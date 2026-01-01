import { Resend } from "resend";
import dotenv from "dotenv";
dotenv.config();

const resendClient = new Resend(process.env.RESEND_API_KEY);

function getEmailHtml({ feedTitle, postTitle, postLink, summary }) {
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4f6f8; padding: 40px 0; margin: 0;">
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
        <tr>
          <td align="center">
            <table role="presentation" cellpadding="0" cellspacing="0" width="600" style="background: #ffffff; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); overflow: hidden;">
              
              <!-- Header -->
              <tr>
                <td style="background: #2563eb; color: white; padding: 20px 32px; text-align: center; font-size: 22px; font-weight: bold; border-top-left-radius: 12px; border-top-right-radius: 12px;">
                  Your fav engineering blogs
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
  `;
}

function getBatchEmailHtml(posts) {
  const postsHtml = posts.map(({ feedTitle, postTitle, postLink, summary }) => `
    <tr>
      <td style="padding: 0 0 32px 0;">
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
  `).join('');

  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4f6f8; padding: 40px 0; margin: 0;">
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
        <tr>
          <td align="center">
            <table role="presentation" cellpadding="0" cellspacing="0" width="600" style="background: #ffffff; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); overflow: hidden;">
              
              <!-- Header -->
              <tr>
                <td style="background: #2563eb; color: white; padding: 20px 32px; text-align: center; font-size: 22px; font-weight: bold; border-top-left-radius: 12px; border-top-right-radius: 12px;">
                  Your fav engineering blogs
                </td>
              </tr>
              
              <!-- Content -->
              <tr>
                <td style="padding: 32px;">
                  <p style="font-size: 18px; color: #111827; margin-bottom: 24px; font-weight: 600;">
                    📬 ${posts.length} new ${posts.length === 1 ? 'post' : 'posts'} for you!
                  </p>
                  ${postsHtml}
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
  `;
}

export async function sendNewPostEmail({
  feedTitle,
  postTitle,
  postLink,
  summary,
}) {
  const fromEmail = process.env.RESEND_FROM_EMAIL;
  const toEmail = process.env.MAIL_TO;

  try {
    const { data, error } = await resendClient.emails.send({
      from: `Your fav engineering blogs: <${fromEmail}>`,
      to: [toEmail],
      subject: `New post on ${feedTitle}: ${postTitle}`,
      html: getEmailHtml({ feedTitle, postTitle, postLink, summary }),
    });

    if (error) {
      throw new Error(`Resend API error: ${error.message}`);
    }

    console.log(`Email sent: ${postTitle}`);
    return data;
  } catch (err) {
    console.error(`Email send failed: ${postTitle}`);
    console.error("Error details:", {
      message: err.message,
      error: err,
    });
    return null;
  }
}

export async function sendBatchEmail(posts) {
  if (!posts || posts.length === 0) {
    console.log("No posts to send in batch email");
    return null;
  }

  const fromEmail = process.env.RESEND_FROM_EMAIL;
  const toEmail = process.env.MAIL_TO;

  const subject = posts.length === 1
    ? `New post: ${posts[0].postTitle}`
    : `${posts.length} new posts from your favorite blogs`;

  try {
    const { data, error } = await resendClient.emails.send({
      from: `Your fav engineering blogs: <${fromEmail}>`,
      to: [toEmail],
      subject: subject,
      html: getBatchEmailHtml(posts),
    });

    if (error) {
      throw new Error(`Resend API error: ${error.message}`);
    }

    console.log(`Batch email sent with ${posts.length} post(s)`);
    return data;
  } catch (err) {
    console.error(`Batch email send failed`);
    console.error("Error details:", {
      message: err.message,
      error: err,
    });
    return null;
  }
}
