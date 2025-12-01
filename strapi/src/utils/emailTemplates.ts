// src/utils/emailTemplates.ts

// --- Style & Color Palette (inspired by your globals.css) ---
// We define these as constants for easy management and consistency.
const colors = {
  background: '#f8fafc',    // Corresponds to your light mode background
  foreground: '#18181b',    // Corresponds to your light mode foreground
  primary: '#4945FF',       // A vibrant accent, like Strapi's brand color
  card: '#ffffff',
  border: '#e5e7eb',
  mutedForeground: '#64748b',
};

const fontStack = `Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"`;

// --- Base Template Wrapper ---
// This function wraps our content in a responsive, email-safe HTML structure.
const createBaseTemplate = (content: string): string => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap');
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: ${colors.background}; font-family: ${fontStack};">
  <table border="0" cellpadding="0" cellspacing="0" width="100%">
    <tr>
      <td style="padding: 20px 0;">
        <table align="center" border="0" cellpadding="0" cellspacing="0" width="600" style="max-width: 600px; border-collapse: collapse; background-color: ${colors.card}; border: 1px solid ${colors.border}; border-radius: 8px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
          <tr>
            <td style="padding: 40px 30px;">
              ${content}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;


// --- Client Confirmation Email ---
interface ClientEmailParams {
  clientName: string;
  albumTitle: string;
  selectedCount: number;
  photographerName: string;
}

export const clientConfirmationTemplates = {
  en: ({ clientName, albumTitle, selectedCount, photographerName }: ClientEmailParams) => {
    const subject = `✅ Confirmation: We've Received Your Selections for "${albumTitle}"`;
    const body = `
      <h1 style="font-size: 24px; color: ${colors.foreground}; font-weight: 700;">Thank You, ${clientName}!</h1>
      <p style="font-size: 16px; color: ${colors.mutedForeground}; line-height: 1.5;">This is an automated confirmation that we have successfully received your image selections for the album: <strong>${albumTitle}</strong>.</p>
      <p style="font-size: 16px; color: ${colors.mutedForeground}; line-height: 1.5;">You selected <strong>${selectedCount}</strong> images.</p>
      <p style="font-size: 16px; color: ${colors.mutedForeground}; line-height: 1.5;">I will review your selections and comments shortly and be in touch with the next steps.</p>
      <br>
      <p style="font-size: 16px; color: ${colors.mutedForeground}; line-height: 1.5;">Best regards,<br>${photographerName}</p>
    `;
    return { subject, html: createBaseTemplate(body) };
  },
  de: ({ clientName, albumTitle, selectedCount, photographerName }: ClientEmailParams) => {
    const subject = `✅ Bestätigung: Wir haben Ihre Auswahl für "${albumTitle}" erhalten`;
    const body = `
      <h1 style="font-size: 24px; color: ${colors.foreground}; font-weight: 700;">Vielen Dank, ${clientName}!</h1>
      <p style="font-size: 16px; color: ${colors.mutedForeground}; line-height: 1.5;">Dies ist eine automatische Bestätigung, dass wir Ihre Bildauswahl für das Album <strong>${albumTitle}</strong> erfolgreich erhalten haben.</p>
      <p style="font-size: 16px; color: ${colors.mutedForeground}; line-height: 1.5;">Sie haben <strong>${selectedCount}</strong> Bilder ausgewählt.</p>
      <p style="font-size: 16px; color: ${colors.mutedForeground}; line-height: 1.5;">Ich werde Ihre Auswahl und Kommentare in Kürze prüfen und mich mit den nächsten Schritten bei Ihnen melden.</p>
      <br>
      <p style="font-size: 16px; color: ${colors.mutedForeground}; line-height: 1.5;">Mit freundlichen Grüßen,<br>${photographerName}</p>
    `;
    return { subject, html: createBaseTemplate(body) };
  },
};


// --- Admin Notification Email ---
interface AdminEmailParams {
  clientName: string;
  albumTitle: string;
  adminLink: string;
  quote?: string;
}

export const adminNotificationTemplates = {
  en: ({ clientName, albumTitle, adminLink, quote }: AdminEmailParams) => {
    const subject = `📥 New Client Approval Submitted: ${albumTitle}`;
    const testimonialHtml = quote 
      ? `<p style="font-size: 16px; color: ${colors.mutedForeground}; line-height: 1.5; border-left: 3px solid ${colors.border}; padding-left: 15px; font-style: italic;"><strong>Testimonial:</strong> "${quote}"</p>`
      : '';
    const body = `
      <h1 style="font-size: 24px; color: ${colors.foreground}; font-weight: 700;">New Approval Submission</h1>
      <p style="font-size: 16px; color: ${colors.mutedForeground}; line-height: 1.5;"><strong>${clientName}</strong> has submitted their image selections and feedback for the album: <strong>${albumTitle}</strong>.</p>
      ${testimonialHtml}
      <table border="0" cellpadding="0" cellspacing="0" style="margin: 24px 0;">
        <tr>
          <td>
            <a href="${adminLink}" target="_blank" style="display: inline-block; padding: 12px 24px; font-size: 16px; color: #ffffff; background-color: ${colors.primary}; text-decoration: none; border-radius: 5px; font-weight: bold;">
              View Approvals in Strapi
            </a>
          </td>
        </tr>
      </table>
    `;
    return { subject, html: createBaseTemplate(body) };
  },
  de: ({ clientName, albumTitle, adminLink, quote }: AdminEmailParams) => {
    const subject = `📥 Neue Kundengenehmigung: ${albumTitle}`;
    const testimonialHtml = quote
      ? `<p style="font-size: 16px; color: ${colors.mutedForeground}; line-height: 1.5; border-left: 3px solid ${colors.border}; padding-left: 15px; font-style: italic;"><strong>Testimonial:</strong> „${quote}“</p>`
      : '';
    const body = `
      <h1 style="font-size: 24px; color: ${colors.foreground}; font-weight: 700;">Neue Freigabe eingegangen</h1>
      <p style="font-size: 16px; color: ${colors.mutedForeground}; line-height: 1.5;"><strong>${clientName}</strong> hat die Bildauswahl und das Feedback für das Album <strong>${albumTitle}</strong> eingereicht.</p>
      ${testimonialHtml}
      <table border="0" cellpadding="0" cellspacing="0" style="margin: 24px 0;">
        <tr>
          <td>
            <a href="${adminLink}" target="_blank" style="display: inline-block; padding: 12px 24px; font-size: 16px; color: #ffffff; background-color: ${colors.primary}; text-decoration: none; border-radius: 5px; font-weight: bold;">
              Freigaben in Strapi ansehen
            </a>
          </td>
        </tr>
      </table>
    `;
    return { subject, html: createBaseTemplate(body) };
  },
};