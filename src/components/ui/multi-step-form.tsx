"use client";

import React, { useState, createContext, useContext, ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { MotionButton } from "./motion-button";
import { StepProgress } from "./progress-indicators";
import { CircularProgress } from "./progress-indicators";
import { ArrowLeft, ArrowRight, Check, Loader2 } from "lucide-react";
import { animations } from "@/lib/animations";

// Context for multi-step form
interface MultiStepFormContextType {
  currentStep: number;
  totalSteps: number;
  goToStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  isFirstStep: boolean;
  isLastStep: boolean;
  canGoNext: boolean;
  setCanGoNext: (value: boolean) => void;
}

const MultiStepFormContext = createContext<MultiStepFormContextType | null>(
  null
);

export const useMultiStepForm = () => {
  const context = useContext(MultiStepFormContext);
  if (!context) {
    throw new Error(
      "useMultiStepForm must be used within MultiStepFormProvider"
    );
  }
  return context;
};

// Main provider component
interface MultiStepFormProviderProps {
  children: ReactNode;
  initialStep?: number;
  onComplete?: () => void;
}

export function MultiStepFormProvider({
  children,
  initialStep = 0,
  onComplete,
}: MultiStepFormProviderProps) {
  const [currentStep, setCurrentStep] = useState(initialStep);
  const [canGoNext, setCanGoNext] = useState(true);

  // Count total steps by counting FormStep components
  const totalSteps = React.Children.toArray(children).filter(
    (child) => React.isValidElement(child) && child.type === FormStep
  ).length;

  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === totalSteps - 1;

  const goToStep = (step: number) => {
    if (step >= 0 && step < totalSteps) {
      setCurrentStep(step);
      setCanGoNext(true);
    }
  };

  const nextStep = () => {
    if (!isLastStep && canGoNext) {
      setCurrentStep((prev) => prev + 1);
      setCanGoNext(true);
    } else if (isLastStep && canGoNext && onComplete) {
      onComplete();
    }
  };

  const prevStep = () => {
    if (!isFirstStep) {
      setCurrentStep((prev) => prev - 1);
      setCanGoNext(true);
    }
  };

  return (
    <MultiStepFormContext.Provider
      value={{
        currentStep,
        totalSteps,
        goToStep,
        nextStep,
        prevStep,
        isFirstStep,
        isLastStep,
        canGoNext,
        setCanGoNext,
      }}
    >
      {children}
    </MultiStepFormContext.Provider>
  );
}

// Individual step component
interface FormStepProps {
  children: ReactNode;
  title?: string;
  description?: string;
  validation?: () => boolean | Promise<boolean>;
}

export function FormStep({
  children,
  title,
  description,
  validation,
}: FormStepProps) {
  return (
    <div className="space-y-4">
      {(title || description) && (
        <div className="mb-6">
          {title && <h3 className="text-lg font-semibold">{title}</h3>}
          {description && (
            <p className="mt-1 text-sm text-gray-600">{description}</p>
          )}
        </div>
      )}
      {children}
    </div>
  );
}

// Progress indicator component
interface FormProgressProps {
  variant?: "steps" | "circular" | "linear";
  stepLabels?: string[];
  className?: string;
}

export function FormProgress({
  variant = "steps",
  stepLabels,
  className,
}: FormProgressProps) {
  const { currentStep, totalSteps } = useMultiStepForm();

  if (variant === "circular") {
    const percentage = ((currentStep + 1) / totalSteps) * 100;
    return (
      <div className={cn("flex items-center justify-center", className)}>
        <CircularProgress value={Math.round(percentage)} size={80} />
      </div>
    );
  }

  if (variant === "linear") {
    const percentage = ((currentStep + 1) / totalSteps) * 100;
    return (
      <div className={cn("w-full", className)}>
        <div className="mb-2 flex justify-between">
          <span className="text-sm font-medium">
            Step {currentStep + 1} of {totalSteps}
          </span>
          <span className="text-sm text-gray-600">
            {Math.round(percentage)}%
          </span>
        </div>
        <div className="h-2 w-full rounded-full bg-gray-200">
          <div
            className="h-2 rounded-full bg-primary transition-all duration-300"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    );
  }

  // Default to steps variant
  const labels =
    stepLabels || Array.from({ length: totalSteps }, (_, i) => `Step ${i + 1}`);
  return (
    <div className={className}>
      <StepProgress currentStep={currentStep} steps={labels} />
    </div>
  );
}

// Step content wrapper with animations
interface StepContentProps {
  children: ReactNode;
  className?: string;
}

export function StepContent({ children, className }: StepContentProps) {
  const { currentStep } = useMultiStepForm();

  const steps = React.Children.toArray(children).filter(
    (child) => React.isValidElement(child) && child.type === FormStep
  );

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={currentStep}
        {...animations.fadeIn}
        transition={{ duration: 0.3 }}
        className={className}
      >
        {steps[currentStep]}
      </motion.div>
    </AnimatePresence>
  );
}

// Navigation component
interface FormNavigationProps {
  onNext?: () => void | Promise<void>;
  onPrev?: () => void;
  onSubmit?: () => void | Promise<void>;
  nextLabel?: string;
  prevLabel?: string;
  submitLabel?: string;
  isLoading?: boolean;
  className?: string;
}

export function FormNavigation({
  onNext,
  onPrev,
  onSubmit,
  nextLabel = "Next",
  prevLabel = "Previous",
  submitLabel = "Submit",
  isLoading = false,
  className,
}: FormNavigationProps) {
  const {
    nextStep,
    prevStep,
    isFirstStep,
    isLastStep,
    canGoNext,
    setCanGoNext,
  } = useMultiStepForm();
  const [loading, setLoading] = useState(false);

  const handleNext = async () => {
    if (onNext) {
      setLoading(true);
      try {
        await onNext();
        nextStep();
      } catch (error) {
        console.error("Error in next step:", error);
      } finally {
        setLoading(false);
      }
    } else {
      nextStep();
    }
  };

  const handlePrev = () => {
    if (onPrev) {
      onPrev();
    }
    prevStep();
  };

  const handleSubmit = async () => {
    if (onSubmit) {
      setLoading(true);
      try {
        await onSubmit();
      } catch (error) {
        console.error("Error in form submission:", error);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className={cn("flex items-center justify-between pt-6", className)}>
      <MotionButton
        type="button"
        variant="outline"
        onClick={handlePrev}
        disabled={isFirstStep || loading || isLoading}
        className={cn("transition-opacity", isFirstStep && "invisible")}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        {prevLabel}
      </MotionButton>

      {!isLastStep ? (
        <MotionButton
          type="button"
          onClick={handleNext}
          disabled={!canGoNext || loading || isLoading}
          className="ml-auto"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              {nextLabel}
              <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </MotionButton>
      ) : (
        <MotionButton
          type="button"
          onClick={handleSubmit}
          disabled={!canGoNext || loading || isLoading}
          className="ml-auto"
        >
          {loading || isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <Check className="mr-2 h-4 w-4" />
              {submitLabel}
            </>
          )}
        </MotionButton>
      )}
    </div>
  );
}

// Complete multi-step form component
interface MultiStepFormProps {
  children: ReactNode;
  onComplete?: () => void;
  className?: string;
  progressVariant?: "steps" | "circular" | "linear";
  stepLabels?: string[];
}

export function MultiStepForm({
  children,
  onComplete,
  className,
  progressVariant = "steps",
  stepLabels,
}: MultiStepFormProps) {
  return (
    <MultiStepFormProvider onComplete={onComplete}>
      <div className={cn("space-y-6", className)}>{children}</div>
    </MultiStepFormProvider>
  );
}

// Example usage component for documentation
export function MultiStepFormExample() {
  const handleComplete = () => {
    console.log("Form completed!");
  };

  return (
    <MultiStepForm
      onComplete={handleComplete}
      stepLabels={["Account Info", "Personal Details", "Preferences"]}
    >
      <FormProgress className="mb-8" />

      <StepContent className="min-h-[300px]">
        <FormStep
          title="Account Information"
          description="Set up your account credentials"
        >
          <div className="space-y-4">
            <input
              type="email"
              placeholder="Email"
              className="w-full rounded border p-2"
            />
            <input
              type="password"
              placeholder="Password"
              className="w-full rounded border p-2"
            />
          </div>
        </FormStep>

        <FormStep title="Personal Details" description="Tell us about yourself">
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Full Name"
              className="w-full rounded border p-2"
            />
            <input
              type="tel"
              placeholder="Phone Number"
              className="w-full rounded border p-2"
            />
          </div>
        </FormStep>

        <FormStep title="Preferences" description="Customize your experience">
          <div className="space-y-4">
            <label className="flex items-center space-x-2">
              <input type="checkbox" />
              <span>Receive email notifications</span>
            </label>
            <label className="flex items-center space-x-2">
              <input type="checkbox" />
              <span>Subscribe to newsletter</span>
            </label>
          </div>
        </FormStep>
      </StepContent>

      <FormNavigation
        onSubmit={async () => {
          // Handle form submission
          await new Promise((resolve) => setTimeout(resolve, 2000));
          console.log("Form submitted!");
        }}
      />
    </MultiStepForm>
  );
}
