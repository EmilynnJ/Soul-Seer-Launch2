import { AppLayout } from "@/components/AppLayout";
import { useGetForumTopic, getGetForumTopicQueryKey, useReplyToForumTopic, useFlagForumPost } from "@workspace/api-client-react";
import { useParams, Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { formatDateTime } from "@/lib/format";
import { MessageCircle, Flag, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export default function ForumTopicPage() {
  const { topicId } = useParams();
  const { data: topic, isLoading } = useGetForumTopic(topicId as string, {
    query: {
      enabled: !!topicId,
      queryKey: getGetForumTopicQueryKey(topicId as string),
    }
  });

  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [replyBody, setReplyBody] = useState("");
  
  const replyMutation = useReplyToForumTopic({
    mutation: {
      onSuccess: () => {
        setReplyBody("");
        queryClient.invalidateQueries({ queryKey: getGetForumTopicQueryKey(topicId as string) });
        toast({ title: "Reply posted successfully" });
      },
      onError: (err: Error) => {
        toast({ title: "Failed to post reply", description: err.message, variant: "destructive" });
      }
    }
  });

  const handleReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyBody.trim()) return;
    replyMutation.mutate({ topicId: topicId as string, data: { body: replyBody } });
  };

  const [flagReason, setFlagReason] = useState("");
  const flagMutation = useFlagForumPost({
    mutation: {
      onSuccess: () => {
        setFlagReason("");
        toast({ title: "Post flagged for review" });
      }
    }
  });

  if (isLoading) return <AppLayout><div className="flex justify-center py-20"><Loader2 className="animate-spin w-8 h-8 text-primary" /></div></AppLayout>;
  if (!topic) return <AppLayout><div className="text-center py-20 font-display text-3xl">Topic not found</div></AppLayout>;

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <Link href="/forum" className="text-muted-foreground hover:text-primary transition-colors text-sm font-sans mb-6 inline-flex items-center">
          &larr; Back to Forum
        </Link>
        
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Badge variant="outline" className="bg-background border-border text-muted-foreground font-sans">
              {topic.categoryName}
            </Badge>
            <span className="text-sm text-muted-foreground font-sans">{formatDateTime(topic.createdAt)}</span>
          </div>
          <h1 className="font-display text-4xl text-primary mb-6">{topic.title}</h1>
          
          <Card className="bg-card border-border shadow-lg">
            <CardContent className="p-6 md:p-8">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-12 h-12 rounded-full border border-border overflow-hidden shrink-0">
                  {topic.authorAvatarUrl ? (
                    <img src={topic.authorAvatarUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-muted flex items-center justify-center font-display text-xl text-muted-foreground">
                      {topic.authorName.charAt(0)}
                    </div>
                  )}
                </div>
                <div>
                  <div className="font-sans font-medium text-foreground text-lg">
                    {topic.authorName} 
                    {topic.authorRole === 'reader' && <Badge variant="secondary" className="ml-2 bg-secondary/10 text-secondary border-secondary/30 text-[10px]">Reader</Badge>}
                  </div>
                  <div className="font-serif text-foreground/90 mt-4 whitespace-pre-wrap leading-relaxed">
                    {topic.body}
                  </div>
                </div>
              </div>
              <div className="flex justify-end pt-4 border-t border-border/50">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-destructive">
                      <Flag className="w-4 h-4 mr-2" /> Report
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-card border-border">
                    <DialogHeader>
                      <DialogTitle className="font-display text-2xl text-destructive">Report Post</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 pt-4">
                      <Textarea 
                        placeholder="Why are you reporting this post?" 
                        value={flagReason}
                        onChange={(e) => setFlagReason(e.target.value)}
                        className="bg-input border-border/50"
                      />
                      <Button 
                        variant="destructive" 
                        className="w-full font-sans"
                        disabled={flagMutation.isPending || !flagReason.trim()}
                        onClick={() => flagMutation.mutate({ postId: topic.id, data: { reason: flagReason }})}
                      >
                        {flagMutation.isPending ? <Loader2 className="animate-spin" /> : "Submit Report"}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>
        </div>

        <h3 className="font-display text-3xl text-secondary mb-6">{topic.replies.length} Replies</h3>
        
        <div className="space-y-6 mb-12">
          {topic.replies.map(reply => (
            <Card key={reply.id} className="bg-card border-border/50">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full border border-border overflow-hidden shrink-0">
                    {reply.authorAvatarUrl ? (
                      <img src={reply.authorAvatarUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-muted flex items-center justify-center font-display text-lg text-muted-foreground">
                        {reply.authorName.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-2">
                      <div className="font-sans font-medium text-foreground">
                        {reply.authorName}
                        {reply.authorRole === 'reader' && <Badge variant="secondary" className="ml-2 bg-secondary/10 text-secondary border-secondary/30 text-[10px]">Reader</Badge>}
                      </div>
                      <span className="text-xs text-muted-foreground font-sans">{formatDateTime(reply.createdAt)}</span>
                    </div>
                    <div className="font-serif text-foreground/80 whitespace-pre-wrap">
                      {reply.body}
                    </div>
                    <div className="flex justify-end mt-2">
                       <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-destructive h-8 px-2">
                            <Flag className="w-3 h-3 mr-1" /> Report
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-card border-border">
                          <DialogHeader>
                            <DialogTitle className="font-display text-2xl text-destructive">Report Reply</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4 pt-4">
                            <Textarea 
                              placeholder="Why are you reporting this reply?" 
                              value={flagReason}
                              onChange={(e) => setFlagReason(e.target.value)}
                              className="bg-input border-border/50"
                            />
                            <Button 
                              variant="destructive" 
                              className="w-full font-sans"
                              disabled={flagMutation.isPending || !flagReason.trim()}
                              onClick={() => flagMutation.mutate({ postId: reply.id, data: { reason: flagReason }})}
                            >
                              {flagMutation.isPending ? <Loader2 className="animate-spin" /> : "Submit Report"}
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="bg-card border-primary/20 shadow-[0_0_15px_rgba(255,105,180,0.1)]">
          <CardContent className="p-6">
            <h3 className="font-display text-2xl text-primary mb-4">Add a Reply</h3>
            <form onSubmit={handleReply}>
              <Textarea 
                placeholder="Share your thoughts..." 
                className="min-h-[120px] bg-input border-border/50 mb-4 font-serif"
                value={replyBody}
                onChange={(e) => setReplyBody(e.target.value)}
              />
              <div className="flex justify-end">
                <Button type="submit" disabled={replyMutation.isPending || !replyBody.trim()} className="font-sans px-8">
                  {replyMutation.isPending ? <Loader2 className="animate-spin mr-2" /> : <MessageCircle className="w-4 h-4 mr-2" />}
                  Post Reply
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
