import { AlertTriangle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export const SecurityNotice = () => {
  return (
    <Alert className="mb-4">
      <AlertTriangle className="h-4 w-4" />
      <AlertDescription>
        Your data is protected with enterprise-grade security. We use end-to-end encryption 
        and never store your payment information.
      </AlertDescription>
    </Alert>
  );
};