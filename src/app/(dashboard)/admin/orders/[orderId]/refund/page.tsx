"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";

export default function RefundPage({
  params,
}: {
  params: { orderId: string };
}) {
  const router = useRouter();
  const [refundType, setRefundType] = useState("full");
  const [partialAmount, setPartialAmount] = useState("");
  const [reason, setReason] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const handleRefund = async () => {
    if (!reason.trim()) {
      toast.error("Please provide a refund reason");
      return;
    }

    if (refundType === "partial" && !partialAmount) {
      toast.error("Please enter the refund amount");
      return;
    }

    setIsProcessing(true);

    try {
      const response = await fetch(
        `/api/admin/orders/${params.orderId}/refund`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: refundType,
            amount:
              refundType === "partial" ? parseFloat(partialAmount) : undefined,
            reason,
          }),
        }
      );

      if (!response.ok) throw new Error("Failed to process refund");

      toast.success("Refund processed successfully");
      router.push(`/admin/orders/${params.orderId}`);
    } catch (error) {
      toast.error("Failed to process refund");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Process Refund</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label>Refund Type</Label>
            <RadioGroup value={refundType} onValueChange={setRefundType}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="full" id="full" />
                <Label htmlFor="full">Full Refund</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="partial" id="partial" />
                <Label htmlFor="partial">Partial Refund</Label>
              </div>
            </RadioGroup>
          </div>

          {refundType === "partial" && (
            <div>
              <Label htmlFor="amount">Refund Amount</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={partialAmount}
                onChange={(e) => setPartialAmount(e.target.value)}
              />
            </div>
          )}

          <div>
            <Label htmlFor="reason">Refund Reason</Label>
            <Textarea
              id="reason"
              placeholder="Please provide a reason for the refund..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
            />
          </div>

          <div className="flex justify-end space-x-4">
            <Button
              variant="outline"
              onClick={() => router.back()}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button onClick={handleRefund} disabled={isProcessing}>
              {isProcessing ? "Processing..." : "Process Refund"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
