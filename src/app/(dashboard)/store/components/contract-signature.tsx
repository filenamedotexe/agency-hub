"use client";

import { useRef, useState, useEffect } from "react";
import SignaturePad from "signature_pad";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface ContractSignatureProps {
  contractContent: string;
  orderId: string;
  onComplete: () => void;
}

export function ContractSignature({
  contractContent,
  orderId,
  onComplete,
}: ContractSignatureProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [signaturePad, setSignaturePad] = useState<SignaturePad | null>(null);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [isSigning, setIsSigning] = useState(false);

  useEffect(() => {
    if (canvasRef.current) {
      const pad = new SignaturePad(canvasRef.current, {
        backgroundColor: "rgb(255, 255, 255)",
      });
      setSignaturePad(pad);

      // Resize canvas
      const resizeCanvas = () => {
        const canvas = canvasRef.current!;
        const ratio = Math.max(window.devicePixelRatio || 1, 1);
        canvas.width = canvas.offsetWidth * ratio;
        canvas.height = canvas.offsetHeight * ratio;
        canvas.getContext("2d")!.scale(ratio, ratio);
        pad.clear();
      };

      resizeCanvas();
      window.addEventListener("resize", resizeCanvas);

      return () => {
        window.removeEventListener("resize", resizeCanvas);
        pad.off();
      };
    }
  }, []);

  const clearSignature = () => {
    signaturePad?.clear();
  };

  const submitSignature = async () => {
    if (!signaturePad || signaturePad.isEmpty()) {
      toast.error("Please provide your signature");
      return;
    }

    if (!fullName || !email) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSigning(true);

    try {
      const signatureData = signaturePad.toDataURL();

      const response = await fetch(`/api/contracts/${orderId}/sign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          signatureData,
          fullName,
          email,
          userAgent: navigator.userAgent,
        }),
      });

      if (!response.ok) throw new Error("Failed to submit signature");

      toast.success("Contract signed successfully!");
      onComplete();
    } catch (error) {
      toast.error("Failed to sign contract");
    } finally {
      setIsSigning(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Service Agreement</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="prose prose-sm mb-6 max-h-96 overflow-y-auto rounded bg-gray-50 p-4">
            <div dangerouslySetInnerHTML={{ __html: contractContent }} />
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="John Doe"
                  required
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="john@example.com"
                  required
                />
              </div>
            </div>

            <div>
              <Label>Signature</Label>
              <div className="rounded-md border bg-white p-2">
                <canvas
                  ref={canvasRef}
                  className="h-32 w-full rounded border"
                  style={{ touchAction: "none" }}
                />
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={clearSignature}
                className="mt-2"
              >
                Clear Signature
              </Button>
            </div>

            <div className="flex items-center justify-between pt-4">
              <p className="text-sm text-gray-600">
                By signing, you agree to the terms of this service agreement
              </p>
              <Button onClick={submitSignature} disabled={isSigning}>
                {isSigning ? "Signing..." : "Sign & Continue"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
