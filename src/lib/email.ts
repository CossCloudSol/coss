import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = 'noreply@cosscloudsol.com';
const BASE_URL = 'https://cosscloudsol.com';

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  return resend.emails.send({ from: FROM, to, subject, html });
}

export function buildInstantEmail({
  title,
  body,
  link,
}: {
  title: string;
  body: string;
  link?: string | null;
}): string {
  const buttonHtml = link
    ? `<a href="${BASE_URL}${link}" style="display:inline-block;padding:12px 24px;background:#024c57;color:#ffffff;text-decoration:none;border-radius:6px;font-weight:600;font-size:14px;">View in Admin</a>`
    : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${esc(title)}</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
    <tr><td align="center" style="padding:32px 16px;">
      <table role="presentation" width="560" cellspacing="0" cellpadding="0" style="background:#ffffff;border-radius:8px;overflow:hidden;max-width:560px;width:100%;">
        <tr>
          <td style="background:#024c57;padding:20px 32px;">
            <span style="color:#5ef0c8;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;">Coss Cloud Solutions — Admin Alert</span>
          </td>
        </tr>
        <tr>
          <td style="padding:32px;">
            <h1 style="margin:0 0 12px;font-size:20px;font-weight:700;color:#111111;line-height:1.3;">${esc(title)}</h1>
            <p style="margin:0 0 28px;font-size:15px;color:#555555;line-height:1.6;">${esc(body)}</p>
            ${buttonHtml}
          </td>
        </tr>
        <tr>
          <td style="padding:16px 32px;background:#f9f9f9;border-top:1px solid #eeeeee;">
            <p style="margin:0;font-size:12px;color:#999999;line-height:1.5;">Automated notification from the Coss Cloud Solutions admin system.</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export function buildDigestEmail({
  groups,
  dateLabel,
}: {
  groups: Array<{
    label: string;
    count: number;
    items: Array<{ text: string; link?: string | null }>;
  }>;
  dateLabel: string;
}): string {
  const groupsHtml = groups
    .map(
      (g) => `
      <tr><td style="padding:0 0 24px 0;">
        <p style="margin:0 0 8px;font-size:13px;font-weight:700;color:#024c57;text-transform:uppercase;letter-spacing:.5px;">${esc(g.label)} &nbsp;<span style="background:#5ef0c8;color:#024c57;border-radius:10px;padding:2px 8px;font-size:11px;">${g.count}</span></p>
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
          ${g.items
            .map(
              (item) => `
          <tr><td style="padding:7px 0;border-bottom:1px solid #f0f0f0;">
            <span style="font-size:14px;color:#333333;">${esc(item.text)}</span>${item.link ? `&nbsp;<a href="${BASE_URL}${item.link}" style="font-size:13px;color:#024c57;text-decoration:underline;">View</a>` : ''}
          </td></tr>`,
            )
            .join('')}
        </table>
      </td></tr>`,
    )
    .join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Daily Admin Digest</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
    <tr><td align="center" style="padding:32px 16px;">
      <table role="presentation" width="560" cellspacing="0" cellpadding="0" style="background:#ffffff;border-radius:8px;overflow:hidden;max-width:560px;width:100%;">
        <tr>
          <td style="background:#024c57;padding:20px 32px;">
            <span style="color:#5ef0c8;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;">Coss Cloud Solutions — Daily Digest</span>
          </td>
        </tr>
        <tr>
          <td style="padding:32px;">
            <h1 style="margin:0 0 4px;font-size:20px;font-weight:700;color:#111111;">Admin Summary</h1>
            <p style="margin:0 0 28px;font-size:13px;color:#999999;">${esc(dateLabel)}</p>
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
              ${groupsHtml}
            </table>
            <a href="${BASE_URL}/admin" style="display:inline-block;margin-top:8px;padding:12px 24px;background:#024c57;color:#ffffff;text-decoration:none;border-radius:6px;font-weight:600;font-size:14px;">Open Admin Dashboard</a>
          </td>
        </tr>
        <tr>
          <td style="padding:16px 32px;background:#f9f9f9;border-top:1px solid #eeeeee;">
            <p style="margin:0;font-size:12px;color:#999999;line-height:1.5;">Daily digest from the Coss Cloud Solutions admin system. Sent at 7:30 AM IST.</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function esc(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
