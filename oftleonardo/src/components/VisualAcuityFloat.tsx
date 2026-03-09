import { useEffect } from "react";
import { Eye } from "lucide-react";
import { Toaster, toast } from "sonner";

const TOAST_ID = "visual-acuity-cta";
const STORAGE_KEY = "visual-acuity-cta-dismissed";

export default function VisualAcuityFloat() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const wasDismissed = window.sessionStorage.getItem(STORAGE_KEY) === "true";
    if (wasDismissed) return;

    const timer = window.setTimeout(() => {
      toast.info("Teste de acuidade visual online", {
        id: TOAST_ID,
        description:
          "Faça uma triagem rápida da sua visão pelo celular em poucos minutos.",
        duration: 15000,
        icon: <Eye className="size-4" />,
        action: {
          label: "Fazer teste",
          onClick: () => {
            window.sessionStorage.setItem(STORAGE_KEY, "true");
            window.location.assign("/acuidade-visual");
          },
        },
        onDismiss: () => {
          window.sessionStorage.setItem(STORAGE_KEY, "true");
        },
      });
    }, 1500);

    return () => {
      window.clearTimeout(timer);
      toast.dismiss(TOAST_ID);
    };
  }, []);

  return <Toaster position="bottom-left" closeButton richColors />;
}
