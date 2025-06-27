"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signUpSchema, type SignUpInput } from "@/lib/validations/auth";
import { AuthClientService } from "@/services/auth.client";
import { UserRole } from "@/types/user";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { MotionButton } from "@/components/ui/motion-button";
import { Input } from "@/components/ui/input";
import { MotionInput } from "@/components/ui/motion-elements";
import { Label } from "@/components/ui/label";
import {
  Card,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StepProgress } from "@/components/ui/progress-indicators";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { animations } from "@/lib/animations";

const roleOptions = [
  {
    value: UserRole.CLIENT,
    label: "Client",
    description: "Access your services and forms",
  },
  {
    value: UserRole.COPYWRITER,
    label: "Copywriter",
    description: "Create and manage content",
  },
  {
    value: UserRole.EDITOR,
    label: "Editor",
    description: "Review and edit content",
  },
  {
    value: UserRole.VA,
    label: "Virtual Assistant",
    description: "Support various tasks",
  },
];

export default function SignUpPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(0);

  const authService = new AuthClientService();

  const form = useForm<SignUpInput>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
      name: "",
      businessName: "",
      role: UserRole.CLIENT,
    },
  });

  const selectedRole = form.watch("role");

  const steps = [
    {
      title: "Account Credentials",
      description: "Set up your email and password",
      fields: ["email", "password", "confirmPassword"] as const,
    },
    {
      title: "Account Type",
      description: "Choose how you'll use the platform",
      fields: ["role"] as const,
    },
    {
      title: "Personal Information",
      description: "Tell us about yourself",
      fields:
        selectedRole === UserRole.CLIENT
          ? (["name", "businessName"] as const)
          : (["name"] as const),
    },
  ];

  const validateStep = async (stepIndex: number) => {
    const fieldsToValidate = steps[stepIndex].fields;
    const isValid = await form.trigger(fieldsToValidate);
    return isValid;
  };

  const handleNext = async () => {
    const isValid = await validateStep(currentStep);
    if (isValid && currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
      setError(null);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      setError(null);
    }
  };

  const onSubmit = async (data: SignUpInput) => {
    setIsLoading(true);
    setError(null);

    try {
      const { user, error } = await authService.signUp({
        email: data.email,
        password: data.password,
        role: data.role,
        profileData: {
          name: data.name,
          businessName: data.businessName,
        },
      });

      if (error) {
        setError(error.message);
        return;
      }

      if (user) {
        // Show success message and redirect to login
        router.push("/login?registered=true");
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email address</FormLabel>
                  <FormControl>
                    <MotionInput
                      {...field}
                      type="email"
                      placeholder="you@example.com"
                      autoComplete="email"
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
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <MotionInput
                      {...field}
                      type="password"
                      placeholder="Minimum 8 characters"
                      autoComplete="new-password"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirm Password</FormLabel>
                  <FormControl>
                    <MotionInput
                      {...field}
                      type="password"
                      placeholder="Re-enter your password"
                      autoComplete="new-password"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        );

      case 1:
        return (
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Account Type</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select an account type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {roleOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          <div className="flex flex-col">
                            <span className="font-medium">{option.label}</span>
                            <span className="text-xs text-gray-500">
                              {option.description}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="rounded-lg bg-gray-50 p-4">
              <p className="text-sm text-gray-600">
                Choose the account type that best describes how you&apos;ll use
                our platform. Admin and Service Manager accounts must be created
                by an existing admin.
              </p>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <MotionInput
                      {...field}
                      type="text"
                      placeholder="John Doe"
                      autoComplete="name"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {selectedRole === UserRole.CLIENT && (
              <FormField
                control={form.control}
                name="businessName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Business Name</FormLabel>
                    <FormControl>
                      <MotionInput
                        {...field}
                        type="text"
                        placeholder="Your Company Name"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <Card className="w-full max-w-lg">
        <CardHeader className="space-y-1">
          <CardTitle className="text-center text-2xl font-bold">
            Create your account
          </CardTitle>
          <CardDescription className="text-center">
            Or{" "}
            <Link
              href="/login"
              className="font-medium text-brand-primary hover:text-brand-primary-hover"
            >
              sign in to your existing account
            </Link>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-8">
            <StepProgress
              currentStep={currentStep}
              steps={steps.map((step) => step.title)}
            />
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStep}
                  {...animations.fadeIn}
                  transition={{ duration: 0.3 }}
                >
                  <div className="min-h-[280px]">
                    <h3 className="mb-2 text-lg font-semibold">
                      {steps[currentStep].title}
                    </h3>
                    <p className="mb-6 text-sm text-gray-600">
                      {steps[currentStep].description}
                    </p>
                    {renderStepContent()}
                  </div>
                </motion.div>
              </AnimatePresence>

              <div className="flex justify-between pt-4">
                <MotionButton
                  type="button"
                  variant="outline"
                  onClick={handlePrevious}
                  disabled={currentStep === 0}
                  className={cn(
                    "transition-opacity",
                    currentStep === 0 && "invisible"
                  )}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Previous
                </MotionButton>

                {currentStep < steps.length - 1 ? (
                  <MotionButton
                    type="button"
                    onClick={handleNext}
                    className="ml-auto"
                  >
                    Next
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </MotionButton>
                ) : (
                  <MotionButton
                    type="submit"
                    className="ml-auto"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      "Creating account..."
                    ) : (
                      <>
                        <Check className="mr-2 h-4 w-4" />
                        Create account
                      </>
                    )}
                  </MotionButton>
                )}
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
