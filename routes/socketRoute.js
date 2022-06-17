module.exports = function (io) {
  const express = require("express");
  const router = express.Router();
  const User = require("../models/users");
  const Chat = require("../models/chat");
  const Conversation = require("../models/conversation");
  const Offer = require("../models/offer");
  const Service = require("../models/service");
  const cloudinary = require("cloudinary");
  const moment = require("moment-timezone");
  const lambdaPDF = require("../controllers/PDFController");
  const sgMail = require("@sendgrid/mail");
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);

  let usernames = {};

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

  io.on("connection", async function (socket) {
    let senderId = socket.handshake.headers.referer.split("x/").pop();
    if (senderId.includes("activity")) {
      console.log("IN HERERHERHERHEHRHEH");
      const sender_split = senderId.split("/");
      senderId = sender_split[sender_split.length - 1];

      socket.on("activity_room", (roomId) => {
        console.log("Activity Joined. ROOM ID: ", roomId);
        socket.join(roomId);
      });

      socket.on("chatMessage", async (msg) => {
        const user = await User.findById(msg.userId);
        console.log("user", user);
        io.to(msg.room).emit("message", {
          user,
          message: msg.message,
          attachments: msg.attachments,
          createdAt: moment(new Date()).format("LL"),
          messagesLength: msg.messagesLength,
        });
      });
    } else {
      let other = await User.findById(senderId);
      let conversation = {},
        isUpdate = false;

      console.log("Socket Controller");

      console.log(socket.request.user.username + " connected", other.username);

      // Accept a login event with user's data
      if (socket.request.user && socket.request.user.logged_in) {
        socket.request.user.status = true;
        usernames[socket.request.user.username] = socket.id;
        console.log("users", usernames);
      } else if (!socket.request.user.logged_in) {
        socket.request.user.status = false;
        console.log("users", usernames);
      }

      let user = socket.request.user;

      // Create function to send status
      sendStatus = function (s) {
        socket.emit("status", s);
      };

      let userId = socket.request.user._id;
      let otherId = other._id;

      conversation = await Conversation.find({
        $or: [
          { participants: { $eq: [userId, otherId] } },
          { participants: { $eq: [otherId, userId] } },
        ],
      });

      conversation = { ...conversation[0]?._doc };

      socket.on("disconnected", async function (data) {
        if (isUpdate) {
          conversation.lastMsgTime = new Date();
          console.log(conversation);
          await Conversation.findOneAndUpdate(
            { _id: conversation._id },
            {
              $set: conversation,
            }
          );
        }
        delete usernames[socket.request.user.username];
      });

      // LISTENER WHEN SEND OFFER IS PRESSED
      socket.on("sendOffer", async function (data) {
        let offerID;

        const address = other.billing.deliverTo[data.offer.userBillingIndex];

        const offerObject = {
          sender: userId,
          receiver: otherId,
          service: data.offer.service,
          type: data.offer.paymentType,
          tasks: data.offer.tasks,
          notes: data.offer.finalNotes,
          discount: data.offer.discount,
          subTotal: data.offer.subTotal,
          totalCost: data.offer.totalPrice,
          revision: data.offer.revision,
          totalDuration: data.offer.totalDuration,
          receiverAddress: {
            name: address.name,
            companyName: address.companyName,
            location: address.location,
            phoneNumber: address.phoneNumber,
            email: address.email,
          },
          tax: data.offer.tax,
          invoiceNo: getRandomId(),
        };

        let existingConv = await Conversation.find({
          $or: [
            { participants: { $eq: [userId, otherId] } },
            { participants: { $eq: [otherId, userId] } },
          ],
        });

        existingConv = { ...existingConv[0]?._doc };

        const offer = new Offer(offerObject);

        let serviceData = await Service.findById(data.offer.service).exec();

        offerObject.service = {
          title: serviceData.title,
          image: serviceData.images[0].url,
        };

        offer.save().then(async (offer) => {
          offerID = offer._id;

          const msgOffer = new Chat({
            conversationID: existingConv._id,
            messages: {
              attachments: [],
              text: "Sent a Custom Offer",
              sender: {
                id: userId,
                username: user.username,
              },
              receiver: {
                id: otherId,
                username: other.username,
              },
            },
            offerID: offer._id,
            isSeen: true,
          });

          offerObject.id = offerID;

          const tempdata = {
            senderID: socket.request.user.id,
            receiverID: other.id,
            name: user.username,
            message: "Sent an offer",
            timeAgo: moment().format("MMMM Do h:mm A"),
            attachments: [],
            from: {
              id: socket.request.user.id,
              username: socket.request.user.username,
              profilePicture: socket.request.user.profilePicture,
              logo: socket.request.user.logo ? socket.request.user.logo : 0,
              isCompany: socket.request.user.isCompany,
              companyName: socket.request.user.companyName
                ? socket.request.user.companyName
                : 0,
              firstName: socket.request.user.firstName
                ? socket.request.user.firstName
                : 0,
              lastName: socket.request.user.lastName
                ? socket.request.user.lastName
                : 0,
            },
            to: {
              id: other.id,
              username: other.username,
              profilePicture: other.profilePicture,
              logo: other.logo ? other.logo : 0,
              isCompany: other.isCompany,
              companyName: other.companyName ? other.companyName : 0,
              firstName: other.firstName ? other.firstName : 0,
              lastName: other.lastName ? other.lastName : 0,
            },
            offer: offerObject,
          };

          if (io.sockets.connected[usernames[other.username]])
            io.sockets.connected[usernames[other.username]].emit("output", [
              tempdata,
            ]);

          if (io.sockets.connected[socket.id])
            io.sockets.connected[socket.id].emit("output", [tempdata]);

          await msgOffer.save();

          if (data.offer.paymentType === "milestonepayment") {
            const pdfData = {
              contractor: {
                logo: socket.request.user.logo,
                companyName: socket.request.user.companyName,
                location: socket.request.user.location,
                city: socket.request.user.city,
                state: socket.request.user.state,
                zipCode: socket.request.user.zipCode,
                phoneNumber: socket.request.user.phoneNumber,
                email: socket.request.user.email,
              },
              client: {
                billTo: {
                  name: other.billing.billTo.name,
                  companyName: other.billing.billTo.companyName,
                  location: other.billing.billTo.location,
                  phoneNumber: other.billing.billTo.phoneNumber,
                  email: other.billing.billTo.email,
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
              date: moment().format("MM-DD-YYYY"),
              estimationNo: offerObject.invoiceNo,
              tax: offerObject.tax,
              revision: offerObject.revision,
            };

            await lambdaPDF
              .invokeFunction({
                FunctionName: "generanteMilestonePaymentEstimation",
                Payload: JSON.stringify({
                  fileName: offerID,
                  data: pdfData,
                }),
              })
              .then((res) => console.log(res))
              .catch((err) => console.log(err));

            pdfData.pdflink =
              "https://s3.amazonaws.com/assets.gabazzo.com/" + offerID;
            const templateData = {
              to: other.email,
              from: "Gabazzo <no-reply@gabazzo.com>",
              subject: "Gabazzo - Offer Estimation",
              template_id: "d-ebbb99a37dd04d19b4b7c1f4c96c7e60",
              dynamic_template_data: pdfData,
            };
            sgMail.send(templateData).catch((err) => console.error(err));
            sgMail.send(templateData).catch((err) => console.error(err));
          } else {
            const pdfData = {
              contractor: {
                logo: socket.request.user.logo,
                companyName: socket.request.user.companyName,
                location: socket.request.user.location,
                city: socket.request.user.city,
                state: socket.request.user.state,
                zipCode: socket.request.user.zipCode,
                phoneNumber: socket.request.user.phoneNumber,
                email: socket.request.user.email,
              },
              client: {
                billTo: {
                  name: other.billing.billTo.name,
                  companyName: other.billing.billTo.companyName,
                  location: other.billing.billTo.location,
                  phoneNumber: other.billing.billTo.phoneNumber,
                  email: other.billing.billTo.email,
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

            await lambdaPDF
              .invokeFunction({
                FunctionName: "generateSinglePaymentEstimation",
                Payload: JSON.stringify({
                  fileName: offerID,
                  data: pdfData,
                }),
              })
              .then((res) => console.log(res))
              .catch((err) => console.log(err));

            pdfData.pdflink =
              "https://s3.amazonaws.com/assets.gabazzo.com/" + offerID;
            const templateData = {
              to: other.email,
              from: "Gabazzo <no-reply@gabazzo.com>",
              subject: "Gabazzo - Member Invoice",
              template_id: "d-89cc25bf5f6a4f3cb2b7b1caf45223fd",
              dynamic_template_data: pdfData,
            };

            // Sending an email to member
            sgMail.send(templateData).catch((err) => console.error(err));

            templateData.to = socket.request.user.email;
            (templateData.subject = "Gabazzo - Contractor Invoice"),
              // Sending an email to contractor
              sgMail.send(templateData).catch((err) => console.error(err));
          }
        });
      });

      socket.on("withdrawOffer", async function (id) {
        await Offer.findByIdAndUpdate({ _id: id }, { status: "withdrawn" });

        if (io.sockets.connected[usernames[other.username]])
          io.sockets.connected[usernames[other.username]].emit(
            "withdrawOfferSuccess",
            id
          );

        if (io.sockets.connected[socket.id])
          io.sockets.connected[socket.id].emit("withdrawOfferSuccess", id);
      });

      socket.on("acceptDeclineOffer", async function (obj) {
        // if (obj.status === "accepted")
        //   await Offer.findByIdAndUpdate(
        //     { _id: obj.id },
        //     { status: "accepted" }
        //   );
        if (obj.status === "declined")
          await Offer.findByIdAndUpdate(
            { _id: obj.id },
            { status: "declined" }
          );

        if (io.sockets.connected[usernames[other.username]])
          io.sockets.connected[usernames[other.username]].emit(
            "acceptDeclineSuccess",
            obj
          );

        if (io.sockets.connected[socket.id])
          io.sockets.connected[socket.id].emit("acceptDeclineSuccess", obj);
      });

      // Handle input events
      socket.on("input", async function (data) {
        // let name = data.name;

        let message = data.message;
        let attachment = data.attachment;

        // Check for name and message
        if (message == "" && attachment.length === 0) {
          // Send error status
          sendStatus("Please enter a message");
        } else {
          let existingConv = conversation;
          isUpdate = true;

          const Msg = new Chat({
            conversationID: existingConv._id,
            messages: {
              attachments: data.attachment,
              text: message,
              sender: {
                id: userId,
                username: user.username,
              },
              receiver: {
                id: otherId,
                username: other.username,
              },
            },
            isSeen: true,
          });

          Chat.create(Msg, async function () {
            const data = {
              senderID: socket.request.user.id,
              receiverID: other.id,
              name: user.username,
              timeAgo: moment().format("MMMM Do h:mm A"),
              message: message,
              attachments: attachment,
              from: {
                id: socket.request.user.id,
                username: socket.request.user.username,
                profilePicture: socket.request.user.profilePicture,
                logo: socket.request.user.logo ? socket.request.user.logo : 0,
                isCompany: socket.request.user.isCompany,
                companyName: socket.request.user.companyName
                  ? socket.request.user.companyName
                  : 0,
                firstName: socket.request.user.firstName
                  ? socket.request.user.firstName
                  : 0,
                lastName: socket.request.user.lastName
                  ? socket.request.user.lastName
                  : 0,
              },
              to: {
                id: other.id,
                username: other.username,
                profilePicture: other.profilePicture,
                logo: other.logo ? other.logo : 0,
                isCompany: other.isCompany,
                companyName: other.companyName ? other.companyName : 0,
                firstName: other.firstName ? other.firstName : 0,
                lastName: other.lastName ? other.lastName : 0,
              },
            };

            if (io.sockets.connected[usernames[other.username]])
              io.sockets.connected[usernames[other.username]].emit("output", [
                data,
              ]);
            if (io.sockets.connected[socket.id])
              io.sockets.connected[socket.id].emit("output", [data]);
          });
        }
      });
    }
  });

  return router;
};
