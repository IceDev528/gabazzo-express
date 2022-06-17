const Activity = require("../../models/activity");
const Job = require("../../models/job");
const lambdaPDF = require("../../controllers/PDFController");
const Conversation = require("../../models/conversation");
const Chat = require("../../models/chat");

// const sgMail = require("@sendgrid/mail");
// sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const moment = require("moment");

const multer = require("multer");
const storage = multer.diskStorage({
  filename: function (req, file, callback) {
    callback(null, Date.now() + file.originalname);
  },
});

const cloudinary = require("cloudinary");
cloudinary.config({
  cloud_name: "gabazzo",
  api_key: "662254991487397",
  api_secret: process.env.CLOUDINARY_SECRET,
});

exports.getActivity = async (req, res) => {
  const activity = await Activity.findOne({ job: req.params.job }).populate({
    path: "job messages.user",
    populate: {
      path: "offer service buyer seller",
    },
  });
  await res.status(200).json({
    activity,
  });
};

exports.sendMessageActivity = async (req, res) => {
  const { activity: id, message, attachments } = req.body;

  console.log("=========================", id);
  try {
    const job = await Job.findById(id);
    job.messages.push({
      user: req.user.id,
      message,
      attachments,
      createdAt: new Date(),
    });
    await job.save();
    await res.status(201).json({
      message: "Job Message Sent",
    });
  } catch (err) {
    console.log(err);
  }
};

exports.addTrackingInfo = async (req, res) => {
  const { progress, description, files, id } = req.body;

  const activity = await Activity.findOne({ job: id }).populate({
    path: "job messages.user",
    populate: {
      path: "offer service buyer seller",
    },
  });
  // if (activity.tracking_info.length === 5) {
  //   if (progress !== "100") {
  //     return res.status(500).json({
  //       message: "You Need To Provide 100% Progress",
  //     });
  //   }
  // }
  activity.tracking_info.push({
    files,
    progress,
    description,
    createdAt: new Date(),
  });
  activity.progress = progress;
  await activity.save();
  await res.status(200).json({
    message: "Tracking Info Updated",
    activity,
  });
};

exports.addMaterialRecieptTracker = async (req, res) => {
  const { company_details, other_details, description, id } = req.body;
  const activity = await Activity.findOne({ job: id }).populate({
    path: "job messages.user",
    populate: {
      path: "offer service buyer seller",
    },
  });
  let total = 0;
  let sub_total = 0;
  let tax = 0;
  description.forEach((desc) => {
    total = total + parseInt(desc.quantity) * parseFloat(desc.cost);
  });
  sub_total = total;
  if (other_details.state_tax)
    tax = (total * parseFloat(other_details.state_tax)) / 100;
  total = total + parseFloat(tax);
  if (other_details.discount)
    total = total - parseFloat(other_details.discount);
  activity.reciepts.push({
    company_details,
    other_details,
    description,
    sub_total,
    tax,
    totalCost: total,
  });
  await activity.save();
  // const pdfData = {
  //   contractor: {
  //     // logo: socket.request.user.logo,
  //     companyName: company_details?.company_name,
  //     address: company_details?.company_address,
  //     recieptNumber: company_details?.reciept_number,
  //     rebateNumber: company_details?.rebate_number,
  //     // city: socket.request.user.city,
  //     // state: socket.request.user.state,
  //     // zipCode: socket.request.user.zipCode,
  //     // phoneNumber: socket.request.user.phoneNumber,
  //     // email: socket.request.user.email,
  //   },
  //   // client: {
  //   //   billTo: {
  //   //     name: other.billing.billTo.name,
  //   //     companyName: other.billing.billTo.companyName,
  //   //     location: other.billing.billTo.location,
  //   //     phoneNumber: other.billing.billTo.phoneNumber,
  //   //     email: other.billing.billTo.email,
  //   //   },
  //   //   deliverTo: {
  //   //     name: other.billing.deliverTo.name,
  //   //     companyName: other.billing.deliverTo.companyName,
  //   //     location: other.billing.deliverTo.location,
  //   //     phoneNumber: other.billing.deliverTo.phoneNumber,
  //   //     email: other.billing.deliverTo.email,
  //   //   },
  //   // },
  //   tasks: description,
  //   // subTotal: offerObject.subTotal,
  //   discount: other_details?.discount,
  //   stateTax: offerObject.state_tax,
  //   // totalCost: offerObject.totalCost,
  //   date: company_details?.date,
  //   // estimationNo: Math.floor(Math.random() * 100000000000) + 1,
  //   recieptNumber: company_details?.reciept_number,
  //   rebateNumber: company_details?.rebate_number,
  // };
  // await lambdaPDF
  //   .invokeFunction({
  //     FunctionName: "generanteMilestonePaymentEstimation",
  //     Payload: JSON.stringify({
  //       fileName: offerID,
  //       data: pdfData,
  //     }),
  //   })
  //   .then((res) => console.log(res))
  //   .catch((err) => console.log(err));

  // // pdfData.pdflink = "https://s3.amazonaws.com/assets.gabazzo.com/" + offerID;
  // // const templateData = {
  // //   to: other.email,
  // //   from: "Gabazzo <no-reply@gabazzo.com>",
  // //   subject: "Gabazzo - Offer Estimation",
  // //   template_id: "d-ebbb99a37dd04d19b4b7c1f4c96c7e60",
  // //   dynamic_template_data: pdfData,
  // // };
  // // await sgMail.send(templateData).catch((err) => console.error(err));
  await res.status(200).json({
    message: "Material Reciept Updated",
    activity,
  });
};

exports.getActivityPage = async (req, res) => {
  const job = await Job.findById(req.params.id).populate(
    "offer service buyer seller"
  );
  const activity = await Activity.findOne({ job: req.params.id });
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

  const user = req.user;

  if (!req.user.isCompany) {
    if (job.isActive) {
      res.render("tracking-service-system/member/activity", {
        // title: "Order Details Single Payment",
        job,
        activity,
        lastMessage,
        moment: moment,
        user,
      });
    } else {
      res.render(
        "tracking-service-system/member/activity-requirements-need-to-submit",
        {
          // title: "Order Details Single Payment",
          job,
          activity,
          lastMessage,
          moment: moment,
          user,
        }
      );
    }
  } else {
    if (job.isActive) {
      res.render("tracking-service-system/contractor/activity", {
        // title: "Order Details Single Payment",
        job,
        activity,
        lastMessage,
        moment: moment,
        user,
      });
    } else {
      res.render(
        "tracking-service-system/contractor/activity-waiting-for-requirements",
        {
          // title: "Order Details Single Payment",
          job,
          activity,
          lastMessage,
          moment: moment,
          user,
        }
      );
    }
  }
};

exports.getTrackingPage = async (req, res) => {
  const jobId = req.params.id;
  const activity = await Activity.findOne({ job: jobId }).populate({
    path: "job messages.user",
    populate: {
      path: "offer service buyer seller",
    },
  });
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

  if (!req.user.isCompany) {
    res.render("tracking-service-system/member/tracking-info", {
      // title: "Order Details Single Payment",
      jobId,
      activity,
      lastMessage,
      moment: moment,
    });
  } else {
    res.render("tracking-service-system/contractor/tracking-info", {
      // title: "Order Details Single Payment",
      jobId,
      activity,
      lastMessage,
      moment: moment,
    });
  }
};

exports.getRequirementsPage = async (req, res) => {
  const jobId = req.params.id;
  const job = await Job.findById(jobId).populate("offer service buyer seller");
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

  if (!req.user.isCompany) {
    if (job?.isActive) {
      res.render("tracking-service-system/member/requirements-submitted", {
        // title: "Order Details Single Payment",
        jobId,
        job,
        lastMessage,
        moment: moment,
      });
    } else {
      res.render("tracking-service-system/member/requirements-before-submit", {
        // title: "Order Details Single Payment",
        jobId,
        job,
        lastMessage,
        moment: moment,
      });
    }
  } else {
    if (job?.isActive) {
      res.render("tracking-service-system/contractor/requirements-submitted", {
        // title: "Order Details Single Payment",
        jobId,
        job,
        lastMessage,
        moment: moment,
      });
    } else {
      res.render(
        "tracking-service-system/contractor/requirements-before-submit",
        {
          // title: "Order Details Single Payment",
          jobId,
          job,
          lastMessage,
          moment: moment,
        }
      );
    }
  }
};

exports.getPdfFilesPage = async (req, res) => {
  const jobId = req.params.id;
  const activity = await Activity.findOne({ job: jobId }).populate({
    path: "job messages.user",
    populate: {
      path: "offer service buyer seller",
    },
  });
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
  if (!req.user.isCompany) {
    res.render("tracking-service-system/member/pdf-files", {
      // title: "Order Details Single Payment",
      jobId,
      activity,
      lastMessage,
      moment: moment,
    });
  } else {
    res.render("tracking-service-system/contractor/pdf-files", {
      // title: "Order Details Single Payment",
      jobId,
      activity,
      lastMessage,
      moment: moment,
    });
  }
};
