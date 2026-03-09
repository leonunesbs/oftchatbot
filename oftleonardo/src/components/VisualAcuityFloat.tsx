import { Eye } from "lucide-react";
import { useEffect } from "react";
import { Toaster, toast } from "sonner";

export default function VisualAcuityFloat() {
  const DISMISS_KEY = "va-toast-dismissed";
  const TOAST_ID = "visual-acuity-toast";

  useEffect(() => {
    const wasDismissed = sessionStorage.getItem(DISMISS_KEY);
    if (wasDismissed) {
      return;
    }

    const timer = window.setTimeout(() => {
      toast("Teste sua visão", {
        id: TOAST_ID,
        description: "Acuidade visual online e gratuita",
        duration: Number.POSITIVE_INFINITY,
        icon: <Eye className="size-4" />,
        action: {
          label: "Iniciar teste",
          onClick: () => {
            sessionStorage.setItem(DISMISS_KEY, "1");
            window.location.assign("/acuidade-visual");
          },
        },
        onDismiss: () => {
          sessionStorage.setItem(DISMISS_KEY, "1");
        },
      });
    }, 3000);

    return () => {
      window.clearTimeout(timer);
      toast.dismiss(TOAST_ID);
    };
  }, []);

  return <Toaster position="bottom-left" closeButton={true} />;
}
