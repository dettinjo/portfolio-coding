import { NextRequest, NextResponse } from "next/server";
import { getPayload } from "payload";
import config from "@payload-config";

export const POST = async (req: NextRequest) => {
  try {
    const { name, email, message, locale = "en" } = await req.json();

    if (!name || !email || !message) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const payload = await getPayload({ config });

    const subject =
      locale === "de"
        ? `Neue Kontaktanfrage von ${name} - Portfolio`
        : `New Contact Form Submission from ${name} - Portfolio`;

    const html =
      locale === "de"
        ? `
        <h1>Neue Kontaktanfrage</h1>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>E-Mail:</strong> ${email}</p>
        <p><strong>Nachricht:</strong></p>
        <p>${message.replace(/\n/g, "<br>")}</p>
      `
        : `
        <h1>New Contact Form Submission</h1>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Message:</strong></p>
        <p>${message.replace(/\n/g, "<br>")}</p>
      `;

    await payload.sendEmail({
      to: "hello@joeldettinger.de",
      subject,
      html,
      replyTo: email,
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Error sending email:", error);
    return NextResponse.json(
      { error: "Failed to send email" },
      { status: 500 }
    );
  }
};
