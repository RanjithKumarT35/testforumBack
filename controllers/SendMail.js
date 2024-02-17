const nodemailer = require("nodemailer");
const dotenv = require("dotenv");
dotenv.config();

const transporter = nodemailer.createTransport({
  host: "smtp.hostinger.com", // Hostinger SMTP server address
  port: 587, // Port for non-secure connection, use 465 for secure connection
  secure: false, // Set to true for secure connection (use port 465)
  auth: {
    user: process.env.nodeMailer_User,
    pass: process.env.nodeMailer_Pass,
  },
});

function sendMail(toEmail, subject, content) {
  const mailOptions = {
    from: process.env.nodeMailer_User,
    to: toEmail,
    subject: subject,
    html: content,
  };
  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.log("Error occurred:", error);
    } else {
      console.log("Email sent for subject:", subject);
    }
  });
}

module.exports = { sendMail };
