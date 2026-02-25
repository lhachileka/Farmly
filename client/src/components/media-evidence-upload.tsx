import { useState, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Camera, Video, CheckCircle, XCircle, Upload, Trash2, MapPin, AlertTriangle, Info } from "lucide-react";
import { gradesApi, type MediaEvidence } from "@/lib/api";

interface MediaEvidenceUploadProps {
  orderId: string;
  listingId?: string;
  onComplete?: () => void;
}

export function MediaEvidenceUpload({ orderId, listingId, onComplete }: MediaEvidenceUploadProps) {
  const queryClient = useQueryClient();
  const [notes, setNotes] = useState("");
  const photoInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [geoLocation, setGeoLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [geoError, setGeoError] = useState<string | null>(null);

  const { data: mediaCheck, refetch: refetchCheck } = useQuery({
    queryKey: ["/api/grades/media/check", orderId],
    queryFn: () => gradesApi.checkMediaRequirements(orderId),
  });

  const { data: existingMedia = [], refetch: refetchMedia } = useQuery({
    queryKey: ["/api/grades/media/order", orderId],
    queryFn: () => gradesApi.getMediaForOrder(orderId),
  });

  const uploadMutation = useMutation({
    mutationFn: (data: { mediaType: "photo" | "video"; url: string; thumbnailUrl?: string; geoLatitude?: number; geoLongitude?: number; notes?: string }) =>
      gradesApi.uploadMediaEvidence({
        orderId,
        listingId,
        ...data,
        purpose: "delivery",
      }),
    onSuccess: () => {
      refetchCheck();
      refetchMedia();
      setNotes("");
    },
  });

  const requestLocation = () => {
    if (navigator.geolocation) {
      setGeoError(null);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setGeoLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          setGeoError("Could not get location. Photos will be uploaded without geo-tagging.");
        }
      );
    }
  };

  const handleFileUpload = async (files: FileList | null, mediaType: "photo" | "video") => {
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setUploadProgress(0);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      const reader = new FileReader();
      reader.onload = async (e) => {
        const dataUrl = e.target?.result as string;
        
        await uploadMutation.mutateAsync({
          mediaType,
          url: dataUrl,
          thumbnailUrl: mediaType === "video" ? undefined : dataUrl,
          geoLatitude: geoLocation?.lat,
          geoLongitude: geoLocation?.lng,
          notes: notes || undefined,
        });

        setUploadProgress(((i + 1) / files.length) * 100);
      };
      reader.readAsDataURL(file);
      
      await new Promise((resolve) => {
        reader.onloadend = resolve;
      });
      
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    setIsUploading(false);
    setUploadProgress(0);
  };

  const photos = existingMedia.filter((m: MediaEvidence) => m.mediaType === "photo");
  const videos = existingMedia.filter((m: MediaEvidence) => m.mediaType === "video");
  const photoCount = photos.length;
  const videoCount = videos.length;
  const meetsRequirements = photoCount >= 3 && videoCount >= 1;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Camera className="h-5 w-5" />
          Delivery Evidence Upload
        </CardTitle>
        <CardDescription>
          Upload photos and videos of your produce before delivery for quality verification
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Alert variant={meetsRequirements ? "default" : "destructive"}>
          {meetsRequirements ? (
            <CheckCircle className="h-4 w-4" />
          ) : (
            <AlertTriangle className="h-4 w-4" />
          )}
          <AlertTitle>{meetsRequirements ? "Requirements Met" : "Upload Required"}</AlertTitle>
          <AlertDescription>
            {meetsRequirements
              ? "You have uploaded enough evidence for delivery verification."
              : `You need at least 3 photos and 1 video. Current: ${photoCount} photos, ${videoCount} videos.`}
          </AlertDescription>
        </Alert>

        <div className="grid grid-cols-2 gap-4">
          <Card className={`border-2 ${photoCount >= 3 ? "border-green-500" : "border-muted"}`}>
            <CardContent className="p-4 text-center">
              <Camera className={`h-8 w-8 mx-auto mb-2 ${photoCount >= 3 ? "text-green-500" : "text-muted-foreground"}`} />
              <div className="text-2xl font-bold">{photoCount}/3</div>
              <div className="text-sm text-muted-foreground">Photos</div>
              {photoCount >= 3 && <Badge className="mt-2 bg-green-500">Complete</Badge>}
            </CardContent>
          </Card>

          <Card className={`border-2 ${videoCount >= 1 ? "border-green-500" : "border-muted"}`}>
            <CardContent className="p-4 text-center">
              <Video className={`h-8 w-8 mx-auto mb-2 ${videoCount >= 1 ? "text-green-500" : "text-muted-foreground"}`} />
              <div className="text-2xl font-bold">{videoCount}/1</div>
              <div className="text-sm text-muted-foreground">Videos</div>
              {videoCount >= 1 && <Badge className="mt-2 bg-green-500">Complete</Badge>}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={requestLocation}
              className={geoLocation ? "text-green-600 border-green-600" : ""}
            >
              <MapPin className="h-4 w-4 mr-1" />
              {geoLocation ? "Location Captured" : "Add Location"}
            </Button>
            {geoError && <span className="text-xs text-muted-foreground">{geoError}</span>}
          </div>

          <Textarea
            placeholder="Add notes about this evidence (optional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="min-h-[60px]"
          />
        </div>

        {isUploading && (
          <div className="space-y-2">
            <Progress value={uploadProgress} />
            <p className="text-sm text-center text-muted-foreground">Uploading... {Math.round(uploadProgress)}%</p>
          </div>
        )}

        <div className="flex gap-4">
          <input
            ref={photoInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => handleFileUpload(e.target.files, "photo")}
          />
          <input
            ref={videoInputRef}
            type="file"
            accept="video/*"
            className="hidden"
            onChange={(e) => handleFileUpload(e.target.files, "video")}
          />

          <Button
            onClick={() => photoInputRef.current?.click()}
            disabled={isUploading}
            className="flex-1"
            variant={photoCount >= 3 ? "outline" : "default"}
          >
            <Camera className="h-4 w-4 mr-2" />
            Upload Photos
          </Button>

          <Button
            onClick={() => videoInputRef.current?.click()}
            disabled={isUploading}
            className="flex-1"
            variant={videoCount >= 1 ? "outline" : "default"}
          >
            <Video className="h-4 w-4 mr-2" />
            Upload Video
          </Button>
        </div>

        {existingMedia.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium">Uploaded Evidence</h4>
            <div className="grid grid-cols-4 gap-2">
              {photos.slice(0, 4).map((media: MediaEvidence) => (
                <div key={media.id} className="relative aspect-square rounded overflow-hidden bg-muted">
                  <img src={media.url} alt="Evidence" className="w-full h-full object-cover" />
                  <Badge className="absolute bottom-1 left-1 text-xs" variant="secondary">
                    Photo
                  </Badge>
                </div>
              ))}
              {videos.map((media: MediaEvidence) => (
                <div key={media.id} className="relative aspect-square rounded overflow-hidden bg-muted flex items-center justify-center">
                  <Video className="h-8 w-8 text-muted-foreground" />
                  <Badge className="absolute bottom-1 left-1 text-xs" variant="secondary">
                    Video
                  </Badge>
                </div>
              ))}
            </div>
            {photos.length > 4 && (
              <p className="text-sm text-muted-foreground">+{photos.length - 4} more photos</p>
            )}
          </div>
        )}

        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>Evidence Tips</AlertTitle>
          <AlertDescription>
            <ul className="list-disc list-inside text-sm mt-1 space-y-1">
              <li>Show close-ups of produce quality and freshness</li>
              <li>Include photos of packaging and labeling</li>
              <li>Record a walkthrough video of the full batch</li>
              <li>Adding location helps verify authenticity</li>
            </ul>
          </AlertDescription>
        </Alert>

        {meetsRequirements && onComplete && (
          <Button onClick={onComplete} className="w-full" size="lg">
            <CheckCircle className="h-4 w-4 mr-2" />
            Continue to Delivery
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
