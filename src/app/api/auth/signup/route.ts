/**
 * @file route.ts
 * @module api/auth/signup
 * @description Sign-up API route for creating new users
 * @author BharatERP
 * @created 2025-02-23
 */

import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { db } from "@/lib/db";

const signUpSchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = signUpSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? "Validation failed" },
        { status: 400 }
      );
    }

    const { name, email, password } = parsed.data;

    const existingUser = await db.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      const errorMessage = existingUser.passwordHash
        ? "An account with this email already exists"
        : "Account already exists. Please set your password using reset password.";
      return NextResponse.json(
        { error: errorMessage },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);

    await db.user.create({
      data: {
        name,
        email,
        passwordHash,
        avatarUrl: "",
        image: null,
        emailVerified: new Date(),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
