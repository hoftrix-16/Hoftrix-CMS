const nodemailer = require('nodemailer');
const path = require('path');

function createTransporter() {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const port = Number(process.env.SMTP_PORT) || 587;

  console.log('📧 SMTP CONFIG:', {
    host,
    port,
    user,
    hasPassword: !!pass,
    secure: process.env.SMTP_SECURE,
    service: process.env.SMTP_SERVICE,
  });

  if (host && user && pass) {
    return nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: {
        user,
        pass,
      },

      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 15000,

      logger: true,
      debug: true,
    });
  }

  if (process.env.SMTP_SERVICE === 'gmail' && user && pass) {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user,
        pass,
      },

      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 15000,

      logger: true,
      debug: true,
    });
  }

  console.log('⚠️ SMTP transporter could not be created');

  return null;
}
async function sendOtpEmail(
  recipientEmail,
  otpCode,
  type = 'Password Reset'
) {
  const transporter = createTransporter();

  const fromAddress =
    process.env.SMTP_FROM ||
    process.env.SMTP_USER ||
    '"Hoftrix Security" <security@hoftrix.com>';

 
 const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${type} Code - Hoftrix</title>
</head>

<body
  style="
    margin: 0;
    padding: 0;
    background-color: #f5f7fa;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    color: #1e293b;
  "
>
  <table
    width="100%"
    border="0"
    cellspacing="0"
    cellpadding="0"
    style="padding: 40px 16px;"
  >
    <tr>
      <td align="center">

        <!-- Main Container -->
        <table
          width="100%"
          border="0"
          cellspacing="0"
          cellpadding="0"
          style="
            max-width: 500px;
            background-color: #ffffff;
            border: 1px solid #e2e8f0;
            border-radius: 14px;
            overflow: hidden;
          "
        >

          <!-- Logo Section -->
          <tr>
            <td
              align="center"
              style="
                padding: 32px 28px 24px;
                border-bottom: 1px solid #f1f5f9;
              "
            >
              <img
                src="cid:hoftrix-logo"
                alt="Hoftrix"
                width="140"
                style="
                  display: block;
                  max-width: 140px;
                  height: auto;
                  margin: 0 auto;
                  border: 0;
                "
              />
            </td>
          </tr>

          <tr>
            <td style="padding: 32px 28px 28px;">

              <!-- Heading -->
              <h1
                style="
                  margin: 0 0 12px;
                  font-size: 22px;
                  line-height: 30px;
                  font-weight: 600;
                  color: #0f172a;
                  text-align: center;
                "
              >
                ${
                  type === 'Password Reset'
                    ? 'Reset your password'
                    : 'Verify your email address'
                }
              </h1>

              <!-- Description -->
              <p
                style="
                  margin: 0 0 24px;
                  font-size: 14px;
                  line-height: 22px;
                  color: #64748b;
                  text-align: center;
                "
              >
                ${
                  type === 'Password Reset'
                    ? 'Use the verification code below to reset your Hoftrix account password.'
                    : 'Use the verification code below to verify your email address and continue.'
                }
              </p>

              <p
                style="
                  margin: 0 0 24px;
                  font-size: 13px;
                  line-height: 20px;
                  color: #64748b;
                  text-align: center;
                "
              >
                Verification requested for
                <strong style="color: #334155;">
                  ${recipientEmail}
                </strong>
              </p>

              <div
                style="
                  background-color: #f8fafc;
                  border: 1px solid #e2e8f0;
                  border-radius: 10px;
                  padding: 20px 16px;
                  text-align: center;
                  margin-bottom: 18px;
                "
              >
                <div
                  style="
                    font-size: 11px;
                    line-height: 16px;
                    font-weight: 600;
                    color: #94a3b8;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                    margin-bottom: 8px;
                  "
                >
                  Verification Code
                </div>

                <div
                  style="
                    font-family: 'Courier New', Courier, monospace;
                    font-size: 32px;
                    line-height: 40px;
                    font-weight: 700;
                    letter-spacing: 8px;
                    color: #0f172a;
                  "
                >
                  ${otpCode}
                </div>
              </div>

              <!-- Expiry -->
              <p
                style="
                  margin: 0 0 28px;
                  font-size: 13px;
                  line-height: 20px;
                  color: #64748b;
                  text-align: center;
                "
              >
                ⏱ This code will expire in
                <strong style="color: #334155;">5 minutes</strong>.
              </p>

              <!-- Security Note -->
              <div
                style="
                  border-top: 1px solid #f1f5f9;
                  padding-top: 20px;
                "
              >
                <p
                  style="
                    margin: 0;
                    font-size: 12px;
                    line-height: 18px;
                    color: #94a3b8;
                    text-align: center;
                  "
                >
                  If you didn't request this code, you can safely ignore
                  this email. Your account remains secure.
                </p>
              </div>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td
              align="center"
              style="
                padding: 20px 28px;
                background-color: #f8fafc;
                border-top: 1px solid #f1f5f9;
              "
            >
              <p
                style="
                  margin: 0 0 6px;
                  font-size: 12px;
                  font-weight: 600;
                  color: #475569;
                "
              >
                Hoftrix
              </p>

              <p
                style="
                  margin: 0;
                  font-size: 11px;
                  line-height: 17px;
                  color: #94a3b8;
                "
              >
                Admin Portal · admin.hoftrix.com
              </p>
            </td>
          </tr>

        </table>

        <!-- Bottom Text -->
        <p
          style="
            margin: 18px 0 0;
            font-size: 11px;
            line-height: 17px;
            color: #94a3b8;
            text-align: center;
          "
        >
          © ${new Date().getFullYear()} Hoftrix. All rights reserved.
        </p>

      </td>
    </tr>
  </table>
</body>
</html>
`;


 if (transporter) {
  try {
    console.log('📧 SMTP: verifying connection...');

    await transporter.verify();

    const logoPath = path.join(
      __dirname,
      '../uploads/hoftrixtechnologies_logo.jpeg'
    );

    console.log('📎 Logo path:', logoPath);

    const info = await transporter.sendMail({
      from: fromAddress,
      to: recipientEmail,
      subject: `Your Hoftrix Verification Code: ${otpCode}`,
      html: htmlContent,

      attachments: [
        {
          filename: 'hoftrixtechnologies_logo.jpeg',
          path: logoPath,
          cid: 'hoftrix-logo',
        },
      ],
    });

    return {
      sent: true,
      messageId: info.messageId,
    };
  } catch (err) {
    console.error(
      `❌ SMTP error to ${recipientEmail}:`,
      err
    );

    return {
      sent: false,
      error: err?.message || String(err),
    };
  }
}
}

module.exports = {
  sendOtpEmail,
};