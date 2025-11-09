import nodemailer from "nodemailer";

import dotenv from "dotenv";
dotenv.config();

// Determine if we should use secure (SSL) or TLS based on port
const port = parseInt(process.env.SMTP_PORT || "465");
const useSecure = port === 465; // Port 465 uses SSL, port 587 uses TLS

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: port,
  secure: useSecure, // true for port 465 (SSL), false for port 587 (TLS)
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  connectionTimeout: 10000, // 10 seconds connection timeout
  greetingTimeout: 10000, // 10 seconds greeting timeout
  socketTimeout: 10000, // 10 seconds socket timeout
  // For cloud environments like Railway
  tls: {
    rejectUnauthorized: false, // Allow self-signed certificates if needed
  },
  // Connection pool settings
  pool: true,
  maxConnections: 1,
  maxMessages: 3,
  rateDelta: 1000,
  rateLimit: 5,
});

export async function sendNewPostEmail({
  feedTitle,
  postTitle,
  postLink,
  summary,
}) {
  const mailOptions = {
    from: `"RSS Watcher" <${process.env.SMTP_USER}>`,
    to: process.env.MAIL_TO,
    subject: `🆕 New post on ${feedTitle}: ${postTitle}`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4f6f8; padding: 40px 0; margin: 0;">
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
          <tr>
            <td align="center">
              <table role="presentation" cellpadding="0" cellspacing="0" width="600" style="background: #ffffff; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); overflow: hidden;">
                
                <!-- Header -->
                <tr>
                  <td style="background: #2563eb; color: white; padding: 20px 32px; text-align: center; font-size: 22px; font-weight: bold; border-top-left-radius: 12px; border-top-right-radius: 12px;">
                    RSS Watcher
                  </td>
                </tr>
                
                <!-- Content -->
                <tr>
                  <td style="padding: 32px;">
                    <h2 style="font-size: 20px; color: #111827; margin-bottom: 12px;">${feedTitle}</h2>
                    
                    <!-- Link Preview -->
                    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border: 1px solid #e5e7eb; border-radius: 10px; overflow: hidden; margin-bottom: 20px;">
                      <tr>
                        <td style="padding: 16px;">
                          <p style="font-size: 16px; font-weight: 600; color: #111827; margin: 0 0 6px 0;">${postTitle}</p>
                          ${
                            summary
                              ? `<p style="font-size: 14px; color: #6b7280; margin: 0 0 12px 0;">${summary}</p>`
                              : ""
                          }
                          <a href="${postLink}" style="font-size: 14px; color: #2563eb; text-decoration: none;">${
      new URL(postLink).hostname
    }</a>
                        </td>
                      </tr>
                    </table>
                    
                    <a href="${postLink}" 
                      style="display: inline-block; background-color: #2563eb; color: #ffffff; text-decoration: none; padding: 10px 18px; border-radius: 6px; font-weight: 500; font-size: 15px;">
                      Read Full Post →
                    </a>
                    
                    <p style="margin-top: 24px; font-size: 14px; color: #6b7280;">
                      Or open this link directly:<br />
                      <a href="${postLink}" style="color: #2563eb; word-break: break-all;">${postLink}</a>
                    </p>
                  </td>
                </tr>
                
                <!-- Footer -->
                <tr>
                  <td style="background: #f9fafb; padding: 16px 32px; text-align: center; color: #9ca3af; font-size: 13px; border-bottom-left-radius: 12px; border-bottom-right-radius: 12px;">
                    <p style="margin: 0;">📰 Sent automatically by <b>RSS Watcher</b></p>
                    <p style="margin: 4px 0 0;">Stay updated with your favorite blogs.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Email sent: ${postTitle}`);
  } catch (err) {
    console.error(`Email send failed: ${postTitle}`);
    console.error("Error details:", {
      code: err.code,
      command: err.command,
      message: err.message,
    });
    
    if (err.code === "ETIMEDOUT" || err.code === "ECONNREFUSED") {
      console.log("Retrying email send after connection error...");
      try {
        await new Promise((resolve) => setTimeout(resolve, 2000));
        await transporter.sendMail(mailOptions);
        console.log(`Email sent (retry successful): ${postTitle}`);
      } catch (retryErr) {
        console.error(`Email send failed after retry: ${postTitle}`);
        console.error("Retry error:", retryErr.message);
      }
    }
  }
}
