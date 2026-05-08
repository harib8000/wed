/**
 * Email Channel — SendGrid integration with graceful fallback (console log) when
 * SENDGRID_API_KEY is not set. Supports HTML templates.
 */
import sgMail from '@sendgrid/mail';
import { renderTemplate } from '../templates/renderer';
import { config } from '../config';
import { logger } from '../utils/logger';

let sdkInitialized = false;

function getMailClient(): typeof sgMail | null {
  if (!config.SENDGRID_API_KEY) return null;
  if (!sdkInitialized) {
    sgMail.setApiKey(config.SENDGRID_API_KEY);
    sdkInitialized = true;
  }
  return sgMail;
}

export interface EmailOptions {
  to: string;
  subject: string;
  templateName: string;
  templateVars: Record<string, unknown>;
  /** Optional plain-text fallback — auto-generated from subject + body if omitted */
  text?: string;
}

/**
 * Send a transactional email.
 * Returns the SendGrid message ID, or a dev stub ID when not configured.
 */
export async function sendEmail(opts: EmailOptions): Promise<string> {
  const { to, subject, templateName, templateVars, text } = opts;
  const client = getMailClient();

  if (!client) {
    logger.info({ to, subject, templateName }, '[Email stub] SendGrid not configured — email not sent');
    return 'stub-email-id';
  }

  let html: string;
  try {
    html = renderTemplate(templateName, templateVars);
  } catch (err) {
    logger.error({ err, templateName }, 'Template render failed, falling back to plain text');
    html = `<p>${subject}</p><p>${text ?? JSON.stringify(templateVars)}</p>`;
  }

  const msg: sgMail.MailDataRequired = {
    to,
    from: {
      email: config.SENDGRID_FROM_EMAIL,
      name: 'WeddingOS',
    },
    subject,
    html,
    text: text ?? subject,
    trackingSettings: {
      clickTracking: { enable: false },
      openTracking: { enable: false },
    },
  };

  const [response] = await client.send(msg);
  const messageId = response.headers['x-message-id'] ?? 'sent';
  logger.info({ to, subject, messageId }, 'Email sent via SendGrid');
  return messageId as string;
}

/**
 * Send the same email to multiple recipients (BCC'd, separate API calls to avoid
 * leaking addresses).
 */
export async function sendEmailBulk(
  recipients: Array<{ to: string; templateVars: Record<string, unknown> }>,
  subject: string,
  templateName: string,
): Promise<void> {
  await Promise.allSettled(
    recipients.map((r) =>
      sendEmail({ to: r.to, subject, templateName, templateVars: r.templateVars }),
    ),
  );
}
