import nodemailer from 'nodemailer';

/**
 * Returns a configured nodemailer transporter.
 * Uses SMTP_* env vars if present, otherwise falls back to
 * Ethereal (a fake SMTP service) so emails still "send" in dev
 * without any real credentials.
 */
const getTransporter = async () => {
  if (process.env.SMTP_HOST) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  }

  // Ethereal fallback for development/testing
  const testAccount = await nodemailer.createTestAccount();
  const transporter = nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass
    }
  });
  console.log('[Mailer] Using Ethereal test account:', testAccount.user);
  return transporter;
};

const FROM_ADDRESS = process.env.SMTP_FROM || '"QuizNova" <noreply@quiznova.app>';
const APP_URL = process.env.APP_URL || 'http://localhost:5001';

/**
 * Send email verification link to a newly registered user.
 */
export const sendVerificationEmail = async (to, token) => {
  try {
    const transporter = await getTransporter();
    const verifyUrl = `${APP_URL}/api/auth/verify-email?token=${token}`;

    const info = await transporter.sendMail({
      from: FROM_ADDRESS,
      to,
      subject: 'Verify your QuizNova account',
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto">
          <h2 style="color:#6c63ff">Welcome to QuizNova! 🎉</h2>
          <p>Thanks for signing up. Click the button below to verify your email address.</p>
          <a href="${verifyUrl}"
             style="display:inline-block;padding:12px 28px;background:#6c63ff;color:#fff;
                    border-radius:8px;text-decoration:none;font-weight:bold;margin:16px 0">
            Verify Email
          </a>
          <p style="color:#888;font-size:12px">
            This link expires in 24 hours. If you didn't sign up, you can ignore this email.
          </p>
        </div>
      `
    });

    // In dev with Ethereal, log the preview URL
    if (nodemailer.getTestMessageUrl(info)) {
      console.log('[Mailer] Verification email preview:', nodemailer.getTestMessageUrl(info));
    }
  } catch (err) {
    console.error('[Mailer] Failed to send verification email:', err.message);
  }
};

/**
 * Send password-change confirmation email.
 */
export const sendPasswordChangedEmail = async (to) => {
  try {
    const transporter = await getTransporter();

    const info = await transporter.sendMail({
      from: FROM_ADDRESS,
      to,
      subject: 'Your QuizNova password was changed',
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto">
          <h2 style="color:#6c63ff">Password Changed</h2>
          <p>Your QuizNova account password was successfully changed.</p>
          <p>If you didn't do this, please contact support immediately.</p>
        </div>
      `
    });

    if (nodemailer.getTestMessageUrl(info)) {
      console.log('[Mailer] Password changed email preview:', nodemailer.getTestMessageUrl(info));
    }
  } catch (err) {
    console.error('[Mailer] Failed to send password changed email:', err.message);
  }
};
