"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signInSchema, type SignInInput } from "@/lib/validations/auth";
import { useAuth } from "@/components/providers/auth-provider";
import { MotionButton } from "@/components/ui/motion-button";
import { MotionInput } from "@/components/ui/motion-elements";
import { EnhancedCard } from "@/components/ui/enhanced-card";
import {
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") || "/dashboard";
  const justRegistered = searchParams.get("registered") === "true";

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { signIn } = useAuth();

  const form = useForm<SignInInput>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: SignInInput) => {
    console.log("[LoginForm] onSubmit called with:", data);
    console.log("[LoginForm] Form validation errors:", form.formState.errors);
    setIsLoading(true);
    setError(null);

    try {
      const { error } = await signIn(data.email, data.password);

      if (error) {
        setError(error.message);
        return;
      }

      // Force a router refresh to ensure middleware runs with new session
      router.refresh();

      // Small delay to ensure cookies are set
      await new Promise((resolve) => setTimeout(resolve, 100));

      // The auth provider will handle the user data, we just need to redirect
      router.push(redirectTo);
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-50 to-white px-4 py-12 sm:px-6 lg:px-8">
      <EnhancedCard className="w-full max-w-md border-0 shadow-xl">
        <CardHeader className="space-y-1 pb-8 text-center">
          <CardTitle className="mb-2 text-3xl font-bold text-gray-900">
            Welcome back
          </CardTitle>
          <CardDescription className="text-gray-600">
            Sign in to your account or{" "}
            <Link
              href="/signup"
              className="font-medium text-indigo-600 transition-colors hover:text-indigo-700"
            >
              create a new account
            </Link>
          </CardDescription>
        </CardHeader>
        <CardContent className="px-8 pb-8">
          <Form {...form}>
            <form
              onSubmit={(e) => {
                console.log("[LoginForm] Form submit event triggered");
                e.preventDefault();
                console.log("[LoginForm] Calling handleSubmit");
                form.handleSubmit(onSubmit)(e);
              }}
              method="post"
              action="#"
              className="space-y-6"
              data-testid="login-form"
            >
              {justRegistered && (
                <Alert className="border-green-200 bg-green-50">
                  <AlertDescription className="text-green-700">
                    Account created successfully! Please sign in.
                  </AlertDescription>
                </Alert>
              )}

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-medium text-gray-700">
                      Email address
                    </FormLabel>
                    <FormControl>
                      <MotionInput
                        {...field}
                        type="email"
                        placeholder="you@example.com"
                        autoComplete="email"
                        className="h-12 rounded-lg border-gray-200 focus:border-indigo-500 focus:ring-indigo-500"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-medium text-gray-700">
                      Password
                    </FormLabel>
                    <FormControl>
                      <MotionInput
                        {...field}
                        type="password"
                        placeholder="••••••••"
                        autoComplete="current-password"
                        className="h-12 rounded-lg border-gray-200 focus:border-indigo-500 focus:ring-indigo-500"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <MotionButton
                type="submit"
                className="h-12 w-full rounded-lg bg-indigo-600 text-base font-semibold shadow-lg transition-all hover:bg-indigo-700 hover:shadow-xl"
                disabled={isLoading}
                data-testid="login-submit"
                onClick={() => console.log("[LoginForm] Submit button clicked")}
              >
                {isLoading ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                    Signing in...
                  </>
                ) : (
                  "Sign in"
                )}
              </MotionButton>
            </form>
          </Form>
        </CardContent>
      </EnhancedCard>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-50 to-white px-4 py-12 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-200 border-t-indigo-600"></div>
            </div>
            <p className="font-medium text-indigo-600">Loading...</p>
          </div>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
