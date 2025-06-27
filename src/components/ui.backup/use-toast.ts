import { toast } from "sonner";

export const useToast = () => {
  return {
    toast: {
      ...toast,
      title: (title: string, options?: any) => toast(title, options),
      description: (description: string, options?: any) =>
        toast(description, options),
    },
  };
};
