import { AppLayout } from "@/components/AppLayout";
import { RequireRole } from "@/components/RequireRole";
import { useGetThread, getGetThreadQueryKey, useSendMessage, useGetMe, getGetMeQueryKey } from "@workspace/api-client-react";
import { useParams, Link } from "wouter";
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Send, ArrowLeft } from "lucide-react";
import { formatDateTime } from "@/lib/format";
import { useQueryClient } from "@tanstack/react-query";

export default function MessageThreadPage() {
  return (
    <RequireRole role="client">
      <MessageThreadContent />
    </RequireRole>
  );
}

function MessageThreadContent() {
  const { threadId } = useParams();
  const queryClient = useQueryClient();
  const { data: me } = useGetMe({ query: { queryKey: getGetMeQueryKey() }});
  
  const { data: thread, isLoading } = useGetThread(threadId as string, {
    query: {
      enabled: !!threadId,
      queryKey: getGetThreadQueryKey(threadId as string),
      refetchInterval: 5000, // poll
    }
  });

  const [msgBody, setMsgBody] = useState("");
  const sendMsg = useSendMessage(threadId as string, {
    mutation: {
      onSuccess: () => {
        setMsgBody("");
        queryClient.invalidateQueries({ queryKey: getGetThreadQueryKey(threadId as string) });
      }
    }
  });

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!msgBody.trim()) return;
    sendMsg.mutate({ data: { body: msgBody } });
  };

  const messagesEndRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "auto" });
  }, [thread?.messages]);

  if (isLoading) return <AppLayout><div className="flex justify-center py-20"><Loader2 className="animate-spin w-8 h-8 text-primary" /></div></AppLayout>;
  if (!thread) return <AppLayout><div className="text-center py-20 font-display text-3xl">Thread not found</div></AppLayout>;

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8 h-[calc(100vh-140px)] flex flex-col max-w-4xl">
        <div className="flex items-center gap-4 mb-4 bg-card border border-border p-4 rounded-xl shadow-lg">
          <Link href="/messages">
            <Button variant="ghost" size="icon" className="shrink-0 text-muted-foreground hover:text-foreground">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div className="w-10 h-10 rounded-full border border-border overflow-hidden shrink-0">
            {thread.otherUserAvatarUrl ? (
              <img src={thread.otherUserAvatarUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-muted flex items-center justify-center font-display text-lg text-muted-foreground">
                {thread.otherUserName.charAt(0)}
              </div>
            )}
          </div>
          <div>
            <h2 className="font-sans font-semibold text-lg text-foreground">{thread.otherUserName}</h2>
            <p className="text-xs text-muted-foreground font-serif capitalize">{thread.otherUserRole || 'User'}</p>
          </div>
        </div>

        <div className="flex-1 bg-card border border-border rounded-xl shadow-lg overflow-hidden flex flex-col min-h-0">
          <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-4">
            {thread.messages?.length ? (
              thread.messages.map(msg => {
                const isMe = msg.senderId === me?.id;
                return (
                  <div key={msg.id} className={`flex flex-col max-w-[75%] ${isMe ? 'self-end items-end' : 'self-start items-start'}`}>
                    <div className={`px-4 py-2 rounded-2xl font-serif text-[15px] leading-relaxed ${isMe ? 'bg-primary text-primary-foreground rounded-br-none' : 'bg-muted text-foreground rounded-bl-none'}`}>
                      {msg.body}
                    </div>
                    <span className="text-[10px] text-muted-foreground font-sans mt-1 px-1">
                      {formatDateTime(msg.createdAt)}
                    </span>
                  </div>
                );
              })
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground font-serif italic">
                No messages yet.
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSend} className="p-4 border-t border-border bg-background flex gap-3">
            <Input 
              placeholder="Write a message..." 
              className="flex-1 bg-input border-border/50 font-serif h-12 rounded-full px-6"
              value={msgBody}
              onChange={(e) => setMsgBody(e.target.value)}
              disabled={sendMsg.isPending}
            />
            <Button type="submit" size="icon" className="h-12 w-12 rounded-full shrink-0 shadow-[0_0_10px_rgba(255,105,180,0.2)]" disabled={!msgBody.trim() || sendMsg.isPending}>
              <Send className="w-5 h-5 ml-1" />
            </Button>
          </form>
        </div>
      </div>
    </AppLayout>
  );
}
