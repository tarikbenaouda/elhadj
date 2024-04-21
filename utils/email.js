// eslint-disable-next-line import/no-extraneous-dependencies
const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  // 1) Create a transporter
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    host: 'smtp.gmail.com',
    secure: false,
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD,
    },
  });
  // 2) Define the email options
  const mailOptions = {
    from: 'elhadj <elhadj.platform@gmail.com>',
    to: options.email,
    subject: options.subject,
    text: options.text,
  };
  // 3) Actually send the mail
  await transporter.sendMail(mailOptions);
};
module.exports = sendEmail;
