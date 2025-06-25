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
}

export interface FormSettings {
  webhookUrl?: string;
  redirectUrl?: string;
  submitButtonText?: string;
  successMessage?: string;
}

export interface Form {
  id: string;
  name: string;
  description?: string;
  schema: FormField[];
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
