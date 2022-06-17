const User = require("../../models/users");
const Chat = require("../../models/chat");
const Conversation = require("../../models/conversation");
const AvailableService = require("../../models/availableServices");
const Project = require("../../models/project.js");
const Service = require("../../models/service.js");
const Offer = require("../../models/offer.js");
const mbxGeocoding = require("@mapbox/mapbox-sdk/services/geocoding");
const moment = require("moment-timezone");
const lambdaPDF = require("../PDFController.js");
const geocodingClient = mbxGeocoding({
  accessToken:
    "pk.eyJ1IjoiYWRuYW5hc2xhbSIsImEiOiJja2h0YzR1YXoxbHllMnRwNXNkamJiNmxvIn0.-eU0lnIjgCMBLn4yh-c-Yg",
});

const { uploadToS3, deleteFileFromS3 } = require("../aws/fileHandler.js");

// Random number generator
const getRandomId = (min = 10000, max = 500000000000) => {
  min = Math.ceil(min);
  max = Math.floor(max);
  const num = Math.floor(Math.random() * (max - min + 1)) + min;
  return num;
};

module.exports = {
  // GET View Request Page
  async getViewRequest(req, res, next) {
    let user = await User.findById(req.user);
    let conversations = [],
      lastMessage;

    //getting the conversation of the sender in descending order
    let existingConv = await Conversation.find({
      participants: { $in: req.user.id },
    }).sort({ lastMsgTime: -1 });

    if (existingConv) {
      // console.log(existingConv);
      //getting the msgs against the current sender and receiver
      lastMessage = await Chat.find({
        conversationID: existingConv[0]?._id,
      });
      lastMessage = lastMessage[0];
    }

    let company = await User.find()
      .where("isCompany" && "isEmailVerified")
      .equals(true)
      .exec();

    const services = await AvailableService.find({});

    const projects = await Project.find({
      "owner.id": req.user.id,
    });

    res.render("lead-system/view-request", {
      title: "GABAZZO | View Request",
      user,
      company,
      conversations,
      lastMessage,
      services,
      projects,
    });
  },

  // POST Project API
  async postProject(req, res, next) {
    try {
      const user = req.user;
      let mediaFiles = [];

      const {
        title,
        location,
        mainCategory,
        subCategory,
        propertyType,
        language,
        date,
        time,
        description,
      } = req.body;

      let fetchedLocation = await geocodingClient
        .forwardGeocode({
          query: location,
          limit: 1,
        })
        .send();

      console.log(fetchedLocation.body.features);

      const coordinates = fetchedLocation.body.features[0].geometry.coordinates;
      // coordinates[0] = Longitude
      // coordinates[1] = Latitude

      const tempProject = {
        owner: {
          id: user.id,
          profilePicture: user.profilePicture,
          name: user.firstName + " " + user.lastName,
          username: user.username,
        },
        title,
        location: {
          type: "Point",
          coordinates: [coordinates[0], coordinates[1]],
        },
        address: location,
        mainCategory,
        subCategory,
        type: propertyType,
        language,
        date,
        time,
        description,
      };

      if (req.body.openBids == "on") {
        tempProject.budget = 0;
        tempProject.isOpenToBid = true;
      } else {
        tempProject.budget = req.body.budget;
      }

      if (req.files.length) {
        for (let i = 0; i < req.files.length; i++) {
          const uploadFile = await uploadToS3(req.files[i]).catch((err) =>
            console.log(err)
          );

          if (uploadFile) {
            mediaFiles.push({ key: uploadFile.Key, path: uploadFile.Location });
          }
        }
      }

      tempProject.media = mediaFiles;

      const project = await Project.create(new Project(tempProject));

      req.session.success = "Project successfully created!";
      return res.redirect("back");
    } catch (err) {
      req.session.error = err;
      return res.redirect("back");
    }
  },

  // Delete Project API
  async deleteProject(req, res, next) {
    try {
      const id = req.params.id;
      const project = await Project.findById(id);

      if (project && project.owner.username == req.user.username) {
        await project.remove();
        req.session.success = "Project successfully deleted!";
        return res.redirect("back");
      }

      req.session.error = "No such Project exists!";
      return res.redirect("/view-request");
    } catch (err) {
      req.session.error = err;
      res.redirect("back");
    }
  },
  // Pause and Active the Project API
  async changeProjectStatus(req, res, next) {
    try {
      const id = req.params.id;
      const status = req.query.status;

      const oldProject = await Project.findById(id);

      if (oldProject.owner.username == req.user.username) {
        if (status == "pause") {
          const project = await Project.findByIdAndUpdate(id, {
            $set: { isActive: false },
          });
          req.session.success = "The project is paused!";
          return res.redirect("back");
        } else {
          const project = await Project.findByIdAndUpdate(id, {
            $set: { isActive: true },
          });
          req.session.success = "The project is active!";
          return res.redirect("back");
        }
      }
      req.session.error = "You are not authorized to do this operation.";
      res.redirect("back");
    } catch (err) {
      req.session.error = err;
      res.redirect("back");
    }
  },

  // GET View Request Page
  async getViewLead(req, res, next) {
    let user = await User.findById(req.user);
    let conversations = [],
      lastMessage;

    //getting the conversation of the sender in descending order
    let existingConv = await Conversation.find({
      participants: { $in: req.user.id },
    }).sort({ lastMsgTime: -1 });

    if (existingConv) {
      // console.log(existingConv);
      //getting the msgs against the current sender and receiver
      lastMessage = await Chat.find({
        conversationID: existingConv[0]?._id,
      });
      lastMessage = lastMessage[0];
    }

    let company = await User.find()
      .where("isCompany" && "isEmailVerified")
      .equals(true)
      .exec();

    // Make a offer field in project and then link that field in projects query so that the active lead can be removed once the offer is sent

    const projects = await Project.find({
      location: {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [user.coordinates[0], user.coordinates[1]],
          },
          $minDistance: 0,
          $maxDistance: 30000, // Max range 30 KMs
        },
      },
    });

    const services = await Service.find()
      .where("owner.id")
      .equals(user._id)
      .exec();

    const sentOffers = await Offer.find({
      sender: user._id,
      offerType: "projectoffer",
    })
      .populate("sender")
      .populate("project");

    res.render("lead-system/view-leads", {
      title: "GABAZZO | View Leads",
      user,
      company,
      services,
      conversations,
      lastMessage,
      projects,
      sentOffers,
    });
  },

  // Post offer on the lead
  async postOfferLead(req, res, next) {
    try {
      const user = req.user;
      const tempOffer = req.body;
      const offer = tempOffer.offer;
      let tasks = [];

      for (let i = 1; i < offer.description.length; i++) {
        tasks.push({
          description: offer.description[i],
          unitPrice: offer.unitPrice[i],
          totalPrice: offer.totalPrice[i],
          quantity: offer.qty[i],
        });
      }

      const tempProject = await Project.findById(tempOffer.projectID);
      const client = await User.findById(tempOffer.receiver);

      // Leads only support the single payment for now that's why making an single payment to constant
      const offerObject = new Offer({
        sender: user._id,
        receiver: tempOffer.receiver,
        service: tempOffer.serviceID,
        project: tempOffer.projectID,
        type: "singlepayment",
        offerType: "projectoffer",
        tasks: tasks,
        notes: tempOffer.notes,
        discount: tempOffer.discount,
        subTotal: tempOffer.subtotal,
        totalCost: tempOffer.quotetotal,
        revision: tempOffer.revision,
        totalDuration: tempOffer.delivery,
        tax: tempOffer.tax,
        receiverAddress: {
          name: client.firstName + " " + client.lastName,
          location: tempProject.address,
          phoneNumber: client.phoneNumber,
          email: client.email,
        },
        invoiceNo: getRandomId(),
      });

      const sentOffer = await Offer.create(offerObject);

      await Project.updateOne(
        { _id: tempOffer.projectID },
        { $push: { sentoffers: user.username } }
      );

      // Generate the PDF Invoice
      const pdfData = {
        contractor: {
          logo: user.logo,
          companyName: user.companyName,
          location: user.location,
          city: user.city,
          state: user.state,
          zipCode: user.zipCode,
          phoneNumber: user.phoneNumber,
          email: user.email,
        },
        client: {
          billTo: {
            name: client.billing.billTo.name,
            companyName: client.billing.billTo.companyName,
            location: client.billing.billTo.location,
            phoneNumber: client.billing.billTo.phoneNumber,
            email: client.billing.billTo.email,
          },
          deliverTo: offerObject.receiverAddress,
        },
        tasks: offerObject.tasks,
        subTotal: offerObject.subTotal,
        discount: offerObject.discount,
        serviceTotal: (0.05 * offerObject.subTotal).toFixed(2),
        totalCost: offerObject.totalCost,
        notes: offerObject.notes,
        totalDuration: offerObject.totalDuration,
        date: moment().format("DD-MM-YYYY"),
        estimationNo: offerObject.invoiceNo,
        tax: offerObject.tax,
        revision: offerObject.revision,
      };

      // Generate the PDF
      lambdaPDF
        .invokeFunction({
          FunctionName: "generateSinglePaymentEstimation",
          Payload: JSON.stringify({
            fileName: sentOffer._id,
            data: pdfData,
          }),
        })
        .then((res) => console.log("the generated pdf is ", res))
        .catch((err) => console.log(err));

      req.session.success = "Offer successfully sent!";
      return res.redirect("back");
    } catch (err) {
      console.log(err);
      req.session.error = err;
      return res.redirect("back");
    }
  },

  // Get Offer View - Speicif Offer
  async getViewOffer(req, res, next) {
    try {
      const projectID = req.params.id;
      const user = req.user;

      let conversations = [],
        lastMessage;

      //getting the conversation of the sender in descending order
      let existingConv = await Conversation.find({
        participants: { $in: req.user.id },
      }).sort({ lastMsgTime: -1 });

      if (existingConv) {
        // console.log(existingConv);
        //getting the msgs against the current sender and receiver
        lastMessage = await Chat.find({
          conversationID: existingConv[0]?._id,
        });
        lastMessage = lastMessage[0];
      }

      const project = await Project.findOne({
        _id: projectID,
        "owner.id": user._id,
      });

      const offers = await Offer.find({
        project: projectID,
        receiver: user._id,
      })
        .populate("service")
        .populate("sender");

      return res.render("lead-system/view-offer", {
        lastMessage,
        conversations,
        offers,
        project,
      });
    } catch (err) {
      console.log(err);
      req.session.error = err;
      return res.redirect("back");
    }
  },

  // Delete Offer API
  async deleteOffer(req, res, next) {
    try {
      const offerID = req.params.id;
      const offer = await Offer.findById(offerID);

      // Either the API caller of this will be a sender or a reciever
      if (offer && offer.receiver.toString() == req.user._id.toString()) {
        await offer.remove();
        req.session.success = "Offer successfully deleted!";
        return res.redirect("back");
      } else if (offer && offer.sender.toString() == req.user._id.toString()) {
        await offer.remove();
        req.session.success = "Offer successfully deleted!";
        return res.redirect("back");
      }

      req.session.error = "No such Offer exists!";
      return res.redirect("back");
    } catch (err) {
      req.session.error = err;
      res.redirect("back");
    }
  },
};
