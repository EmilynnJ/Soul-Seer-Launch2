import { AppLayout } from "@/components/AppLayout";
import { RequireRole } from "@/components/RequireRole";
import { useGetMyReaderProfile, useUpdateMyReaderProfile } from "@workspace/api-client-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Upload, User } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useAuth0 } from "@auth0/auth0-react";

const API_BASE = import.meta.env.BASE_URL.replace(/\/$/, "") + "/api";
const CLOUDINARY_CLOUD = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME as string;

const profileSchema = z.object({
  displayName: z.string().min(2),
  tagline: z.string().optional(),
  bio: z.string().optional(),
  ratePerMinChatCents: z.coerce.number().min(0),
  ratePerMinPhoneCents: z.coerce.number().min(0),
  ratePerMinVideoCents: z.coerce.number().min(0),
  status: z.enum(["online", "offline", "busy"]),
  specialties: z.string().transform((v) => v.split(",").map((s) => s.trim()).filter(Boolean)),
  yearsExperience: z.coerce.number().min(0).optional(),
});

export default function ReaderProfilePage() {
  return (
    <RequireRole role="reader">
      <ReaderProfileContent />
    </RequireRole>
  );
}

function ReaderProfileContent() {
  const { data: profile, isLoading } = useGetMyReaderProfile();
  const { toast } = useToast();
  const { getAccessTokenSilently } = useAuth0();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(undefined);
  const [uploading, setUploading] = useState(false);

  const form = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      displayName: "",
      tagline: "",
      bio: "",
      ratePerMinChatCents: 0,
      ratePerMinPhoneCents: 0,
      ratePerMinVideoCents: 0,
      status: "offline",
      specialties: [] as any,
      yearsExperience: 0,
    },
  });

  useEffect(() => {
    if (profile) {
      form.reset({
        displayName: profile.displayName,
        tagline: profile.tagline || "",
        bio: profile.bio || "",
        ratePerMinChatCents: profile.ratePerMinChatCents,
        ratePerMinPhoneCents: profile.ratePerMinPhoneCents,
        ratePerMinVideoCents: profile.ratePerMinVideoCents,
        status: profile.status,
        specialties: profile.specialties?.join(", ") as any,
        yearsExperience: profile.yearsExperience || 0,
      });
      setAvatarUrl(profile.avatarUrl || undefined);
    }
  }, [profile, form]);

  const updateProfile = useUpdateMyReaderProfile({
    mutation: {
      onSuccess: () => toast({ title: "Profile updated successfully" }),
      onError: (err) => toast({ title: "Failed to update profile", description: err.message, variant: "destructive" }),
    },
  });

  const handleAvatarUpload = async (file: File) => {
    if (!CLOUDINARY_CLOUD) {
      toast({ title: "Image upload not configured", variant: "destructive" });
      return;
    }
    setUploading(true);
    try {
      const token = await getAccessTokenSilently();
      const sigResp = await fetch(`${API_BASE}/upload/avatar-signature`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!sigResp.ok) throw new Error("Could not get upload signature");
      const { signature, timestamp, folder, cloudName, apiKey } = await sigResp.json();

      const formData = new FormData();
      formData.append("file", file);
      formData.append("signature", signature);
      formData.append("timestamp", String(timestamp));
      formData.append("folder", folder);
      formData.append("api_key", apiKey);

      const uploadResp = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: "POST",
        body: formData,
      });
      if (!uploadResp.ok) throw new Error("Upload failed");
      const result = await uploadResp.json();
      const url: string = result.secure_url;
      setAvatarUrl(url);
      await updateProfile.mutateAsync({ data: { avatarUrl: url } as any });
      toast({ title: "Photo updated!" });
    } catch (e: any) {
      toast({ title: "Upload failed", description: e.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const onSubmit = (values: z.infer<typeof profileSchema>) => {
    updateProfile.mutate({ data: { ...values, avatarUrl } as any });
  };

  if (isLoading) return <AppLayout><div className="flex justify-center py-20"><Loader2 className="animate-spin w-8 h-8 text-primary" /></div></AppLayout>;

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-12 max-w-3xl">
        <h1 className="font-display text-4xl text-primary mb-8 drop-shadow-[0_0_8px_rgba(255,105,180,0.3)]">Edit Profile</h1>

        {/* Avatar */}
        <Card className="bg-card border-border shadow-lg mb-6">
          <CardContent className="p-6 flex items-center gap-6">
            <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt="Profile photo"
                  className="w-24 h-24 rounded-full object-cover border-2 border-primary/50 shadow-[0_0_15px_rgba(255,105,180,0.2)]"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-muted border-2 border-border flex items-center justify-center">
                  <User className="w-10 h-10 text-muted-foreground/50" />
                </div>
              )}
              <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                {uploading ? <Loader2 className="w-6 h-6 animate-spin text-white" /> : <Upload className="w-6 h-6 text-white" />}
              </div>
            </div>
            <div>
              <p className="font-sans font-medium text-foreground">Profile Photo</p>
              <p className="font-sans text-sm text-muted-foreground mt-1">Click your photo to upload a new one</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-3 font-sans"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                {uploading ? <Loader2 className="animate-spin mr-2 w-3 h-3" /> : <Upload className="w-3 h-3 mr-2" />}
                Change Photo
              </Button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleAvatarUpload(file);
                e.target.value = "";
              }}
            />
          </CardContent>
        </Card>

        <Card className="bg-card border-border shadow-lg">
          <CardContent className="p-6 md:p-8">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="displayName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-sans">Display Name</FormLabel>
                        <FormControl><Input {...field} className="bg-input font-sans" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-sans">Current Status</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="bg-input font-sans">
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="online">Online</SelectItem>
                            <SelectItem value="busy">Busy</SelectItem>
                            <SelectItem value="offline">Offline</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="tagline"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-sans">Tagline</FormLabel>
                      <FormControl><Input {...field} className="bg-input font-serif" placeholder="e.g. Clairvoyant & Tarot Master" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="bio"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-sans">Bio</FormLabel>
                      <FormControl><Textarea {...field} className="bg-input font-serif min-h-[150px]" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="specialties"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-sans">Specialties (comma separated)</FormLabel>
                        <FormControl><Input {...field} className="bg-input font-sans" placeholder="Tarot, Astrology, Love" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="yearsExperience"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-sans">Years of Experience</FormLabel>
                        <FormControl><Input type="number" {...field} className="bg-input font-sans" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="pt-6 border-t border-border">
                  <h3 className="font-sans font-medium mb-4">Rates (cents per minute)</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <FormField
                      control={form.control}
                      name="ratePerMinChatCents"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-sans">Chat ($0 = disabled)</FormLabel>
                          <FormControl><Input type="number" step="100" {...field} className="bg-input font-sans tabular-nums" /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="ratePerMinPhoneCents"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-sans">Phone</FormLabel>
                          <FormControl><Input type="number" step="100" {...field} className="bg-input font-sans tabular-nums" /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="ratePerMinVideoCents"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-sans">Video</FormLabel>
                          <FormControl><Input type="number" step="100" {...field} className="bg-input font-sans tabular-nums" /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <Button type="submit" disabled={updateProfile.isPending} className="font-sans px-8 shadow-[0_0_15px_rgba(255,105,180,0.2)]">
                    {updateProfile.isPending ? <Loader2 className="animate-spin mr-2 w-4 h-4" /> : null}
                    Save Profile
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
