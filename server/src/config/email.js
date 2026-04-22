// SMART ECCD – Email Configuration
// Uses Resend in production, logs to console in development

const EMAIL_ENABLED = process.env.ENABLE_EMAIL_NOTIFICATIONS === 'true';

let resendClient = null;
if (EMAIL_ENABLED && process.env.RESEND_API_KEY) {
  const { Resend } = require('resend');
  resendClient = new Resend(process.env.RESEND_API_KEY);
}

/**
 * Send an email
 * @param {Object} options - { to, subject, html, text }
 */
const sendEmail = async ({ to, subject, html, text }) => {
  if (!EMAIL_ENABLED || !resendClient) {
    // Dev mode: log instead of sending
    console.log(`\n📧 [Email Mock]\n  To: ${to}\n  Subject: ${subject}\n  Body: ${text || 'HTML email'}\n`);
    return { id: 'mock-email-id' };
  }

  const result = await resendClient.emails.send({
    from: process.env.EMAIL_FROM || 'SMART ECCD <noreply@smart-eccd.com>',
    to,
    subject,
    html,
    text,
  });

  return result;
};

module.exports = { sendEmail };
