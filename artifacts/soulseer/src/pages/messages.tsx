import { AppLayout } from "@/components/AppLayout";
import { RequireRole } from "@/components/RequireRole";
import { useListThreads, useGetMe, getGetMeQueryKey } from "@workspace/api-client-react";
import { Link, useLocation } from "wouter";
import { formatDateTime } from "@/lib/format";
import { Loader2, MessageSquare } from "lucide-react";
import { Card } from "@/components/ui/card";

export default function MessagesPage() {
  return (
    <RequireRole role="client">
      <MessagesContent />
    </RequireRole>
  );
}

function MessagesContent() {
  const { data: me } = useGetMe({ query: { queryKey: getGetMeQueryKey() }});
  const { data: threads, isLoading } = useListThreads();
  const [, setLocation] = useLocation();

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <h1 className="font-display text-4xl text-primary mb-2">Messages</h1>
        <p className="font-serif text-muted-foreground mb-8">Communicate securely with your readers.</p>

        <Card className="bg-card border-border shadow-lg overflow-hidden">
          {isLoading ? (
            <div className="flex justify-center p-12"><Loader2 className="animate-spin w-8 h-8 text-primary" /></div>
          ) : threads?.length ? (
            <div className="divide-y divide-border/50">
              {threads.map(thread => (
                <div 
                  key={thread.id} 
                  className={`p-4 sm:p-6 flex items-start gap-4 hover:bg-muted/20 transition-colors cursor-pointer ${thread.unreadCount > 0 ? 'bg-primary/5' : ''}`}
                  onClick={() => setLocation(`/messages/${thread.id}`)}
                >
                  <div className="w-12 h-12 rounded-full border border-border overflow-hidden shrink-0">
                    {thread.otherUserAvatarUrl ? (
                      <img src={thread.otherUserAvatarUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-muted flex items-center justify-center font-display text-xl">
                        {thread.otherUserName.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-1">
                      <h4 className={`font-sans text-lg truncate pr-4 ${thread.unreadCount > 0 ? 'font-bold text-primary' : 'font-medium text-foreground'}`}>
                        {thread.otherUserName}
                      </h4>
                      {thread.lastMessageAt && (
                        <span className="text-xs text-muted-foreground whitespace-nowrap shrink-0">
                          {formatDateTime(thread.lastMessageAt)}
                        </span>
                      )}
                    </div>
                    <div className="flex justify-between items-center gap-4">
                      <p className={`text-sm truncate font-serif ${thread.unreadCount > 0 ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                        {thread.lastMessagePreview || "No messages yet"}
                      </p>
                      {thread.unreadCount > 0 && (
                        <span className="bg-primary text-primary-foreground text-xs font-sans font-bold px-2 py-0.5 rounded-full shrink-0">
                          {thread.unreadCount} new
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-16 text-center">
              <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <h3 className="font-sans font-medium text-foreground mb-2">No messages yet</h3>
              <p className="text-muted-foreground font-serif text-sm">Your conversations with readers will appear here.</p>
            </div>
          )}
        </Card>
      </div>
    </AppLayout>
  );
}
