import { AppLayout } from "@/components/AppLayout";
import { RequireRole } from "@/components/RequireRole";
import { useCreateAnnouncement } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

export default function AdminAnnouncementsPage() {
  return (
    <RequireRole role="admin">
      <AdminAnnouncementsContent />
    </RequireRole>
  );
}

function AdminAnnouncementsContent() {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [isPinned, setIsPinned] = useState(false);
  const { toast } = useToast();

  const createAnnouncement = useCreateAnnouncement({
    mutation: {
      onSuccess: () => {
        toast({ title: "Announcement published" });
        setTitle("");
        setBody("");
        setIsPinned(false);
      }
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !body) return;
    createAnnouncement.mutate({ data: { title, body, isPinned } });
  };

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-12 max-w-3xl">
        <h1 className="font-display text-4xl text-secondary mb-8">Publish Announcement</h1>
        
        <Card className="bg-card border-border shadow-lg">
          <CardHeader>
            <CardTitle className="font-sans">New Announcement</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label className="font-sans text-foreground">Title</Label>
                <Input 
                  placeholder="Announcement title" 
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="bg-input border-border/50 font-sans"
                />
              </div>
              
              <div className="space-y-2">
                <Label className="font-sans text-foreground">Content</Label>
                <Textarea 
                  placeholder="Write your announcement here..." 
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  className="bg-input border-border/50 font-serif min-h-[200px]"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch 
                  id="pinned" 
                  checked={isPinned}
                  onCheckedChange={setIsPinned}
                />
                <Label htmlFor="pinned" className="font-sans cursor-pointer">Pin to top of community page</Label>
              </div>

              <div className="pt-4 flex justify-end">
                <Button type="submit" className="font-sans bg-secondary text-secondary-foreground hover:bg-secondary/90 px-8" disabled={createAnnouncement.isPending || !title || !body}>
                  {createAnnouncement.isPending ? <Loader2 className="animate-spin mr-2" /> : null}
                  Publish
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
