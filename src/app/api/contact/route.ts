import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { siteConfig } from "@/lib/config";

export const POST = async (req: NextRequest) => {
  try {
    const { name, email, message, locale = "en" } = await req.json();

    if (!name || !email || !message) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // SMTP credentials are deployment secrets — no personal fallbacks.
    const smtpHost = process.env.SMTP_HOST;
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;
    if (!smtpHost || !smtpUser || !smtpPass) {
      console.error("Contact form: SMTP_HOST/SMTP_USER/SMTP_PASS are not configured.");
      return NextResponse.json(
        { error: "Email service is not configured" },
        { status: 500 }
      );
    }

    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: Number(process.env.SMTP_PORT || 465),
      secure: true,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });

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

    const recipientEmail = siteConfig.person.email;
    const senderName = siteConfig.person.fullName;
    const fromAddress = process.env.SMTP_FROM || siteConfig.contact.smtpFrom || smtpUser;

    await transporter.sendMail({
      from: `"${senderName}" <${fromAddress}>`,
      to: recipientEmail,
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
