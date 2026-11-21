import nodemailer from 'nodemailer'

let transporter
let warnedAboutDevelopmentFallback = false

function smtpSettings() {
  const port = Number(process.env.SMTP_PORT || 465)
  const user = process.env.SMTP_USER?.trim()
  const pass = process.env.SMTP_PASS?.replace(/\s+/g, '')

  return {
    host: process.env.SMTP_HOST?.trim() || 'smtp.gmail.com',
    port,
    secure: process.env.SMTP_SECURE
      ? process.env.SMTP_SECURE === 'true'
      : port === 465,
    user,
    pass,
    fromName: process.env.SMTP_FROM_NAME?.trim() || 'iFLARE',
    fromEmail: process.env.SMTP_FROM_EMAIL?.trim() || user,
  }
}

function getTransport() {
  if (transporter) return transporter

  const settings = smtpSettings()
  if (!settings.user || !settings.pass) return null

  transporter = nodemailer.createTransport({
    host: settings.host,
    port: settings.port,
    secure: settings.secure,
    auth: {
      user: settings.user,
      pass: settings.pass,
    },
    // Do not allow a slow/unreachable mail server to hold an API request open.
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 15_000,
  })

  return transporter
}

/**
 * Send application email through SMTP.
 *
 * A development checkout can still exercise OTP flows without credentials;
 * callers receive `development: true` and expose the generated code locally.
 * Production never falls back and returns a configuration error instead.
 */
export async function sendMail({ to, subject, html, text }) {
  const transport = getTransport()
  const settings = smtpSettings()

  if (!transport) {
    if (process.env.NODE_ENV !== 'production') {
      if (!warnedAboutDevelopmentFallback) {
        console.warn('SMTP_USER/SMTP_PASS are not configured; using the local OTP fallback.')
        warnedAboutDevelopmentFallback = true
      }
      return { success: true, development: true }
    }

    return {
      success: false,
      error: new Error('SMTP_USER and SMTP_PASS are required in production'),
    }
  }

  try {
    const info = await transport.sendMail({
      from: `"${settings.fromName.replace(/"/g, '')}" <${settings.fromEmail}>`,
      to,
      subject,
      text,
      html,
    })
    return { success: true, messageId: info.messageId }
  } catch (error) {
    console.error('SMTP send error:', error)
    return { success: false, error }
  }
}

