/**
 * Template renderer — minimal Mustache-style replacement engine for HTML email templates.
 * No external dependency required; variable syntax: {{VAR_NAME}}
 */

import fs from 'fs';
import path from 'path';

const TEMPLATES_DIR = path.join(__dirname, '../templates/html');

/**
 * Render a named template with the provided variables.
 * Throws if the template file does not exist.
 */
export function renderTemplate(
  templateName: string,
  vars: Record<string, unknown>,
): string {
  const filePath = path.join(TEMPLATES_DIR, `${templateName}.html`);

  if (!fs.existsSync(filePath)) {
    // Fallback: inline generic template
    return buildGenericTemplate(vars['title'] as string ?? templateName, vars['body'] as string ?? '');
  }

  let html = fs.readFileSync(filePath, 'utf8');

  // Replace {{VARIABLE}} tokens
  for (const [key, value] of Object.entries(vars)) {
    const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
    html = html.replace(regex, String(value ?? ''));
  }

  return html;
}

function buildGenericTemplate(title: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(title)}</title>
  <style>
    body { margin: 0; padding: 0; font-family: 'Helvetica Neue', Arial, sans-serif; background: #f8f9fa; color: #1a1a2e; }
    .container { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 16px rgba(0,0,0,.08); }
    .header { background: linear-gradient(135deg, #7c3aed 0%, #c026d3 100%); padding: 32px 40px; text-align: center; }
    .header h1 { margin: 0; font-size: 24px; color: #ffffff; font-weight: 700; letter-spacing: -0.5px; }
    .header p { margin: 6px 0 0; font-size: 13px; color: rgba(255,255,255,.75); }
    .body { padding: 40px; }
    .body p { font-size: 15px; line-height: 1.7; color: #374151; margin: 0 0 16px; }
    .cta { display: block; margin: 32px auto 0; width: fit-content; background: #7c3aed; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-size: 15px; font-weight: 600; }
    .footer { background: #f3f4f6; padding: 20px 40px; text-align: center; font-size: 12px; color: #9ca3af; }
    .footer a { color: #7c3aed; text-decoration: none; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>💍 WeddingOS</h1>
      <p>India's Wedding Operating System</p>
    </div>
    <div class="body">
      <p><strong>${escapeHtml(title)}</strong></p>
      <p>${escapeHtml(body)}</p>
    </div>
    <div class="footer">
      <p>You received this email because you have an account on WeddingOS.</p>
      <p><a href="https://weddingos.in/unsubscribe">Unsubscribe</a> · <a href="https://weddingos.in/privacy">Privacy Policy</a></p>
    </div>
  </div>
</body>
</html>`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
