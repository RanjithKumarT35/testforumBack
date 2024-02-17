const express = require("express");
const {
  verify,
  Register,
  Login,
  User,
  Logout,
  LoggedIn,
  updateProfile,
  ForgotPassword,
  passwordChange,
  FindIdentity,
} = require("../controllers/authController");
var router = express.Router();
router.post("/verify", verify);
router.post("/register", Register);
router.post("/login", Login);
router.get("/logout", Logout);
router.put("/updateProfile", updateProfile);
router.get("/user", User);
router.post("/findIdentity", FindIdentity);
router.get("/loggedIn", LoggedIn);
router.post("/forgotPassword", ForgotPassword);
router.post("/passwordChange", passwordChange);

module.exports = router;
