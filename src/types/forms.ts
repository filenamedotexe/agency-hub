export type FieldType =
  | "text"
  | "textarea"
  | "number"
  | "email"
  | "tel"
  | "date"
  | "select"
  | "checkbox"
  | "radio"
  | "file"
  | "list";

export interface FieldOption {
  label: string;
  value: string;
}

export interface FieldValidation {
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
}

export interface FormField {
  id: string;
  type: FieldType;
  label: string;
  name: string;
  required: boolean;
  placeholder?: string;
  description?: string;
  options?: FieldOption[];
  validation?: FieldValidation;
  stepId?: string; // For multi-step forms
}

export interface FormStep {
  id: string;
  title: string;
  description?: string;
  order: number;
}

export interface FormSettings {
  webhookUrl?: string;
  redirectUrl?: string;
  submitButtonText?: string;
  successMessage?: string;
  multiStep?: boolean;
  progressIndicator?: "steps" | "circular" | "linear";
  allowStepNavigation?: boolean; // Allow users to go back/forward between steps
  validateStepBeforeNext?: boolean; // Validate current step before moving to next
}

export interface Form {
  id: string;
  name: string;
  description?: string;
  schema: FormField[];
  steps?: FormStep[]; // For multi-step forms
  settings?: FormSettings;
  serviceId?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    responses: number;
  };
}

export interface FormResponse {
  id: string;
  formId: string;
  clientId: string;
  responseData: Record<
    string,
    {
      value: any;
      type: FieldType;
      label: string;
    }
  >;
  submittedAt: string;
  form?: Form;
  client?: {
    id: string;
    name: string;
    businessName: string;
  };
}
