import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { CheckCircle, XCircle, AlertTriangle, Image, Video, Star, ThumbsUp, ThumbsDown, Scale } from "lucide-react";
import { gradesApi, type MediaEvidence, type DeliveryGrade } from "@/lib/api";

interface BuyerGradeConfirmationProps {
  orderId: string;
  deliveryGrade: DeliveryGrade;
  sellerId: string;
  onComplete?: () => void;
}

const GRADE_COLORS = {
  A: "bg-green-500",
  B: "bg-yellow-500",
  C: "bg-orange-500",
};

export function BuyerGradeConfirmation({ orderId, deliveryGrade, sellerId, onComplete }: BuyerGradeConfirmationProps) {
  const queryClient = useQueryClient();
  const [confirmation, setConfirmation] = useState<"matches" | "lower" | "rejected" | null>(null);
  const [reportedGrade, setReportedGrade] = useState<string | null>(null);
  const [comment, setComment] = useState("");
  const [showDispute, setShowDispute] = useState(false);
  const [disputeReason, setDisputeReason] = useState("");

  const { data: media = [] } = useQuery({
    queryKey: ["/api/grades/media/order", orderId],
    queryFn: () => gradesApi.getMediaForOrder(orderId),
  });

  const confirmMutation = useMutation({
    mutationFn: () =>
      gradesApi.confirmDeliveryGrade(
        deliveryGrade.id,
        confirmation!,
        confirmation === "lower" ? reportedGrade || undefined : undefined,
        comment || undefined
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/grades/delivery", orderId] });
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      if (confirmation === "rejected") {
        setShowDispute(true);
      } else {
        onComplete?.();
      }
    },
  });

  const disputeMutation = useMutation({
    mutationFn: () =>
      gradesApi.createDispute({
        deliveryGradeId: deliveryGrade.id,
        orderId,
        sellerId,
        claimedGrade: reportedGrade || "C",
        actualGrade: expectedGrade,
        buyerReason: disputeReason,
      }),
    onSuccess: () => {
      setShowDispute(false);
      onComplete?.();
    },
  });

  const photos = media.filter((m: MediaEvidence) => m.mediaType === "photo");
  const videos = media.filter((m: MediaEvidence) => m.mediaType === "video");

  const expectedGrade = deliveryGrade.expectedGrade || "B";

  return (
    <>
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Scale className="h-5 w-5" />
            Confirm Delivery Quality
          </CardTitle>
          <CardDescription>
            Review the delivered produce and confirm if it matches the expected quality grade
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <div>
              <p className="text-sm text-muted-foreground">Expected Grade</p>
              <div className="flex items-center gap-2 mt-1">
                <Badge className={`${GRADE_COLORS[expectedGrade as keyof typeof GRADE_COLORS]} text-white text-lg px-3 py-1`}>
                  Grade {expectedGrade}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {expectedGrade === "A" && "Premium Quality"}
                  {expectedGrade === "B" && "Standard Quality"}
                  {expectedGrade === "C" && "Economy Quality"}
                </span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Seller Declared</p>
              <Badge variant="outline" className="text-lg mt-1">
                Grade {deliveryGrade.sellerDeclaredGrade}
              </Badge>
            </div>
          </div>

          {media.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-medium flex items-center gap-2">
                <Image className="h-4 w-4" />
                Seller's Evidence ({photos.length} photos, {videos.length} videos)
              </h4>
              <div className="grid grid-cols-4 gap-2">
                {photos.slice(0, 4).map((m: MediaEvidence) => (
                  <div key={m.id} className="relative aspect-square rounded overflow-hidden bg-muted">
                    <img src={m.url} alt="Evidence" className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
              {photos.length > 4 && (
                <p className="text-sm text-muted-foreground">+{photos.length - 4} more photos</p>
              )}
            </div>
          )}

          <div className="space-y-4">
            <h4 className="font-medium">How does the delivery quality match your expectations?</h4>
            
            <RadioGroup
              value={confirmation || ""}
              onValueChange={(value) => {
                setConfirmation(value as "matches" | "lower" | "rejected");
                if (value === "matches") {
                  setReportedGrade(null);
                }
              }}
              className="space-y-3"
            >
              <div className="flex items-center space-x-3 p-4 rounded-lg border hover:bg-muted/50 cursor-pointer">
                <RadioGroupItem value="matches" id="matches" />
                <Label htmlFor="matches" className="flex-1 cursor-pointer">
                  <div className="flex items-center gap-2">
                    <ThumbsUp className="h-4 w-4 text-green-500" />
                    <span className="font-medium">Matches Expected Grade</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    The produce quality matches Grade {expectedGrade} as expected
                  </p>
                </Label>
              </div>

              <div className="flex items-center space-x-3 p-4 rounded-lg border hover:bg-muted/50 cursor-pointer">
                <RadioGroupItem value="lower" id="lower" />
                <Label htmlFor="lower" className="flex-1 cursor-pointer">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-500" />
                    <span className="font-medium">Lower Than Expected</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    The quality is acceptable but lower than the expected grade
                  </p>
                </Label>
              </div>

              <div className="flex items-center space-x-3 p-4 rounded-lg border hover:bg-muted/50 cursor-pointer">
                <RadioGroupItem value="rejected" id="rejected" />
                <Label htmlFor="rejected" className="flex-1 cursor-pointer">
                  <div className="flex items-center gap-2">
                    <XCircle className="h-4 w-4 text-red-500" />
                    <span className="font-medium">Rejected - Unacceptable Quality</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    The produce quality is unacceptable and I want to dispute this order
                  </p>
                </Label>
              </div>
            </RadioGroup>
          </div>

          {confirmation === "lower" && (
            <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
              <h4 className="font-medium">What grade would you assign to this delivery?</h4>
              <RadioGroup
                value={reportedGrade || ""}
                onValueChange={setReportedGrade}
                className="flex gap-4"
              >
                {["A", "B", "C"].filter((g) => g !== expectedGrade).map((grade) => (
                  <div key={grade} className="flex items-center space-x-2">
                    <RadioGroupItem value={grade} id={`grade-${grade}`} />
                    <Label htmlFor={`grade-${grade}`} className="cursor-pointer">
                      <Badge className={`${GRADE_COLORS[grade as keyof typeof GRADE_COLORS]} text-white`}>
                        Grade {grade}
                      </Badge>
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          )}

          <Textarea
            placeholder="Add any comments about the delivery quality (optional)"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="min-h-[80px]"
          />

          {confirmation && (
            <Alert variant={confirmation === "matches" ? "default" : confirmation === "rejected" ? "destructive" : "default"}>
              {confirmation === "matches" ? (
                <CheckCircle className="h-4 w-4" />
              ) : confirmation === "rejected" ? (
                <XCircle className="h-4 w-4" />
              ) : (
                <AlertTriangle className="h-4 w-4" />
              )}
              <AlertTitle>
                {confirmation === "matches" && "Quality Confirmed"}
                {confirmation === "lower" && "Lower Grade Reported"}
                {confirmation === "rejected" && "Order Will Be Disputed"}
              </AlertTitle>
              <AlertDescription>
                {confirmation === "matches" && "Funds will be released to the seller. Their trust score will increase."}
                {confirmation === "lower" && "Seller's trust score will be adjusted. Funds will be released."}
                {confirmation === "rejected" && "A dispute will be opened and funds held in escrow until resolved."}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
        <CardFooter>
          <Button
            onClick={() => confirmMutation.mutate()}
            disabled={!confirmation || (confirmation === "lower" && !reportedGrade) || confirmMutation.isPending}
            className="w-full"
            size="lg"
            variant={confirmation === "rejected" ? "destructive" : "default"}
          >
            {confirmMutation.isPending ? "Submitting..." : "Submit Confirmation"}
          </Button>
        </CardFooter>
      </Card>

      <Dialog open={showDispute} onOpenChange={setShowDispute}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Open Dispute</DialogTitle>
            <DialogDescription>
              Please provide details about why you're rejecting this delivery. An admin will review your dispute.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Describe the quality issues with this delivery..."
            value={disputeReason}
            onChange={(e) => setDisputeReason(e.target.value)}
            className="min-h-[120px]"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDispute(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => disputeMutation.mutate()}
              disabled={!disputeReason || disputeMutation.isPending}
            >
              {disputeMutation.isPending ? "Submitting..." : "Submit Dispute"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
