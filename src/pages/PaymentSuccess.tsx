
import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [processed, setProcessed] = useState(false);
  const { toast } = useToast();
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    const verifyPaymentAndAddCredits = async () => {
      if (!sessionId) {
        console.log("No session ID found");
        setLoading(false);
        return;
      }

      try {
        console.log("Verifying payment for session:", sessionId);
        
        // Call the handle-payment-success function to verify and add credits
        const { data, error } = await supabase.functions.invoke('handle-payment-success', {
          body: { session_id: sessionId }
        });

        if (error) {
          console.error("Error verifying payment:", error);
          toast({
            title: "Payment Verification Error",
            description: "There was an issue verifying your payment. Please contact support.",
            variant: "destructive",
          });
        } else {
          console.log("Payment verified successfully:", data);
          setProcessed(true);
          toast({
            title: "Payment Successful!",
            description: "Your credits have been added to your account.",
          });
        }
      } catch (error) {
        console.error("Payment verification failed:", error);
        toast({
          title: "Payment Verification Failed",
          description: "Please contact support if your credits weren't added.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    verifyPaymentAndAddCredits();
  }, [sessionId, toast]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Verifying your payment...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow p-8 text-center">
        <div className="mb-6">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {processed ? "Payment Successful!" : "Payment Completed"}
          </h1>
          <p className="text-gray-600">
            {processed 
              ? "Thank you for your purchase. Your credits have been added to your account."
              : "Your payment has been processed. Your credits should be available shortly."
            }
          </p>
        </div>
        
        <Link
          to="/"
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Return to Dashboard
        </Link>
      </div>
    </div>
  );
};

export default PaymentSuccess;
