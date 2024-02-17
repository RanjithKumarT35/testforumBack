const express = require("express");

const {
  addHeading,
  getHeading,
  deleteHeading,
} = require("../controllers/headingControllers");
var router = express.Router();

router.get("/", getHeading);
router.post("/", addHeading);
router.delete("/", deleteHeading);
module.exports = router;
