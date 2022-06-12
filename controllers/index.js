const User = require("../models/users");
// const path = require("path");
const Journey = require("../models/journey");
const MediaPhoto = require("../models/mediaPhoto");
const MediaVideo = require("../models/mediaVideo");
const Certificate = require("../models/certificate");
const Employee = require("../models/employee");
const Portfolio = require("../models/portfolio");
const Review = require("../models/review");
const Service = require("../models/service");
const Product = require("../models/product");
const Chat = require("../models/chat");
const Conversation = require("../models/conversation");
const Faq = require("../models/faq");
const List = require("../models/list");
const Label = require("../models/label");
const moment = require("moment-timezone");
const mbxGeocoding = require("@mapbox/mapbox-sdk/services/geocoding");
const AvailableService = require("../models/availableServices");
const filterHandler = require("../helpers/filterHelper");
const geocodingClient = mbxGeocoding({
  accessToken:
    "pk.eyJ1IjoiYWRuYW5hc2xhbSIsImEiOiJja2h0YzR1YXoxbHllMnRwNXNkamJiNmxvIn0.-eU0lnIjgCMBLn4yh-c-Yg",
});
// const passport = require('passport');
// var GoogleStrategy = require('passport-google-oauth20').Strategy;
const crypto = require("crypto");
const util = require("util");
const sgMail = require("@sendgrid/mail");
const multer = require("multer");

const { uploadToS3, deleteFileFromS3 } = require("./aws/fileHandler");

// const storage = multer.diskStorage({
//   filename: function (req, file, callback) {
//     callback(null, Date.now() + file.originalname);
//   },
// });

const cloudinary = require("cloudinary");
cloudinary.config({
  cloud_name: "gabazzo",
  api_key: "662254991487397",
  api_secret: process.env.CLOUDINARY_SECRET,
});

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

module.exports = {
  //GET /
  async getHomePage(req, res, next) {
    let lastMessage, user;

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

    let company = await User.find({
      isEmailVerified: true,
      isCompany: true,
    }).limit(10);

    const aggregateQuery = [
      {
        $lookup: {
          from: "services",
          localField: "_id",
          foreignField: "owner.id",
          as: "existingService",
        },
      },
      {
        $project: {
          existingService: { $arrayElemAt: ["$existingService", 0] },
          companyName: 1,
          averageReview: 1,
          reviews: 1,
          logo: 1,
        },
      },
    ];
    let service = await User.aggregate(aggregateQuery);
    let companies = [];

    company.forEach(function (comp) {
      if (company.indexOf(comp) < 5) {
        // TIME CALCULATIONS FOR OPENING/CLOSING BUSINESS
        moment.tz.setDefault("America/Chicago");
        let time = moment().format("HH:mm");
        let day = moment
          .utc(new Date(), "HH:mm")
          .tz("America/Chicago")
          .format("dddd");

        const isTimeBetween = function (startTime, endTime, serverTime) {
          let start = moment(startTime, "H:mm");
          let end = moment(endTime, "H:mm");
          let server = moment(serverTime, "H:mm");
          if (end < start) {
            return (
              (server >= start && server <= moment("23:59:59", "h:mm:ss")) ||
              (server >= moment("0:00:00", "h:mm:ss") && server < end)
            );
          }
          return server >= start && server < end;
        };

        let startTime = day.charAt(0).toLowerCase() + day.slice(1) + "From";
        startTime = comp[startTime];
        let endTime = day.charAt(0).toLowerCase() + day.slice(1) + "To";
        endTime = comp[endTime];

        if (startTime && endTime) {
          comp.startTime = startTime;
          comp.endTime = endTime;
          if (isTimeBetween(startTime, endTime, time))
            comp.companyStatus = true;
          else comp.companyStatus = false;
        } else {
          comp.isHoliday = true;
          comp.companyStatus = false;
        }
        companies.push(comp);
      }
    });

    // if (req.user) {
    //   user.status = true;
    //   await user.save();
    // }

    let time = moment.utc(new Date(), "HH:mm").tz("America/Chicago");

    usaTime = time.format("HH:mm");

    res.render("index", {
      title: "GABAZZO",
      user,
      company,
      companies,
      service,
      usaTime,
      lastMessage,
    });
  },

  //GET /aboutUs
  async getAboutUs(req, res, next) {
    let user = await User.findById(req.user);
    //getting the conversation of the sender
    let conversations = [],
      lastMessage;

    if (user) {
      let existingConv = await Conversation.find({
        participants: { $in: user._id },
      }).sort({ lastMsgTime: -1 });

      if (existingConv) {
        //getting the msgs against the current sender and receiver
        for (let i = 0; i < existingConv.length; i++) {
          let tempChat = await Chat.find({
            conversationID: existingConv[i]._id,
          })
            .sort({
              _id: 1,
            })
            .populate("conversationID")
            .populate("messages.sender.id")
            .populate("messages.receiver.id");
          conversations.push(tempChat);
        }
      }
    }
    let company = await User.find()
      .where("isCompany" && "isEmailVerified")
      .equals(true)
      .exec();

    let existingConv = await Conversation.find({
      participants: { $in: req.user?.id },
    }).sort({ lastMsgTime: -1 });

    if (existingConv) {
      lastMessage = await Chat.find({
        conversationID: existingConv[0]?._id,
      });
      lastMessage = lastMessage[0];
    }
    res.render("about-us", {
      title: "GABAZZO | About Us",
      user,
      company,
      conversations,
      lastMessage,
    });
  },

  //GET Partnership
  async getPartnership(req, res, next) {
    let user = await User.findById(req.user);
    let conversations = [],
      lastMessage;

    if (user) {
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
    }

    let company = await User.find()
      .where("isCompany" && "isEmailVerified")
      .equals(true)
      .exec();
    res.render("partnership", {
      title: "GABAZZO | Contact Us",
      user,
      company,
      conversations,
      lastMessage,
    });
  },

  // POST Partnership
  async postPartnership(req, res, next) {
    try {
      const msg = {
        to: "support@gabazzo.com",
        from: "GABAZZO <no-reply@gabazzo.com>",
        subject: "Partnership Invitation",
        text: `Name: ${req.body.name}
               Email: ${req.body.email}
               Company Name: ${req.body.companyName}
               Message: ${req.body.message}`.replace(/				/g, ""),
      };

      await sgMail.send(msg).catch((err) => console.log(err));

      req.session.success = `Email Sent`;
      res.redirect("back");
    } catch (err) {
      console.log(err);
      req.session.error = err;
      res.redirect("back");
    }
  },

  //GET contact-us
  async getContactUs(req, res, next) {
    let user = await User.findById(req.user);
    let conversations = [],
      lastMessage;
    let existingConv;
    if (user) {
      //getting the conversation of the sender
      existingConv = await Conversation.find({
        participants: { $in: user._id },
      }).sort({ lastMsgTime: -1 });

      if (existingConv) {
        //getting the msgs against the current sender and receiver
        for (let i = 0; i < existingConv.length; i++) {
          let tempChat = await Chat.find({
            conversationID: existingConv[i]._id,
          })
            .sort({
              _id: 1,
            })
            .populate("conversationID")
            .populate("messages.sender.id")
            .populate("messages.receiver.id");

          conversations.push(tempChat);
        }
      }
    }

    let company = await User.find()
      .where("isCompany" && "isEmailVerified")
      .equals(true)
      .exec();
    if (existingConv) {
      lastMessage = await Chat.find({
        conversationID: existingConv[0]?._id,
      });
      lastMessage = lastMessage[0];
    }
    res.render("contact-us", {
      title: "GABAZZO | Contact Us",
      user,
      company,
      conversations,
      lastMessage,
    });
  },

  // POST ContactUs
  async postContactUs(req, res, next) {
    const msg = {
      to: "support@gabazzo.com",
      from: "GABAZZO <no-reply@gabazzo.com>",
      subject: req.body.subject,
      text: `First Name: ${req.body.firstName}
                   Last Name: ${req.body.lastName}
                   Email: ${req.body.email}
                   Message: ${req.body.message}`.replace(/				/g, ""),
    };

    await sgMail.send(msg).catch((err) => console.log(err));

    req.session.success = `Email Sent`;
    res.redirect("back");
  },

  //GET cookie-policy
  async getCookiePolicy(req, res, next) {
    let user = await User.findById(req.user);
    let conversations = [],
      lastMessage,
      existingConv;

    if (user) {
      //getting the conversation of the sender
      existingConv = await Conversation.find({
        participants: { $in: user._id },
      }).sort({ lastMsgTime: -1 });

      if (existingConv) {
        //getting the msgs against the current sender and receiver
        for (let i = 0; i < existingConv.length; i++) {
          let tempChat = await Chat.find({
            conversationID: existingConv[i]._id,
          })
            .sort({
              _id: 1,
            })
            .populate("conversationID")
            .populate("messages.sender.id")
            .populate("messages.receiver.id");

          conversations.push(tempChat);
        }
      }
    }
    let company = await User.find()
      .where("isCompany" && "isEmailVerified")
      .equals(true)
      .exec();

    if (existingConv) {
      lastMessage = await Chat.find({
        conversationID: existingConv[0]?._id,
      });
      lastMessage = lastMessage[0];
    }
    res.render("cookie-policy", {
      title: "GABAZZO | Cookie Policy",
      user,
      company,
      conversations,
      lastMessage,
    });
  },

  //GET Help Center Buyer
  async getHelpBuyer(req, res, next) {
    let user = await User.findById(req.user);
    let conversations = [],
      lastMessage,
      existingConv;

    if (user) {
      //getting the conversation of the sender
      existingConv = await Conversation.find({
        participants: { $in: user._id },
      }).sort({ lastMsgTime: -1 });

      if (existingConv) {
        //getting the msgs against the current sender and receiver
        for (let i = 0; i < existingConv.length; i++) {
          let tempChat = await Chat.find({
            conversationID: existingConv[i]._id,
          })
            .sort({
              _id: 1,
            })
            .populate("conversationID")
            .populate("messages.sender.id")
            .populate("messages.receiver.id");

          conversations.push(tempChat);
        }
      }
    }
    let company = await User.find()
      .where("isCompany" && "isEmailVerified")
      .equals(true)
      .exec();

    if (existingConv) {
      lastMessage = await Chat.find({
        conversationID: existingConv[0]?._id,
      });
      lastMessage = lastMessage[0];
    }
    res.render("help-center-buyer", {
      title: "GABAZZO | Buyer Help Center",
      user,
      company,
      conversations,
      lastMessage,
    });
  },

  //GET Help Center Seller
  async getHelpSeller(req, res, next) {
    let user = await User.findById(req.user);
    let conversations = [],
      lastMessage,
      existingConv;

    if (user) {
      //getting the conversation of the sender
      existingConv = await Conversation.find({
        participants: { $in: user._id },
      }).sort({ lastMsgTime: -1 });

      if (existingConv) {
        //getting the msgs against the current sender and receiver
        for (let i = 0; i < existingConv.length; i++) {
          let tempChat = await Chat.find({
            conversationID: existingConv[i]._id,
          })
            .sort({
              _id: 1,
            })
            .populate("conversationID")
            .populate("messages.sender.id")
            .populate("messages.receiver.id");

          conversations.push(tempChat);
        }
      }
    }
    let company = await User.find()
      .where("isCompany" && "isEmailVerified")
      .equals(true)
      .exec();

    if (existingConv) {
      lastMessage = await Chat.find({
        conversationID: existingConv[0]?._id,
      });
      lastMessage = lastMessage[0];
    }
    res.render("help-center-seller", {
      title: "GABAZZO | Seller Help Center",
      user,
      company,
      conversations,
      lastMessage,
    });
  },

  //GET how-it-works-business-owner
  async getHowBusiness(req, res, next) {
    let user = await User.findById(req.user);

    let conversations = [];

    if (user) {
      //getting the conversation of the sender
      let existingConv = await Conversation.find({
        participants: { $in: user._id },
      }).sort({ lastMsgTime: -1 });

      if (existingConv) {
        //getting the msgs against the current sender and receiver
        for (let i = 0; i < existingConv.length; i++) {
          let tempChat = await Chat.find({
            conversationID: existingConv[i]._id,
          })
            .sort({
              _id: 1,
            })
            .populate("conversationID")
            .populate("messages.sender.id")
            .populate("messages.receiver.id");

          conversations.push(tempChat);
        }
      }
    }

    let company = await User.find()
      .where("isCompany" && "isEmailVerified")
      .equals(true)
      .exec();
    res.render("how-it-works-business-owner", {
      title: "GABAZZO | How It Works",
      user,
      company,
      conversations,
    });
  },

  //GET how-it-works-members
  async getHowMember(req, res, next) {
    let user = await User.findById(req.user);
    let conversations = [];

    if (user) {
      //getting the conversation of the sender
      let existingConv = await Conversation.find({
        participants: { $in: user._id },
      }).sort({ lastMsgTime: -1 });

      if (existingConv) {
        //getting the msgs against the current sender and receiver
        for (let i = 0; i < existingConv.length; i++) {
          let tempChat = await Chat.find({
            conversationID: existingConv[i]._id,
          })
            .sort({
              _id: 1,
            })
            .populate("conversationID")
            .populate("messages.sender.id")
            .populate("messages.receiver.id");
          conversations.push(tempChat);
        }
      }
    }
    let company = await User.find()
      .where("isCompany" && "isEmailVerified")
      .equals(true)
      .exec();
    res.render("how-it-works-members", {
      title: "GABAZZO | How It Works",
      user,
      company,
      conversations,
    });
  },

  //GET press-and-news
  async getPress(req, res, next) {
    let user = await User.findById(req.user);

    let conversations = [],
      lastMessage,
      existingConv;

    if (user) {
      //getting the conversation of the sender
      existingConv = await Conversation.find({
        participants: { $in: user._id },
      }).sort({ lastMsgTime: -1 });

      if (existingConv) {
        //getting the msgs against the current sender and receiver
        for (let i = 0; i < existingConv.length; i++) {
          let tempChat = await Chat.find({
            conversationID: existingConv[i]._id,
          })
            .sort({
              _id: 1,
            })
            .populate("conversationID")
            .populate("messages.sender.id")
            .populate("messages.receiver.id");

          conversations.push(tempChat);
        }
      }
    }

    let company = await User.find()
      .where("isCompany" && "isEmailVerified")
      .equals(true)
      .exec();

    if (existingConv) {
      lastMessage = await Chat.find({
        conversationID: existingConv[0]?._id,
      });
      lastMessage = lastMessage[0];
    }
    res.render("press-and-news", {
      title: "GABAZZO | Press & News",
      user,
      company,
      lastMessage,
    });
  },

  //GET Article-Investor Relations-Crowd Funding Campgain
  async getGabazzoCrowdFundingCampaign(req, res, next) {
    let user = await User.findById(req.user);

    let conversations = [],
      lastMessage,
      existingConv;

    if (user) {
      //getting the conversation of the sender
      existingConv = await Conversation.find({
        participants: { $in: user._id },
      }).sort({ lastMsgTime: -1 });

      if (existingConv) {
        //getting the msgs against the current sender and receiver
        for (let i = 0; i < existingConv.length; i++) {
          let tempChat = await Chat.find({
            conversationID: existingConv[i]._id,
          })
            .sort({
              _id: 1,
            })
            .populate("conversationID")
            .populate("messages.sender.id")
            .populate("messages.receiver.id");

          conversations.push(tempChat);
        }
      }
    }

    let company = await User.find()
      .where("isCompany" && "isEmailVerified")
      .equals(true)
      .exec();

    if (existingConv) {
      lastMessage = await Chat.find({
        conversationID: existingConv[0]?._id,
      });
      lastMessage = lastMessage[0];
    }
    res.render("press-and-news-pages/crowdfunding-campaign", {
      title: "GABAZZO | News | Crowd Funding Campaign",
      user,
      company,
      lastMessage,
    });
  },

  async getAboutDigipaid(req, res, next) {
    let user = await User.findById(req.user);

    let conversations = [],
      lastMessage,
      existingConv;

    if (user) {
      //getting the conversation of the sender
      existingConv = await Conversation.find({
        participants: { $in: user._id },
      }).sort({ lastMsgTime: -1 });

      if (existingConv) {
        //getting the msgs against the current sender and receiver
        for (let i = 0; i < existingConv.length; i++) {
          let tempChat = await Chat.find({
            conversationID: existingConv[i]._id,
          })
            .sort({
              _id: 1,
            })
            .populate("conversationID")
            .populate("messages.sender.id")
            .populate("messages.receiver.id");

          conversations.push(tempChat);
        }
      }
    }

    let company = await User.find()
      .where("isCompany" && "isEmailVerified")
      .equals(true)
      .exec();

    if (existingConv) {
      lastMessage = await Chat.find({
        conversationID: existingConv[0]?._id,
      });
      lastMessage = lastMessage[0];
    }
    res.render("press-and-news-pages/about-digipaid", {
      title: "GABAZZO | News | About Digipaid",
      user,
      company,
      lastMessage,
    });
  },

  //GET Whistleblower-Hotline
  async getWhistleblowerHotline(req, res, next) {
    let user = await User.findById(req.user);

    let conversations = [],
      lastMessage,
      existingConv;

    if (user) {
      //getting the conversation of the sender
      existingConv = await Conversation.find({
        participants: { $in: user._id },
      }).sort({ lastMsgTime: -1 });

      if (existingConv) {
        //getting the msgs against the current sender and receiver
        for (let i = 0; i < existingConv.length; i++) {
          let tempChat = await Chat.find({
            conversationID: existingConv[i]._id,
          })
            .sort({
              _id: 1,
            })
            .populate("conversationID")
            .populate("messages.sender.id")
            .populate("messages.receiver.id");

          conversations.push(tempChat);
        }
      }
    }

    let company = await User.find()
      .where("isCompany" && "isEmailVerified")
      .equals(true)
      .exec();

    if (existingConv) {
      lastMessage = await Chat.find({
        conversationID: existingConv[0]?._id,
      });
      lastMessage = lastMessage[0];
    }
    res.render("whistleblower-hotline", {
      title: "GABAZZO | Whistleblower Hotline",
      user,
      company,
      lastMessage,
    });
  },

  //GET privacyPolicy
  async getPrivacyPolicy(req, res, next) {
    let user = await User.findById(req.user);

    let conversations = [],
      lastMessage,
      existingConv;

    if (user) {
      //getting the conversation of the sender
      existingConv = await Conversation.find({
        participants: { $in: user._id },
      }).sort({ lastMsgTime: -1 });

      if (existingConv) {
        //getting the msgs against the current sender and receiver
        for (let i = 0; i < existingConv.length; i++) {
          let tempChat = await Chat.find({
            conversationID: existingConv[i]._id,
          })
            .sort({
              _id: 1,
            })
            .populate("conversationID")
            .populate("messages.sender.id")
            .populate("messages.receiver.id");

          conversations.push(tempChat);
        }
      }
    }

    let company = await User.find()
      .where("isCompany" && "isEmailVerified")
      .equals(true)
      .exec();

    if (existingConv) {
      lastMessage = await Chat.find({
        conversationID: existingConv[0]?._id,
      });
      lastMessage = lastMessage[0];
    }
    res.render("privacy-policy", {
      title: "GABAZZO | Privacy Policy",
      user,
      company,
      conversations,
      lastMessage,
    });
  },

  //GET site-map
  async getSiteMap(req, res, next) {
    let user = await User.findById(req.user);
    let conversations = [];
    let lastMessage = [];
    let existingConv;
    if (user) {
      //getting the conversation of the sender
      existingConv = await Conversation.find({
        participants: { $in: user._id },
      }).sort({ lastMsgTime: -1 });

      if (existingConv) {
        //getting the msgs against the current sender and receiver
        for (let i = 0; i < existingConv.length; i++) {
          let tempChat = await Chat.find({
            conversationID: existingConv[i]._id,
          })
            .sort({
              _id: 1,
            })
            .populate("conversationID")
            .populate("messages.sender.id")
            .populate("messages.receiver.id");
          conversations.push(tempChat);
        }
      }
    }
    let company = await User.find()
      .where("isCompany" && "isEmailVerified")
      .equals(true)
      .exec();
    if (existingConv) {
      lastMessage = await Chat.find({
        conversationID: existingConv[0]?._id,
      });
      lastMessage = lastMessage[0];
    }
    res.render("site-map", {
      title: "GABAZZO | Site Map",
      user,
      company,
      conversations,
      lastMessage,
    });
  },

  // Get Covid Info
  async getCovidInfo(req, res, next) {
    let user = await User.findById(req.user);
    let conversations = [],
      existingConv,
      lastMessage;

    if (user) {
      //getting the conversation of the sender
      existingConv = await Conversation.find({
        participants: { $in: user._id },
      }).sort({ lastMsgTime: -1 });

      if (existingConv) {
        //getting the msgs against the current sender and receiver
        for (let i = 0; i < existingConv.length; i++) {
          let tempChat = await Chat.find({
            conversationID: existingConv[i]._id,
          })
            .sort({
              _id: 1,
            })
            .populate("conversationID")
            .populate("messages.sender.id")
            .populate("messages.receiver.id");

          conversations.push(tempChat);
        }
      }
    }
    let company = await User.find()
      .where("isCompany" && "isEmailVerified")
      .equals(true)
      .exec();

    if (existingConv) {
      lastMessage = await Chat.find({
        conversationID: existingConv[0]?._id,
      });
      lastMessage = lastMessage[0];
    }
    res.render("covid-info", {
      title: "GABAZZO | Covid Informations",
      user,
      company,
      conversations,
      lastMessage,
    });
  },

  // Get Jobs & Opportunities Info
  async getJobsAndOpportunities(req, res, next) {
    let user = await User.findById(req.user);
    let conversations = [],
      lastMessage,
      existingConv;

    if (user) {
      //getting the conversation of the sender
      existingConv = await Conversation.find({
        participants: { $in: user._id },
      }).sort({ lastMsgTime: -1 });

      if (existingConv) {
        //getting the msgs against the current sender and receiver
        for (let i = 0; i < existingConv.length; i++) {
          let tempChat = await Chat.find({
            conversationID: existingConv[i]._id,
          })
            .sort({
              _id: 1,
            })
            .populate("conversationID")
            .populate("messages.sender.id")
            .populate("messages.receiver.id");

          conversations.push(tempChat);
        }
      }
    }
    let company = await User.find()
      .where("isCompany" && "isEmailVerified")
      .equals(true)
      .exec();

    if (existingConv) {
      lastMessage = await Chat.find({
        conversationID: existingConv[0]?._id,
      });
      lastMessage = lastMessage[0];
    }
    res.render("jobs-and-opportunities", {
      title: "GABAZZO | Jobs & Opportunities",
      user,
      company,
      conversations,
      lastMessage,
    });
  },

  // Get Technology Opportunities
  async getTechnologyOpportunities(req, res, next) {
    let user = await User.findById(req.user);
    let conversations = [],
      lastMessage,
      existingConv;

    if (user) {
      //getting the conversation of the sender
      existingConv = await Conversation.find({
        participants: { $in: user._id },
      }).sort({ lastMsgTime: -1 });

      if (existingConv) {
        //getting the msgs against the current sender and receiver
        for (let i = 0; i < existingConv.length; i++) {
          let tempChat = await Chat.find({
            conversationID: existingConv[i]._id,
          })
            .sort({
              _id: 1,
            })
            .populate("conversationID")
            .populate("messages.sender.id")
            .populate("messages.receiver.id");

          conversations.push(tempChat);
        }
      }
    }
    let company = await User.find()
      .where("isCompany" && "isEmailVerified")
      .equals(true)
      .exec();

    if (existingConv) {
      lastMessage = await Chat.find({
        conversationID: existingConv[0]?._id,
      });
      lastMessage = lastMessage[0];
    }
    res.render("Jobs-And-Opportunities/technology-opportunities", {
      title: "GABAZZO | Jobs & Opportunities | Technology Opportunities ",
      user,
      company,
      conversations,
      lastMessage,
    });
  },

  // Get Apply Full Stack Developer
  async getApplyFullStackDeveloper(req, res, next) {
    let user = await User.findById(req.user);
    let conversations = [],
      lastMessage,
      existingConv;

    if (user) {
      //getting the conversation of the sender
      existingConv = await Conversation.find({
        participants: { $in: user._id },
      }).sort({ lastMsgTime: -1 });

      if (existingConv) {
        //getting the msgs against the current sender and receiver
        for (let i = 0; i < existingConv.length; i++) {
          let tempChat = await Chat.find({
            conversationID: existingConv[i]._id,
          })
            .sort({
              _id: 1,
            })
            .populate("conversationID")
            .populate("messages.sender.id")
            .populate("messages.receiver.id");

          conversations.push(tempChat);
        }
      }
    }
    let company = await User.find()
      .where("isCompany" && "isEmailVerified")
      .equals(true)
      .exec();

    if (existingConv) {
      lastMessage = await Chat.find({
        conversationID: existingConv[0]?._id,
      });
      lastMessage = lastMessage[0];
    }
    res.render("Jobs-And-Opportunities/apply-full-stack-developer", {
      title:
        "GABAZZO | Jobs & Opportunities | Technology Opportunities | Apply Full-Stack Developer ",
      user,
      company,
      conversations,
      lastMessage,
    });
  },

  // Get Safety for Members Info
  async getSafetyBuyer(req, res, next) {
    let user = await User.findById(req.user);
    let conversations = [],
      lastMessage,
      existingConv;

    if (user) {
      //getting the conversation of the sender
      existingConv = await Conversation.find({
        participants: { $in: user._id },
      }).sort({ lastMsgTime: -1 });

      if (existingConv) {
        //getting the msgs against the current sender and receiver
        for (let i = 0; i < existingConv.length; i++) {
          let tempChat = await Chat.find({
            conversationID: existingConv[i]._id,
          })
            .sort({
              _id: 1,
            })
            .populate("conversationID")
            .populate("messages.sender.id")
            .populate("messages.receiver.id");

          conversations.push(tempChat);
        }
      }
    }
    let company = await User.find()
      .where("isCompany" && "isEmailVerified")
      .equals(true)
      .exec();

    if (existingConv) {
      lastMessage = await Chat.find({
        conversationID: existingConv[0]?._id,
      });
      lastMessage = lastMessage[0];
    }
    res.render("safety-for-members", {
      title: "GABAZZO | Safety for Members",
      user,
      company,
      conversations,
      lastMessage,
    });
  },

  // Get Safety for Contractor Info
  async getSafetySeller(req, res, next) {
    let user = await User.findById(req.user);
    let conversations = [],
      lastMessage,
      existingConv;

    if (user) {
      //getting the conversation of the sender
      existingConv = await Conversation.find({
        participants: { $in: user._id },
      }).sort({ lastMsgTime: -1 });

      if (existingConv) {
        //getting the msgs against the current sender and receiver
        for (let i = 0; i < existingConv.length; i++) {
          let tempChat = await Chat.find({
            conversationID: existingConv[i]._id,
          })
            .sort({
              _id: 1,
            })
            .populate("conversationID")
            .populate("messages.sender.id")
            .populate("messages.receiver.id");

          conversations.push(tempChat);
        }
      }
    }
    let company = await User.find()
      .where("isCompany" && "isEmailVerified")
      .equals(true)
      .exec();

    if (existingConv) {
      lastMessage = await Chat.find({
        conversationID: existingConv[0]?._id,
      });
      lastMessage = lastMessage[0];
    }
    res.render("safety-for-contractors", {
      title: "GABAZZO | Safety for Sellers",
      user,
      company,
      conversations,
      lastMessage,
    });
  },

  //GET terms
  async getTerms(req, res, next) {
    let user = await User.findById(req.user);

    let conversations = [],
      existingConv,
      lastMessage;

    if (user) {
      //getting the conversation of the sender
      existingConv = await Conversation.find({
        participants: { $in: user._id },
      }).sort({ lastMsgTime: -1 });

      if (existingConv) {
        //getting the msgs against the current sender and receiver
        for (let i = 0; i < existingConv.length; i++) {
          let tempChat = await Chat.find({
            conversationID: existingConv[i]._id,
          })
            .sort({
              _id: 1,
            })
            .populate("conversationID")
            .populate("messages.sender.id")
            .populate("messages.receiver.id");

          conversations.push(tempChat);
        }
      }
    }

    let company = await User.find()
      .where("isCompany" && "isEmailVerified")
      .equals(true)
      .exec();

    if (existingConv) {
      lastMessage = await Chat.find({
        conversationID: existingConv[0]?._id,
      });
      lastMessage = lastMessage[0];
    }
    res.render("terms-and-conditions", {
      title: "GABAZZO | Terms And Conditions",
      user,
      company,
      conversations,
      lastMessage,
    });
  },

  //GET Intellectual Property Claims
  async getIntellectual(req, res, next) {
    let user = await User.findById(req.user);

    let conversations = [],
      lastMessage,
      existingConv;

    if (user) {
      //getting the conversation of the sender
      existingConv = await Conversation.find({
        participants: { $in: user._id },
      }).sort({ lastMsgTime: -1 });

      if (existingConv) {
        //getting the msgs against the current sender and receiver
        for (let i = 0; i < existingConv.length; i++) {
          let tempChat = await Chat.find({
            conversationID: existingConv[i]._id,
          })
            .sort({
              _id: 1,
            })
            .populate("conversationID")
            .populate("messages.sender.id")
            .populate("messages.receiver.id");

          conversations.push(tempChat);
        }
      }
    }

    let company = await User.find()
      .where("isCompany" && "isEmailVerified")
      .equals(true)
      .exec();

    if (existingConv) {
      lastMessage = await Chat.find({
        conversationID: existingConv[0]?._id,
      });
      lastMessage = lastMessage[0];
    }
    res.render("intellectual-property-claims", {
      title: "GABAZZO | Intellectual Property Claims",
      user,
      company,
      conversations,
      lastMessage,
    });
  },

  //GET Trust and Safety Members
  async getTrustMembers(req, res, next) {
    let user = await User.findById(req.user);

    let conversations = [],
      lastMessage,
      existingConv;

    if (user) {
      //getting the conversation of the sender
      existingConv = await Conversation.find({
        participants: { $in: user._id },
      }).sort({ lastMsgTime: -1 });

      if (existingConv) {
        //getting the msgs against the current sender and receiver
        for (let i = 0; i < existingConv.length; i++) {
          let tempChat = await Chat.find({
            conversationID: existingConv[i]._id,
          })
            .sort({
              _id: 1,
            })
            .populate("conversationID")
            .populate("messages.sender.id")
            .populate("messages.receiver.id");

          conversations.push(tempChat);
        }
      }
    }

    let company = await User.find()
      .where("isCompany" && "isEmailVerified")
      .equals(true)
      .exec();

    if (existingConv) {
      lastMessage = await Chat.find({
        conversationID: existingConv[0]?._id,
      });
      lastMessage = lastMessage[0];
    }
    res.render("trust-and-safety-members", {
      title: "GABAZZO | Trust and Safety Members",
      user,
      company,
      conversations,
      lastMessage,
    });
  },

  //GET Study Buyer
  async getStudyBuyer(req, res, next) {
    let user = await User.findById(req.user);

    let conversations = [],
      lastMessage,
      existingConv;

    if (user) {
      //getting the conversation of the sender
      existingConv = await Conversation.find({
        participants: { $in: user._id },
      }).sort({ lastMsgTime: -1 });

      if (existingConv) {
        //getting the msgs against the current sender and receiver
        for (let i = 0; i < existingConv.length; i++) {
          let tempChat = await Chat.find({
            conversationID: existingConv[i]._id,
          })
            .sort({
              _id: 1,
            })
            .populate("conversationID")
            .populate("messages.sender.id")
            .populate("messages.receiver.id");

          conversations.push(tempChat);
        }
      }
    }

    let company = await User.find()
      .where("isCompany" && "isEmailVerified")
      .equals(true)
      .exec();

    if (existingConv) {
      lastMessage = await Chat.find({
        conversationID: existingConv[0]?._id,
      });
      lastMessage = lastMessage[0];
    }
    res.render("study-buyer", {
      title: "GABAZZO | Study Buyer",
      user,
      company,
      conversations,
      lastMessage,
    });
  },

  //GET Seller League System
  async getSellerLeagueSystem(req, res, next) {
    let user = await User.findById(req.user);

    let conversations = [],
      lastMessage,
      existingConv;

    if (user) {
      //getting the conversation of the sender
      existingConv = await Conversation.find({
        participants: { $in: user._id },
      }).sort({ lastMsgTime: -1 });

      if (existingConv) {
        //getting the msgs against the current sender and receiver
        for (let i = 0; i < existingConv.length; i++) {
          let tempChat = await Chat.find({
            conversationID: existingConv[i]._id,
          })
            .sort({
              _id: 1,
            })
            .populate("conversationID")
            .populate("messages.sender.id")
            .populate("messages.receiver.id");

          conversations.push(tempChat);
        }
      }
    }

    let company = await User.find()
      .where("isCompany" && "isEmailVerified")
      .equals(true)
      .exec();

    if (existingConv) {
      lastMessage = await Chat.find({
        conversationID: existingConv[0]?._id,
      });
      lastMessage = lastMessage[0];
    }
    res.render("seller-league-system", {
      title: "GABAZZO | Seller League System",
      user,
      company,
      conversations,
      lastMessage,
    });
  },

  //GET Member Ranking System
  async getMemberRankingSystem(req, res, next) {
    let user = await User.findById(req.user);

    let conversations = [],
      lastMessage,
      existingConv;

    if (user) {
      //getting the conversation of the sender
      existingConv = await Conversation.find({
        participants: { $in: user._id },
      }).sort({ lastMsgTime: -1 });

      if (existingConv) {
        //getting the msgs against the current sender and receiver
        for (let i = 0; i < existingConv.length; i++) {
          let tempChat = await Chat.find({
            conversationID: existingConv[i]._id,
          })
            .sort({
              _id: 1,
            })
            .populate("conversationID")
            .populate("messages.sender.id")
            .populate("messages.receiver.id");

          conversations.push(tempChat);
        }
      }
    }

    let company = await User.find()
      .where("isCompany" && "isEmailVerified")
      .equals(true)
      .exec();

    if (existingConv) {
      lastMessage = await Chat.find({
        conversationID: existingConv[0]?._id,
      });
      lastMessage = lastMessage[0];
    }
    res.render("ranking-system-members", {
      title: "GABAZZO | Member Ranking System",
      user,
      company,
      conversations,
      lastMessage,
    });
  },

  //GET Investor Relations
  async getInvestorRelations(req, res, next) {
    let user = await User.findById(req.user);

    let conversations = [],
      lastMessage,
      existingConv;

    if (user) {
      //getting the conversation of the sender
      existingConv = await Conversation.find({
        participants: { $in: user._id },
      }).sort({ lastMsgTime: -1 });

      if (existingConv) {
        //getting the msgs against the current sender and receiver
        for (let i = 0; i < existingConv.length; i++) {
          let tempChat = await Chat.find({
            conversationID: existingConv[i]._id,
          })
            .sort({
              _id: 1,
            })
            .populate("conversationID")
            .populate("messages.sender.id")
            .populate("messages.receiver.id");

          conversations.push(tempChat);
        }
      }
    }

    let company = await User.find()
      .where("isCompany" && "isEmailVerified")
      .equals(true)
      .exec();

    if (existingConv) {
      lastMessage = await Chat.find({
        conversationID: existingConv[0]?._id,
      });
      lastMessage = lastMessage[0];
    }
    res.render("investor-relations", {
      title: "GABAZZO | Investor Relations",
      user,
      company,
      conversations,
      lastMessage,
    });
  },

  //GET Investor Contact Us
  async getInvestorContactUs(req, res, next) {
    let user = await User.findById(req.user);

    let conversations = [],
      lastMessage,
      existingConv;

    if (user) {
      //getting the conversation of the sender
      existingConv = await Conversation.find({
        participants: { $in: user._id },
      }).sort({ lastMsgTime: -1 });

      if (existingConv) {
        //getting the msgs against the current sender and receiver
        for (let i = 0; i < existingConv.length; i++) {
          let tempChat = await Chat.find({
            conversationID: existingConv[i]._id,
          })
            .sort({
              _id: 1,
            })
            .populate("conversationID")
            .populate("messages.sender.id")
            .populate("messages.receiver.id");

          conversations.push(tempChat);
        }
      }
    }

    let company = await User.find()
      .where("isCompany" && "isEmailVerified")
      .equals(true)
      .exec();

    if (existingConv) {
      lastMessage = await Chat.find({
        conversationID: existingConv[0]?._id,
      });
      lastMessage = lastMessage[0];
    }
    res.render("investor-contact-us", {
      title: "GABAZZO | Investor Relations | Contact Us",
      user,
      company,
      conversations,
      lastMessage,
    });
  },

  //GET Investor Email Alerts
  async getInvestorEmailAlerts(req, res, next) {
    let user = await User.findById(req.user);

    let conversations = [],
      lastMessage,
      existingConv;

    if (user) {
      //getting the conversation of the sender
      existingConv = await Conversation.find({
        participants: { $in: user._id },
      }).sort({ lastMsgTime: -1 });

      if (existingConv) {
        //getting the msgs against the current sender and receiver
        for (let i = 0; i < existingConv.length; i++) {
          let tempChat = await Chat.find({
            conversationID: existingConv[i]._id,
          })
            .sort({
              _id: 1,
            })
            .populate("conversationID")
            .populate("messages.sender.id")
            .populate("messages.receiver.id");

          conversations.push(tempChat);
        }
      }
    }

    let company = await User.find()
      .where("isCompany" && "isEmailVerified")
      .equals(true)
      .exec();

    if (existingConv) {
      lastMessage = await Chat.find({
        conversationID: existingConv[0]?._id,
      });
      lastMessage = lastMessage[0];
    }
    res.render("investor-email-alerts", {
      title: "GABAZZO | Investor Relations | Email Alerts",
      user,
      company,
      conversations,
      lastMessage,
    });
  },

  //GET Investor FAQs
  async getInvestorFaqs(req, res, next) {
    let user = await User.findById(req.user);

    let conversations = [],
      lastMessage,
      existingConv;

    if (user) {
      //getting the conversation of the sender
      existingConv = await Conversation.find({
        participants: { $in: user._id },
      }).sort({ lastMsgTime: -1 });

      if (existingConv) {
        //getting the msgs against the current sender and receiver
        for (let i = 0; i < existingConv.length; i++) {
          let tempChat = await Chat.find({
            conversationID: existingConv[i]._id,
          })
            .sort({
              _id: 1,
            })
            .populate("conversationID")
            .populate("messages.sender.id")
            .populate("messages.receiver.id");

          conversations.push(tempChat);
        }
      }
    }

    let company = await User.find()
      .where("isCompany" && "isEmailVerified")
      .equals(true)
      .exec();

    if (existingConv) {
      lastMessage = await Chat.find({
        conversationID: existingConv[0]?._id,
      });
      lastMessage = lastMessage[0];
    }
    res.render("investor-faqs", {
      title: "GABAZZO | Investor Relations | Email FAQs",
      user,
      company,
      conversations,
      lastMessage,
    });
  },

  //GET Patronage
  async getPatronage(req, res, next) {
    let user = await User.findById(req.user);

    let conversations = [],
      lastMessage,
      existingConv;

    if (user) {
      //getting the conversation of the sender
      existingConv = await Conversation.find({
        participants: { $in: user._id },
      }).sort({ lastMsgTime: -1 });

      if (existingConv) {
        //getting the msgs against the current sender and receiver
        for (let i = 0; i < existingConv.length; i++) {
          let tempChat = await Chat.find({
            conversationID: existingConv[i]._id,
          })
            .sort({
              _id: 1,
            })
            .populate("conversationID")
            .populate("messages.sender.id")
            .populate("messages.receiver.id");

          conversations.push(tempChat);
        }
      }
    }

    let company = await User.find()
      .where("isCompany" && "isEmailVerified")
      .equals(true)
      .exec();

    if (existingConv) {
      lastMessage = await Chat.find({
        conversationID: existingConv[0]?._id,
      });
      lastMessage = lastMessage[0];
    }
    res.render("patronage", {
      title: "GABAZZO | Investor Relations | Patronage",
      user,
      company,
      conversations,
      lastMessage,
    });
  },

  //GET Patronage Chief Officers
  async getPatronageChiefOfficers(req, res, next) {
    let user = await User.findById(req.user);

    let conversations = [],
      lastMessage,
      existingConv;

    if (user) {
      //getting the conversation of the sender
      existingConv = await Conversation.find({
        participants: { $in: user._id },
      }).sort({ lastMsgTime: -1 });

      if (existingConv) {
        //getting the msgs against the current sender and receiver
        for (let i = 0; i < existingConv.length; i++) {
          let tempChat = await Chat.find({
            conversationID: existingConv[i]._id,
          })
            .sort({
              _id: 1,
            })
            .populate("conversationID")
            .populate("messages.sender.id")
            .populate("messages.receiver.id");

          conversations.push(tempChat);
        }
      }
    }

    let company = await User.find()
      .where("isCompany" && "isEmailVerified")
      .equals(true)
      .exec();

    if (existingConv) {
      lastMessage = await Chat.find({
        conversationID: existingConv[0]?._id,
      });
      lastMessage = lastMessage[0];
    }
    res.render("patronage-chief-officers", {
      title: "GABAZZO | Investor Relations | Chief Officers",
      user,
      company,
      conversations,
      lastMessage,
    });
  },

  //GET Mexico Relations
  async getPatronageMexicoRelations(req, res, next) {
    let user = await User.findById(req.user);

    let conversations = [],
      lastMessage,
      existingConv;

    if (user) {
      //getting the conversation of the sender
      existingConv = await Conversation.find({
        participants: { $in: user._id },
      }).sort({ lastMsgTime: -1 });

      if (existingConv) {
        //getting the msgs against the current sender and receiver
        for (let i = 0; i < existingConv.length; i++) {
          let tempChat = await Chat.find({
            conversationID: existingConv[i]._id,
          })
            .sort({
              _id: 1,
            })
            .populate("conversationID")
            .populate("messages.sender.id")
            .populate("messages.receiver.id");

          conversations.push(tempChat);
        }
      }
    }

    let company = await User.find()
      .where("isCompany" && "isEmailVerified")
      .equals(true)
      .exec();

    if (existingConv) {
      lastMessage = await Chat.find({
        conversationID: existingConv[0]?._id,
      });
      lastMessage = lastMessage[0];
    }
    res.render("patronage-mexico-relations", {
      title: "GABAZZO | Investor Relations | Mexico Relations",
      user,
      company,
      conversations,
      lastMessage,
    });
  },

  //GET Events and Presentations
  async getEventsAndPresentations(req, res, next) {
    let user = await User.findById(req.user);

    let conversations = [],
      lastMessage,
      existingConv;

    if (user) {
      //getting the conversation of the sender
      existingConv = await Conversation.find({
        participants: { $in: user._id },
      }).sort({ lastMsgTime: -1 });

      if (existingConv) {
        //getting the msgs against the current sender and receiver
        for (let i = 0; i < existingConv.length; i++) {
          let tempChat = await Chat.find({
            conversationID: existingConv[i]._id,
          })
            .sort({
              _id: 1,
            })
            .populate("conversationID")
            .populate("messages.sender.id")
            .populate("messages.receiver.id");

          conversations.push(tempChat);
        }
      }
    }

    let company = await User.find()
      .where("isCompany" && "isEmailVerified")
      .equals(true)
      .exec();

    if (existingConv) {
      lastMessage = await Chat.find({
        conversationID: existingConv[0]?._id,
      });
      lastMessage = lastMessage[0];
    }
    res.render("events-and-presentations", {
      title: "GABAZZO | Events and Presentations",
      user,
      company,
      conversations,
      lastMessage,
    });
  },

  search(req, res, next) {
    let search = req.body.service;
    if (search === "Roofing Services") {
      res.redirect("/services/roofing-services");
    } else if (search === "Landscaping Services") {
      res.redirect("/services/landscaping-services");
    } else if (search === "Paving Services") {
      res.redirect("/services/paving-services");
    } else if (search === "Fencing Services") {
      res.redirect("/services/fencing-services");
    } else if (search === "Junk Removal") {
      res.redirect("/services/junk-removal");
    } else if (search === "General Siding") {
      res.redirect("/services/general-siding");
    } else if (search === "Exterior Painting") {
      res.redirect("/services/exterior-painting");
    } else if (search === "Garage Services") {
      res.redirect("/services/garage-services");
    } else if (search === "Pools, Spas and Hot Tubs") {
      res.redirect("/services/pools-hot-tubes-spas");
    } else if (search === "Masonry Services") {
      res.redirect("/services/masonry-services");
    } else if (search === "Plumbing Services") {
      res.redirect("/services/plumbing-services");
    } else if (search === "HVAC Services") {
      res.redirect("/services/hvac-services");
    } else if (search === "Dry Wall & Insulation") {
      res.redirect("/services/drywall-and-insulation");
    } else if (search === "Pest Control") {
      res.redirect("/services/pest-control");
    } else if (search === "General Cleaning") {
      res.redirect("/services/general-cleaning");
    } else if (search === "Painting Services") {
      res.redirect("/services/painting-services");
    } else if (search === "Flooring Services") {
      res.redirect("/services/flooring-services");
    } else if (search === "") {
      res.redirect("/services/general-remodeling");
    } else if (search === "Carpenters Services") {
      res.redirect("/services/carpenters-services");
    } else if (search === "Towing Services") {
      res.redirect("/services/towing-services");
    } else if (search === "Oil & Fluid Exchange") {
      res.redirect("/services/oil-and-fluid-exchange");
    } else if (search === "Body Shop") {
      res.redirect("/services/body-shop");
    } else if (search === "Mufflers & Exhaust Services") {
      res.redirect("/services/mufflers-and-exhaust");
    } else if (search === "Suspension Services") {
      res.redirect("/services/suspension-services");
    } else if (search === "Brake Change") {
      res.redirect("/services/brake-change");
    } else if (search === "Alarm Installation") {
      res.redirect("/services/alarm-installation");
    } else if (search === "Engine Diagnostic Services") {
      res.redirect("/services/engine-diagnostic");
    } else if (search === "Heating & Cooling") {
      res.redirect("/services/heating-and-cooling");
    } else if (search === "Wheel & Tire Services") {
      res.redirect("/services/wheel-and-tire");
    } else if (search === "Check Engine Light") {
      res.redirect("/services/check-engine-light");
    } else if (search === "Battery Services") {
      res.redirect("/services/battery-services");
    } else if (search === "Window Tinting") {
      res.redirect("/services/window-tinting");
    } else if (search === "Fleet Services") {
      res.redirect("/services/fleet-services");
    } else if (search === "General Handyman") {
      res.redirect("/services/general-handyman");
    } else if (search === "General Contractor") {
      res.redirect("/services/general-contractor");
    } else if (search === "Electrical Services") {
      res.redirect("/services/electrical-services");
    } else if (search === "Moving Services") {
      res.redirect("/services/moving-services");
    } else if (search === "Building Security") {
      res.redirect("/services/building-security");
    } else if (search === "Demolition Services") {
      res.redirect("/services/demolition-services");
    } else if (search === "Appliance Services") {
      res.redirect("/services/appliance-repairs");
    } else if (search === "Locksmith Services") {
      res.redirect("/services/locksmith-services");
    } else {
      res.redirect("back");
    }
  },

  //GET /become-a-seller-overview
  getSellerOverview(req, res, next) {
    res.render("visitors/become-a-seller-overview", {
      title: "Seller Overview",
    });
  },

  //GET /become-a-seller-overview-do
  getSellerDo(req, res, next) {
    res.render("visitors/become-a-seller-overview-do", {
      title: "Seller Overview",
    });
  },

  //GET /become-a-seller-overview-do-not
  getSellerDoNot(req, res, next) {
    res.render("visitors/become-a-seller-overview-do-not", {
      title: "Seller Overview",
    });
  },

  //GET /become-a-seller-overview2
  getSellerOverview2(req, res, next) {
    res.render("visitors/become-a-seller-overview2", {
      title: "Seller Overview",
    });
  },

  //GET /sign-up
  async getSignup(req, res, next) {
    let total = await User.find({ isEmailVerified: true })
      .where("isCompany")
      .equals(true)
      .exec();
    res.render("visitors/sign-up", { title: "Sign Up", total });
  },

  //POST /sign-up
  async postSignUp(req, res, next) {
    if (req.body.password === req.body.confirmpassword) {
      const token = await crypto.randomBytes(20).toString("hex");
      const newUser = new User({
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        username: req.body.username,
        email: req.body.email,
        verifyToken: token,
        verifyTokenExpires: Date.now() + 3600000, // 1 hour
        about: "",
      });

      let user = await User.register(newUser, req.body.password);

      req.login(user, async function (err) {
        if (err) return next(err);

        const msg = {
          to: user.email,
          from: "Gabazzo <no-reply@gabazzo.com>",
          subject: "Gabazzo - Verify Email",
          template_id: "d-b8b55998c9294122933903d622cedb77",
          dynamic_template_data: {
            username: user.username,
            verify_link: `http://${req.headers.host}/verify/${token}`,
          },
        };

        try {
          await sgMail.send(msg).catch((err) => console.error(err));

          req.session.success = `An Email has been sent to ${user.email} Kindly verify your email.`;

          // req.session.success = "User Registered";
          // console.log("USER REGISTERED!");
          return res.redirect("/");
        } catch (error) {
          console.log(error);
        }
      });
    } else {
      return res.redirect("back");
    }
  },

  //GET /company-sign-up
  async getCompanySignUpHome(req, res, next) {
    let company = await User.find({
      isCompany: true,
      isEmailVerified: true,
    }).exec();

    let companies = [];
    company.forEach(function (comp) {
      if (company.indexOf(comp) < 5) {
        // TIME CALCULATIONS FOR OPENING/CLOSING BUSINESS
        moment.tz.setDefault("America/Chicago");
        let time = moment().format("HH:mm");
        let day = moment
          .utc(new Date(), "HH:mm")
          .tz("America/Chicago")
          .format("dddd");

        const isTimeBetween = function (startTime, endTime, serverTime) {
          let start = moment(startTime, "H:mm");
          let end = moment(endTime, "H:mm");
          let server = moment(serverTime, "H:mm");
          if (end < start) {
            return (
              (server >= start && server <= moment("23:59:59", "h:mm:ss")) ||
              (server >= moment("0:00:00", "h:mm:ss") && server < end)
            );
          }
          return server >= start && server < end;
        };

        let startTime = day.charAt(0).toLowerCase() + day.slice(1) + "From";
        startTime = comp[startTime];
        let endTime = day.charAt(0).toLowerCase() + day.slice(1) + "To";
        endTime = comp[endTime];

        if (startTime && endTime) {
          comp.startTime = startTime;
          comp.endTime = endTime;
          if (isTimeBetween(startTime, endTime, time))
            comp.companyStatus = true;
          else comp.companyStatus = false;
        } else {
          comp.isHoliday = true;
          comp.companyStatus = false;
        }
        companies.push(comp);
      }
    });

    res.render("visitors/company-sign-up-home", {
      title: "Company Sign Up",
      company,
      companies,
    });
  },

  //GET /company-sign-up
  getCompanySignUp(req, res, next) {
    res.render("visitors/company-sign-up1", { title: "Company Sign Up" });
  },

  async postCompanySignUp(req, res, next) {
    let emailExists = await User.findOne({ email: req.body.email });
    let userNameExists = await User.findOne({ username: req.body.username });
    let response;

    if (emailExists || userNameExists) {
      req.session.error = "Email or Username already exists";
      // console.log("Email or Username already exists");
      return res.redirect("back");
    } else {
      try {
        response = await geocodingClient
          .forwardGeocode({
            query: req.body.location,
            limit: 1,
          })
          .send();

        req.body.coordinates = response.body.features[0].geometry.coordinates;

        await geocodingClient
          .reverseGeocode({
            query: [req.body.coordinates[0], req.body.coordinates[1]],
          })
          .send()
          .then((response) => {
            for (let i = 0; i < response.body.features.length; i++) {
              if (response.body.features[i].place_type[0] === "place") {
                req.body.city = response.body.features[i].text;
              }
              if (response.body.features[i].place_type[0] === "region") {
                req.body.state = response.body.features[i].text;
              }
              if (response.body.features[i].place_type[0] === "postcode") {
                req.body.zipCode = response.body.features[i].text;
              }
            }
          });

        const newUser = new User({
          firstName: req.body.firstName,
          lastName: req.body.lastName,
          username: req.body.username,
          email: req.body.email,
          location: req.body.location,
          // address2: req.body.address2,
          city: req.body.city,
          state: req.body.state,
          zipCode: req.body.zipCode,
          country: req.body.country,
          phoneNumber: req.body.phoneNumber,
          isCompany: true,
          coordinates: req.body.coordinates,
        });

        let user = await User.register(newUser, req.body.password);
        req.login(user, function (err) {
          if (err) return next(err);
          // req.session.success = "Company Registered";
          // console.log(user);
          res.redirect("/company-sign-up2");
        });
      } catch (err) {
        console.log(err);
      }
    }
  },

  //GET /company-sign-up2
  getCompanySignUp2(req, res, next) {
    res.render("visitors/company-sign-up2", { title: "Company Sign Up" });
  },

  async postCompanySignUp2(req, res, next) {
    // req.body.filters = [];
    let image = await cloudinary.v2.uploader.upload(req.file.path);
    const user = req.user;
    user.companyName = req.body.companyName;
    user.logo = image.secure_url;
    user.logoId = image.public_id;
    user.about = req.body.about;

    await user.save();

    res.redirect("/company-sign-up4");
  },

  //GET /company-sign-up3
  getCompanySignUp3(req, res, next) {
    res.render("visitors/company-sign-up3", { title: "Company Sign Up" });
  },

  //GET /company-sign-up4
  getCompanySignUp4(req, res, next) {
    res.render("visitors/company-sign-up4", { title: "Company Sign Up" });
  },

  //POST /company-sign-up4
  async postCompanySignUp4(req, res, next) {
    try {
      const token = await crypto.randomBytes(20).toString("hex");

      const user = await User.findOne({ email: req.user.email });

      user.verifyToken = token;
      user.verifyTokenExpires = Date.now() + 3600000; // 1 hour

      await user.save();

      const msg = {
        to: user.email,
        from: "Gabazzo <no-reply@gabazzo.com>",
        subject: "Gabazzo - Verify Email",
        template_id: "d-b8b55998c9294122933903d622cedb77",
        dynamic_template_data: {
          username: user.username,
          verify_link: `http://${req.headers.host}/verify/${token}`,
        },
      };

      await sgMail.send(msg);

      req.session.success = `An Email has been sent to ${user.email} with further instructions.`;
      console.log("Email sent!");
      res.redirect("/company-sign-up4");
    } catch (error) {
      console.log(error);
    }
  },

  //Company Update
  async userUpdate(req, res, next) {
    // find the user by id
    const user = req.user;
    // console.log("CALLED", req.body);
    // check if location was updated
    if (req.body.location && req.body.location !== user.location) {
      let response = await geocodingClient
        .forwardGeocode({
          query: req.body.location + req.body.city + req.body.state,
          limit: 1,
        })
        .send();
      user.coordinates = response.body.features[0].geometry.coordinates;
      user.location = req.body.location;
    }

    req.body.images = [];

    if (typeof req.file !== "undefined") {
      await cloudinary.v2.uploader.destroy(req.user.logoId);
      let image = await cloudinary.v2.uploader.upload(req.file.path);
      user.logoId = image.public_id;
      user.logo = image.secure_url;
    }

    // for (const file of req.files) {
    //   if (user.sliderPhotos.length > 0) {
    //     user.sliderPhotos.forEach(async function (photo) {
    //       await cloudinary.v2.uploader.destroy(photo.public_id);
    //     });
    //   }
    //   let image = await cloudinary.v2.uploader.upload(file.path);
    //   req.body.images.push({
    //     url: image.secure_url,
    //     public_id: image.public_id,
    //   });
    // }
    // update the user with any new properties
    const {
      email,
      city,
      state,
      zipCode,
      language,
      country,
      phoneNumber,
      about,
      slogan,
      tags,
      service,
      serviceCategory,
      companyName,
      facebookUrl,
      twitterUrl,
      instagramUrl,
      linkedinUrl,
      pinterestUrl,
      directions,
      website,
      yearsInBusiness,
      address,
      stateLicenseTrade,
      licenseNumber,
      licenseExpiration,
      entity,
      insuranceType,
      insuranceExpiration,
      mondayFrom,
      mondayTo,
      tuesdayFrom,
      tuesdayTo,
      wednesdayFrom,
      wednesdayTo,
      thursdayFrom,
      thursdayTo,
      fridayFrom,
      fridayTo,
      saturdayFrom,
      saturdayTo,
      sundayFrom,
      sundayTo,
      employees,
    } = req.body;

    if (companyName) user.companyName = companyName;
    if (language) user.language = language;
    if (email) user.email = req.body.email;
    if (address) user.address = address;
    if (employees) user.noOfEmployees = employees;
    if (city) user.city = req.body.city;
    if (state) user.state = req.body.state;
    if (zipCode) user.zipCode = req.body.zipCode;
    if (country) user.country = req.body.country;
    if (phoneNumber) user.phoneNumber = req.body.phoneNumber;
    if (about) user.about = req.body.about;
    if (slogan) user.slogan = req.body.slogan;
    if (service) user.service = req.body.service;
    if (serviceCategory) user.serviceCategory = req.body.serviceCategory;
    if (facebookUrl) user.facebookUrl = req.body.facebookUrl;
    if (twitterUrl) user.twitterUrl = req.body.twitterUrl;
    if (instagramUrl) user.instagramUrl = req.body.instagramUrl;
    if (linkedinUrl) user.linkedinUrl = req.body.linkedinUrl;
    if (pinterestUrl) user.pinterestUrl = req.body.pinterestUrl;
    if (directions) user.directions = req.body.directions;
    if (website) user.website = req.body.website;
    if (tags) user.tags = req.body.tags;
    if (yearsInBusiness) user.yearsInBusiness = req.body.yearsInBusiness;

    if (entity) user.entityType = req.body.entity;
    if (mondayFrom) user.mondayFrom = req.body.mondayFrom;
    if (mondayTo) user.mondayTo = req.body.mondayTo;
    if (tuesdayFrom) user.tuesdayFrom = req.body.tuesdayFrom;
    if (tuesdayTo) user.tuesdayTo = req.body.tuesdayTo;
    if (wednesdayFrom) user.wednesdayFrom = req.body.wednesdayFrom;
    if (wednesdayTo) user.wednesdayTo = req.body.wednesdayTo;
    if (thursdayFrom) user.thursdayFrom = req.body.thursdayFrom;
    if (thursdayTo) user.thursdayTo = req.body.thursdayTo;
    if (fridayFrom) user.fridayFrom = req.body.fridayFrom;
    if (fridayTo) user.fridayTo = req.body.fridayTo;
    if (saturdayFrom) user.saturdayFrom = req.body.saturdayFrom;
    if (saturdayTo) user.saturdayTo = req.body.saturdayTo;
    if (sundayFrom) user.sundayFrom = req.body.sundayFrom;
    if (sundayTo) user.sundayTo = req.body.sundayTo;
    if (req.body.images) user.sliderPhotos = req.body.images;
    if (req.body.products) user.productsUsed = req.body.products;
    if (req.body.tags) user.tags = req.body.tags;

    if (req.body.flagArea) user.areasOfExpertise = req.body.areas;
    if (req.body.flagService) user.serviceAreas = req.body.services;
    if (req.body.paymentMethod) user.paymentMethod = paymentMethod;
    user.serviceAreas = req.body.serviceAreas;

    // save the updated user into the db
    await user.save();
    const login = util.promisify(req.login.bind(req));
    await login(user);
    req.session.success = "Profile successfully updated!";
    req.session.success = "Profile Updated";
    // redirect to show page
    res.redirect("/company-dashboard");
  },

  // GET /verify
  async getVerify(req, res, next) {
    const { token } = req.params;
    const user = await User.findOne({
      verifyToken: token,
      verifyTokenExpires: { $gt: Date.now() },
    });

    user.isEmailVerified = true;
    user.verifyToken = null;
    user.verifyTokenExpires = null;
    await user.save();

    const msg = {
      to: user.email,
      from: "Gabazzo <no-reply@gabazzo.com>",
      subject: "Gabazzo - Verified",
      template_id: "d-09713efe713d4e4b97fb7fbff3f54708",
      dynamic_template_data: {
        username: user.username,
      },
    };

    await sgMail.send(msg);

    if (!user.isCompany) {
      req.session.success =
        "You have successfully verified your email account, now you can use the Gabazzo Platform for Members.";
      res.redirect("/");
    } else {
      req.session.success =
        "You have successfully verified your email account, now you can use the Gabazzo Platform for Companies*";
      res.redirect("/company-sign-up5");
    }
  },

  //GET /company-sign-up5
  getCompanySignUp5(req, res, next) {
    res.render("visitors/company-sign-up5", { title: "Company Sign Up" });
  },

  //GET /dashboard
  async getCompanyDashboard(req, res, next) {
    try {
      let companyID = req.user._id;
      let conversations = [],
        average = 0,
        lastMessage;

      let promises = await Promise.all([
        Portfolio.find({ "owner.id": companyID }).populate("owner.id"),
        Service.find({ "owner.id": companyID }).populate("owner.id"),
        Review.find({ "owner.id": companyID })
          .populate("author.id")
          .populate("owner.id"),
      ]);

      let portfolio = promises[0];
      let services = promises[1];
      let review = promises[2];

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
      res.render("businesses/dashboard", {
        title: "Dashboard | Home",
        conversations,
        portfolio,
        services,
        average,
        review,
        lastMessage,
      });
    } catch (err) {
      console.log(err);
    }
  },

  //GET /dashboard
  async getMemberProfile(req, res, next) {
    let user = await User.findById(req.params.id),
      lastMessage;

    let percentage = 0;
    if (user.isEmailVerified || user.isFacebookVerified) {
      percentage = 50;
    } else if (user.isEmailVerified && user.isFacebookVerified) {
      percentage = 100;
    }

    let time = moment.utc(new Date(), "HH:mm").tz("America/Chicago");
    let memberSince = moment(user.createdAt).fromNow();

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

    res.render("members/profile", {
      title: "Your Profile",
      user,
      percentage,
      lastMessage,
      time,
      memberSince,
    });
  },

  //GET /login
  async getLogin(req, res, next) {
    let total = await User.find({ isEmailVerified: true })
      .where("isCompany")
      .equals(true)
      .exec();
    res.render("visitors/login", { title: "Login", total });
  },

  //POST /login
  async postLogin(req, res, next) {
    const { username, password } = req.body;
    const { user, error } = await User.authenticate()(username, password);

    if (!user && error) {
      console.log("err1741..", error);
      return next(error);
    }

    if (!user.isActive) {
      req.session.error = "The Account is currently de-activated!";
      res.redirect("/");
    } else {
      req.login(user, async function (err) {
        if (err) {
          console.log("err1647...", err);
          return next(err);
        }
        user.status = true;
        await user.save();
        req.session.success = "Welcome back!";
        // console.log(user.username + " Logged In");
        // console.log("Welcome back!");
        const redirectUrl1 = req.session.redirectTo || "/";
        const redirectUrl2 = req.session.redirectTo || "/company-dashboard";
        delete req.session.redirectTo;

        req.user = user;
        res.locals.currentUser = user;
        if (!user.isCompany) {
          res.redirect(redirectUrl1);
        } else {
          res.redirect(redirectUrl2);
        }
      });
    }
  },

  //GET /logout
  async getLogout(req, res, next) {
    req.user.status = false;
    let d = Date();
    req.user.loggedOut = d;
    // console.log(req.user.username + " logged Out");
    await req.user.save();
    await req.logout();
    req.user = null;
    res.redirect("/");
  },

  //GET /company-dashboard/employees
  async getEmployees(req, res, next) {
    let user = req.user;

    let conversations = [];

    if (user) {
      //getting the conversation of the sender
      let existingConv = await Conversation.find({
        participants: { $in: user._id },
      }).sort({ lastMsgTime: -1 });

      if (existingConv) {
        //getting the msgs against the current sender and receiver
        for (let i = 0; i < existingConv.length; i++) {
          let tempChat = await Chat.find({
            conversationID: existingConv[i]._id,
          })
            .sort({
              _id: 1,
            })
            .populate("conversationID")
            .populate("messages.sender.id")
            .populate("messages.receiver.id");

          conversations.push(tempChat);
        }
      }
    }

    let employee = await Employee.find()
      .where("owner.id")
      .equals(user._id)
      .exec();
    res.render("businesses/employees", {
      title: "Dashboard | Employees",
      user,
      employee,
      conversations,
    });
  },

  //GET /company-dashboard/about
  async getAbout(req, res, next) {
    let user = await req.user;
    let videoFlag = -1;

    let conversations = [];

    if (user) {
      //getting the conversation of the sender
      let existingConv = await Conversation.find({
        participants: { $in: user._id },
      }).sort({ lastMsgTime: -1 });

      if (existingConv) {
        //getting the msgs against the current sender and receiver
        for (let i = 0; i < existingConv.length; i++) {
          let tempChat = await Chat.find({
            conversationID: existingConv[i]._id,
          })
            .sort({
              _id: 1,
            })
            .populate("conversationID")
            .populate("messages.sender.id")
            .populate("messages.receiver.id");

          conversations.push(tempChat);
        }
      }
    }

    if (user.videos) {
      // 0 if the video is present
      // 1 for the image
      // -1 No data

      for (let i = 0; i < user.videos.length; i++) {
        if (
          user.videos[i].url.includes(".jpg") ||
          user.videos[i].url.includes(".jpeg") ||
          user.videos[i].url.includes(".png") ||
          user.videos[i].url.includes(".gif")
        ) {
          videoFlag = 0;
          break;
        } else if (
          user.videos[i].url.includes(".mp4") ||
          user.videos[i].url.includes(".oog")
        ) {
          videoFlag = 1;
          break;
        }
      }
    }

    user.videoFlag = videoFlag;
    // console.log(user.videoFlag);

    let journey = await Journey.find()
      .where("owner.id")
      .equals(user._id)
      .exec();
    let certificate = await Certificate.find()
      .where("owner.id")
      .equals(user._id)
      .exec();
    res.render("businesses/about", {
      title: "Dashboard | About",
      user,
      journey,
      certificate,
      conversations,
    });
  },

  //Put /company-dashboard/about
  async putAbout(req, res, next) {
    // find the user
    const user = req.user;
    let files = [];

    if (req.files) {
      let fileSize = 0;
      let imgCount = 0,
        videoCount = 0;

      for (const file of req.files) {
        if (file.mimetype.includes("image")) {
          imgCount++;
        } else if (file.mimetype.includes("video")) {
          videoCount++;
        }
      }

      if (imgCount > 0 && videoCount > 0) {
        req.session.error =
          "You are not allowed to upload image or video both at a time. You can upload up to five images or one video.";
        // redirect to show page
        res.redirect("/company-dashboard/about");
      } else {
        if (imgCount > 0) {
          for (const file of req.files) {
            //removing existing images from the cloud.
            if (user.videos.length > 0) {
              user.videos.forEach(async function (photo) {
                cloudinary.v2.uploader.destroy(
                  photo.public_id,
                  { resource_type: "video" },
                  function (error, result) {
                    console.log(result, error);
                  }
                );
              });
            }

            let image = await cloudinary.v2.uploader.upload(file.path);
            files.push({
              url: image.secure_url,
              public_id: image.public_id,
            });
          }

          user.videos = files;
        } else if (videoCount > 0) {
          fileSize = Math.round(req.files[0].size);
          if (fileSize >= 1073741824) {
            req.session.error = "Video Size is too large.";
            // redirect to show page
            res.redirect("/company-dashboard/about");
          } else {
            // checking that file size should be less than 1 gb

            //removing existing images from the cloud.
            if (user.videos.length > 0) {
              user.videos.forEach(async function (photo) {
                await cloudinary.v2.uploader.destroy(photo.public_id);
              });
            }

            let video = await cloudinary.v2.uploader.upload(req.files[0].path, {
              resource_type: "video",
              chunk_size: 6000000,
              eager: [{ audio_codec: "aac" }],
              eager_async: true,
            });

            files.push({
              url: video.secure_url,
              public_id: video.public_id,
            });

            user.videos = files;
          }
        }
      }
    }

    const { about, purpose } = req.body;

    if (about) user.about = req.body.about;
    if (purpose) user.Purpose = req.body.purpose;

    // console.log(user.videos);

    // save the updated user into the db
    await user.save();
    const login = util.promisify(req.login.bind(req));
    await login(user);
    req.session.success = "Profile successfully updated!";
    // redirect to show page
    res.redirect("/company-dashboard/about");
  },

  //Create Journey
  async postJourney(req, res, next) {
    // find the user
    const user = req.user;
    const owner = {
      id: req.user._id,
      username: req.user.username,
    };
    const newJourney = new Journey({
      year: req.body.year,
      title: req.body.title,
      Description: req.body.description,
      owner: owner,
    });

    // save the updated journey into the db
    let journey = await Journey.create(newJourney);

    const login = util.promisify(req.login.bind(req));
    await login(user);
    req.session.success = "Journey successfully added!";
    // redirect to show page
    res.redirect("/company-dashboard/about");
  },

  //Edit Journey
  async putJourney(req, res, next) {
    let journey = await Journey.findById(req.params.id);

    const { year, title, Description } = req.body;

    if (year) journey.year = req.body.year;
    if (title) journey.title = req.body.title;
    if (Description) journey.Description = req.body.Description;

    await journey.save();
    req.session.success = "Journey successfully Updated!";
    // redirect to show page
    res.redirect("/company-dashboard/about");
  },

  // Delete Journey
  async deleteJourney(req, res, next) {
    let journey = await Journey.findById(req.params.id);
    await journey.remove();
    req.session.error = "Journey Deleted!";
    res.redirect("/company-dashboard/about");
  },

  //Create Certificate
  async postCertificate(req, res, next) {
    // find the user
    const user = req.user;
    const owner = {
      id: req.user._id,
      username: req.user.username,
    };
    let image = await cloudinary.v2.uploader.upload(req.file.path);

    const newCertificate = new Certificate({
      title: req.body.title,
      date: req.body.date,
      owner: owner,
      description: req.body.description,
      imageUrl: image.secure_url,
      imageId: image.public_id,
    });

    // save the updated journey into the db
    let certificate = await Certificate.create(newCertificate);

    const login = util.promisify(req.login.bind(req));
    await login(user);
    req.session.success = "Journey successfully added!";
    // redirect to show page
    res.redirect("/company-dashboard/about");
  },

  //Edit Certificate
  async putCertificate(req, res, next) {
    let certificate = await Certificate.findById(req.params.id);
    if (req.file) {
      await cloudinary.v2.uploader.destroy(certificate.imageId);
      // upload image
      let image = await cloudinary.v2.uploader.upload(req.file.path);
      // add images to post.images array
      certificate.imageUrl = image.secure_url;
      certificate.imageId = image.public_id;
    }
    const { title, description, date } = req.body;

    if (date) certificate.date = req.body.date;
    if (title) certificate.title = req.body.title;
    if (description) certificate.description = req.body.description;

    await certificate.save();
    req.session.success = "Certificate successfully Updated!";
    // redirect to show page
    res.redirect("/company-dashboard/about");
  },

  // Delete Certificate
  async deleteCertificate(req, res, next) {
    let certificate = await Certificate.findById(req.params.id);
    await cloudinary.v2.uploader.destroy(certificate.imageId);
    await certificate.remove();
    req.session.error = "Certificate Deleted!";
    res.redirect("/company-dashboard/about");
  },

  //Edit Logo
  async putLogo(req, res, next) {
    let user = req.user;
    if (req.file) {
      await cloudinary.v2.uploader.destroy(user.logoId);
      // upload image
      let logo = await cloudinary.v2.uploader.upload(req.file.path);
      // add images to post.images array
      user.logo = logo.secure_url;
      user.logoId = logo.public_id;
    }

    await user.save();
    const login = util.promisify(req.login.bind(req));
    await login(user);
    req.session.success = "Logo successfully Updated!";
    // redirect to show page
    res.redirect("/company-dashboard");
  },

  //Edit Profile Picture
  async putProfilePicture(req, res, next) {
    let user = req.user;
    if (req.file) {
      await cloudinary.v2.uploader.destroy(user.profilePictureId);
      // upload image
      let picture = await cloudinary.v2.uploader.upload(req.file.path);
      // add images to post.images array
      user.profilePicture = picture.secure_url;
      user.profilePictureId = picture.public_id;
    }

    await user.save();
    const login = util.promisify(req.login.bind(req));
    await login(user);
    req.session.success = "Profile Picture successfully Updated!";
    // redirect to show page
    res.redirect("/company-dashboard");
  },

  //GET /company-dashboard/faq
  async getFaq(req, res, next) {
    let user = req.user;
    let conversations = [];

    if (user) {
      //getting the conversation of the sender
      let existingConv = await Conversation.find({
        participants: { $in: user._id },
      }).sort({ lastMsgTime: -1 });

      if (existingConv) {
        //getting the msgs against the current sender and receiver
        for (let i = 0; i < existingConv.length; i++) {
          let tempChat = await Chat.find({
            conversationID: existingConv[i]._id,
          })
            .sort({
              _id: 1,
            })
            .populate("conversationID")
            .populate("messages.sender.id")
            .populate("messages.receiver.id");

          conversations.push(tempChat);
        }
      }
    }

    let faq = await Faq.find().where("owner.id").equals(user._id).exec();
    res.render("businesses/faq", {
      title: "Dashboard | FAQ",
      faq,
      user,
      conversations,
    });
  },

  //GET /company-dashboard/media
  async getMedia(req, res, next) {
    let user = req.user;

    let conversations = [];

    if (user) {
      //getting the conversation of the sender
      let existingConv = await Conversation.find({
        participants: { $in: user._id },
      }).sort({ lastMsgTime: -1 });

      if (existingConv) {
        //getting the msgs against the current sender and receiver
        for (let i = 0; i < existingConv.length; i++) {
          let tempChat = await Chat.find({
            conversationID: existingConv[i]._id,
          })
            .sort({
              _id: 1,
            })
            .populate("conversationID")
            .populate("messages.sender.id")
            .populate("messages.receiver.id");

          conversations.push(tempChat);
        }
      }
    }

    let mediaPhoto = await MediaPhoto.find()
      .where("owner.id")
      .equals(user._id)
      .exec();
    let mediaVideo = await MediaVideo.find()
      .where("owner.id")
      .equals(user._id)
      .exec();
    res.render("businesses/media", {
      title: "Dashboard | Media",
      mediaPhoto,
      mediaVideo,
      conversations,
    });
  },

  //Create mediaPhoto
  async postMediaPhoto(req, res, next) {
    // find the user
    const user = req.user;
    const owner = {
      id: req.user._id,
      username: req.user.username,
    };
    let image = await cloudinary.v2.uploader.upload(req.file.path);

    const newMediaPhoto = new MediaPhoto({
      title: req.body.title,
      owner: owner,
      description: req.body.description,
      imageUrl: image.secure_url,
      imageId: image.public_id,
    });

    // save the updated journey into the db
    let mediaPhoto = await MediaPhoto.create(newMediaPhoto);

    const login = util.promisify(req.login.bind(req));
    await login(user);
    req.session.success = "Photo successfully added!";
    // redirect to show page
    res.redirect("/company-dashboard/media");
  },

  //Edit Media Photo
  async putMediaPhoto(req, res, next) {
    let mediaPhoto = await MediaPhoto.findById(req.params.id);
    const { title, description } = req.body;

    if (title) mediaPhoto.title = req.body.title;
    if (description) mediaPhoto.description = req.body.description;

    await mediaPhoto.save();
    req.session.success = "Media Photo successfully Updated!";
    // redirect to show page
    res.redirect("/company-dashboard/media");
  },

  //Delete Media Photo
  async deleteMediaPhoto(req, res, next) {
    let mediaPhoto = await MediaPhoto.findById(req.params.id);
    await cloudinary.v2.uploader.destroy(mediaPhoto.imageId);
    await mediaPhoto.remove();
    req.session.error = "Media Photo Deleted!";
    res.redirect("/company-dashboard/media");
  },

  //Create mediaVideo
  async postMediaVideo(req, res, next) {
    // find the user
    const user = req.user;
    const owner = {
      id: req.user._id,
      username: req.user.username,
    };
    let video = await cloudinary.v2.uploader.upload(req.file.path, {
      resource_type: "video",
      chunk_size: 6000000,
      eager: [{ audio_codec: "aac" }],
      eager_async: true,
    });

    const newMediaVideo = new MediaVideo({
      title: req.body.title,
      owner: owner,
      description: req.body.description,
      videoUrl: video.secure_url,
      videoId: video.public_id,
    });

    let mediaVideo = await MediaVideo.create(newMediaVideo);

    const login = util.promisify(req.login.bind(req));
    await login(user);
    req.session.success = "Video successfully added!";
    // redirect to show page
    res.redirect("/company-dashboard/media");
  },

  //Edit Media Video
  async putMediaVideo(req, res, next) {
    let mediaVideo = await MediaVideo.findById(req.params.id);
    const { title, description } = req.body;

    if (title) mediaVideo.title = req.body.title;
    if (description) mediaVideo.description = req.body.description;

    await mediaVideo.save();
    req.session.success = "Media Video successfully Updated!";
    // redirect to show page
    res.redirect("/company-dashboard/media");
  },

  //Delete Media Video
  async deleteMediaVideo(req, res, next) {
    let mediaVideo = await MediaVideo.findById(req.params.id);
    await cloudinary.v2.uploader.destroy(mediaVideo.videoId);
    await mediaVideo.remove();
    req.session.error = "Media Video Deleted!";
    res.redirect("/company-dashboard/media");
  },

  //Create employee
  async postEmployee(req, res, next) {
    // find the user
    const user = req.user;
    const owner = {
      id: req.user._id,
      username: req.user.username,
    };
    let image = await cloudinary.v2.uploader.upload(req.file.path);

    const newEmployee = new Employee({
      name: req.body.name,
      owner: owner,
      position: req.body.position,
      description: req.body.description,
      imageUrl: image.secure_url,
      imageId: image.public_id,
    });

    // save the updated journey into the db
    let employee = await Employee.create(newEmployee);

    const login = util.promisify(req.login.bind(req));
    await login(user);
    req.session.success = "Employee successfully added!";
    // redirect to show page
    res.redirect("/company-dashboard/employees");
  },

  //Edit Employee
  async putEmployee(req, res, next) {
    let employee = await Employee.findById(req.params.id);
    if (req.file) {
      await cloudinary.v2.uploader.destroy(employee.imageId);
      // upload image
      let image = await cloudinary.v2.uploader.upload(req.file.path);
      // add images to post.images array
      employee.imageUrl = image.secure_url;
      employee.imageId = image.public_id;
    }
    const { name, description, position } = req.body;

    if (name) employee.name = req.body.name;
    if (position) employee.position = req.body.position;
    if (description) employee.description = req.body.description;

    await employee.save();
    req.session.success = "Employee successfully Updated!";
    // redirect to show page
    res.redirect("/company-dashboard/employees");
  },

  //Delete Employee
  async deleteEmployee(req, res, next) {
    let employee = await Employee.findById(req.params.id);
    await cloudinary.v2.uploader.destroy(employee.imageId);
    await employee.remove();
    req.session.error = "Employee Deleted!";
    res.redirect("/company-dashboard/employees");
  },

  //GET /company-dashboard/portfolio
  async getPortfolio(req, res, next) {
    let user = req.user;

    let conversations = [];

    if (user) {
      //getting the conversation of the sender
      let existingConv = await Conversation.find({
        participants: { $in: user._id },
      }).sort({ lastMsgTime: -1 });

      if (existingConv) {
        //getting the msgs against the current sender and receiver
        for (let i = 0; i < existingConv.length; i++) {
          let tempChat = await Chat.find({
            conversationID: existingConv[i]._id,
          })
            .sort({
              _id: 1,
            })
            .populate("conversationID")
            .populate("messages.sender.id")
            .populate("messages.receiver.id");

          conversations.push(tempChat);
        }
      }
    }

    let portfolio = await Portfolio.find()
      .where("owner.id")
      .equals(user._id)
      .exec();
    res.render("businesses/portfolio", {
      title: "Dashboard | Portfolio",
      portfolio,
      user,
      conversations,
    });
  },

  //Create portfolio
  async postPortfolio(req, res, next) {
    req.body.images = [];
    // find the user
    const user = req.user;
    const owner = {
      id: req.user._id,
      username: req.user.username,
    };
    for (const file of req.files) {
      let image = await cloudinary.v2.uploader.upload(file.path);
      req.body.images.push({
        url: image.secure_url,
        public_id: image.public_id,
      });
    }

    const newPortfolio = new Portfolio({
      title: req.body.title,
      owner: owner,
      category: req.body.category,
      service: req.body.service,
      city: req.body.city,
      state: req.body.state,
      images: req.body.images,
    });

    // save the updated journey into the db
    let portfolio = await Portfolio.create(newPortfolio);

    const login = util.promisify(req.login.bind(req));
    await login(user);
    req.session.success = "Portfolio successfully added!";
    // redirect to show page
    res.redirect("/company-dashboard");
  },

  //Edit Portfolio
  async putPortfolio(req, res, next) {
    let portfolio = await Portfolio.findById(req.params.id);

    if (req.body.deleteImages && req.body.deleteImages.length) {
      // assign deleteImages from req.body to its own variable
      let deleteImages = req.body.deleteImages;
      // loop over deleteImages
      for (const public_id of deleteImages) {
        // delete images from cloudinary
        await cloudinary.v2.uploader.destroy(public_id);
        // delete image from post.images
        for (const image of portfolio.images) {
          if (image.public_id === public_id) {
            let index = portfolio.images.indexOf(image);
            portfolio.images.splice(index, 1);
          }
        }
      }
    }

    // check if there are any new images for upload
    if (req.files) {
      // upload images
      for (const file of req.files) {
        let image = await cloudinary.v2.uploader.upload(file.path);
        // add images to post.images array
        portfolio.images.push({
          url: image.secure_url,
          public_id: image.public_id,
        });
      }
    }

    const { title, city, state } = req.body;

    if (title) portfolio.title = req.body.title;
    if (city) portfolio.city = req.body.city;
    if (state) portfolio.state = req.body.state;

    await portfolio.save();
    req.session.success = "Portfolio successfully Updated!";
    // redirect to show page
    res.redirect("/company-dashboard");
  },

  //Delete Portfolio
  async deletePortfolio(req, res, next) {
    let portfolio = await Portfolio.findById(req.params.id);
    for (const public_id of portfolio.images) {
      // delete images from cloudinary
      await cloudinary.v2.uploader.destroy(public_id);
    }

    await portfolio.remove();
    req.session.error = "Portfolio Deleted!";
    res.redirect("/company-dashboard");
  },

  //GET /company-dashboard/products
  async getProducts(req, res, next) {
    let user = req.user;

    let conversations = [];

    if (user) {
      //getting the conversation of the sender
      let existingConv = await Conversation.find({
        participants: { $in: user._id },
      }).sort({ lastMsgTime: -1 });

      if (existingConv) {
        //getting the msgs against the current sender and receiver
        for (let i = 0; i < existingConv.length; i++) {
          let tempChat = await Chat.find({
            conversationID: existingConv[i]._id,
          })
            .sort({
              _id: 1,
            })
            .populate("conversationID")
            .populate("messages.sender.id")
            .populate("messages.receiver.id");

          conversations.push(tempChat);
        }
      }
    }
    let product = await Product.find()
      .where("owner.id")
      .equals(user._id)
      .exec();
    res.render("businesses/products", {
      title: "Dashboard | Products",
      product,
      conversations,
    });
  },

  // COMPANY SETTINGS PAGES

  // GET account settings
  async getAccount(req, res, next) {
    const user = req.user;
    let lastMessage;

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

    res.render("businesses/account", { title: "Settings", user, lastMessage });
  },

  //Company Update
  async putAccount(req, res, next) {
    const user = req.user;

    const { email, offlineSpan } = req.body;

    if (email) user.email = email;

    if (offlineSpan) {
      let startTime = moment().utc().tz("America/Chicago");
      let endTime;

      if (offlineSpan === "8 Hours") {
        endTime = moment().utc().tz("America/Chicago").add(8, "hours");
      } else if (offlineSpan === "1 Day") {
        endTime = moment().utc().tz("America/Chicago").add(1, "day");
      } else if (offlineSpan === "1 Week") {
        endTime = moment().utc().tz("America/Chicago").add(1, "week");
      } else if (offlineSpan === "1 Month") {
        endTime = moment().utc().tz("America/Chicago").add(1, "month");
      } else if (offlineSpan === "1 Year") {
        endTime = moment().utc().tz("America/Chicago").add(1, "year");
      }
      user.offlineSpanFrom = startTime.format("YYYY-MM-DD HH:mm");
      user.offlineSpanTo = endTime.format("YYYY-MM-DD HH:mm");
      user.offlineSpan = offlineSpan;
      user.isOffline = true;
    }

    await user.save();
    const login = util.promisify(req.login.bind(req));
    await login(user);
    req.session.success = "Profile Updated";
    res.redirect("/company-settings/account");
  },

  // Edit the existing email and then verify
  async putEmailAccount(req, res, next) {
    const user = req.user;
    const { email } = req.body;

    try {
      const token = await crypto.randomBytes(20).toString("hex");

      const prevUser = await User.findOne({ username: user.username });
      const userExistence = await User.findOne({ email: req.body.email });
      if (userExistence) {
        req.session.error = "This email already exists.";
        return res.redirect("back");
      }

      if (email) user.email = req.body.email;

      user.verifyToken = token;
      user.verifyTokenExpires = Date.now() + 3600000; // 1 hour
      user.isEmailVerified = false;

      await user.save();

      // Sending the email to the previously set email. Informing about the email change.
      let msg = {
        to: prevUser?.email,
        from: "Gabazzo <no-reply@gabazzo.com>",
        subject: "Gabazzo - Verify Email",
        template_id: "d-6140b68616d5407ab35e970fec89f059",
        dynamic_template_data: {
          username: user.username,
        },
      };

      await sgMail.send(msg);

      msg = {
        to: user.email,
        from: "Gabazzo <no-reply@gabazzo.com>",
        subject: "Gabazzo - Verify Email",
        template_id: "d-b8b55998c9294122933903d622cedb77",
        dynamic_template_data: {
          username: user.username,
          verify_link: `http://${req.headers.host}/verify/${token}`,
        },
      };

      await sgMail.send(msg);

      req.session.success = `An Email has been sent to ${user.email} with further instructions.`;
      res.redirect("/company-settings/account");
    } catch (error) {
      console.log(error);
    }
  },

  // GET billing settings
  async getBilling(req, res, next) {
    const user = req.user;
    let lastMessage;

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

    res.render("businesses/billing", { title: "Settings", user, lastMessage });
  },

  // GET billing settings
  async getUserBilling(req, res, next) {
    const user = req.user;
    let lastMessage;

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

    res.render("businesses/userbilling", {
      title: "Settings",
      user,
      lastMessage,
    });
  },

  //PUT Billing
  async putUserBilling(req, res, next) {
    let user = req.user;
    const {
      BillToContactName,
      BillToCompanyName,
      BillToAddress,
      BillToPhoneNumber,
      BillToEmail,
      DeliverToContactName,
      DeliverToCompanyName,
      DeliverToAddress,
      DeliverToPhoneNumber,
      DeliverToEmail,
    } = req.body;

    user.billing.billTo.name = BillToContactName;
    user.billing.billTo.companyName = BillToCompanyName;
    user.billing.billTo.location = BillToAddress;
    user.billing.billTo.phoneNumber = BillToPhoneNumber;
    user.billing.billTo.email = BillToEmail;

    user.billing.deliverTo.push({
      name: DeliverToContactName,
      companyName: DeliverToCompanyName,
      location: DeliverToAddress,
      phoneNumber: DeliverToPhoneNumber,
      email: DeliverToEmail,
    });

    await user.save();
    req.session.success = "Billing Info successfully Updated!";
    // redirect to show page
    res.redirect("back");
  },

  // GET company-info settings
  // async getCompanyInfo(req, res, next) {
  //     res.render('businesses/company-info', { title: 'Settings' });
  // },

  // GET notifications settings
  async getNotifications(req, res, next) {
    let lastMessage;

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

    res.render("businesses/notifications", { title: "Settings", lastMessage });
  },

  // GET profile settings
  async getProfile(req, res, next) {
    let lastMessage;

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

    res.render("businesses/profile", { title: "Settings", lastMessage });
  },

  //Edit Profile
  async putProfile(req, res, next) {
    let user = req.user;
    if (req.file) {
      if (user.profilePictureId)
        await cloudinary.v2.uploader.destroy(user.profilePictureId);
      // upload image
      let picture = await cloudinary.v2.uploader.upload(req.file.path);
      // add images to post.images array
      user.profilePicture = picture.secure_url;
      user.profilePictureId = picture.public_id;
    }

    const {
      firstName,
      lastName,
      location,
      city,
      state,
      zipCode,
      country,
      phoneNumber,
      about,
      twitterUrl,
      linkedinUrl,
      instagramUrl,
      facebookUrl,
    } = req.body;

    user.firstName = req.body.firstName;
    user.lastName = req.body.lastName;
    user.location = req.body.location;
    user.city = req.body.city;
    user.state = req.body.state;
    user.zipCode = req.body.zipCode;
    user.country = req.body.country;
    user.twitterUrl = req.body.twitterUrl;
    user.linkedinUrl = req.body.linkedinUrl;
    user.instagramUrl = req.body.instagramUrl;
    user.facebookUrl = req.body.facebookUrl;
    user.phoneNumber = req.body.phoneNumber;
    user.about = req.body.about;

    await user.save();
    const login = util.promisify(req.login.bind(req));
    await login(user);
    // console.log("updated");
    req.session.success = "Profile Successfully Updated!";
    // redirect to show page
    res.redirect("/company-settings/profile");
  },

  // GET payment settings
  async getPayment(req, res, next) {
    res.render("businesses/payment", { title: "Settings" });
  },

  // GET security settings
  async getSecurity(req, res, next) {
    const user = await User.find().where("_id").equals(req.user._id);
    let lastMessage;

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

    res.render("businesses/security", { title: "Settings", user, lastMessage });
  },

  async putSecurity(req, res, next) {
    try {
      const user = req.user;

      const login = util.promisify(req.login.bind(req));
      await login(user);

      const msg = {
        to: user.email,
        from: "Gabazzo <no-reply@gabazzo.com>",
        subject: "Gabazzo - Password Alert",
        template_id: "d-21b6b7e5870741898d971104de8decb5",
        dynamic_template_data: {
          username: user.username,
        },
      };

      await sgMail.send(msg).catch((err) => console.error(err));

      req.session.success = "Password Updated";
      return res.redirect("/company-settings/security");
    } catch (error) {
      console.log(error);
      return res.redirect("back");
    }
  },

  // GET verification settings
  async getVerification(req, res, next) {
    const user = req.user;
    let score = 0;
    let grade = "Poor";
    if (user.email && user.isFacebookVerified) {
      score = 10;
      grade = "Excellent";
    } else if (user.email || user.isFacebookVerified) {
      score = 5;
      grade = "Good";
    } else {
      score = 0;
      grade = "Poor";
    }
    res.render("businesses/trust-verification", {
      title: "Settings",
      score,
      grade,
    });
  },

  //GET /company-dashboard/reviews
  async getReviews(req, res, next) {
    let user = req.user;
    let review;

    let conversations = [];

    if (user) {
      //getting the conversation of the sender
      let existingConv = await Conversation.find({
        participants: { $in: user._id },
      }).sort({ lastMsgTime: -1 });

      if (existingConv) {
        //getting the msgs against the current sender and receiver
        for (let i = 0; i < existingConv.length; i++) {
          let tempChat = await Chat.find({
            conversationID: existingConv[i]._id,
          })
            .sort({
              _id: 1,
            })
            .populate("conversationID")
            .populate("messages.sender.id")
            .populate("messages.receiver.id");

          conversations.push(tempChat);
        }
      }
    }

    if (req.body.filter === "recent") {
      review = await Review.find()
        .where("owner.id")
        .equals(user._id)
        .sort({ createdAt: -1 })
        .exec();
      function calculateAverage(reviews) {
        if (review.length === 0) {
          return 0;
        }
        var sum = 0;
        review.forEach(function (element) {
          sum += element.rating;
        });
        return sum / review.length;
      }
      let average = await calculateAverage(review).toFixed(1);
      res.render("businesses/reviews", {
        title: "Dashboard | Reviews",
        review,
        average,
        user,
        conversations,
      });
    } else if (req.body.filter === "positive") {
      review = await Review.find({ rating: { $gte: 4 } })
        .where("owner.id")
        .equals(user._id)
        .exec();
      function calculateAverage(reviews) {
        if (review.length === 0) {
          return 0;
        }
        var sum = 0;
        review.forEach(function (element) {
          sum += element.rating;
        });
        return sum / review.length;
      }
      let average = await calculateAverage(review).toFixed(1);
      res.render("businesses/reviews-positive", {
        title: "Dashboard | Reviews",
        review,
        average,
        user,
        conversations,
      });
    } else if (req.body.filter === "negative") {
      review = await Review.find({ rating: { $gte: 0, $lte: 3.9 } })
        .where("owner.id")
        .equals(user._id)
        .exec();
      function calculateAverage(reviews) {
        if (review.length === 0) {
          return 0;
        }
        var sum = 0;
        review.forEach(function (element) {
          sum += element.rating;
        });
        return sum / review.length;
      }
      let average = await calculateAverage(review).toFixed(1);
      res.render("businesses/reviews-negative", {
        title: "Dashboard | Reviews",
        review,
        average,
        conversations,
        user,
      });
    } else if (req.body.filter === "neutral") {
      review = await Review.find({ rating: { $in: 3 } })
        .where("owner.id")
        .equals(user._id)
        .exec();
      function calculateAverage(reviews) {
        if (review.length === 0) {
          return 0;
        }
        var sum = 0;
        review.forEach(function (element) {
          sum += element.rating;
        });
        return sum / review.length;
      }
      let average = await calculateAverage(review).toFixed(1);
      res.render("businesses/reviews-neutral", {
        title: "Dashboard | Reviews",
        review,
        average,
        user,
        conversations,
      });
    } else {
      review = await Review.find()
        .where("owner.id")
        .equals(user._id)
        .sort({ createdAt: -1 })
        .exec();
      function calculateAverage(reviews) {
        if (review.length === 0) {
          return 0;
        }
        var sum = 0;
        review.forEach(function (element) {
          sum += element.rating;
        });
        return sum / review.length;
      }
      let average = await calculateAverage(review).toFixed(1);
      res.render("businesses/reviews", {
        title: "Dashboard | Reviews",
        review,
        average,
        user,
        conversations,
      });
    }
  },

  async garageServices(req, res, next) {
    let user = await User.findById(req.user);

    let conversations = [];
    if (req.user) {
      user = await User.findById(req.user.id);
      //getting the conversation of the sender
      let existingConv = await Conversation.find({
        participants: { $in: user._id },
      }).sort({ lastMsgTime: -1 });

      if (existingConv) {
        //getting the msgs against the current sender and receiver
        for (let i = 0; i < existingConv.length; i++) {
          let tempChat = await Chat.find({
            conversationID: existingConv[i]._id,
          })
            .sort({
              _id: 1,
            })
            .populate("conversationID")
            .populate("messages.sender.id")
            .populate("messages.receiver.id");

          conversations.push(tempChat);
        }
      }
    }

    let company;
    let filter = req.body.filter;
    let zip = req.body.zip;
    let sorting = {};
    if (req.body.sort === "asc") {
      sorting = await { companyName: -1 };
    } else if (req.body.sort === "desc") {
      sorting = await { companyName: 1 };
    } else if (req.body.sort === "created") {
      sorting = await { createdAt: -1 };
    } else if (req.body.sort === "rated") {
      sorting = await { averageReview: 1 };
    } else {
      sorting = await { id: -1 };
    }

    if (filter) {
      if (zip && filter) {
        company = await User.find({
          isEmailVerified: true,
          zipCode: zip,
          filters: { $in: filter },
        })
          .where("serviceCategory")
          .equals("Garage services")
          .populate({
            path: "reviews",
            options: { sort: { _id: -1 } },
          })
          .sort(sorting)
          .exec();
      } else {
        company = await User.find({
          isEmailVerified: true,
          filters: { $in: filter },
        })
          .where("serviceCategory")
          .equals("Garage services")
          .populate({
            path: "reviews",
            options: { sort: { _id: -1 } },
          })
          .sort(sorting)
          .exec();
      }
    } else if (zip) {
      company = await User.find({ isEmailVerified: true, zipCode: zip })
        .where("serviceCategory")
        .equals("Garage services")
        .populate({
          path: "reviews",
          options: { sort: { _id: -1 } },
        })
        .sort(sorting)
        .exec();
    } else {
      company = await User.find({ isEmailVerified: true })
        .where("serviceCategory")
        .equals("Garage services")
        .populate({
          path: "reviews",
          options: { sort: { _id: -1 } },
        })
        .sort(sorting)
        .exec();
    }
    let review = await Review.find()
      .where("owner.id")
      .equals(company._id)
      .exec();
    if (req.xhr) {
      res.json(company);
    } else {
      res.render("show-pages/garage-services", {
        title: "Company Profile",
        user,
        company,
        review,
        total,
        conversations,
      });
    }
  },

  //Reply Review
  async reviewReply(req, res, next) {
    let review = await Review.findById(req.params.id);

    const { reply } = req.body;

    if (reply) review.reply = req.body.reply;

    await review.save();
    req.session.success = "Reply Successful";
    // redirect to show page
    res.redirect("back");
  },

  //GET /company-dashboard/services
  async getServices(req, res, next) {
    let user = req.user;

    let conversations = [];

    if (user) {
      //getting the conversation of the sender
      let existingConv = await Conversation.find({
        participants: { $in: user._id },
      }).sort({ lastMsgTime: -1 });

      if (existingConv) {
        //getting the msgs against the current sender and receiver
        for (let i = 0; i < existingConv.length; i++) {
          let tempChat = await Chat.find({
            conversationID: existingConv[i]._id,
          })
            .sort({
              _id: 1,
            })
            .populate("conversationID")
            .populate("messages.sender.id")
            .populate("messages.receiver.id");

          conversations.push(tempChat);
        }
      }
    }

    let service = await Service.find()
      .where("owner.id")
      .equals(user._id)
      .exec();

    res.render("businesses/services", {
      title: "Dashboard | Services",
      service,
      user,
      conversations,
    });
  },

  //Create service
  async postService(req, res, next) {
    req.body.images = [];
    // find the user
    const user = req.user;
    const owner = {
      id: req.user._id,
      username: req.user.username,
    };
    for (const file of req.files) {
      let image = await cloudinary.v2.uploader.upload(file.path);
      req.body.images.push({
        url: image.secure_url,
        public_id: image.public_id,
      });
    }

    const newService = new Service({
      title: req.body.title,
      owner: owner,
      category: req.body.category,
      serviceType: req.body.serviceType,
      description: req.body.description,
      time: req.body.time,
      budget: req.body.budget,
      teamMembers: req.body.teamMembers,
      products: req.body.products,
      images: req.body.images,
      priceTo: req.body.priceTo,
      priceFrom: req.body.priceFrom,
      priceInfo: req.body.priceInfo,
      teamInfo: req.body.teamInfo,
      tags: req.body.tags,
    });

    // save the updated journey into the db
    let service = await Service.create(newService);

    const login = util.promisify(req.login.bind(req));
    await login(user);
    req.session.success = "Service successfully added!";
    // redirect to show page
    res.redirect("/company-dashboard/services");
  },

  async getUpdateService(req, res, next) {
    let portID = req.params.id,
      lastMessage;

    let service = await Service.findById(portID);
    let user = req.user;

    // Condition to check that the port belongs to the logged in user
    if (service.owner.username === user.username) {
      if (user) {
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
    }

    res.render("businesses/update-service", {
      user,
      service,
      lastMessage,
    });
  },

  //Edit Service
  async putService(req, res, next) {
    let service = await Service.findById(req.params.id);

    if (req.body.deleteImages && req.body.deleteImages.length) {
      // assign deleteImages from req.body to its own variable
      let deleteImages = req.body.deleteImages;
      // loop over deleteImages
      for (const public_id of deleteImages) {
        // delete images from cloudinary
        await cloudinary.v2.uploader.destroy(public_id);
        // delete image from post.images
        for (const image of service.images) {
          if (image.public_id === public_id) {
            let index = service.images.indexOf(image);
            service.images.splice(index, 1);
          }
        }
      }
    }

    // check if there are any new images for upload
    if (req.files) {
      // upload images
      for (const file of req.files) {
        let image = await cloudinary.v2.uploader.upload(file.path);
        // add images to post.images array
        service.images.push({
          url: image.secure_url,
          public_id: image.public_id,
        });
      }
    }

    const {
      title,
      category,
      serviceType,
      description,
      time,
      priceTo,
      priceFrom,
    } = req.body;

    if (title) service.title = req.body.title;
    if (category) service.category = req.body.category;
    if (description) service.description = req.body.description;
    if (serviceType) service.serviceType = req.body.serviceType;
    if (priceTo) service.priceTo = req.body.priceTo;
    if (priceFrom) service.priceFrom = req.body.priceFrom;
    if (time) service.time = req.body.time;

    await service.save();

    req.session.success = "Service successfully Updated!";

    // redirect to filter page
    res.redirect(`/updatefilter/${service._id}`);
  },

  //Delete Service
  async deleteService(req, res, next) {
    let service = await Service.findById(req.params.id);
    for (const public_id of service.images) {
      // delete images from cloudinary
      await cloudinary.v2.uploader.destroy(public_id);
    }
    await service.remove();
    req.session.error = "Service Deleted!";
    res.redirect("/company-dashboard");
  },

  //Create product
  async postProduct(req, res, next) {
    req.body.images = [];
    // find the user
    const user = req.user;
    const owner = {
      id: req.user._id,
      username: req.user.username,
    };
    for (const file of req.files) {
      let image = await cloudinary.v2.uploader.upload(file.path);
      req.body.images.push({
        url: image.secure_url,
        public_id: image.public_id,
      });
    }

    const newProduct = new Product({
      price: req.body.price,
      title: req.body.title,
      category: req.body.category,
      service: req.body.service,
      description: req.body.description,
      images: req.body.images,
      owner: owner,
      time: req.body.time,
      tags: req.body.tags,
      specificationTitle: req.body.specificationTitle,
      specificationDescription: req.body.specificationDescription,
      specificationTitle2: req.body.specificationTitle2,
      specificationDescription2: req.body.specificationDescription2,
      deliveryInfo: req.body.deliveryInfo,
      deliveryCharge: req.body.deliveryCharge,
      returnTime: req.body.returnTime,
    });

    // save the updated journey into the db
    let product = await Product.create(newProduct);

    const login = util.promisify(req.login.bind(req));
    await login(user);
    req.session.success = "Product successfully added!";
    // redirect to show page
    res.redirect("/company-dashboard/products");
  },

  //Edit Product
  async putProduct(req, res, next) {
    let product = await Product.findById(req.params.id);

    if (req.body.deleteImages && req.body.deleteImages.length) {
      // assign deleteImages from req.body to its own variable
      let deleteImages = req.body.deleteImages;
      // loop over deleteImages
      for (const public_id of deleteImages) {
        // delete images from cloudinary
        await cloudinary.v2.uploader.destroy(public_id);
        // delete image from post.images
        for (const image of product.images) {
          if (image.public_id === public_id) {
            let index = product.images.indexOf(image);
            product.images.splice(index, 1);
          }
        }
      }
    }

    // check if there are any new images for upload
    if (req.files) {
      // upload images
      for (const file of req.files) {
        let image = await cloudinary.v2.uploader.upload(file.path);
        // add images to post.images array
        product.images.push({
          url: image.secure_url,
          public_id: image.public_id,
        });
      }
    }

    const {
      price,
      title,
      category,
      service,
      description,
      time,
      tags,
      specificationTitle,
      specificationDescription,
      specificationTitle2,
      specificationDescription2,
      deliveryInfo,
      deliveryCharge,
      returnTime,
    } = req.body;

    if (title) product.title = req.body.title;
    if (category) product.category = req.body.category;
    if (description) product.description = req.body.description;
    if (price) product.price = req.body.price;
    if (tags) product.tags = req.body.tags;
    if (specificationTitle)
      product.specificationTitle = req.body.specificationTitle;
    if (specificationDescription)
      product.specificationDescription = req.body.specificationDescription;
    if (specificationTitle2)
      product.specificationTitle2 = req.body.specificationTitle2;
    if (specificationDescription2)
      product.specificationDescription2 = req.body.specificationDescription2;
    if (deliveryInfo) product.deliveryInfo = req.body.deliveryInfo;
    if (deliveryCharge) product.deliveryCharge = req.body.deliveryCharge;
    if (returnTime) product.returnTime = req.body.returnTime;
    if (time) product.time = req.body.time;
    if (service) product.service = req.body.service;

    await product.save();
    req.session.success = "Product successfully Updated!";
    // redirect to show page
    res.redirect("/company-dashboard/products");
  },

  //Delete Product
  async deleteProduct(req, res, next) {
    let product = await Product.findById(req.params.id);
    for (const public_id of product.images) {
      // delete images from cloudinary
      await cloudinary.v2.uploader.destroy(public_id);
    }
    await product.remove();
    req.session.error = "Product Deleted!";
    res.redirect("/company-dashboard/products");
  },

  //Create Faq
  async postFaq(req, res, next) {
    // find the user
    const user = req.user;
    const owner = {
      id: req.user._id,
      username: req.user.username,
    };

    const newFaq = new Faq({
      question: req.body.question,
      answer: req.body.answer,
      owner: owner,
    });

    // save the updated journey into the db
    let faq = await Faq.create(newFaq);

    const login = util.promisify(req.login.bind(req));
    await login(user);
    req.session.success = "Faq successfully added!";
    // redirect to show page
    res.redirect("/company-dashboard/faq");
  },

  //Edit Faq
  async putFaq(req, res, next) {
    let faq = await Faq.findById(req.params.id);

    const { question, answer } = req.body;

    if (question) faq.question = req.body.question;
    if (answer) faq.answer = req.body.answer;

    await faq.save();
    req.session.success = "Faq successfully Updated!";
    // redirect to show page
    res.redirect("/company-dashboard/faq");
  },

  //Delete Faq
  async deleteFaq(req, res, next) {
    let faq = await Faq.findById(req.params.id);
    await faq.remove();
    req.session.error = "Faq Deleted!";
    res.redirect("/company-dashboard/faq");
  },

  // Company Profile Page
  async companyProfileShow(req, res, next) {
    try {
      let companyID = req.params.id;
      let company = await User.findById(companyID);
      let user = await req.user,
        lists;
      let lastMessage;

      let service = await Service.find({ "owner.id": companyID }).populate(
        "owner.id"
      );

      let portfolio = await Portfolio.find({ "owner.id": companyID }).populate(
        "owner.id"
      );

      let review = await Review.find({ "owner.id": companyID })
        .populate("author.id")
        .populate("owner.id");

      let oneStarPercentage = 0,
        twoStarPercentage = 0,
        threeStarPercentage = 0,
        fourStarPercentage = 0,
        fiveStarPercentage = 0;

      function calculateAverage() {
        if (review.length === 0) {
          return 0;
        }
        var sum = 0;
        review.forEach(function (element) {
          if (element.rating == 5) {
            fiveStarPercentage += 1;
          } else if (element.rating == 4) {
            fourStarPercentage += 1;
          } else if (element.rating == 3) {
            threeStarPercentage += 1;
          } else if (element.rating == 2) {
            twoStarPercentage += 1;
          } else if (element.rating == 1) {
            oneStarPercentage += 1;
          }

          sum += element.rating;
        });
        return sum / review.length;
      }

      // Calculating reviews
      let averageRating = calculateAverage(review).toFixed(1);
      oneStarPercentage = (oneStarPercentage / review.length) * 100;
      twoStarPercentage = (twoStarPercentage / review.length) * 100;
      threeStarPercentage = (threeStarPercentage / review.length) * 100;
      fourStarPercentage = (fourStarPercentage / review.length) * 100;
      fiveStarPercentage = (fiveStarPercentage / review.length) * 100;

      // TIME CALCULATIONS FOR OPENING/CLOSING BUSINESS
      moment.tz.setDefault("America/Chicago");

      // let time = moment.utc(new Date(), "HH:mm").tz("America/Chicago");
      let day = moment
        .utc(new Date(), "HH:mm")
        .tz("America/Chicago")
        .format("dddd");

      let startTime = day.charAt(0).toLowerCase() + day.slice(1) + "From";
      startTime = company[startTime];
      let endTime = day.charAt(0).toLowerCase() + day.slice(1) + "To";
      endTime = company[endTime];

      if (req.user) {
        lists = await List.find().where("owner.id").equals(user._id).exec();

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
      // if (company.phoneNumber) {
      //   let newnum=
      //   company.phoneNumber=newnum;
      // }
      console.log(
        "Mugheera",
        "company====>",
        "usr.....",
        fiveStarPercentage,
        fourStarPercentage,
        threeStarPercentage
      );
      res.render("show-pages/company-profile", {
        title: "Company Profile",
        averageRating,
        company,
        service,
        review,
        user,
        portfolio,
        oneStarPercentage,
        twoStarPercentage,
        threeStarPercentage,
        fourStarPercentage,
        fiveStarPercentage,
        lastMessage,
        startTime,
        endTime,
        day,
        lists,
      });
    } catch (err) {
      console.log(err);
    }
  },

  async companyContact(req, res, next) {
    let company = await User.findById(req.params.id);
    const msg = {
      to: company.email,
      from: "GABAZZO <no-reply@gbazzo.com>",
      subject: "GABAZZO Contact Form",
      text: `First Name: ${req.body.firstName}
                   Last Name: ${req.body.lastName}
                   Email: ${req.body.email}
                   Phone Number: ${req.body.phone}
                   Reason For Contact: ${req.body.reason}
                   Address: ${req.body.address}
                   Comment: ${req.body.comment}`.replace(/				/g, ""),
    };

    await sgMail.send(msg);

    req.session.success = `Email Sent`;
    res.redirect("back");
  },

  async companyProfileAbout(req, res, next) {
    let company = await User.findById(req.params.id);
    let user = await req.user;
    let conversations = [];

    if (user) {
      //getting the conversation of the sender
      let existingConv = await Conversation.find({
        participants: { $in: user._id },
      }).sort({ lastMsgTime: -1 });

      if (existingConv) {
        //getting the msgs against the current sender and receiver
        for (let i = 0; i < existingConv.length; i++) {
          let tempChat = await Chat.find({
            conversationID: existingConv[i]._id,
          })
            .sort({
              _id: 1,
            })
            .populate("conversationID")
            .populate("messages.sender.id")
            .populate("messages.receiver.id");

          conversations.push(tempChat);
        }
      }
    }

    let videoFlag = -1;

    if (company.videos) {
      // 0 if the video is present
      // 1 for the image
      // -1 No data

      for (let i = 0; i < company.videos.length; i++) {
        if (
          company.videos[i].url.includes(".jpg") ||
          company.videos[i].url.includes(".jpeg") ||
          company.videos[i].url.includes(".png") ||
          company.videos[i].url.includes(".gif")
        ) {
          videoFlag = 0;
          break;
        } else if (
          company.videos[i].url.includes(".mp4") ||
          company.videos[i].url.includes(".oog")
        ) {
          videoFlag = 1;
          break;
        }
      }
    }

    company.videoFlag = videoFlag;

    let total = await User.find({ isEmailVerified: true })
      .where("isCompany")
      .equals(true)
      .exec();
    let journey = await Journey.find()
      .where("owner.id")
      .equals(company._id)
      .exec();
    let certificate = await Certificate.find()
      .where("owner.id")
      .equals(company._id)
      .exec();
    let mediaPhoto = await MediaPhoto.find()
      .where("owner.id")
      .equals(company._id)
      .exec();
    let review = await Review.find()
      .where("owner.id")
      .equals(company._id)
      .exec();
    let lists;
    if (user) {
      lists = await List.find().where("owner.id").equals(user._id).exec();
    }
    function calculateAverage(reviews) {
      if (review.length === 0) {
        return 0;
      }
      var sum = 0;
      review.forEach(function (element) {
        sum += element.rating;
      });
      return sum / review.length;
    }
    let average = calculateAverage(review).toFixed(1);

    // TIME CALCULATIONS FOR OPENING/CLOSING BUSINESS
    moment.tz.setDefault("America/Chicago");

    let time = moment.utc(new Date(), "HH:mm").tz("America/Chicago");

    let day = moment
      .utc(new Date(), "HH:mm")
      .tz("America/Chicago")
      .format("dddd");

    let startTime = day.charAt(0).toLowerCase() + day.slice(1) + "From";
    startTime = company[startTime];

    let endTime = day.charAt(0).toLowerCase() + day.slice(1) + "To";
    endTime = company[endTime];

    if (startTime && endTime) {
      startTime = moment(startTime, "HH:mm");
      endTime = moment(endTime, "HH:mm");

      if (startTime.isBefore(time) && endTime.isAfter(time))
        company.companyStatus = true;
      else company.companyStatus = false;
    } else {
      company.companyStatus = true;
    }

    let temptime = moment.utc(new Date(), "HH:mm").tz("America/Chicago");
    usaTime = temptime.format("HH:mm");

    res.render("show-pages/about", {
      title: "Company Profile",
      lists,
      average,
      total,
      company,
      journey,
      certificate,
      mediaPhoto,
      review,
      user,
      usaTime,
      conversations,
    });
  },

  async companyProfileMedia(req, res, next) {
    let company = await User.findById(req.params.id);
    let user = await req.user;
    let total = await User.find({ isEmailVerified: true })
      .where("isCompany")
      .equals(true)
      .exec();
    let photo = await MediaPhoto.find()
      .where("owner.id")
      .equals(company._id)
      .exec();
    let video = await MediaVideo.find()
      .where("owner.id")
      .equals(company._id)
      .exec();
    let review = await Review.find()
      .where("owner.id")
      .equals(company._id)
      .exec();
    let lists;
    if (user) {
      lists = await List.find().where("owner.id").equals(user._id).exec();
    }
    function calculateAverage(reviews) {
      if (review.length === 0) {
        return 0;
      }
      var sum = 0;
      review.forEach(function (element) {
        sum += element.rating;
      });
      return sum / review.length;
    }
    let average = calculateAverage(review).toFixed(1);
    res.render("show-pages/media", {
      title: "Company Profile",
      lists,
      average,
      total,
      company,
      photo,
      video,
      review,
    });
  },

  async companyProfileEmployee(req, res, next) {
    let company = await User.findById(req.params.id);
    let user = await req.user;
    let total = await User.find({ isEmailVerified: true })
      .where("isCompany")
      .equals(true)
      .exec();
    let employee = await Employee.find()
      .where("owner.id")
      .equals(company._id)
      .exec();
    let review = await Review.find()
      .where("owner.id")
      .equals(company._id)
      .exec();
    let lists;
    if (user) {
      lists = await List.find().where("owner.id").equals(user._id).exec();
    }
    function calculateAverage(reviews) {
      if (review.length === 0) {
        return 0;
      }
      var sum = 0;
      review.forEach(function (element) {
        sum += element.rating;
      });
      return sum / review.length;
    }
    let average = calculateAverage(review).toFixed(1);
    res.render("show-pages/employees", {
      title: "Company Profile",
      lists,
      average,
      total,
      company,
      employee,
      review,
    });
  },

  async companyProfilePortfolio(req, res, next) {
    let company = await User.findById(req.params.id);
    let user = await req.user;
    let conversations = [];

    if (user) {
      //getting the conversation of the sender
      let existingConv = await Conversation.find({
        participants: { $in: user._id },
      }).sort({ lastMsgTime: -1 });

      if (existingConv) {
        //getting the msgs against the current sender and receiver
        for (let i = 0; i < existingConv.length; i++) {
          let tempChat = await Chat.find({
            conversationID: existingConv[i]._id,
          })
            .sort({
              _id: 1,
            })
            .populate("conversationID")
            .populate("messages.sender.id")
            .populate("messages.receiver.id");

          conversations.push(tempChat);
        }
      }
    }

    let total = await User.find({ isEmailVerified: true })
      .where("isCompany")
      .equals(true)
      .exec();
    let portfolio = await Portfolio.find()
      .where("owner.id")
      .equals(company._id)
      .exec();
    let review = await Review.find()
      .where("owner.id")
      .equals(company._id)
      .exec();
    let lists;
    if (user) {
      lists = await List.find().where("owner.id").equals(user._id).exec();
    }
    function calculateAverage(reviews) {
      if (review.length === 0) {
        return 0;
      }
      var sum = 0;
      review.forEach(function (element) {
        sum += element.rating;
      });
      return sum / review.length;
    }
    let average = calculateAverage(review).toFixed(1);

    // TIME CALCULATIONS FOR OPENING/CLOSING BUSINESS
    moment.tz.setDefault("America/Chicago");

    let time = moment.utc(new Date(), "HH:mm").tz("America/Chicago");

    let day = moment
      .utc(new Date(), "HH:mm")
      .tz("America/Chicago")
      .format("dddd");

    let startTime = day.charAt(0).toLowerCase() + day.slice(1) + "From";
    startTime = company[startTime];

    let endTime = day.charAt(0).toLowerCase() + day.slice(1) + "To";
    endTime = company[endTime];

    if (startTime && endTime) {
      startTime = moment(startTime, "HH:mm");
      endTime = moment(endTime, "HH:mm");

      if (startTime.isBefore(time) && endTime.isAfter(time))
        company.companyStatus = true;
      else company.companyStatus = false;
    } else {
      company.companyStatus = true;
    }

    let temptime = moment.utc(new Date(), "HH:mm").tz("America/Chicago");
    usaTime = temptime.format("HH:mm");

    res.render("show-pages/portfolio", {
      title: "Company Profile",
      lists,
      average,
      total,
      company,
      portfolio,
      user,
      review,
      conversations,
      usaTime,
    });
  },

  async companyProfileServices(req, res, next) {
    let company = await User.findById(req.params.id);
    let user = await req.user;

    let conversations = [];

    if (user) {
      //getting the conversation of the sender
      let existingConv = await Conversation.find({
        participants: { $in: user._id },
      }).sort({ lastMsgTime: -1 });

      if (existingConv) {
        //getting the msgs against the current sender and receiver
        for (let i = 0; i < existingConv.length; i++) {
          let tempChat = await Chat.find({
            conversationID: existingConv[i]._id,
          })
            .sort({
              _id: 1,
            })
            .populate("conversationID")
            .populate("messages.sender.id")
            .populate("messages.receiver.id");

          conversations.push(tempChat);
        }
      }
    }

    let total = await User.find({ isEmailVerified: true })
      .where("isCompany")
      .equals(true)
      .exec();
    let product = await Product.find()
      .where("owner.id")
      .equals(company._id)
      .exec();
    let service = await Service.find()
      .where("owner.id")
      .equals(company._id)
      .exec();
    let review = await Review.find()
      .where("owner.id")
      .equals(company._id)
      .exec();
    let lists;
    if (user) {
      lists = await List.find().where("owner.id").equals(user._id).exec();
    }
    function calculateAverage(reviews) {
      if (review.length === 0) {
        return 0;
      }
      var sum = 0;
      review.forEach(function (element) {
        sum += element.rating;
      });
      return sum / review.length;
    }
    let average = calculateAverage(review).toFixed(1);

    // TIME CALCULATIONS FOR OPENING/CLOSING BUSINESS
    moment.tz.setDefault("America/Chicago");

    let time = moment.utc(new Date(), "HH:mm").tz("America/Chicago");

    let day = moment
      .utc(new Date(), "HH:mm")
      .tz("America/Chicago")
      .format("dddd");

    let startTime = day.charAt(0).toLowerCase() + day.slice(1) + "From";
    startTime = company[startTime];

    let endTime = day.charAt(0).toLowerCase() + day.slice(1) + "To";
    endTime = company[endTime];

    if (startTime && endTime) {
      startTime = moment(startTime, "HH:mm");
      endTime = moment(endTime, "HH:mm");

      if (startTime.isBefore(time) && endTime.isAfter(time))
        company.companyStatus = true;
      else company.companyStatus = false;
    } else {
      company.companyStatus = true;
    }

    let temptime = moment.utc(new Date(), "HH:mm").tz("America/Chicago");
    usaTime = temptime.format("HH:mm");

    res.render("show-pages/services-products", {
      title: "Company Profile",
      lists,
      average,
      total,
      company,
      product,
      service,
      user,
      review,
      usaTime,
      conversations,
    });
  },

  async companyProfileReviews(req, res, next) {
    let company = await User.findById(req.params.id);
    let user = await req.user;

    let conversations = [];

    if (user) {
      //getting the conversation of the sender
      let existingConv = await Conversation.find({
        participants: { $in: user._id },
      }).sort({ lastMsgTime: -1 });

      if (existingConv) {
        //getting the msgs against the current sender and receiver
        for (let i = 0; i < existingConv.length; i++) {
          let tempChat = await Chat.find({
            conversationID: existingConv[i]._id,
          })
            .sort({
              _id: 1,
            })
            .populate("conversationID")
            .populate("messages.sender.id")
            .populate("messages.receiver.id");

          conversations.push(tempChat);
        }
      }
    }

    let total = await User.find({ isEmailVerified: true })
      .where("isCompany")
      .equals(true)
      .exec();
    let lists;
    if (user) {
      lists = await List.find().where("owner.id").equals(user._id).exec();
    }
    let review;
    let fiveReview = [];
    let fourReview = [];
    let threeReview = [];
    let twoReview = [];
    let oneReview = [];
    let average;

    async function others(page) {
      await review.forEach(function (review) {
        if (review.rating === 5) {
          fiveReview.push(review);
        }
        if (review.rating === 4) {
          fourReview.push(review);
        }
        if (review.rating === 3) {
          threeReview.push(review);
        }
        if (review.rating === 2) {
          twoReview.push(review);
        }
        if (review.rating === 1) {
          oneReview.push(review);
        }
      });
      function calculateAverage(reviews) {
        if (review.length === 0) {
          return 0;
        }
        var sum = 0;
        review.forEach(function (element) {
          sum += element.rating;
        });
        return sum / review.length;
      }

      // TIME CALCULATIONS FOR OPENING/CLOSING BUSINESS
      moment.tz.setDefault("America/Chicago");

      let time = moment.utc(new Date(), "HH:mm").tz("America/Chicago");

      let day = moment
        .utc(new Date(), "HH:mm")
        .tz("America/Chicago")
        .format("dddd");

      let startTime = day.charAt(0).toLowerCase() + day.slice(1) + "From";
      startTime = company[startTime];

      let endTime = day.charAt(0).toLowerCase() + day.slice(1) + "To";
      endTime = company[endTime];
      if (startTime && endTime) {
        startTime = moment(startTime, "HH:mm");
        endTime = moment(endTime, "HH:mm");

        if (startTime.isBefore(time) && endTime.isAfter(time))
          company.companyStatus = true;
        else company.companyStatus = false;
      } else {
        company.companyStatus = true;
      }

      average = calculateAverage(review).toFixed(1);
      company.averageReview = average.toString();
      await company.save();

      let temptime = moment.utc(new Date(), "HH:mm").tz("America/Chicago");
      usaTime = temptime.format("HH:mm");

      res.render(page, {
        title: "Company Profile",
        review,
        company,
        average,
        fiveReview,
        fourReview,
        threeReview,
        twoReview,
        oneReview,
        lists,
        total,
        user,
        usaTime,
        conversations,
      });
    }

    if (req.body.filter === "recent") {
      review = await Review.find()
        .where("owner.id")
        .equals(company._id)
        .sort({ createdAt: -1 })
        .exec();
      others("show-pages/reviews");
    } else if (req.body.filter === "positive") {
      review = await Review.find({ rating: { $gte: 4 } })
        .where("owner.id")
        .equals(company._id)
        .exec();
      others("show-pages/reviews-positive");
    } else if (req.body.filter === "neutral") {
      review = await Review.find({ rating: { $in: 3 } })
        .where("owner.id")
        .equals(company._id)
        .exec();
      others("show-pages/reviews-neutral");
    } else if (req.body.filter === "negative") {
      review = await Review.find({ rating: { $gte: 0, $lte: 3.9 } })
        .where("owner.id")
        .equals(company._id)
        .exec();
      others("show-pages/reviews-negative");
    } else {
      review = await Review.find()
        .where("owner.id")
        .equals(company._id)
        .sort({ createdAt: -1 })
        .exec();
      others("show-pages/reviews");
    }
  },

  //Create Review
  async createReview(req, res, next) {
    req.body.images = [];
    // find the user
    const user = req.user;
    const company = await User.findById(req.params.id);
    const owner = {
      id: company._id,
      username: company.username,
    };
    const author = {
      id: user._id,
      username: user.username,
    };

    for (const file of req.files) {
      let image = await cloudinary.v2.uploader.upload(file.path);
      req.body.images.push({
        url: image.secure_url,
        public_id: image.public_id,
      });
    }

    const newReview = new Review({
      text: req.body.text,
      author: author,
      rating: req.body.rating,
      owner: owner,
      images: req.body.images,
    });

    // save the updated journey into the db
    let review = await Review.create(newReview);

    await company.reviews.push(review);
    await company.save();

    const login = util.promisify(req.login.bind(req));
    await login(user);
    req.session.success = "Review successfully created!";
    // redirect to show page
    res.redirect("back");
  },

  async serviceDetails(req, res, next) {
    let service = await Service.findById(req.params.id).populate("owner.id");
    let user = req.user,
      lastMessage,
      lists;

    let company = service.owner.id;

    let review = await Review.find({ "owner.id": service.owner.id._id });

    if (user) {
      lists = await List.find().where("owner.id").equals(user._id).exec();

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

    res.render("show-pages/service-details", {
      service,
      lastMessage,
      review,
      lists,
      company,
    });
  },

  async productDetails(req, res, next) {
    let product = await Product.findById(req.params.id);
    let total = await User.find({ isEmailVerified: true })
      .where("isCompany")
      .equals(true)
      .exec();
    let company = await User.findById(product.owner.id)
      .populate({
        path: "reviews",
        options: { sort: { _id: -1 } },
      })
      .exec();
    let user = await req.user;
    let lists;
    let otherProducts = await Product.find()
      .where("owner.id")
      .equals(company)
      .exec();
    let review = await Review.find()
      .where("owner.id")
      .equals(company._id)
      .exec();
    if (user) {
      lists = await List.find().where("owner.id").equals(user._id).exec();
    }
    function calculateAverage(reviews) {
      if (review.length === 0) {
        return 0;
      }
      var sum = 0;
      review.forEach(function (element) {
        sum += element.rating;
      });
      return sum / review.length;
    }
    let average = calculateAverage(review).toFixed(1);

    // TIME CALCULATIONS FOR OPENING/CLOSING BUSINESS
    moment.tz.setDefault("America/Chicago");

    let time = moment.utc(new Date(), "HH:mm").tz("America/Chicago");

    let day = moment
      .utc(new Date(), "HH:mm")
      .tz("America/Chicago")
      .format("dddd");

    let startTime = day.charAt(0).toLowerCase() + day.slice(1) + "From";
    startTime = company[startTime];

    let endTime = day.charAt(0).toLowerCase() + day.slice(1) + "To";
    endTime = company[endTime];

    if (startTime && endTime) {
      startTime = moment(startTime, "HH:mm");
      endTime = moment(endTime, "HH:mm");

      if (startTime.isBefore(time) && endTime.isAfter(time))
        company.companyStatus = true;
      else company.companyStatus = false;
    } else {
      company.companyStatus = true;
    }

    res.render("show-pages/product-details", {
      title: "Company Profile",
      lists,
      average,
      total,
      product,
      company,
      otherProducts,
      review,
    });
  },

  async companyProfileFaq(req, res, next) {
    let company = await User.findById(req.params.id)
      .populate({
        path: "reviews",
        options: { sort: { _id: -1 } },
      })
      .exec();
    let total = await User.find({ isEmailVerified: true })
      .where("isCompany")
      .equals(true)
      .exec();
    let user = await req.user;
    let faq = await Faq.find().where("owner.id").equals(company._id).exec();
    let review = await company.reviews;
    let lists;

    let conversations = [];

    if (user) {
      //getting the conversation of the sender
      let existingConv = await Conversation.find({
        participants: { $in: user._id },
      }).sort({ lastMsgTime: -1 });

      if (existingConv) {
        //getting the msgs against the current sender and receiver
        for (let i = 0; i < existingConv.length; i++) {
          let tempChat = await Chat.find({
            conversationID: existingConv[i]._id,
          })
            .sort({
              _id: 1,
            })
            .populate("conversationID")
            .populate("messages.sender.id")
            .populate("messages.receiver.id");

          conversations.push(tempChat);
        }
      }
    }

    if (user) {
      lists = await List.find().where("owner.id").equals(user._id).exec();
    }
    function calculateAverage(reviews) {
      if (review.length === 0) {
        return 0;
      }
      var sum = 0;
      review.forEach(function (element) {
        sum += element.rating;
      });
      return sum / review.length;
    }
    let average = calculateAverage(review).toFixed(1);

    // TIME CALCULATIONS FOR OPENING/CLOSING BUSINESS
    moment.tz.setDefault("America/Chicago");

    let time = moment.utc(new Date(), "HH:mm").tz("America/Chicago");

    let day = moment
      .utc(new Date(), "HH:mm")
      .tz("America/Chicago")
      .format("dddd");

    let startTime = day.charAt(0).toLowerCase() + day.slice(1) + "From";
    startTime = company[startTime];

    let endTime = day.charAt(0).toLowerCase() + day.slice(1) + "To";
    endTime = company[endTime];

    if (startTime && endTime) {
      startTime = moment(startTime, "HH:mm");
      endTime = moment(endTime, "HH:mm");

      if (startTime.isBefore(time) && endTime.isAfter(time))
        company.companyStatus = true;
      else company.companyStatus = false;
    } else {
      company.companyStatus = true;
    }

    let temptime = moment.utc(new Date(), "HH:mm").tz("America/Chicago");
    usaTime = temptime.format("HH:mm");

    res.render("show-pages/faq", {
      title: "Company Profile",
      lists,
      average,
      total,
      company,
      faq,
      review,
      user,
      usaTime,
      conversations,
    });
  },

  //Services Pages Controllers
  async garageServices(req, res, next) {
    let user = await User.findById(req.user);

    let conversations = [];
    if (req.user) {
      user = await User.findById(req.user.id);
      //getting the conversation of the sender
      let existingConv = await Conversation.find({
        participants: { $in: user._id },
      });

      if (existingConv) {
        //getting the msgs against the current sender and receiver
        for (let i = 0; i < existingConv.length; i++) {
          let tempChat = await Chat.find({
            conversationID: existingConv[i]._id,
          })
            .sort({
              _id: 1,
            })
            .populate("conversationID")
            .populate("messages.sender.id")
            .populate("messages.receiver.id");

          conversations.push(tempChat);
        }

        function bubbleSort(arr) {
          for (let i = 0; i < arr.length - 1; i++) {
            if (
              arr[i][arr[i].length - 1]?.createdAt &&
              arr[i + 1][arr[i + 1].length - 1]?.createdAt
            ) {
              let date1 = moment(arr[i][arr[i].length - 1].createdAt);
              let date2 = moment(arr[i + 1][arr[i + 1].length - 1].createdAt);
              for (let j = 0; j < arr.length - i - 1; j++)
                if (date1.isBefore(date2)) {
                  let tmp = arr[j];
                  arr[j] = arr[j + 1];
                  arr[j + 1] = tmp;
                }
            }
          }

          return arr;
        }

        if (conversations.length) {
          conversations = conversations.filter((array) => array.length !== 0);

          conversations = bubbleSort(conversations);
        }
      }
    }

    let total = await User.find({ isEmailVerified: true })
      .where("isCompany")
      .equals(true)
      .exec();
    let company;
    let filter = req.body.filter;
    let zip = req.body.zip;
    let sorting = {};
    if (req.body.sort === "asc") {
      sorting = await { companyName: -1 };
    } else if (req.body.sort === "desc") {
      sorting = await { companyName: 1 };
    } else if (req.body.sort === "created") {
      sorting = await { createdAt: -1 };
    } else if (req.body.sort === "rated") {
      sorting = await { averageReview: 1 };
    } else {
      sorting = await { id: -1 };
    }

    if (filter) {
      if (zip && filter) {
        company = await User.find({
          isEmailVerified: true,
          zipCode: zip,
          filters: { $in: filter },
        })
          .where("serviceCategory")
          .equals("Garage services")
          .populate({
            path: "reviews",
            options: { sort: { _id: -1 } },
          })
          .sort(sorting)
          .exec();
      } else {
        company = await User.find({
          isEmailVerified: true,
          filters: { $in: filter },
        })
          .where("serviceCategory")
          .equals("Garage services")
          .populate({
            path: "reviews",
            options: { sort: { _id: -1 } },
          })
          .sort(sorting)
          .exec();
      }
    } else if (zip) {
      company = await User.find({ isEmailVerified: true, zipCode: zip })
        .where("serviceCategory")
        .equals("Garage services")
        .populate({
          path: "reviews",
          options: { sort: { _id: -1 } },
        })
        .sort(sorting)
        .exec();
    } else {
      company = await User.find({ isEmailVerified: true })
        .where("serviceCategory")
        .equals("Garage services")
        .populate({
          path: "reviews",
          options: { sort: { _id: -1 } },
        })
        .sort(sorting)
        .exec();
    }
    let review = await Review.find()
      .where("owner.id")
      .equals(company._id)
      .exec();
    if (req.xhr) {
      res.json(company);
    } else {
      res.render("show-pages/garage-services", {
        title: "Company Profile",
        user,
        company,
        review,
        conversations,
        total,
      });
    }
  },

  async roofingServies(req, res, next) {
    let user = await User.findById(req.user);

    let conversations = [];
    if (req.user) {
      user = await User.findById(req.user.id);
      //getting the conversation of the sender
      let existingConv = await Conversation.find({
        participants: { $in: user._id },
      });

      if (existingConv) {
        //getting the msgs against the current sender and receiver
        for (let i = 0; i < existingConv.length; i++) {
          let tempChat = await Chat.find({
            conversationID: existingConv[i]._id,
          })
            .sort({
              _id: 1,
            })
            .populate("conversationID")
            .populate("messages.sender.id")
            .populate("messages.receiver.id");

          conversations.push(tempChat);
        }

        function bubbleSort(arr) {
          for (let i = 0; i < arr.length - 1; i++) {
            if (
              arr[i][arr[i].length - 1]?.createdAt &&
              arr[i + 1][arr[i + 1].length - 1]?.createdAt
            ) {
              let date1 = moment(arr[i][arr[i].length - 1].createdAt);
              let date2 = moment(arr[i + 1][arr[i + 1].length - 1].createdAt);
              for (let j = 0; j < arr.length - i - 1; j++)
                if (date1.isBefore(date2)) {
                  let tmp = arr[j];
                  arr[j] = arr[j + 1];
                  arr[j + 1] = tmp;
                }
            }
          }

          return arr;
        }

        if (conversations.length) {
          conversations = conversations.filter((array) => array.length !== 0);

          conversations = bubbleSort(conversations);
        }
      }
    }

    let total = await User.find({ isEmailVerified: true })
      .where("isCompany")
      .equals(true)
      .exec();
    let company;
    let filter = req.body.filter;
    let zip = req.body.zip;
    let sorting = {};
    if (req.body.sort === "asc") {
      sorting = await { companyName: -1 };
    } else if (req.body.sort === "desc") {
      sorting = await { companyName: 1 };
    } else if (req.body.sort === "created") {
      sorting = await { createdAt: -1 };
    } else if (req.body.sort === "rated") {
      sorting = await { averageReview: 1 };
    } else {
      sorting = await { id: -1 };
    }

    if (filter) {
      if (zip && filter) {
        company = await User.find({
          isEmailVerified: true,
          zipCode: zip,
          filters: { $in: filter },
        })
          .where("serviceCategory")
          .equals("Roofing services")
          .populate({
            path: "reviews",
            options: { sort: { _id: -1 } },
          })
          .sort(sorting)
          .exec();
      } else {
        company = await User.find({
          isEmailVerified: true,
          filters: { $in: filter },
        })
          .where("serviceCategory")
          .equals("Roofing services")
          .populate({
            path: "reviews",
            options: { sort: { _id: -1 } },
          })
          .sort(sorting)
          .exec();
      }
    } else if (zip) {
      company = await User.find({ isEmailVerified: true, zipCode: zip })
        .where("serviceCategory")
        .equals("Roofing services")
        .populate({
          path: "reviews",
          options: { sort: { _id: -1 } },
        })
        .sort(sorting)
        .exec();
    } else {
      company = await User.find({ isEmailVerified: true })
        .where("serviceCategory")
        .equals("Roofing services")
        .populate({
          path: "reviews",
          options: { sort: { _id: -1 } },
        })
        .sort(sorting)
        .exec();
    }
    let review = await Review.find()
      .where("owner.id")
      .equals(company._id)
      .exec();
    if (req.xhr) {
      res.json(company);
    } else {
      res.render("show-pages/roofing-services", {
        title: "Company Profile",
        user,
        company,
        review,
        total,
        conversations,
      });
    }
  },

  async landscapingServices(req, res, next) {
    let user = await User.findById(req.user);

    let conversations = [];
    if (req.user) {
      user = await User.findById(req.user.id);
      //getting the conversation of the sender
      let existingConv = await Conversation.find({
        participants: { $in: user._id },
      });

      if (existingConv) {
        //getting the msgs against the current sender and receiver
        for (let i = 0; i < existingConv.length; i++) {
          let tempChat = await Chat.find({
            conversationID: existingConv[i]._id,
          })
            .sort({
              _id: 1,
            })
            .populate("conversationID")
            .populate("messages.sender.id")
            .populate("messages.receiver.id");

          conversations.push(tempChat);
        }

        function bubbleSort(arr) {
          for (let i = 0; i < arr.length - 1; i++) {
            if (
              arr[i][arr[i].length - 1]?.createdAt &&
              arr[i + 1][arr[i + 1].length - 1]?.createdAt
            ) {
              let date1 = moment(arr[i][arr[i].length - 1].createdAt);
              let date2 = moment(arr[i + 1][arr[i + 1].length - 1].createdAt);
              for (let j = 0; j < arr.length - i - 1; j++)
                if (date1.isBefore(date2)) {
                  let tmp = arr[j];
                  arr[j] = arr[j + 1];
                  arr[j + 1] = tmp;
                }
            }
          }

          return arr;
        }

        if (conversations.length) {
          conversations = conversations.filter((array) => array.length !== 0);

          conversations = bubbleSort(conversations);
        }
      }
    }

    let total = await User.find({ isEmailVerified: true })
      .where("isCompany")
      .equals(true)
      .exec();
    let company;
    let filter = req.body.filter;
    let zip = req.body.zip;
    let sorting = {};
    if (req.body.sort === "asc") {
      sorting = await { companyName: -1 };
    } else if (req.body.sort === "desc") {
      sorting = await { companyName: 1 };
    } else if (req.body.sort === "created") {
      sorting = await { createdAt: -1 };
    } else if (req.body.sort === "rated") {
      sorting = await { averageReview: 1 };
    } else {
      sorting = await { id: -1 };
    }

    if (filter) {
      if (zip && filter) {
        company = await User.find({
          isEmailVerified: true,
          zipCode: zip,
          filters: { $in: filter },
        })
          .where("serviceCategory")
          .equals("Landscaping services")
          .populate({
            path: "reviews",
            options: { sort: { _id: -1 } },
          })
          .sort(sorting)
          .exec();
      } else {
        company = await User.find({
          isEmailVerified: true,
          filters: { $in: filter },
        })
          .where("serviceCategory")
          .equals("Landscaping services")
          .populate({
            path: "reviews",
            options: { sort: { _id: -1 } },
          })
          .sort(sorting)
          .exec();
      }
    } else if (zip) {
      company = await User.find({ isEmailVerified: true, zipCode: zip })
        .where("serviceCategory")
        .equals("Landscaping services")
        .populate({
          path: "reviews",
          options: { sort: { _id: -1 } },
        })
        .sort(sorting)
        .exec();
    } else {
      company = await User.find({ isEmailVerified: true })
        .where("serviceCategory")
        .equals("Landscaping services")
        .populate({
          path: "reviews",
          options: { sort: { _id: -1 } },
        })
        .sort(sorting)
        .exec();
    }
    let review = await Review.find()
      .where("owner.id")
      .equals(company._id)
      .exec();
    if (req.xhr) {
      res.json(company);
    } else {
      res.render("show-pages/landscaping-services", {
        title: "Company Profile",
        user,
        company,
        review,
        total,
        conversations,
      });
    }
  },

  async pavingServices(req, res, next) {
    let user = await User.findById(req.user);

    let conversations = [];
    if (req.user) {
      user = await User.findById(req.user.id);
      //getting the conversation of the sender
      let existingConv = await Conversation.find({
        participants: { $in: user._id },
      });

      if (existingConv) {
        //getting the msgs against the current sender and receiver
        for (let i = 0; i < existingConv.length; i++) {
          let tempChat = await Chat.find({
            conversationID: existingConv[i]._id,
          })
            .sort({
              _id: 1,
            })
            .populate("conversationID")
            .populate("messages.sender.id")
            .populate("messages.receiver.id");

          conversations.push(tempChat);
        }

        function bubbleSort(arr) {
          for (let i = 0; i < arr.length - 1; i++) {
            if (
              arr[i][arr[i].length - 1]?.createdAt &&
              arr[i + 1][arr[i + 1].length - 1]?.createdAt
            ) {
              let date1 = moment(arr[i][arr[i].length - 1].createdAt);
              let date2 = moment(arr[i + 1][arr[i + 1].length - 1].createdAt);
              for (let j = 0; j < arr.length - i - 1; j++)
                if (date1.isBefore(date2)) {
                  let tmp = arr[j];
                  arr[j] = arr[j + 1];
                  arr[j + 1] = tmp;
                }
            }
          }

          return arr;
        }

        if (conversations.length) {
          conversations = conversations.filter((array) => array.length !== 0);

          conversations = bubbleSort(conversations);
        }
      }
    }

    let total = await User.find({ isEmailVerified: true })
      .where("isCompany")
      .equals(true)
      .exec();
    let company;
    let filter = req.body.filter;
    let zip = req.body.zip;
    let sorting = {};
    if (req.body.sort === "asc") {
      sorting = await { companyName: -1 };
    } else if (req.body.sort === "desc") {
      sorting = await { companyName: 1 };
    } else if (req.body.sort === "created") {
      sorting = await { createdAt: -1 };
    } else if (req.body.sort === "rated") {
      sorting = await { averageReview: 1 };
    } else {
      sorting = await { id: -1 };
    }

    if (filter) {
      if (zip && filter) {
        company = await User.find({
          isEmailVerified: true,
          zipCode: zip,
          filters: { $in: filter },
        })
          .where("serviceCategory")
          .equals("Paving services")
          .populate({
            path: "reviews",
            options: { sort: { _id: -1 } },
          })
          .sort(sorting)
          .exec();
      } else {
        company = await User.find({
          isEmailVerified: true,
          filters: { $in: filter },
        })
          .where("serviceCategory")
          .equals("Paving services")
          .populate({
            path: "reviews",
            options: { sort: { _id: -1 } },
          })
          .sort(sorting)
          .exec();
      }
    } else if (zip) {
      company = await User.find({ isEmailVerified: true, zipCode: zip })
        .where("serviceCategory")
        .equals("Paving services")
        .populate({
          path: "reviews",
          options: { sort: { _id: -1 } },
        })
        .sort(sorting)
        .exec();
    } else {
      company = await User.find({ isEmailVerified: true })
        .where("serviceCategory")
        .equals("Paving services")
        .populate({
          path: "reviews",
          options: { sort: { _id: -1 } },
        })
        .sort(sorting)
        .exec();
    }
    let review = await Review.find()
      .where("owner.id")
      .equals(company._id)
      .exec();
    if (req.xhr) {
      res.json(company);
    } else {
      res.render("show-pages/paving-services", {
        title: "Company Profile",
        user,
        company,
        review,
        total,
        conversations,
      });
    }
  },

  async fencingServices(req, res, next) {
    let user = await User.findById(req.user);

    let conversations = [];
    if (req.user) {
      user = await User.findById(req.user.id);
      //getting the conversation of the sender
      let existingConv = await Conversation.find({
        participants: { $in: user._id },
      });

      if (existingConv) {
        //getting the msgs against the current sender and receiver
        for (let i = 0; i < existingConv.length; i++) {
          let tempChat = await Chat.find({
            conversationID: existingConv[i]._id,
          })
            .sort({
              _id: 1,
            })
            .populate("conversationID")
            .populate("messages.sender.id")
            .populate("messages.receiver.id");

          conversations.push(tempChat);
        }

        function bubbleSort(arr) {
          for (let i = 0; i < arr.length - 1; i++) {
            if (
              arr[i][arr[i].length - 1]?.createdAt &&
              arr[i + 1][arr[i + 1].length - 1]?.createdAt
            ) {
              let date1 = moment(arr[i][arr[i].length - 1].createdAt);
              let date2 = moment(arr[i + 1][arr[i + 1].length - 1].createdAt);
              for (let j = 0; j < arr.length - i - 1; j++)
                if (date1.isBefore(date2)) {
                  let tmp = arr[j];
                  arr[j] = arr[j + 1];
                  arr[j + 1] = tmp;
                }
            }
          }

          return arr;
        }

        if (conversations.length) {
          conversations = conversations.filter((array) => array.length !== 0);

          conversations = bubbleSort(conversations);
        }
      }
    }

    let total = await User.find({ isEmailVerified: true })
      .where("isCompany")
      .equals(true)
      .exec();
    let company;
    let filter = req.body.filter;
    let zip = req.body.zip;
    let sorting = {};
    if (req.body.sort === "asc") {
      sorting = await { companyName: -1 };
    } else if (req.body.sort === "desc") {
      sorting = await { companyName: 1 };
    } else if (req.body.sort === "created") {
      sorting = await { createdAt: -1 };
    } else if (req.body.sort === "rated") {
      sorting = await { averageReview: 1 };
    } else {
      sorting = await { id: -1 };
    }

    if (filter) {
      if (zip && filter) {
        company = await User.find({
          isEmailVerified: true,
          zipCode: zip,
          filters: { $in: filter },
        })
          .where("serviceCategory")
          .equals("Fencing services")
          .populate({
            path: "reviews",
            options: { sort: { _id: -1 } },
          })
          .sort(sorting)
          .exec();
      } else {
        company = await User.find({
          isEmailVerified: true,
          filters: { $in: filter },
        })
          .where("serviceCategory")
          .equals("Fencing services")
          .populate({
            path: "reviews",
            options: { sort: { _id: -1 } },
          })
          .sort(sorting)
          .exec();
      }
    } else if (zip) {
      company = await User.find({ isEmailVerified: true, zipCode: zip })
        .where("serviceCategory")
        .equals("Fencing services")
        .populate({
          path: "reviews",
          options: { sort: { _id: -1 } },
        })
        .sort(sorting)
        .exec();
    } else {
      company = await User.find({ isEmailVerified: true })
        .where("serviceCategory")
        .equals("Fencing services")
        .populate({
          path: "reviews",
          options: { sort: { _id: -1 } },
        })
        .sort(sorting)
        .exec();
    }
    let review = await Review.find()
      .where("owner.id")
      .equals(company._id)
      .exec();
    if (req.xhr) {
      res.json(company);
    } else {
      res.render("show-pages/fencing-services", {
        title: "Company Profile",
        user,
        company,
        review,
        total,
        conversations,
      });
    }
  },

  async junkRemoval(req, res, next) {
    let user = await User.findById(req.user);

    let conversations = [];
    if (req.user) {
      user = await User.findById(req.user.id);
      //getting the conversation of the sender
      let existingConv = await Conversation.find({
        participants: { $in: user._id },
      });

      if (existingConv) {
        //getting the msgs against the current sender and receiver
        for (let i = 0; i < existingConv.length; i++) {
          let tempChat = await Chat.find({
            conversationID: existingConv[i]._id,
          })
            .sort({
              _id: 1,
            })
            .populate("conversationID")
            .populate("messages.sender.id")
            .populate("messages.receiver.id");

          conversations.push(tempChat);
        }

        function bubbleSort(arr) {
          for (let i = 0; i < arr.length - 1; i++) {
            if (
              arr[i][arr[i].length - 1]?.createdAt &&
              arr[i + 1][arr[i + 1].length - 1]?.createdAt
            ) {
              let date1 = moment(arr[i][arr[i].length - 1].createdAt);
              let date2 = moment(arr[i + 1][arr[i + 1].length - 1].createdAt);
              for (let j = 0; j < arr.length - i - 1; j++)
                if (date1.isBefore(date2)) {
                  let tmp = arr[j];
                  arr[j] = arr[j + 1];
                  arr[j + 1] = tmp;
                }
            }
          }

          return arr;
        }

        if (conversations.length) {
          conversations = conversations.filter((array) => array.length !== 0);

          conversations = bubbleSort(conversations);
        }
      }
    }

    let total = await User.find({ isEmailVerified: true })
      .where("isCompany")
      .equals(true)
      .exec();
    let company;
    let filter = req.body.filter;
    let zip = req.body.zip;
    let sorting = {};
    if (req.body.sort === "asc") {
      sorting = await { companyName: -1 };
    } else if (req.body.sort === "desc") {
      sorting = await { companyName: 1 };
    } else if (req.body.sort === "created") {
      sorting = await { createdAt: -1 };
    } else if (req.body.sort === "rated") {
      sorting = await { averageReview: 1 };
    } else {
      sorting = await { id: -1 };
    }

    if (filter) {
      if (zip && filter) {
        company = await User.find({
          isEmailVerified: true,
          zipCode: zip,
          filters: { $in: filter },
        })
          .where("serviceCategory")
          .equals("Junk Removal")
          .populate({
            path: "reviews",
            options: { sort: { _id: -1 } },
          })
          .sort(sorting)
          .exec();
      } else {
        company = await User.find({
          isEmailVerified: true,
          filters: { $in: filter },
        })
          .where("serviceCategory")
          .equals("Junk Removal")
          .populate({
            path: "reviews",
            options: { sort: { _id: -1 } },
          })
          .sort(sorting)
          .exec();
      }
    } else if (zip) {
      company = await User.find({ isEmailVerified: true, zipCode: zip })
        .where("serviceCategory")
        .equals("Junk Removal")
        .populate({
          path: "reviews",
          options: { sort: { _id: -1 } },
        })
        .sort(sorting)
        .exec();
    } else {
      company = await User.find({ isEmailVerified: true })
        .where("serviceCategory")
        .equals("Junk Removal")
        .populate({
          path: "reviews",
          options: { sort: { _id: -1 } },
        })
        .sort(sorting)
        .exec();
    }
    let review = await Review.find()
      .where("owner.id")
      .equals(company._id)
      .exec();
    if (req.xhr) {
      res.json(company);
    } else {
      res.render("show-pages/junk-removal", {
        title: "Company Profile",
        user,
        company,
        review,
        conversations,
        total,
      });
    }
  },

  async generalSiding(req, res, next) {
    let user = await User.findById(req.user);

    let conversations = [];
    if (req.user) {
      user = await User.findById(req.user.id);
      //getting the conversation of the sender
      let existingConv = await Conversation.find({
        participants: { $in: user._id },
      });

      if (existingConv) {
        //getting the msgs against the current sender and receiver
        for (let i = 0; i < existingConv.length; i++) {
          let tempChat = await Chat.find({
            conversationID: existingConv[i]._id,
          })
            .sort({
              _id: 1,
            })
            .populate("conversationID")
            .populate("messages.sender.id")
            .populate("messages.receiver.id");

          conversations.push(tempChat);
        }

        function bubbleSort(arr) {
          for (let i = 0; i < arr.length - 1; i++) {
            if (
              arr[i][arr[i].length - 1]?.createdAt &&
              arr[i + 1][arr[i + 1].length - 1]?.createdAt
            ) {
              let date1 = moment(arr[i][arr[i].length - 1].createdAt);
              let date2 = moment(arr[i + 1][arr[i + 1].length - 1].createdAt);
              for (let j = 0; j < arr.length - i - 1; j++)
                if (date1.isBefore(date2)) {
                  let tmp = arr[j];
                  arr[j] = arr[j + 1];
                  arr[j + 1] = tmp;
                }
            }
          }

          return arr;
        }

        if (conversations.length) {
          conversations = conversations.filter((array) => array.length !== 0);

          conversations = bubbleSort(conversations);
        }
      }
    }

    let total = await User.find({ isEmailVerified: true })
      .where("isCompany")
      .equals(true)
      .exec();
    let company;
    let filter = req.body.filter;
    let zip = req.body.zip;
    let sorting = {};
    if (req.body.sort === "asc") {
      sorting = await { companyName: -1 };
    } else if (req.body.sort === "desc") {
      sorting = await { companyName: 1 };
    } else if (req.body.sort === "created") {
      sorting = await { createdAt: -1 };
    } else if (req.body.sort === "rated") {
      sorting = await { averageReview: 1 };
    } else {
      sorting = await { id: -1 };
    }

    if (filter) {
      if (zip && filter) {
        company = await User.find({
          isEmailVerified: true,
          zipCode: zip,
          filters: { $in: filter },
        })
          .where("serviceCategory")
          .equals("General Siding")
          .populate({
            path: "reviews",
            options: { sort: { _id: -1 } },
          })
          .sort(sorting)
          .exec();
      } else {
        company = await User.find({
          isEmailVerified: true,
          filters: { $in: filter },
        })
          .where("serviceCategory")
          .equals("General Siding")
          .populate({
            path: "reviews",
            options: { sort: { _id: -1 } },
          })
          .sort(sorting)
          .exec();
      }
    } else if (zip) {
      company = await User.find({ isEmailVerified: true, zipCode: zip })
        .where("serviceCategory")
        .equals("General Siding")
        .populate({
          path: "reviews",
          options: { sort: { _id: -1 } },
        })
        .sort(sorting)
        .exec();
    } else {
      company = await User.find({ isEmailVerified: true })
        .where("serviceCategory")
        .equals("General Siding")
        .populate({
          path: "reviews",
          options: { sort: { _id: -1 } },
        })
        .sort(sorting)
        .exec();
    }
    let review = await Review.find()
      .where("owner.id")
      .equals(company._id)
      .exec();
    if (req.xhr) {
      res.json(company);
    } else {
      res.render("show-pages/general-siding", {
        title: "Company Profile",
        user,
        company,
        review,
        total,
        conversations,
      });
    }
  },

  async exteriorPainting(req, res, next) {
    let user = await User.findById(req.user);

    let conversations = [];
    if (req.user) {
      user = await User.findById(req.user.id);
      //getting the conversation of the sender
      let existingConv = await Conversation.find({
        participants: { $in: user._id },
      });

      if (existingConv) {
        //getting the msgs against the current sender and receiver
        for (let i = 0; i < existingConv.length; i++) {
          let tempChat = await Chat.find({
            conversationID: existingConv[i]._id,
          })
            .sort({
              _id: 1,
            })
            .populate("conversationID")
            .populate("messages.sender.id")
            .populate("messages.receiver.id");

          conversations.push(tempChat);
        }

        function bubbleSort(arr) {
          for (let i = 0; i < arr.length - 1; i++) {
            if (
              arr[i][arr[i].length - 1]?.createdAt &&
              arr[i + 1][arr[i + 1].length - 1]?.createdAt
            ) {
              let date1 = moment(arr[i][arr[i].length - 1].createdAt);
              let date2 = moment(arr[i + 1][arr[i + 1].length - 1].createdAt);
              for (let j = 0; j < arr.length - i - 1; j++)
                if (date1.isBefore(date2)) {
                  let tmp = arr[j];
                  arr[j] = arr[j + 1];
                  arr[j + 1] = tmp;
                }
            }
          }

          return arr;
        }

        if (conversations.length) {
          conversations = conversations.filter((array) => array.length !== 0);

          conversations = bubbleSort(conversations);
        }
      }
    }

    let total = await User.find({ isEmailVerified: true })
      .where("isCompany")
      .equals(true)
      .exec();
    let company;
    let filter = req.body.filter;
    let zip = req.body.zip;
    let sorting = {};
    if (req.body.sort === "asc") {
      sorting = await { companyName: -1 };
    } else if (req.body.sort === "desc") {
      sorting = await { companyName: 1 };
    } else if (req.body.sort === "created") {
      sorting = await { createdAt: -1 };
    } else if (req.body.sort === "rated") {
      sorting = await { averageReview: 1 };
    } else {
      sorting = await { id: -1 };
    }

    if (filter) {
      if (zip && filter) {
        company = await User.find({
          isEmailVerified: true,
          zipCode: zip,
          filters: { $in: filter },
        })
          .where("serviceCategory")
          .equals("Exterior Painting")
          .populate({
            path: "reviews",
            options: { sort: { _id: -1 } },
          })
          .sort(sorting)
          .exec();
      } else {
        company = await User.find({
          isEmailVerified: true,
          filters: { $in: filter },
        })
          .where("serviceCategory")
          .equals("Exterior Painting")
          .populate({
            path: "reviews",
            options: { sort: { _id: -1 } },
          })
          .sort(sorting)
          .exec();
      }
    } else if (zip) {
      company = await User.find({ isEmailVerified: true, zipCode: zip })
        .where("serviceCategory")
        .equals("Exterior Painting")
        .populate({
          path: "reviews",
          options: { sort: { _id: -1 } },
        })
        .sort(sorting)
        .exec();
    } else {
      company = await User.find({ isEmailVerified: true })
        .where("serviceCategory")
        .equals("Exterior Painting")
        .populate({
          path: "reviews",
          options: { sort: { _id: -1 } },
        })
        .sort(sorting)
        .exec();
    }
    let review = await Review.find()
      .where("owner.id")
      .equals(company._id)
      .exec();
    if (req.xhr) {
      res.json(company);
    } else {
      res.render("show-pages/exterior-painting", {
        title: "Company Profile",
        user,
        company,
        review,
        total,
        conversations,
      });
    }
  },

  async poolsSpas(req, res, next) {
    let user = await User.findById(req.user);

    let conversations = [];
    if (req.user) {
      user = await User.findById(req.user.id);
      //getting the conversation of the sender
      let existingConv = await Conversation.find({
        participants: { $in: user._id },
      });

      if (existingConv) {
        //getting the msgs against the current sender and receiver
        for (let i = 0; i < existingConv.length; i++) {
          let tempChat = await Chat.find({
            conversationID: existingConv[i]._id,
          })
            .sort({
              _id: 1,
            })
            .populate("conversationID")
            .populate("messages.sender.id")
            .populate("messages.receiver.id");

          conversations.push(tempChat);
        }

        function bubbleSort(arr) {
          for (let i = 0; i < arr.length - 1; i++) {
            if (
              arr[i][arr[i].length - 1]?.createdAt &&
              arr[i + 1][arr[i + 1].length - 1]?.createdAt
            ) {
              let date1 = moment(arr[i][arr[i].length - 1].createdAt);
              let date2 = moment(arr[i + 1][arr[i + 1].length - 1].createdAt);
              for (let j = 0; j < arr.length - i - 1; j++)
                if (date1.isBefore(date2)) {
                  let tmp = arr[j];
                  arr[j] = arr[j + 1];
                  arr[j + 1] = tmp;
                }
            }
          }

          return arr;
        }

        if (conversations.length) {
          conversations = conversations.filter((array) => array.length !== 0);

          conversations = bubbleSort(conversations);
        }
      }
    }

    let total = await User.find({ isEmailVerified: true })
      .where("isCompany")
      .equals(true)
      .exec();
    let company;
    let filter = req.body.filter;
    let zip = req.body.zip;
    let sorting = {};
    if (req.body.sort === "asc") {
      sorting = await { companyName: -1 };
    } else if (req.body.sort === "desc") {
      sorting = await { companyName: 1 };
    } else if (req.body.sort === "created") {
      sorting = await { createdAt: -1 };
    } else if (req.body.sort === "rated") {
      sorting = await { averageReview: 1 };
    } else {
      sorting = await { id: -1 };
    }

    if (filter) {
      if (zip && filter) {
        company = await User.find({
          isEmailVerified: true,
          zipCode: zip,
          filters: { $in: filter },
        })
          .where("serviceCategory")
          .equals("Pools, Spas and Hot Tubs")
          .populate({
            path: "reviews",
            options: { sort: { _id: -1 } },
          })
          .sort(sorting)
          .exec();
      } else {
        company = await User.find({
          isEmailVerified: true,
          filters: { $in: filter },
        })
          .where("serviceCategory")
          .equals("Pools, Spas and Hot Tubs")
          .populate({
            path: "reviews",
            options: { sort: { _id: -1 } },
          })
          .sort(sorting)
          .exec();
      }
    } else if (zip) {
      company = await User.find({ isEmailVerified: true, zipCode: zip })
        .where("serviceCategory")
        .equals("Pools, Spas and Hot Tubs")
        .populate({
          path: "reviews",
          options: { sort: { _id: -1 } },
        })
        .sort(sorting)
        .exec();
    } else {
      company = await User.find({ isEmailVerified: true })
        .where("serviceCategory")
        .equals("Pools, Spas and Hot Tubs")
        .populate({
          path: "reviews",
          options: { sort: { _id: -1 } },
        })
        .sort(sorting)
        .exec();
    }
    let review = await Review.find()
      .where("owner.id")
      .equals(company._id)
      .exec();
    if (req.xhr) {
      res.json(company);
    } else {
      res.render("show-pages/pools-hot-tubes-spas", {
        title: "Company Profile",
        user,
        company,
        review,
        total,
        conversations,
      });
    }
  },

  async masonryServices(req, res, next) {
    let user = await User.findById(req.user);

    let conversations = [];
    if (req.user) {
      user = await User.findById(req.user.id);
      //getting the conversation of the sender
      let existingConv = await Conversation.find({
        participants: { $in: user._id },
      });

      if (existingConv) {
        //getting the msgs against the current sender and receiver
        for (let i = 0; i < existingConv.length; i++) {
          let tempChat = await Chat.find({
            conversationID: existingConv[i]._id,
          })
            .sort({
              _id: 1,
            })
            .populate("conversationID")
            .populate("messages.sender.id")
            .populate("messages.receiver.id");

          conversations.push(tempChat);
        }

        function bubbleSort(arr) {
          for (let i = 0; i < arr.length - 1; i++) {
            if (
              arr[i][arr[i].length - 1]?.createdAt &&
              arr[i + 1][arr[i + 1].length - 1]?.createdAt
            ) {
              let date1 = moment(arr[i][arr[i].length - 1].createdAt);
              let date2 = moment(arr[i + 1][arr[i + 1].length - 1].createdAt);
              for (let j = 0; j < arr.length - i - 1; j++)
                if (date1.isBefore(date2)) {
                  let tmp = arr[j];
                  arr[j] = arr[j + 1];
                  arr[j + 1] = tmp;
                }
            }
          }

          return arr;
        }

        if (conversations.length) {
          conversations = conversations.filter((array) => array.length !== 0);

          conversations = bubbleSort(conversations);
        }
      }
    }

    let total = await User.find({ isEmailVerified: true })
      .where("isCompany")
      .equals(true)
      .exec();
    let company;
    let filter = req.body.filter;
    let zip = req.body.zip;
    let sorting = {};
    if (req.body.sort === "asc") {
      sorting = await { companyName: -1 };
    } else if (req.body.sort === "desc") {
      sorting = await { companyName: 1 };
    } else if (req.body.sort === "created") {
      sorting = await { createdAt: -1 };
    } else if (req.body.sort === "rated") {
      sorting = await { averageReview: 1 };
    } else {
      sorting = await { id: -1 };
    }

    if (filter) {
      if (zip && filter) {
        company = await User.find({
          isEmailVerified: true,
          zipCode: zip,
          filters: { $in: filter },
        })
          .where("serviceCategory")
          .equals("Masonry services")
          .populate({
            path: "reviews",
            options: { sort: { _id: -1 } },
          })
          .sort(sorting)
          .exec();
      } else {
        company = await User.find({
          isEmailVerified: true,
          filters: { $in: filter },
        })
          .where("serviceCategory")
          .equals("Masonry services")
          .populate({
            path: "reviews",
            options: { sort: { _id: -1 } },
          })
          .sort(sorting)
          .exec();
      }
    } else if (zip) {
      company = await User.find({ isEmailVerified: true, zipCode: zip })
        .where("serviceCategory")
        .equals("Masonry services")
        .populate({
          path: "reviews",
          options: { sort: { _id: -1 } },
        })
        .sort(sorting)
        .exec();
    } else {
      company = await User.find({ isEmailVerified: true })
        .where("serviceCategory")
        .equals("Masonry services")
        .populate({
          path: "reviews",
          options: { sort: { _id: -1 } },
        })
        .sort(sorting)
        .exec();
    }
    let review = await Review.find()
      .where("owner.id")
      .equals(company._id)
      .exec();
    if (req.xhr) {
      res.json(company);
    } else {
      res.render("show-pages/masonry-services", {
        title: "Company Profile",
        user,
        company,
        review,
        conversations,
        total,
      });
    }
  },

  async generalRemodeling(req, res, next) {
    let user = await User.findById(req.user);

    let conversations = [];
    if (req.user) {
      user = await User.findById(req.user.id);
      //getting the conversation of the sender
      let existingConv = await Conversation.find({
        participants: { $in: user._id },
      });

      if (existingConv) {
        //getting the msgs against the current sender and receiver
        for (let i = 0; i < existingConv.length; i++) {
          let tempChat = await Chat.find({
            conversationID: existingConv[i]._id,
          })
            .sort({
              _id: 1,
            })
            .populate("conversationID")
            .populate("messages.sender.id")
            .populate("messages.receiver.id");

          conversations.push(tempChat);
        }

        function bubbleSort(arr) {
          for (let i = 0; i < arr.length - 1; i++) {
            if (
              arr[i][arr[i].length - 1]?.createdAt &&
              arr[i + 1][arr[i + 1].length - 1]?.createdAt
            ) {
              let date1 = moment(arr[i][arr[i].length - 1].createdAt);
              let date2 = moment(arr[i + 1][arr[i + 1].length - 1].createdAt);
              for (let j = 0; j < arr.length - i - 1; j++)
                if (date1.isBefore(date2)) {
                  let tmp = arr[j];
                  arr[j] = arr[j + 1];
                  arr[j + 1] = tmp;
                }
            }
          }

          return arr;
        }

        if (conversations.length) {
          conversations = conversations.filter((array) => array.length !== 0);

          conversations = bubbleSort(conversations);
        }
      }
    }

    let total = await User.find({ isEmailVerified: true })
      .where("isCompany")
      .equals(true)
      .exec();
    let company;
    let filter = req.body.filter;
    let zip = req.body.zip;
    let sorting = {};
    if (req.body.sort === "asc") {
      sorting = await { companyName: -1 };
    } else if (req.body.sort === "desc") {
      sorting = await { companyName: 1 };
    } else if (req.body.sort === "created") {
      sorting = await { createdAt: -1 };
    } else if (req.body.sort === "rated") {
      sorting = await { averageReview: 1 };
    } else {
      sorting = await { id: -1 };
    }

    if (filter) {
      if (zip && filter) {
        company = await User.find({
          isEmailVerified: true,
          zipCode: zip,
          filters: { $in: filter },
        })
          .where("serviceCategory")
          .equals("")
          .populate({
            path: "reviews",
            options: { sort: { _id: -1 } },
          })
          .sort(sorting)
          .exec();
      } else {
        company = await User.find({
          isEmailVerified: true,
          filters: { $in: filter },
        })
          .where("serviceCategory")
          .equals("")
          .populate({
            path: "reviews",
            options: { sort: { _id: -1 } },
          })
          .sort(sorting)
          .exec();
      }
    } else if (zip) {
      company = await User.find({ isEmailVerified: true, zipCode: zip })
        .where("serviceCategory")
        .equals("")
        .populate({
          path: "reviews",
          options: { sort: { _id: -1 } },
        })
        .sort(sorting)
        .exec();
    } else {
      company = await User.find({ isEmailVerified: true })
        .where("serviceCategory")
        .equals("")
        .populate({
          path: "reviews",
          options: { sort: { _id: -1 } },
        })
        .sort(sorting)
        .exec();
    }
    let review = await Review.find()
      .where("owner.id")
      .equals(company._id)
      .exec();
    if (req.xhr) {
      res.json(company);
    } else {
      res.render("show-pages/general-remodeling", {
        title: "Company Profile",
        user,
        company,
        review,
        total,
        conversations,
      });
    }
  },

  // GET /forgot-password
  getForgotPw(req, res, next) {
    res.render("visitors/forgot");
  },

  //PUT /forgot-password
  async putForgotPw(req, res, next) {
    const token = await crypto.randomBytes(20).toString("hex");

    const user = await User.findOne({ email: req.body.email });
    if (!user) {
      req.session.error = "No account with that email address exists.";
      return res.redirect("/forgot-password");
    }

    user.resetPasswordToken = token;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

    await user.save();

    const msg = {
      to: user.email,
      from: "Gabazzo <no-reply@gabazzo.com>",
      subject: "Gabazzo - Reset Password",
      template_id: "d-fd4d780ab09c499394b45011331587be",
      dynamic_template_data: {
        username: user.username,
        verify_link: `http://${req.headers.host}/reset/${token}`,
      },
    };

    await sgMail.send(msg);

    req.session.success = `An e-mail has been sent to ${user.email} with further instructions. Check in your spam folder also`;
    res.redirect("/forgot-password");
  },

  //GET /reset
  async getReset(req, res, next) {
    const { token } = req.params;
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });
    if (!user) {
      req.session.error = "Password reset token is invalid or has expired.";
      return res.redirect("/forgot-password");
    }
    res.render("visitors/reset", { token });
  },

  // PUT /reset
  async putReset(req, res, next) {
    const { token } = req.params;
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      req.session.error = "Password reset token is invalid or has expired.";
      return res.redirect(`/reset/${token}`);
    }

    if (req.body.password === req.body.confirm) {
      await user.setPassword(req.body.password);
      user.resetPasswordToken = null;
      user.resetPasswordExpires = null;
      await user.save();
      const login = util.promisify(req.login.bind(req));
      await login(user);
    } else {
      req.session.error = "Passwords do not match.";
      return res.redirect(`/reset/${token}`);
    }

    const msg = {
      to: user.email,
      from: "Gabazzo <no-reply@gabazzo.com>",
      subject: "Gabazzo - Password Alert",
      template_id: "d-21b6b7e5870741898d971104de8decb5",
      dynamic_template_data: {
        username: user.username,
      },
    };

    await sgMail.send(msg).catch((err) => console.error(err));

    if (!user.isCompany) {
      res.redirect("/");
    } else {
      res.redirect("/company-dashboard");
    }
  },

  async likes(req, res, next) {
    let company = await User.findById(req.params.id);
    let user = req.user;
    if (!user.likes.includes(company._id)) {
      await user.likes.push(company);
      // await company.liked++;
      await User.findOneAndUpdate(
        { _id: req.params.id },
        { $inc: { liked: 1 } },
        { new: true }
      ).exec();
    } else {
      colsole.log("ALREADY LIKED");
    }
    // save the updated user into the db
    await user.save();
    const login = util.promisify(req.login.bind(req));
    await login(user);
    // console.log("LIKED!!!");
    req.session.success = "Profile successfully updated!";
    // redirect to show page
    res.redirect("back");
  },

  async unlike(req, res, next) {
    let company = await User.findById(req.params.id);
    let user = req.user;

    const index = user.likes.indexOf(company);
    await user.likes.splice(index, 1);
    await User.findOneAndUpdate(
      { _id: req.params.id },
      { $inc: { liked: -1 } },
      { new: true }
    ).exec();
    // save the updated user into the db
    await user.save();
    const login = util.promisify(req.login.bind(req));
    await login(user);
    console.log("UNLIKED!!!");
    req.session.success = "Profile successfully updated!";
    // redirect to show page
    res.redirect("back");
  },

  // ROUTE for creating list
  async createList(req, res, next) {
    // find the user
    const user = req.user;
    const owner = {
      id: req.user._id,
      username: req.user.username,
    };

    const newList = new List({
      title: req.body.title,
      owner: owner,
    });

    // save the updated journey into the db
    let list = await List.create(newList);

    const login = util.promisify(req.login.bind(req));
    await login(user);
    req.session.success = "List Created!";
    // console.log("List Created");
    // redirect to show page
    res.redirect("back");
  },

  //Route for deleting List
  async deleteList(req, res, next) {
    let list = await List.findById(req.params.id);
    await list.remove();
    req.session.error = "List Deleted!";
    res.redirect("/saved-list");
  },

  async saveToList(req, res, next) {
    let company = await User.findById(req.params.companyId);
    let user = req.user;
    let lists = await List.find();
    let whichList = await List.findById(req.params.listId);

    if (!whichList.companies.includes(company._id)) {
      await whichList.companies.push(company);
      whichList.save();
      // console.log("saved");
    } else {
      console.log("ALREADY SAVED");
    }
    // save the updated user into the db
    await user.save();
    const login = util.promisify(req.login.bind(req));
    await login(user);
    console.log("SAVED!!!");
    req.session.success = "Profile successfully updated!";
    // redirect to show page
    res.redirect("back");
  },

  async defaultList(req, res, next) {
    let company = await User.findById(req.params.companyId);
    let user = req.user;
    //check if it is saved to the default list
    console.log(req.params);

    //else save to the selected list by id
    if (!user.list.includes(company._id)) {
      await user.list.push(company);
    } else {
      colsole.log("ALREADY SAVED");
    }
    // save the updated user into the db
    await user.save();
    const login = util.promisify(req.login.bind(req));
    await login(user);
    console.log("SAVED!!!");
    req.session.success = "Profile successfully updated!";
    // redirect to show page
    res.redirect("back");
  },

  async removeFromList(req, res, next) {
    // search through all the lists owned by the user and delete the company
    let company = await User.findById(req.params.id);
    let user = req.user;
    const index = user.list.indexOf(company);
    await user.list.splice(index, 1);
    // save the updated user into the db
    await user.save();
    const login = util.promisify(req.login.bind(req));
    await login(user);
    console.log("REMOVED!!!");
    req.session.success = "Profile successfully updated!";
    // redirect to show page
    res.redirect("/saved-list");
  },

  async removeCompanyFromList(req, res, next) {
    let list = await List.findById(req.params.listId);
    await List.update(
      { _id: req.params.listId },
      { $pull: { companies: req.params.companyId } },
      { safe: true, multi: true }
    );
    console.log("REMOVED!!!");
    req.session.success = "List successfully updated!";
    // redirect to show page
    res.redirect("/saved-list");
  },

  // De-Activate Account Button and Email Template

  async deactivateAccount(req, res, next) {
    const user = req.user;
    if (user.email) {
      if (user.isActive) user.isActive = false;
      await user.save();

      const token = await crypto.randomBytes(20).toString("hex");
      user.activateToken = token;
      user.activateExpires = Date.now() + 86400000000000;

      await user.save();

      console.log("Account Deactivated");

      const msg = {
        to: user.email,
        from: "GABAZZO <no-reply@gabazzo.com>",
        subject: "GABAZZO - Account Deactivation",
        template_id: "d-8d8df1e103a94456bb548c4cb31ada4f",
        dynamic_template_data: {
          username: user.username,
          deactivate_link:
            `http://${req.headers.host}/activate/${token}`.replace(/				/g, ""),
        },
      };

      await sgMail.send(msg);

      req.session.success = `An e-mail has been sent to ${user.email}.`;

      console.log("Account Deactivated");
      req.session.success = "Account Deactivated";
      // redirect to show page
      res.redirect("/logout");
    } else {
      req.session.error = `Please Insrt email and make a username to fully deactivate account, you will also use the same email to re-activate your account in the future`;
      res.redirect("back");
    }
  },

  // Re-Activate Account Button and Email Template

  async activateAccount(req, res, next) {
    const { token } = req.params;
    const user = await User.findOne({
      activateToken: token,
      activateExpires: { $gt: Date.now() },
    });

    if (!user) {
      req.session.error = "Activation token is invalid or has expired.";
      return res.redirect(`/activate/${token}`);
    }

    user.isActive = true;
    user.activateToken = null;
    user.activateExpires = null;
    await user.save();

    const msg = {
      to: user.email,
      from: "GABAZZO <no-reply@gabazzo.com>",
      subject: "GABAZZO - Account Re-activated",
      template_id: "d-8d25387581884bd684af9cebf44d4ac7",
      dynamic_template_data: {
        username: user.username,
        reactivate_link: `http://${req.headers.host}/login}`.replace(/		  	/g, ""),
      },
    };

    await sgMail.send(msg);
    res.redirect("/login");
  },

  //GET saved to list
  async getSavedListItems(req, res, next) {
    let user = await User.findById(req.user).populate("users"),
      lastMessage;
    let ids = [];

    if (user) {
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

    await user.list.forEach(function (comp) {
      ids.push(comp);
    });
    let company = await User.find().where("_id").in(ids).exec();
    res.render("businesses/saved-list-items", {
      title: "Saved List",
      user,
      company,
      lastMessage,
    });
  },

  //GET saved to list
  async getOtherListItems(req, res, next) {
    let user = await User.findById(req.user).populate("users"),
      lastMessage;
    let list = await List.findById(req.params.id);
    let ids = [];

    let conversations = [];

    if (user) {
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

    await list.companies.forEach(function (comp) {
      ids.push(comp);
    });
    let company = await User.find().where("_id").in(ids).exec();
    res.render("businesses/other-list-items", {
      title: "Saved List",
      user,
      company,
      list,
      lastMessage,
    });
  },

  //GET saved to list
  async getSavedList(req, res, next) {
    let user = await User.findById(req.user).populate("users");
    let lists = await List.find().where("owner.id").equals(user._id).exec();
    let ids = [];
    let lastMessage;

    if (user) {
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

    await user.list.forEach(function (comp) {
      ids.push(comp);
    });
    let company = await User.find().where("_id").in(ids).exec();
    res.render("businesses/saved-list", {
      title: "Saved List",
      user,
      company,
      lists,
      lastMessage,
    });
  },

  //PUT Security Question
  async putSecurityQuestion(req, res, next) {
    let user = req.user;
    const { question, answer } = req.body;

    if (question) user.securityQuestion.question = req.body.question;
    if (answer) user.securityQuestion.answer = req.body.answer;

    const msg = {
      to: user.email,
      from: "Gabazzo <no-reply@gabazzo.com>",
      subject: "GABAZZO Security Alert",
      template_id: "d-6c3991d7152848499684fa7f31cd0957",
      dynamic_template_data: {
        username: user.username,
      },
    };

    await sgMail.send(msg).catch((err) => console.error(err));

    await user.save();
    req.session.success = "Security question successfully Updated!";
    // redirect to show page
    res.redirect("back");
  },

  //PUT Billing
  async putBilling(req, res, next) {
    let user = req.user;
    const { companyName, fullName, country, address, city, zipCode } = req.body;

    if (companyName) user.billing.billTo.companyName = req.body.companyName;
    if (fullName) user.billing.billTo.name = req.body.fullName;
    if (country) user.billing.billTo.country = req.body.country;
    if (address) user.billing.billTo.location = req.body.address;
    if (city) user.billing.billTo.city = req.body.city;
    if (zipCode) user.billing.billTo.zipCode = req.body.zipCode;

    await user.save();
    req.session.success = "Billing Info successfully Updated!";
    // redirect to show page
    res.redirect("back");
  },

  //GET Inbox / Messages
  async getInbox(req, res, next) {
    let sender = req.user,
      lastMessage,
      services = [];

    // params.id is the id of the receiever
    let receiver = await User.findById(req.params.id);
    let review = await Review.find()
      .where("owner.id")
      .equals(receiver._id)
      .exec();

    if (sender.isCompany)
      services = await Service.find({
        "owner.id": { $eq: sender._id },
      });

    let senderID = sender._id;
    let receiverID = receiver._id;

    console.log("get messagess ID ", senderID, receiverID);

    let labels = await Label.find()
      .where("owner.id")
      .equals(req.user._id)
      .exec();

    console.log(labels.length);

    //getting the conversation of the sender
    let existingConv = await Conversation.find({
      participants: { $in: senderID },
    }).sort({ lastMsgTime: -1 });

    let otherUser,
      timeAgo = [],
      tempMessages = [];
    let conversations = [],
      messages = [];

    if (existingConv) {
      //getting the msgs against the current sender and receiver
      for (let i = 0; i < existingConv.length; i++) {
        let tempChat = await Chat.find({
          conversationID: existingConv[i]._id,
        })
          .sort({
            _id: 1,
          })
          .populate("conversationID")
          .populate("messages.sender.id")
          .populate("messages.receiver.id")
          .populate({
            path: "offerID",
            populate: {
              path: "service",
            },
          });

        conversations.push(tempChat);

        //Getting the msgs of the current receiever
        for (let i = 0; i < tempChat.length; i++) {
          if (
            (tempChat[i].conversationID.participants[0].toString() ===
              receiverID.toString() &&
              tempChat[i].conversationID.participants[1].toString() ===
                senderID.toString()) ||
            (tempChat[i].conversationID.participants[0].toString() ===
              senderID.toString() &&
              tempChat[i].conversationID.participants[1].toString() ===
                receiverID.toString())
          ) {
            messages = tempChat;
            break;
          }
        }
      }

      tempMessages = [...messages];

      for (let i = 0; i < tempMessages.length; i++) {
        tempMessages[i].timeAgo = moment(tempMessages[i].createdAt).format(
          "MMMM Do h:mm A"
        );
      }

      messages = [...tempMessages];

      if (conversations.length) {
        for (let i = 0; i < conversations.length; i++) {
          timeAgo.push(
            moment(
              conversations[i][conversations[i].length - 1].createdAt
            ).fromNow()
          );
        }
      }
    }

    let time = moment.utc(new Date(), "HH:mm").tz("America/Chicago");

    usaTime = time.format("HH:mm");

    //Useless conventions, ignore it
    otherUser = receiver;
    let user = sender;
    let chat = conversations;

    if (existingConv) {
      //getting the msgs against the current sender and receiver
      lastMessage = await Chat.find({
        conversationID: existingConv[0]?._id,
      });
      lastMessage = lastMessage[0];
    }

    function calculateAverage() {
      if (review.length === 0) {
        return 0;
      }
      var sum = 0;
      review.forEach(function (element) {
        sum += element.rating;
      });
      return sum / review.length;
    }

    // Calculating reviews
    let averageRating = calculateAverage(review).toFixed(1);
    let isBillingAvailable = false;

    if (typeof receiver.billing.deliverTo[0] !== "undefined") {
      isBillingAvailable = true;
      console.log("is billing true");
    }

    res.render("businesses/inbox", {
      title: "Inbox",
      receiverID,
      averageRating,
      user,
      lastMessage,
      sender,
      chat,
      review,
      usaTime,
      otherUser,
      messages,
      services,
      timeAgo,
      labels,
      isBillingAvailable,
    });
  },

  async postMessage(req, res, next) {
    let user = req.user;
    let { message } = req.body;
    let receiver = await User.findById(req.params.id);
    let receiverID = req.params.id;

    try {
      if (user) {
        let existingConv = await Conversation.find({
          $or: [
            { participants: { $eq: [user.id, receiverID] } },
            { participants: { $eq: [receiverID, user.id] } },
          ],
        });

        existingConv = { ...existingConv[0]?._doc };

        //No conversation instance found
        if (
          Object.keys(existingConv).length === 0 &&
          existingConv.constructor === Object
        ) {
          let conv = new Conversation({
            participants: [user.id, receiverID],
            lastMsgTime: new Date(),
          });

          existingConv = await Conversation.create(conv);
        } else {
          existingConv.lastMsgTime = new Date();
          await Conversation.findOneAndUpdate(
            { _id: existingConv._id },
            {
              $set: existingConv,
            }
          );
        }

        let attachments = [];
        //Fetching the attached files if there are any
        if (req.files) {
          for (const file of req.files) {
            let attachment = await cloudinary.v2.uploader.upload(file.path, {
              folder: "messageAttachments",
            });

            attachments.push({
              type: attachment.format,
              url: attachment.secure_url,
            });
          }
        }

        //After successfully making a conversationID, insert message in Chat.
        const Msg = new Chat({
          conversationID: existingConv._id,
          messages: {
            attachments: attachments,
            text: message,
            sender: {
              id: user._id,
              username: user.username,
            },
            receiver: {
              id: receiver._id,
              username: receiver.username,
            },
          },
          isSeen: false,
        });

        await Chat.create(Msg);
      } else {
        req.session.error = "Please login to send the message.";
        return res.redirect("/");
      }
      req.session.success = "Message has been successfully sent.";
      return res.redirect("back");
    } catch (err) {
      console.log(err);
      req.session.error = err;
      return res.redirect("back");
    }
  },

  async getCreateServices(req, res, next) {
    let user = req.user;
    let lastMessage;

    if (user) {
      //getting the conversation of the sender
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

    res.render("businesses/create-service", {
      title: "Create a Service Port",
      user,
      lastMessage,
    });
  },

  async postServicePortFormOne(req, res, next) {
    req.body.images = [];

    const owner = {
      id: req.user._id,
      username: req.user.username,
    };

    for (const file of req.files) {
      let image = await cloudinary.v2.uploader.upload(file.path);
      req.body.images.push({
        url: image.secure_url,
        public_id: image.public_id,
      });
    }

    const ServicePort = new Service({
      title: req.body.title,
      owner: owner,
      category: req.body.category,
      serviceType: req.body.serviceType,
      description: req.body.description,
      time: req.body.time,
      budget: "",
      teamMembers: "",
      products: "",
      images: req.body.images,
      priceTo: req.body.priceTo,
      priceFrom: req.body.priceFrom,
      priceInfo: req.body.priceInfo,
      teamInfo: "",
      tags: "",
    });

    //Save the Service Port in the DB
    let Port = await Service.create(ServicePort);

    res.redirect(`/filterconfiguration/${Port._id}`);
  },

  async getServicePortSecondForm(req, res, next) {
    let portID = req.params.id,
      filters,
      lastMessage;

    let servicePort = await Service.findById(portID);
    let category = servicePort.category.toLowerCase();

    let user = req.user;

    // Condition to check that the port belongs to the logged in user
    if (servicePort.owner.username === user.username) {
      filters = await AvailableService.findOne({ title: category });
      if (user) {
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
    } else {
      res.redirect("/company-dashboard");
    }

    res.render("businesses/filters-configuration", {
      title: "Configure Filter",
      filters,
      servicePort,
      user,
      lastMessage,
    });
  },

  async postServicePortSecondForm(req, res, next) {
    // Only these keys are allowed in the body
    const possibleSet = [
      "Material Type",
      "Service Type",
      "Property Type",
      "Other Filters",
      "Pest Type",
      "Appliance Type",
      "Lock Type",
      "Junk Type",
      "Haul Size",
      "Type of Moving Truck",
      "Truck Tow Type",
      "Vehicle Type",
    ];

    // Validating the body
    let flag = false;
    for (const key in req.body) {
      if (!possibleSet.includes(key)) {
        flag = true;
        break;
      }
    }

    if (!flag) {
      let portID = req.params.id;
      await Service.findByIdAndUpdate(portID, { $set: { filter: req.body } });
    }

    res.redirect("/company-dashboard");
  },

  async getSearchPage(req, res, next) {
    let filters,
      availableServices,
      skip = 0,
      limit = 30,
      totalCount = 0,
      lastMessage;
    const { query } = req;

    let { category, pageNo, reviewFilter, location } = query;

    pageNo = parseInt(pageNo);

    console.log("QUERY", req.query);

    if (category) {
      filters = await AvailableService.findOne({
        title: category.toLowerCase(),
      });
      availableServices = JSON.parse(JSON.stringify(filters));
      mobileFilters = JSON.parse(JSON.stringify(filters));

      // Generating the query according to the document structure
      searchParams = filterHandler.makeSearchParams(query);

      console.log("location ", location);
      console.log("GENERATED QUERY service port", searchParams);

      if (pageNo) {
        console.log("page no is available");
        skip = pageNo === 1 ? 0 : (pageNo - 1) * limit;
      }

      if (!pageNo) {
        console.log("page no is not available");
        query.pageNo = 1;
      }

      const portAggregateQuery = [
        {
          $lookup: {
            from: "users",
            localField: "owner.id",
            foreignField: "_id",
            as: "companyInfo",
          },
        },
        {
          $unwind: {
            path: "$companyInfo",
          },
        },
        {
          $match: {
            ...searchParams,
          },
        },
        {
          $skip: skip,
        },
        {
          $limit: limit,
        },
      ];
      const pagingAggregateQuery = [...portAggregateQuery];
      // Removing the skip & limit
      pagingAggregateQuery.splice(3, 2);
      // Strucuting the query to get total Count
      pagingAggregateQuery.push({
        $count: "totalCount",
      });

      let results = await Promise.all([
        Service.aggregate(portAggregateQuery),
        Service.aggregate(pagingAggregateQuery),
      ]);

      if (results) totalCount = results[1][0]?.totalCount;

      let servicePorts = results[0];
      const totalPorts = totalCount;

      // Filtering the results for reviews - Review filter and location
      if (reviewFilter) {
        servicePorts = servicePorts.filter(
          (port) => port.companyInfo.averageReview >= reviewFilter
        );
      }

      if (typeof location !== "undefined") {
        servicePorts = servicePorts.filter((port) => {
          if (port.companyInfo?.city.toLowerCase() == location.toLowerCase()) {
            return true;
          } else if (
            port.companyInfo?.state.toLowerCase() == location.toLowerCase()
          ) {
            return true;
          } else if (
            port.companyInfo?.zipCode?.toLowerCase() == location.toLowerCase()
          ) {
            return true;
          }
        });
      }

      console.log("TOTAL", totalPorts);

      // TIME CALCULATIONS FOR OPENING/CLOSING BUSINESS
      moment.tz.setDefault("America/Chicago");
      let time = moment().format("HH:mm");
      let day = moment
        .utc(new Date(), "HH:mm")
        .tz("America/Chicago")
        .format("dddd");

      const isTimeBetween = function (startTime, endTime, serverTime) {
        let start = moment(startTime, "H:mm");
        let end = moment(endTime, "H:mm");
        let server = moment(serverTime, "H:mm");
        if (end < start) {
          return (
            (server >= start && server <= moment("23:59:59", "h:mm:ss")) ||
            (server >= moment("0:00:00", "h:mm:ss") && server < end)
          );
        }
        return server >= start && server < end;
      };

      for (let i = 0; i < servicePorts.length; i++) {
        let startTime = day.charAt(0).toLowerCase() + day.slice(1) + "From";
        startTime = servicePorts[i].companyInfo[startTime];
        let endTime = day.charAt(0).toLowerCase() + day.slice(1) + "To";
        endTime = servicePorts[i].companyInfo[endTime];

        if (startTime && endTime) {
          if (isTimeBetween(startTime, endTime, time))
            servicePorts[i].companyInfo.companyStatus = true;
          else servicePorts[i].companyInfo.companyStatus = false;
        } else {
          servicePorts[i].companyInfo.companyStatus = false;
        }
      }

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

      res.render("show-pages/search-page", {
        title: "Configure Filter",
        filters,
        availableServices,
        servicePorts,
        query,
        totalPorts,
        limit,
        mobileFilters,
        lastMessage,
      });
    }
  },

  async getFilterUpdate(req, res, next) {
    let portID = req.params.id,
      filters,
      lastMessage;

    let servicePort = await Service.findById(portID);
    let category = servicePort.category.toLowerCase();

    let user = req.user;

    // Condition to check that the port belongs to the logged in user
    if (servicePort.owner.username === user.username) {
      filters = await AvailableService.findOne({ title: category });
      if (user) {
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
    } else {
      res.redirect("/company-dashboard");
    }

    console.log(servicePort.filter);

    // Adding filter object for those services that don't contain the filter object.
    if (typeof servicePort.filter === "undefined") {
      servicePort.filter = {};
    }

    res.render("businesses/filters-update", {
      title: "Configure Filter",
      filters,
      servicePort,
      user,
      lastMessage,
    });
  },

  async postSearchPage(req, res, next) {
    console.log(req.body);

    let query = req.query,
      filters,
      availableServices;

    if (req.query.category) {
      filters = await AvailableService.findOne({
        title: req.query.category.toLowerCase(),
      });
      availableServices = JSON.parse(JSON.stringify(filters));
    }

    res.render("show-pages/search-page", {
      title: "Configure Filter",
      filters,
      availableServices,
    });
  },

  async getPortfolioForm(req, res, next) {
    let user = req.user;
    let lastMessage;

    if (user) {
      //getting the conversation of the sender
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

    res.render("businesses/create-portfolio", {
      title: "Create a Service Port",
      user,
      lastMessage,
    });
  },

  async getUpdatePortfolio(req, res, next) {
    let portID = req.params.id,
      lastMessage;

    let portfolio = await Portfolio.findById(portID);
    let user = req.user;

    // Condition to check that the port belongs to the logged in user
    if (portfolio.owner.username === user.username) {
      if (user) {
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
    }

    res.render("businesses/update-portfolio", {
      user,
      portfolio,
      lastMessage,
    });
  },

  async postUserNote(req, res, next) {
    const { notes } = req.body;

    console.log(notes);
    let user = req.user;
    user.notes = notes;

    await user.save();
    let resParams = { Msg: "Successfully created the notes!" };
    return res.status(200).send(resParams);
  },

  async postUserReminder(req, res, next) {
    const { reminder } = req.body;
    let user = req.user;
    user.reminder = reminder;

    await user.save();

    let resParams = { Msg: "Successfully created the Tasks & Reminders!" };
    return res.status(200).send(resParams);
  },

  async createLabel(req, res, next) {
    // find the user
    // const user = req.user;
    const owner = {
      id: req.user._id,
      username: req.user.username,
    };

    const newLabel = new Label({
      title: req.body.title,
      owner: owner,
    });

    // save the updated journey into the db
    // let label = await Label.create(newLabel);

    // const login = util.promisify(req.login.bind(req));
    // await login(user);

    res.redirect("back");
  },

  async saveToLabel(req, res, next) {
    let company = await User.findById(req.params.companyId);
    let user = req.user;
    let whichList = await Label.findById(req.params.labelId);

    if (!whichList.members.includes(company._id)) {
      await whichList.members.push(company);
      whichList.save();
    }
    // save the updated user into the db
    await user.save();
    const login = util.promisify(req.login.bind(req));
    await login(user);
    // redirect to show page
    res.redirect("back");
  },

  async saveInsurance(req, res) {
    const { id } = req.params;
    const {
      insuranceState = "",
      insuranceCompany = "",
      insuranceNo = "",
      insuranceCovered = "",
      insuranceExpiration = "",
    } = req.body;
    let company = await User.findById(id);
    // let insuranceImage = await cloudinary.v2.uploader.upload(req.file?.path);
    company.insuranceState = insuranceState;
    company.insuranceCompany = insuranceCompany;
    company.insuranceNo = insuranceNo;
    company.insuranceCovered = insuranceCovered;
    company.insuranceExpiration = insuranceExpiration;
    // company.insuranceImage = insuranceImage.secure_url;
    company.isInsured = true;
    await company.save();
    res.redirect("back");
  },
  async saveBonded(req, res) {
    const { id } = req.params;
    const { bondState = "", bondInfo = "" } = req.body;
    let company = await User.findById(id);

    // if (req.file) {
    //   if (company.bondImage) {
    //     await cloudinary.v2.uploader.destroy(company.bondImage);
    //   }
    //   bondImage = await cloudinary.v2.uploader.upload(req.file.path);
    // }
    company.bondInfo = bondInfo;
    company.isBonded = true;
    company.bondState = bondState;
    await company.save();
    res.redirect("back");
  },
  async saveStateLicence(req, res, next) {
    try {
      const { id } = req.params;
      const { licenseState, licenseNo, licenseExpiration } = req.body;
      let company = await User.findById(id);

      company.stateLicense.licenseNo = licenseNo;
      company.stateLicense.licenseState = licenseState;
      company.stateLicense.licenseExpiration = licenseExpiration;

      if (typeof company.stateLicense.file.key !== "undefined") {
        const deleteFile = await deleteFileFromS3(
          company.stateLicense.file.key
        ).catch((err) => console.log(err));
      }

      if (req.file) {
        console.log(req.file);
        const uploadFile = await uploadToS3(req.file).catch((err) =>
          console.log(err)
        );

        if (uploadFile) {
          company.stateLicense.file = {
            key: uploadFile.Key,
            path: uploadFile.Location,
          };
        }
      }

      company.isStateLicensed = true;

      await company.save();

      req.session.success = "State License successfully uploaded!";
      return res.redirect("back");
    } catch (err) {}
  },

  async saveInsuranceLicense(req, res, next) {
    try {
      const { id } = req.params;
      const {
        insuranceState,
        insuranceCompany,
        insuranceNo,
        insuranceCovered,
        insuranceExpiration,
      } = req.body;

      let company = await User.findById(id);

      company.insurance.insuranceState = insuranceState;
      company.insurance.insuranceCompany = insuranceCompany;
      company.insurance.insuranceNo = insuranceNo;
      company.insurance.insuranceCovered = insuranceCovered;
      company.insurance.insuranceExpiration = insuranceExpiration;

      if (typeof company.insurance.file.key !== "undefined") {
        const deleteFile = await deleteFileFromS3(
          company.stateLicense.file.key
        ).catch((err) => console.log(err));
      }

      if (req.file) {
        const uploadFile = await uploadToS3(req.file).catch((err) =>
          console.log(err)
        );

        if (uploadFile) {
          company.insurance.file = {
            key: uploadFile.Key,
            path: uploadFile.Location,
          };
        }
      }

      company.isInsured = true;

      await company.save();

      req.session.success = "Insurance License successfully uploaded!";
      return res.redirect("back");
    } catch (err) {}
  },

  async saveBondLicense(req, res, next) {
    try {
      const { id } = req.params;
      const {
        insuranceState,
        insuranceCompany,
        insuranceNo,
        insuranceCovered,
        insuranceExpiration,
      } = req.body;

      let company = await User.findById(id);

      company.insurance.insuranceState = insuranceState;
      company.insurance.insuranceCompany = insuranceCompany;
      company.insurance.insuranceNo = insuranceNo;
      company.insurance.insuranceCovered = insuranceCovered;
      company.insurance.insuranceExpiration = insuranceExpiration;

      if (typeof company.insurance.file.key !== "undefined") {
        const deleteFile = await deleteFileFromS3(
          company.stateLicense.file.key
        ).catch((err) => console.log(err));
      }

      if (req.file) {
        const uploadFile = await uploadToS3(req.file).catch((err) =>
          console.log(err)
        );

        if (uploadFile) {
          company.insurance.file = {
            key: uploadFile.Key,
            path: uploadFile.Location,
          };
        }
      }

      company.isInsured = true;

      await company.save();

      req.session.success = "Insurance License successfully uploaded!";
      return res.redirect("back");
    } catch (err) {}
  },

  async addCommentReply(req, res, next) {
    try {
      console.log("controller called");
      const reviewID = req.params.id;

      const review = await Review.findById(reviewID);
      review.reply = req.body.reply;

      await review.save();

      return res
        .status(201)
        .json({ message: "successfully updated", data: review });
    } catch (err) {
      console.log(err);
      return res.status(400).json({ err: err });
    }
  },
};
