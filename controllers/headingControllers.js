const headingModel = require("../models/headingModel");

const getHeading = async (req, res) => {
  try {
    const headings = await headingModel.find();

    if (!headings || headings.length === 0) {
      return res.status(200).json({ error: "No Headings not found" });
    }

    res.json(headings);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const addHeading = async (req, res) => {
  try {
    const { headingName } = req.body;

    if (!headingName) {
      return res.status(400).json({ error: "Missing heading data" });
    }

    const existingHeading = await headingModel.findOne({
      headingName: headingName,
    });

    if (existingHeading) {
      return res.status(409).json({ error: "Heading already exists" });
    }

    const addedHeading = new headingModel({
      headingName: headingName,
    });

    const savedHeading = await addedHeading.save();

    if (savedHeading) {
      return res.status(200).json(savedHeading);
    } else {
      return res.status(500).json({ error: "Failed to save heading" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const deleteHeading = async (req, res) => {
  try {
    const { headingName } = await req.body;

    // Check if the heading exists
    const deletedHeading = await headingModel.findOneAndDelete({
      headingName: headingName,
    });
    // console.log(existingHeading);
    // if (!existingHeading) {
    //   return res.status(404).json({ error: "Heading not found" });
    // }

    // // Delete the heading
    // const deletedHeading = await existingHeading.de();

    if (deletedHeading) {
      res.status(200).json({ message: "Heading deleted successfully" });
    } else {
      res.status(200).json({ message: "Heading not deleted successfully" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
module.exports = {
  getHeading,
  addHeading,
  deleteHeading,
};
