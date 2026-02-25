import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

export default function PaymentCallback() {
  const [, setLocation] = useLocation();
  const [status, setStatus] = useState<"loading" | "success" | "failed">("loading");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const txRef = params.get("tx_ref");
    const txStatus = params.get("status");
    const transactionId = params.get("transaction_id");

    if (txStatus === "successful" && transactionId) {
      apiRequest("GET", `/api/payment/verify/${transactionId}`)
        .then((res) => res.json())
        .then((data) => {
          setStatus(data.data?.status === "successful" ? "success" : "failed");
        })
        .catch(() => setStatus("failed"));
    } else if (txStatus === "cancelled") {
      setStatus("failed");
    } else {
      // Give it a moment then mark as success if we have a tx_ref (webhook will handle the rest)
      setTimeout(() => setStatus(txRef ? "success" : "failed"), 2000);
    }
  }, []);

  return (
    <Layout>
      <div className="container mx-auto px-4 py-20 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-8 pb-8 text-center space-y-4">
            {status === "loading" && (
              <>
                <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
                <h2 className="text-xl font-semibold">Verifying payment...</h2>
                <p className="text-muted-foreground">Please wait while we confirm your payment.</p>
              </>
            )}
            {status === "success" && (
              <>
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto" />
                <h2 className="text-xl font-semibold">Payment Successful!</h2>
                <p className="text-muted-foreground">Your order has been confirmed. The seller has been notified.</p>
                <div className="flex gap-3 justify-center pt-4">
                  <Button onClick={() => setLocation("/dashboard")}>View Dashboard</Button>
                  <Button variant="outline" onClick={() => setLocation("/marketplace")}>Continue Shopping</Button>
                </div>
              </>
            )}
            {status === "failed" && (
              <>
                <XCircle className="h-12 w-12 text-red-500 mx-auto" />
                <h2 className="text-xl font-semibold">Payment Failed</h2>
                <p className="text-muted-foreground">Something went wrong with your payment. Please try again.</p>
                <div className="flex gap-3 justify-center pt-4">
                  <Button onClick={() => setLocation("/cart")}>Return to Cart</Button>
                  <Button variant="outline" onClick={() => setLocation("/dashboard")}>View Orders</Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
