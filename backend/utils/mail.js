const nodemailer = require('nodemailer');

function isSmtpConfigured() {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

function getTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

async function sendPasswordResetEmail(to, resetUrl) {
  const from = process.env.SMTP_FROM || process.env.SMTP_USER || 'noreply@hoftrix.com';
  const subject = 'Reset your Hoftrix CRM password';
  const text = `You requested a password reset.\n\nOpen this link to set a new password (valid for 1 hour):\n${resetUrl}\n\nIf you did not request this, you can ignore this email.`;
  const html = `
    <p>You requested a password reset for your Hoftrix CRM account.</p>
    <p><a href="${resetUrl}">Click here to set a new password</a> (link valid for 1 hour).</p>
    <p>If you did not request this, you can safely ignore this email.</p>
  `;

  if (!isSmtpConfigured()) {
    console.log(`[mail] SMTP not configured — password reset link for ${to}:\n${resetUrl}`);
    return { dev: true };
  }

  await getTransporter().sendMail({ from, to, subject, text, html });
  return { dev: false };
}

module.exports = { sendPasswordResetEmail, isSmtpConfigured };
