import { AppLayout } from "@/components/AppLayout";
import { useCreateForumTopic, useListForumCategories } from "@workspace/api-client-react";
import { Link, useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function ForumNewPage() {
  const { data: categories, isLoading: catLoading } = useListForumCategories();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [categorySlug, setCategorySlug] = useState("");

  const createTopic = useCreateForumTopic({
    mutation: {
      onSuccess: (topic) => {
        toast({ title: "Topic created" });
        setLocation(`/forum/topics/${topic.id}`);
      },
      onError: (err) => {
        toast({ title: "Error creating topic", description: err.message, variant: "destructive" });
      }
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !body.trim() || !categorySlug) {
      toast({ title: "Missing fields", description: "Please fill out all fields", variant: "destructive" });
      return;
    }
    createTopic.mutate({ data: { title, body, categorySlug } });
  };

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-12 max-w-3xl">
        <Link href="/forum" className="text-muted-foreground hover:text-primary transition-colors text-sm font-sans mb-6 inline-flex items-center">
          &larr; Back to Forum
        </Link>
        
        <h1 className="font-display text-5xl text-primary mb-8">Start a Conversation</h1>
        
        <Card className="bg-card border-border shadow-lg">
          <CardContent className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label className="font-sans text-foreground">Category</Label>
                <Select value={categorySlug} onValueChange={setCategorySlug}>
                  <SelectTrigger className="bg-input border-border/50 font-sans">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    {categories?.map(c => (
                      <SelectItem key={c.id} value={c.slug} className="font-sans cursor-pointer">{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label className="font-sans text-foreground">Title</Label>
                <Input 
                  placeholder="What's on your mind?" 
                  className="bg-input border-border/50 font-sans text-lg py-6"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label className="font-sans text-foreground">Message</Label>
                <Textarea 
                  placeholder="Share your thoughts, questions, or experiences..." 
                  className="min-h-[250px] bg-input border-border/50 font-serif text-base leading-relaxed"
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                />
              </div>
              
              <div className="pt-4 flex justify-end gap-4">
                <Link href="/forum">
                  <Button variant="ghost" type="button" className="font-sans">Cancel</Button>
                </Link>
                <Button type="submit" className="font-sans px-8" disabled={createTopic.isPending || !title || !body || !categorySlug}>
                  {createTopic.isPending ? <Loader2 className="animate-spin mr-2" /> : null}
                  Post Topic
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
