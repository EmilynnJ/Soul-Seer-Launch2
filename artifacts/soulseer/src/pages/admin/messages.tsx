import { AppLayout } from "@/components/AppLayout";
import { RequireRole } from "@/components/RequireRole";
import { useListThreads } from "@workspace/api-client-react";
import { Card } from "@/components/ui/card";
import { Loader2, MessageSquare } from "lucide-react";
import { formatDateTime } from "@/lib/format";
import { Link } from "wouter";

export default function AdminMessagesPage() {
  return (
    <RequireRole role="admin">
      <AdminMessagesContent />
    </RequireRole>
  );
}

function AdminMessagesContent() {
  // Support inbox is just threads where otherUser is talking to us (the admin)
  const { data: threads, isLoading } = useListThreads();

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <h1 className="font-display text-4xl text-secondary mb-8">Support Inbox</h1>
        
        <Card className="bg-card border-border shadow-lg overflow-hidden">
          {isLoading ? (
            <div className="flex justify-center p-12"><Loader2 className="animate-spin w-8 h-8 text-primary" /></div>
          ) : threads?.length ? (
            <div className="divide-y divide-border/50">
              {threads.map(thread => (
                <Link key={thread.id} href={`/messages/${thread.id}`}>
                  <div className={`p-4 sm:p-6 flex items-start gap-4 hover:bg-muted/20 transition-colors cursor-pointer ${thread.unreadCount > 0 ? 'bg-secondary/5' : ''}`}>
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
                        <h4 className={`font-sans text-lg truncate pr-4 ${thread.unreadCount > 0 ? 'font-bold text-secondary' : 'font-medium text-foreground'}`}>
                          {thread.otherUserName} <span className="text-xs font-normal text-muted-foreground uppercase">({thread.otherUserRole})</span>
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
                          <span className="bg-secondary text-secondary-foreground text-xs font-sans font-bold px-2 py-0.5 rounded-full shrink-0">
                            {thread.unreadCount} new
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="p-16 text-center">
              <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <h3 className="font-sans font-medium text-foreground mb-2">Inbox Empty</h3>
              <p className="text-muted-foreground font-serif text-sm">No support messages to display.</p>
            </div>
          )}
        </Card>
      </div>
    </AppLayout>
  );
}
