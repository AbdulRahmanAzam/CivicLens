const nodemailer = require('nodemailer');
const env = require('../config/env');

const buildTransporter = () => {
  if (!env.email?.smtp?.host) {
    throw new Error('SMTP host is not configured');
  }

  return nodemailer.createTransport({
    host: env.email.smtp.host,
    port: env.email.smtp.port,
    secure: env.email.smtp.secure,
    auth: env.email.smtp.user && env.email.smtp.pass
      ? {
          user: env.email.smtp.user,
          pass: env.email.smtp.pass,
        }
      : undefined,
  });
};

const transporter = buildTransporter();

async function sendEmail({ to, subject, text, html, from }) {
  if (!to) throw new Error('Recipient (to) is required');
  const mailFrom = from || env.email.from || env.email.smtp.user;

  if (!mailFrom) {
    throw new Error('Sender (from) address is not configured');
  }

  const info = await transporter.sendMail({
    from: mailFrom,
    to,
    subject,
    text,
    html,
  });

  return info;
}

async function verifyConnection() {
  return transporter.verify();
}

module.exports = {
  sendEmail,
  verifyConnection,
};
