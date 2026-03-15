"use client";

import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

type ServerAction = (formData: FormData) => Promise<unknown>;

type ActionToastFormProps = {
  action: ServerAction;
  successMessage: string;
  errorMessage: string;
  className?: string;
  id?: string;
  children: ReactNode;
  refreshOnSuccess?: boolean;
  onSuccess?: (formData: FormData) => void;
};

export function ActionToastForm({
  action,
  successMessage,
  errorMessage,
  className,
  id,
  children,
  refreshOnSuccess = true,
  onSuccess,
}: ActionToastFormProps) {
  const router = useRouter();

  async function handleAction(formData: FormData) {
    try {
      await action(formData);
      toast.success(successMessage);
      onSuccess?.(formData);
      if (refreshOnSuccess) {
        router.refresh();
      }
    } catch (error) {
      const details = error instanceof Error ? error.message : "";
      toast.error(errorMessage, {
        description: details && details !== errorMessage ? details : undefined,
      });
    }
  }

  return (
    <form id={id} action={handleAction} className={className}>
      {children}
    </form>
  );
}
