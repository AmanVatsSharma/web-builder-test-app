"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

const requestSchema = z.object({
  email: z.string().email("Enter a valid email address"),
});

const resetSchema = z
  .object({
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(8, "Confirm password is required"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });

type RequestValues = z.infer<typeof requestSchema>;
type ResetValues = z.infer<typeof resetSchema>;

const Page = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const email = searchParams.get("email");

  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [devResetUrl, setDevResetUrl] = useState<string | null>(null);

  const requestForm = useForm<RequestValues>({
    resolver: zodResolver(requestSchema),
    defaultValues: { email: "" },
  });

  const resetForm = useForm<ResetValues>({
    resolver: zodResolver(resetSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  const onRequestReset = async (values: RequestValues) => {
    setError(null);
    setMessage(null);
    setDevResetUrl(null);

    const response = await fetch("/api/auth/request-password-reset", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    const payload = (await response.json()) as { error?: string; resetUrl?: string };

    if (!response.ok) {
      setError(payload.error ?? "Could not request a reset link.");
      return;
    }

    if (payload.resetUrl) {
      setDevResetUrl(payload.resetUrl);
    }
    setMessage("If that account exists, a reset link has been sent.");
  };

  const onResetPassword = async (values: ResetValues) => {
    if (!token || !email) {
      setError("Reset link is invalid.");
      return;
    }

    setError(null);
    setMessage(null);

    const response = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        token,
        password: values.password,
      }),
    });
    const payload = (await response.json()) as { error?: string };

    if (!response.ok) {
      setError(payload.error ?? "Could not reset password.");
      return;
    }

    setMessage("Password updated successfully. Redirecting to sign in...");
    setTimeout(() => router.push("/agency/sign-in"), 1200);
  };

  const isResetFlow = Boolean(token && email);

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{isResetFlow ? "Set a new password" : "Reset your password"}</CardTitle>
        </CardHeader>
        <CardContent>
          {isResetFlow ? (
            <Form {...resetForm}>
              <form onSubmit={resetForm.handleSubmit(onResetPassword)} className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Resetting password for <span className="font-medium">{email}</span>
                </p>
                <FormField
                  control={resetForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>New password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="••••••••" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={resetForm.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm new password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="••••••••" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={resetForm.formState.isSubmitting}>
                  {resetForm.formState.isSubmitting ? "Updating..." : "Update password"}
                </Button>
              </form>
            </Form>
          ) : (
            <Form {...requestForm}>
              <form onSubmit={requestForm.handleSubmit(onRequestReset)} className="space-y-4">
                <FormField
                  control={requestForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="you@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={requestForm.formState.isSubmitting}>
                  {requestForm.formState.isSubmitting ? "Sending..." : "Send reset link"}
                </Button>
              </form>
            </Form>
          )}

          {error ? <p className="mt-4 text-sm text-destructive">{error}</p> : null}
          {message ? <p className="mt-4 text-sm text-emerald-600">{message}</p> : null}
          {devResetUrl ? (
            <p className="mt-2 text-xs text-muted-foreground break-all">
              Dev reset link:{" "}
              <a href={devResetUrl} className="underline">
                {devResetUrl}
              </a>
            </p>
          ) : null}

          <div className="mt-4 text-center text-sm text-muted-foreground">
            <Link href="/agency/sign-in" className="text-primary hover:underline">
              Back to sign in
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Page;
