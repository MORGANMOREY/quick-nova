import nodemailer from 'nodemailer';

let cachedTransporter = null;

/**
 * Returns a configured nodemailer transporter with support for:
 * 1. Provider presets: Gmail, Resend, SendGrid, Brevo (Sendinblue), Mailgun
 * 2. Custom host/port/auth settings
 * 3. Ethereal test account dev fallback (auto-generated testing inbox)
 */
export const getTransporter = async () => {
  if (cachedTransporter) {
    return cachedTransporter;
  }

  const service = (process.env.SMTP_SERVICE || '').toLowerCase();

  // 1. Gmail App Password preset
  if (service === 'gmail' || (process.env.SMTP_USER && process.env.SMTP_USER.includes('@gmail.com') && !process.env.SMTP_HOST)) {
    cachedTransporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS // 16-character App Password from Google Security
      }
    });
    console.log('[Mailer] Initialized using Gmail Service');
    return cachedTransporter;
  }

  // 2. Resend preset
  if (service === 'resend' || process.env.RESEND_API_KEY) {
    cachedTransporter = nodemailer.createTransport({
      host: 'smtp.resend.com',
      port: 465,
      secure: true,
      auth: {
        user: 'resend',
        pass: process.env.RESEND_API_KEY || process.env.SMTP_PASS
      }
    });
    console.log('[Mailer] Initialized using Resend SMTP');
    return cachedTransporter;
  }

  // 3. SendGrid preset
  if (service === 'sendgrid' || process.env.SENDGRID_API_KEY) {
    cachedTransporter = nodemailer.createTransport({
      host: 'smtp.sendgrid.net',
      port: 587,
      secure: false,
      auth: {
        user: 'apikey',
        pass: process.env.SENDGRID_API_KEY || process.env.SMTP_PASS
      }
    });
    console.log('[Mailer] Initialized using SendGrid SMTP');
    return cachedTransporter;
  }

  // 4. Brevo (Sendinblue) preset
  if (service === 'brevo') {
    cachedTransporter = nodemailer.createTransport({
      host: 'smtp-relay.brevo.com',
      port: 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
    console.log('[Mailer] Initialized using Brevo SMTP');
    return cachedTransporter;
  }

  // 5. Standard Custom SMTP
  if (process.env.SMTP_HOST) {
    cachedTransporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
    console.log(`[Mailer] Initialized custom SMTP (${process.env.SMTP_HOST}:${process.env.SMTP_PORT || 587})`);
    return cachedTransporter;
  }

  // 6. Ethereal dev fallback
  try {
    const testAccount = await nodemailer.createTestAccount();
    cachedTransporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass
      }
    });
    console.log('[Mailer] No production SMTP configured. Using Ethereal dev test account:', testAccount.user);
    return cachedTransporter;
  } catch (e) {
    console.warn('[Mailer] Could not initialize Ethereal account:', e.message);
    // Dummy null-transporter
    return {
      sendMail: async () => ({ messageId: 'dummy_offline_id' })
    };
  }
};

const FROM_ADDRESS = process.env.SMTP_FROM || '"QuizNova" <noreply@quiznova.app>';
const APP_URL = process.env.APP_URL || 'http://localhost:5001';

/**
 * Verify transporter connection on boot
 */
export const verifyMailerConnection = async () => {
  try {
    const transporter = await getTransporter();
    if (transporter && typeof transporter.verify === 'function') {
      await transporter.verify();
      console.log('✅ Mailer connection verified successfully.');
    }
  } catch (err) {
    console.warn('⚠️ Mailer connection check warning:', err.message);
  }
};

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
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px;border-radius:12px;background:#0d1117;color:#ffffff;">
          <h2 style="color:#38bdf8;margin-top:0">Welcome to QuizNova! 🎉</h2>
          <p style="color:#e2e8f0;font-size:15px">Thanks for signing up. Click the button below to verify your email address.</p>
          <div style="margin:24px 0">
            <a href="${verifyUrl}"
               style="display:inline-block;padding:12px 28px;background:linear-gradient(135deg, #0ea5e9, #6366f1);color:#fff;
                      border-radius:8px;text-decoration:none;font-weight:bold;box-shadow:0 4px 15px rgba(14,165,233,0.3)">
              Verify Email Address
            </a>
          </div>
          <p style="color:#94a3b8;font-size:12px">
            This link expires in 24 hours. If you didn't sign up for QuizNova, you can safely ignore this message.
          </p>
        </div>
      `
    });

    if (nodemailer.getTestMessageUrl(info)) {
      console.log('[Mailer] Verification email preview URL:', nodemailer.getTestMessageUrl(info));
    }
  } catch (err) {
    console.error('[Mailer] Failed to send verification email:', err.message);
  }
};

/**
 * Send password reset OTP email.
 */
export const sendPasswordResetEmail = async (to, otp) => {
  try {
    const transporter = await getTransporter();

    const info = await transporter.sendMail({
      from: FROM_ADDRESS,
      to,
      subject: 'QuizNova Password Reset Code: ' + otp,
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px;border-radius:12px;background:#0d1117;color:#ffffff;">
          <h2 style="color:#38bdf8;margin-top:0;">QuizNova Password Reset 🔐</h2>
          <p style="color:#e2e8f0;font-size:15px;">You requested a password reset for your QuizNova account. Use the 6-digit verification code below to reset your password:</p>
          <div style="margin:24px 0;text-align:center;">
            <span style="display:inline-block;padding:14px 28px;background:linear-gradient(135deg, #0ea5e9, #6366f1);color:#ffffff;font-size:28px;font-weight:900;letter-spacing:6px;border-radius:10px;box-shadow:0 6px 20px rgba(14,165,233,0.3);">
              ${otp}
            </span>
          </div>
          <p style="color:#94a3b8;font-size:13px;">This code will expire in <strong>15 minutes</strong>. If you did not request this password reset, please ignore this email.</p>
        </div>
      `
    });

    if (nodemailer.getTestMessageUrl(info)) {
      console.log('[Mailer] Password reset email preview URL:', nodemailer.getTestMessageUrl(info));
    }
  } catch (err) {
    console.error('[Mailer] Failed to send password reset email:', err.message);
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
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px;border-radius:12px;background:#0d1117;color:#ffffff;">
          <h2 style="color:#10b981;margin-top:0">Password Changed Successfully</h2>
          <p style="color:#e2e8f0;font-size:15px">Your QuizNova account password was successfully updated.</p>
          <p style="color:#94a3b8;font-size:13px">If you did not perform this change, please contact support immediately.</p>
        </div>
      `
    });

    if (nodemailer.getTestMessageUrl(info)) {
      console.log('[Mailer] Password changed email preview URL:', nodemailer.getTestMessageUrl(info));
    }
  } catch (err) {
    console.error('[Mailer] Failed to send password changed email:', err.message);
  }
};
