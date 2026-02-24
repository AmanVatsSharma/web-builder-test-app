/**
 * @file route.ts
 * @module api/auth/request-password-reset
 * @description Creates one-time password reset tokens and dispatches reset emails.
 * @author BharatERP
 * @created 2025-02-23
 */

import { randomBytes } from "crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";

const requestSchema = z.object({
  email: z.string().email("Invalid email address"),
});

const sendResetPasswordEmail = async (to: string, resetUrl: string) => {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  if (!apiKey || !from) return false;

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to,
      subject: "Reset your password",
      html: `<p>Use this secure link to reset your password:</p><p><a href="${resetUrl}">${resetUrl}</a></p><p>This link expires in 1 hour.</p>`,
    }),
  });

  return response.ok;
};

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = requestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? "Validation failed" },
        { status: 400 }
      );
    }

    const isEmailProviderConfigured = Boolean(
      process.env.RESEND_API_KEY && process.env.RESEND_FROM_EMAIL
    );
    if (process.env.NODE_ENV === "production" && !isEmailProviderConfigured) {
      return NextResponse.json(
        { error: "Password reset email provider is not configured." },
        { status: 500 }
      );
    }

    const { email } = parsed.data;
    const user = await db.user.findUnique({
      where: { email },
      select: { email: true },
    });

    // Return generic success to prevent user enumeration.
    if (!user) {
      return NextResponse.json({ success: true });
    }

    const token = randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 60 * 60 * 1000);
    const appUrl = (
      process.env.NEXTAUTH_URL ??
      process.env.NEXT_PUBLIC_URL ??
      new URL(request.url).origin
    ).replace(/\/$/, "");
    const resetUrl = `${appUrl}/agency/reset-password?token=${encodeURIComponent(
      token
    )}&email=${encodeURIComponent(email)}`;

    await db.verificationToken.deleteMany({
      where: { identifier: email },
    });

    await db.verificationToken.create({
      data: {
        identifier: email,
        token,
        expires,
      },
    });

    if (isEmailProviderConfigured) {
      const isSent = await sendResetPasswordEmail(email, resetUrl);
      if (!isSent) {
        return NextResponse.json(
          { error: "Failed to send password reset email." },
          { status: 502 }
        );
      }
    }

    if (process.env.NODE_ENV !== "production" && !isEmailProviderConfigured) {
      return NextResponse.json({ success: true, resetUrl });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
