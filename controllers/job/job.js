const paypal = require("@paypal/checkout-server-sdk");
const Job = require("../../models/job");
const Offer = require("../../models/offer");
const Activity = require("../../models/activity");
const Service = require("../../models/service");
const Chat = require("../../models/chat");
const User = require("../../models/users");
const Conversation = require("../../models/conversation");

const Review = require("../../models/review");

const { differenceInHours } = require("../../helpers/dateHelpers");

const MakePayment = require("../../services/make_payment");
const MakePaymentIntent = require("../../services/make_payment_intent");
const RefundPayment = require("../../services/refund_payment");

const lambdaPDF = require("../PDFController");

const moment = require("moment");
const multer = require("multer");

const sgMail = require("@sendgrid/mail");
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const storage = multer.diskStorage({
  filename: function (req, file, callback) {
    callback(null, Date.now() + file.originalname);
  },
});

// const Environment =
//   process.env.NODE_ENV === "production"
//     ? paypal.core.LiveEnvironment
//     : paypal.core.SandboxEnvironment;

let environment = new paypal.core.SandboxEnvironment(
  process.env.PAYPAL_CLIENT_ID,
  process.env.PAYPAL_CLIENT_SECRET
);
let paypalClient = new paypal.core.PayPalHttpClient(environment);

const {
  generatePaypalToken,
  getPaypalOrderDetails,
} = require("../../services/paypal");

const cloudinary = require("cloudinary");
cloudinary.config({
  cloud_name: "gabazzo",
  api_key: "662254991487397",
  api_secret: process.env.CLOUDINARY_SECRET,
});

// Random number generator
const getRandomId = (min = 10000, max = 500000000000) => {
  min = Math.ceil(min);
  max = Math.floor(max);
  const num = Math.floor(Math.random() * (max - min + 1)) + min;
  return num;
};

exports.createJob = async (req, res, next) => {
  const session = await Job.startSession();
  session.startTransaction();
  let charge_id;
  try {
    const {
      card_holder_name,
      card_number,
      card_expiry_month,
      card_expiry_year,
      cvv,
      offer_id,
      description,
      finaldeliverydate,
      email,
      payment_type,
      paypal_id,
    } = req.body;
    const opts = { session };
    let someDate = new Date();

    const offer = await Offer.findById(offer_id);
    if (!offer) throw new Error("Invalid Offer ID");
    const amount = offer.totalCost;
    const tasks = [];
    offer.tasks.forEach((task) => {
      tasks.push({
        qty: task.quantity,
        deliverydate: task.delivery,
        unitprice: task.unitPrice,
        total: task.totalPrice,
        description: task.description,
      });
    });
    const job = new Job({
      buyer: req.user.id,
      seller: offer.sender,
      service: offer.service,
      type: offer.type,
      task: offer.type === "singlepayment" ? tasks : [],
      milestone: offer.type === "milestonepayment" ? tasks : [],
      offer: offer._id,
      isActive: description ? true : false,
      description,
      finaldeliverydate: someDate.setDate(
        someDate.getDate() + parseInt(finaldeliverydate)
      ),
      card_holder_name,
      status: description ? "Incomplete" : "Missing Details",
      receiptNo: getRandomId(),
    });

    await job.save(opts);

    const activity = new Activity({
      job: job._id,
    });

    if (payment_type === "paypal") {
      const res = await generatePaypalToken();
      const body = await res.json();
      const access_token = body.access_token;

      const res_order = await getPaypalOrderDetails(paypal_id, access_token);
      const body_order = await res_order.json();

      job.charge_object = body_order;

      if (body_order.status !== "COMPLETED" && body_order.status !== "PENDING")
        throw new Error("Unable To Complete Payment");
    } else {
      const payment = await MakePayment(
        card_number,
        card_expiry_month,
        card_expiry_year,
        cvv,
        email,
        amount,
        "usd"
      );
      charge_id = payment.id;
      // THIS CAUSES DOUBLE CHARGE. NO NEED OF THIS
      // const payment_intent = await MakePaymentIntent(amount, payment.customer.id);
      // job.payment_intent = payment_intent;
      job.charge_object = payment;
    }

    await job.save(opts);
    await activity.save(opts);

    await session.commitTransaction();
    session.endSession();

    console.log("DONE PAYMENT");

    // Changing the offer to status to accepted
    offer.status = "accepted";
    offer.save();

    // // Invoice PDF Work
    const contractor = await User.findById(offer.sender);
    const member = req.user;
    let profilePic;

    if (typeof member.profilePicture !== "undefined") {
      profilePic = member.profilePicture;
    } else {
      profilePic =
        "https://res.cloudinary.com/gabazzo/image/upload/v1653780214/man_bsete9.png";
    }

    const contractorPDF = {
      thankingText: "You've received an Order! Casshinggg! ",
      text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
      invoiceNo: offer.invoiceNo,
      receiptNo: job.receiptNo,
      user: {
        img: profilePic,
        username: member.username,
        name: contractor.companyName,
        address: contractor.location,
        city: contractor.city,
        state: contractor.state,
        zipCode: contractor.zipCode,
        phoneNumber: contractor.phoneNumber,
        email: contractor.email,
      },
      member: {
        billTo: {
          name: member.billing.billTo.name,
          companyName: member.billing.billTo.companyName,
          location: member.billing.billTo.location,
          phoneNumber: member.billing.billTo.phoneNumber,
          email: member.billing.billTo.email,
        },
        deliverTo: offer.receiverAddress,
      },
      revision: offer.revision,
      tasks: offer.tasks,
      subTotal: offer.subTotal,
      discount: offer.discount,
      tax: offer.tax,
      gabazzoRate: "5%",
      serviceTotal: (0.05 * offer.subTotal).toFixed(2),
      totalCost: offer.totalCost,
      notes: offer.notes,
      estimatedTime: offer.totalDuration,
      currentDate: moment().format("DD-MM-YYYY"),
      pdfLink: `https://s3.amazonaws.com/assets.gabazzo.com/${offer_id}c-receipt.pdf`,
    };

    // Invoing the lambda for the contractors PDF
    lambdaPDF
      .invokeFunction({
        FunctionName: "generatePDFReceipt",
        Payload: JSON.stringify({
          fileName: offer_id + "c-receipt",
          data: contractorPDF,
        }),
      })
      .then((res) => console.log(res))
      .catch((err) => console.log(err));

    // Generating email for the contractor
    const templateDataContractor = {
      to: contractor.email,
      from: "Gabazzo <no-reply@gabazzo.com>",
      subject: "Gabazzo - Receipt",
      template_id: "d-a4ed1c7508b14d6c98220491a313002a",
      dynamic_template_data: contractorPDF,
    };
    sgMail.send(templateDataContractor).catch((err) => console.error(err));

    // Members PDF

    const memberPDF = { ...contractorPDF };
    memberPDF.thankingText = "Thank You For Your Order!";
    memberPDF.user.username = contractor.username;
    memberPDF.pdfLink = `https://s3.amazonaws.com/assets.gabazzo.com/${offer_id}m-receipt.pdf`;

    if (typeof contractor.logo !== "undefined") {
      memberPDF.user.img = contractor.logo;
    } else {
      memberPDF.user.img =
        "https://res.cloudinary.com/gabazzo/image/upload/v1653780214/man_bsete9.png";
    }

    // Invoing the lambda for the Member PDF
    lambdaPDF
      .invokeFunction({
        FunctionName: "generatePDFReceipt",
        Payload: JSON.stringify({
          fileName: offer_id + "m-receipt",
          data: memberPDF,
        }),
      })
      .then((res) => console.log(res))
      .catch((err) => console.log(err));

    // Generating email for the member
    const templateDataMember = {
      to: member.email,
      from: "Gabazzo <no-reply@gabazzo.com>",
      subject: "Gabazzo - Receipt",
      template_id: "d-a4ed1c7508b14d6c98220491a313002a",
      dynamic_template_data: memberPDF,
    };
    sgMail.send(templateDataMember).catch((err) => console.error(err));

    await res.status(201).json({
      message: "Payment Completed. Job Created",
      data: {
        jobId: job._id,
      },
    });

    // this.getSubmitRequirementsSinglePaymentPage(offer_id, job._id);
  } catch (err) {
    console.log(err);
    await session.abortTransaction();
    session.endSession();
    if (charge_id) {
      await RefundPayment(charge_id);
    }
    next();
  }
};

exports.getSubmitRequirementsSinglePaymentPage = async (req, res) => {
  let jobId = req.params.id;
  if (jobId === "undefined") throw new Error("Invalid Job ID");

  const job = await Job.findById(jobId);
  const offer = await Offer.findById(job.offer);
  const service = await Service.findById(offer.service);

  var months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  var created_date = new Date(offer?.createdAt);
  const date =
    created_date.getDate() +
    "/" +
    months[created_date.getMonth()] +
    "/" +
    created_date.getFullYear();

  res.render("payment/single-payment/submit-work-requirements-single-payment", {
    // title: "Order Details Single Payment",
    offer,
    service,
    job,
    date,
  });
};

exports.getMyJobs = async (req, res) => {
  const status_filter = req.query.status
    ? req.query.status === "All"
      ? {}
      : {
          status: req.query.status,
        }
    : {};
  const jobs = await Job.find({
    $or: [
      {
        buyer: req.user.id,
      },
      {
        seller: req.user.id,
      },
    ],
    ...status_filter,
  }).populate("offer service buyer seller");
  await res.status(200).json({
    jobs,
  });
};

exports.getSingleJob = async (req, res) => {
  const job = await Job.findById(req.params.id);
  await res.status(200).json({
    job,
  });
};

exports.addDescription = async (req, res) => {
  // req.body.images = [];
  // for (const file of req.files) {
  //   let image = await cloudinary.v2.uploader.upload(file.path);
  //   req.body.images.push({
  //     url: image.secure_url,
  //     public_id: image.public_id,
  //   });
  // }
  const { job_id, description, attachment } = req.body;
  let someDate = new Date();
  const job = await Job.findById(job_id);
  const difference = differenceInHours(new Date(), job.createdAt);
  job.description = description;
  job.isActive = true;
  job.status = "Incomplete";
  job.starting_time = new Date();
  // job.job_images = req.body.images;
  job.job_images = attachment;
  job.remind_later = false;
  // today - createdat = ?? days
  // add into final delivery date
  const date_to_change = job.finaldeliverydate;
  const new_date = new Date(
    date_to_change.setHours(date_to_change.getHours() + parseInt(difference))
  );
  job.finaldeliverydate = new_date;
  job.markModified("finaldeliverydate");
  await job.save();
  await res.status(201).json({
    message: "Description Added",
    data: {
      jobId: job._id,
    },
  });
};

exports.addDescriptionCustomer = async (req, res) => {
  const { job_id, description, answer1, answer2, answer3 } = req.body;
  const job = await Job.findById(job_id);
  const difference = differenceInHours(new Date(), job.createdAt);
  job.description = description;
  job.isActive = true;
  job.status = "Incomplete";
  job.starting_time = new Date();
  job.answer1 = answer1;
  job.answer2 = answer2;
  job.answer3 = answer3;
  job.remind_later = false;
  const date_to_change = job.finaldeliverydate;
  const new_date = new Date(
    date_to_change.setHours(date_to_change.getHours() + parseInt(difference))
  );
  job.finaldeliverydate = new_date;
  job.markModified("finaldeliverydate");
  await job.save();
  await res.status(201).json({
    message: "Description Added",
    data: {
      jobId: job._id,
    },
  });
};

exports.changeStatus = async (req, res) => {
  const { job_id, status } = req.body;
  const job = await Job.findById(job_id);
  job.status = status;
  if (status === "Awaiting Review") job.completion_time = new Date();
  await job.save();
  await res.status(201).json({
    message: "Description Added",
    data: {
      jobId: job._id,
    },
  });
};

exports.remindLater = async (req, res) => {
  let today = new Date();
  const job = await Job.findById(req.params.id);
  job.remind_later = true;
  job.next_reminder = today.setHours(today.getHours() + 16);
  await job.save();
  await res.status(201).json({
    message: "You'll be emailed after every 16 hours",
    data: {
      jobId: job._id,
    },
  });
};

exports.getMangeOrderPage = async (req, res) => {
  const [
    jobs,
    incomplete_jobs,
    missing_details,
    awaiting_review,
    delivered,
    completed,
    cancelled,
  ] = await Promise.all([
    Job.find({
      $or: [
        {
          buyer: req.user.id,
        },
        {
          seller: req.user.id,
        },
      ],
    }).populate("offer service buyer seller"),
    Job.find({
      $or: [
        {
          buyer: req.user.id,
        },
        {
          seller: req.user.id,
        },
      ],
      status: "Incomplete",
    }).countDocuments(),
    Job.find({
      $or: [
        {
          buyer: req.user.id,
        },
        {
          seller: req.user.id,
        },
      ],
      status: "Missing Details",
    }).countDocuments(),
    Job.find({
      $or: [
        {
          buyer: req.user.id,
        },
        {
          seller: req.user.id,
        },
      ],
      status: "Awaiting Review",
    }).countDocuments(),
    Job.find({
      $or: [
        {
          buyer: req.user.id,
        },
        {
          seller: req.user.id,
        },
      ],
      status: "Delivered",
    }).countDocuments(),
    Job.find({
      $or: [
        {
          buyer: req.user.id,
        },
        {
          seller: req.user.id,
        },
      ],
      status: "Completed",
    }).countDocuments(),
    Job.find({
      $or: [
        {
          buyer: req.user.id,
        },
        {
          seller: req.user.id,
        },
      ],
      status: "Cancelled",
    }).countDocuments(),
  ]);

  if (req.user) {
    //getting the conversation of the sender in descending order
    let existingConv = await Conversation.find({
      participants: { $in: req.user.id },
    }).sort({ lastMsgTime: -1 });

    if (existingConv) {
      //getting the msgs against the current sender and receiver
      lastMessage = await Chat.find({
        conversationID: existingConv[0]?._id,
      });
      lastMessage = lastMessage[0];
    }
  }
  res.render("manage-orders/manage-orders", {
    incomplete_jobs,
    missing_details,
    awaiting_review,
    delivered,
    completed,
    cancelled,
    jobs,
    lastMessage,
    moment: moment,
  });
};

exports.getReviewPage = async (req, res) => {
  const job = await Job.findById(req.params.id).populate(
    "offer service buyer seller"
  );
  if (req.user) {
    //getting the conversation of the sender in descending order
    let existingConv = await Conversation.find({
      participants: { $in: req.user.id },
    }).sort({ lastMsgTime: -1 });

    if (existingConv) {
      //getting the msgs against the current sender and receiver
      lastMessage = await Chat.find({
        conversationID: existingConv[0]?._id,
      });
      lastMessage = lastMessage[0];
    }
  }
  res.render("tracking-service-system/member/reviews-providing", {
    job,
    lastMessage,
    moment: moment,
  });
};

exports.createReviewJob = async (req, res) => {
  const { job: job_id, review, permission, ratings } = req.body;
  const job = await Job.findById(job_id).populate("seller");
  job.review = {
    ratings,
    permission,
    review,
  };
  job.status = "Completed";

  await job.save();

  const activity = await Activity.find({ job: job._id });

  const tempReview = new Review({
    text: review,
    rating: ratings,
    activity: activity._id,
    owner: {
      id: job.seller._id,
      username: job.seller.username,
      name: job.seller.companyName,
      logo: job.seller.logo,
    },
    author: {
      id: req.user._id,
      username: req.user.username,
      name: req.user.firstName + " " + req.user.lastName,
      logo: req.user.profilePicture,
    },
    offer: job.offer,
    job: job._id,
    sharingPermision: permission,
  });

  Review.create(tempReview);

  await res.status(201).json({
    message: "Review Added and Status Changed",
    data: {
      jobId: job._id,
    },
  });
};

exports.extendDeadLine = async (req, res) => {
  const { job_id, days } = req.body;

  const job = await Job.findById(job_id);

  let result = new Date(job.finaldeliverydate);
  result.setDate(result.getDate() + parseInt(days));

  job.finaldeliverydate = result;
  await job.save();
  await res.status(201).json({
    message: "Date Extended",
    data: {
      jobId: job._id,
    },
  });
};

exports.createPaypalCharge = async (req, res) => {
  try {
    console.log("Paypal method called");
    const { offer_id, serviceFee } = req.body;
    const offer = await Offer.findById(offer_id);
    if (!offer) throw new Error("Invalid Offer");

    const request = new paypal.orders.OrdersCreateRequest();
    const total = offer.totalCost;
    request.prefer("return=representation");
    request.requestBody({
      intent: "CAPTURE",
      purchase_units: [
        {
          amount: {
            currency_code: "USD",
            value: total,
            breakdown: {
              item_total: {
                currency_code: "USD",
                value: total,
              },
            },
          },
        },
      ],
    });

    // request.requestBody({
    //   intent: "CAPTURE",
    //   purchase_units: [
    //     {
    //       amount: {
    //         currency_code: "USD",
    //         value: total,
    //         breakdown: {
    //           item_total: {
    //             currency_code: "USD",
    //             value: total,
    //           },
    //         },
    //       },
    //       items: offer.tasks.map((item) => {
    //         const service_fee = item.totalPrice * (serviceFee / 100);
    //         return {
    //           name: item.description,
    //           unit_amount: {
    //             currency_code: "USD",
    //             value: parseFloat(item.unitPrice),
    //           },
    //           quantity: parseFloat(item.quantity),
    //         };
    //       }),
    //     },
    //   ],
    // });

    const order = await paypalClient.execute(request);
    res.status(200).json({
      id: order.result.id,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      message: err.toString(),
    });
  }
};


// //resolution center

// exports.getResolutionCenterPage = async (req, res) => {
//   res.render('resolution-center/select-action');
// };

// exports.getDisputedSubmittedPage = async (req, res) => {
//   res.render('resolution-center/dispute-submitted');
// }