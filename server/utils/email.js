import nodemailer from 'nodemailer'

// NOTE: dotenv is loaded by the main server entry (server/index.js) before this module is imported.
// Do NOT call dotenv.config() here — it can override already-loaded env vars.

const createTransporter = () =>
  nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    tls: {
      rejectUnauthorized: false,
    },
  })

// Lazy transporter — created on first use so env vars are guaranteed to be loaded
let _transporter = null
const getTransporter = () => {
  if (!_transporter) _transporter = createTransporter()
  return _transporter
}

// Run SMTP connectivity check at server startup
export const verifySmtp = () => {
  const t = getTransporter()
  t.verify((error) => {
    if (error) {
      console.log(`\nFull SMTP error:`, error, `\n`)
    } else {
      console.log(`\nSMTP CONNECTED SUCCESSFULLY\n`)
    }
  })
}

export const sendOTP = async (to, otp, type = 'verification') => {
  const label = type === 'verification' ? 'EMAIL_VERIFICATION' : 'PASSWORD_RESET'
  const subject = type === 'verification'
    ? 'Verify your TaskFlow Account'
    : 'Reset your TaskFlow Password'

  const html = type === 'verification'
    ? `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #f9fafb; border-radius: 12px;">
        <div style="background: linear-gradient(135deg,#7c6af7,#22d3ee); padding: 20px; border-radius: 8px; text-align: center; margin-bottom: 24px;">
          <h1 style="color: white; margin: 0; font-size: 24px;">TaskFlow</h1>
        </div>
        <h2 style="color: #1a1a2e;">Welcome to TaskFlow!</h2>
        <p style="color: #555; line-height: 1.6;">Please use the following 6-digit OTP to verify your email address:</p>
        <div style="background: #fff; border: 2px solid #7c6af7; border-radius: 10px; padding: 20px; text-align: center; margin: 24px 0;">
          <h1 style="letter-spacing: 10px; color: #4F46E5; margin: 0; font-size: 36px;">${otp}</h1>
        </div>
        <p style="color: #888; font-size: 14px;">This code will expire in <strong>10 minutes</strong>. Do not share it with anyone.</p>
      </div>
    `
    : `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #f9fafb; border-radius: 12px;">
        <div style="background: linear-gradient(135deg,#f43f5e,#f59e0b); padding: 20px; border-radius: 8px; text-align: center; margin-bottom: 24px;">
          <h1 style="color: white; margin: 0; font-size: 24px;">TaskFlow</h1>
        </div>
        <h2 style="color: #1a1a2e;">Password Reset Request</h2>
        <p style="color: #555; line-height: 1.6;">You requested a password reset. Please use the following 6-digit OTP:</p>
        <div style="background: #fff; border: 2px solid #f43f5e; border-radius: 10px; padding: 20px; text-align: center; margin: 24px 0;">
          <h1 style="letter-spacing: 10px; color: #E53E3E; margin: 0; font-size: 36px;">${otp}</h1>
        </div>
        <p style="color: #888; font-size: 14px;">This code will expire in <strong>10 minutes</strong>. If you did not request this, you can safely ignore this email.</p>
      </div>
    `

  const mailOptions = {
    from: `"TaskFlow" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html,
  }

  console.log(`\n==================================================`)
  console.log(`ATTEMPTING EMAIL DELIVERY`)
  console.log(`TO: ${to}`)
  console.log(`TYPE: ${label}`)
  console.log(`========================`)

  try {
    const transporter = getTransporter()
    await transporter.sendMail(mailOptions)
    console.log(`SUCCESS: Email delivered successfully`)
    console.log(`==================================================\n`)
    return true
  } catch (error) {
    console.log(`FAILED: ${error.message}`)
    console.log(`==================================================\n`)
    throw new Error('Failed to send email.', { cause: error })
  }
}
