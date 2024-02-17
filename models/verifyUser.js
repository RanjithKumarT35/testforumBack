const mongoose = require("mongoose");

const verifyUserSchema = new mongoose.Schema(
  {
    userName: {
      type: String,
      required: true,
    },
    lastName: {
      type: String,
    },
    userIdentity: {
      type: String,
      required: true,
      unique: true,
    },
    profilePic: {
      type: String,
      default: "",
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  },
  {
    collection: "verifyUser",
  }
);

module.exports = mongoose.model("verifyUser", verifyUserSchema);
