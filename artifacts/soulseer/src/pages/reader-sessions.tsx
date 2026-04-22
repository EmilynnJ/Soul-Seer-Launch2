import { AppLayout } from "@/components/AppLayout";
import { RequireRole } from "@/components/RequireRole";
import { useListMySessions, useAcceptSession, useDeclineSession, useStartSession, useEndSession, getListMySessionsQueryKey } from "@workspace/api-client-react";
import { Link } from "wouter";
import { formatCents, formatDateTime, formatDuration } from "@/lib/format";
import { Clock, Video, Phone, MessageSquare, Loader2, Check, X, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

export default function ReaderSessionsPage() {
  return (
    <RequireRole role="reader">
      <SessionsContent />
    </RequireRole>
  );
}

function SessionsContent() {
  const { data: sessions, isLoading } = useListMySessions({ limit: 100 });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const getServiceIcon = (service: string) => {
    switch (service) {
      case 'video': return <Video className="w-4 h-4" />;
      case 'phone': return <Phone className="w-4 h-4" />;
      case 'chat': return <MessageSquare className="w-4 h-4" />;
      default: return null;
    }
  };

  const acceptSession = useAcceptSession({
    mutation: {
      onSuccess: () => {
        toast({ title: "Session accepted" });
        queryClient.invalidateQueries({ queryKey: getListMySessionsQueryKey() });
      }
    }
  });

  const declineSession = useDeclineSession({
    mutation: {
      onSuccess: () => {
        toast({ title: "Session declined" });
        queryClient.invalidateQueries({ queryKey: getListMySessionsQueryKey() });
      }
    }
  });

  const startSession = useStartSession({
    mutation: {
      onSuccess: () => {
        toast({ title: "Session started" });
        queryClient.invalidateQueries({ queryKey: getListMySessionsQueryKey() });
      }
    }
  });

  const handleAction = (action: 'accept' | 'decline' | 'start', sessionId: string) => {
    if (action === 'accept') acceptSession.mutate({ sessionId });
    if (action === 'decline') declineSession.mutate({ sessionId });
    if (action === 'start') startSession.mutate({ sessionId });
  };

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h1 className="font-display text-4xl text-primary mb-2">My Sessions</h1>
            <p className="font-serif text-muted-foreground">Your reading history with clients.</p>
          </div>
        </div>

        <div className="bg-card border border-border shadow-lg rounded-xl overflow-hidden">
          {isLoading ? (
            <div className="flex justify-center p-12"><Loader2 className="animate-spin w-8 h-8 text-primary" /></div>
          ) : sessions?.length ? (
            <div className="divide-y divide-border/50">
              {sessions.map(s => (
                <div key={s.id} className="p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:bg-muted/10 transition-colors">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full border border-border overflow-hidden shrink-0 mt-1">
                      {s.clientAvatarUrl ? <img src={s.clientAvatarUrl} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full bg-muted flex items-center justify-center font-display text-xl">{s.clientName.charAt(0)}</div>}
                    </div>
                    <div>
                      <h4 className="font-display text-2xl text-foreground mb-1">{s.clientName}</h4>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground font-sans">
                        <span className="flex items-center"><Clock className="w-3 h-3 mr-1" /> {formatDateTime(s.createdAt)}</span>
                        <span className="flex items-center capitalize px-2 py-0.5 bg-muted/30 rounded-full border border-border/50">
                          <span className="mr-1">{getServiceIcon(s.service)}</span> {s.service}
                        </span>
                        <span className={`capitalize px-2 py-0.5 rounded-full border ${s.status === 'completed' ? 'bg-secondary/10 text-secondary border-secondary/30' : s.status === 'in_progress' ? 'bg-primary/10 text-primary border-primary/30' : s.status === 'pending' ? 'bg-orange-500/10 text-orange-500 border-orange-500/30' : 'bg-muted/30 text-muted-foreground border-border/50'}`}>
                          {s.status.replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end mt-4 sm:mt-0 flex-wrap">
                    
                    {s.status === 'pending' && (
                      <>
                        <Button variant="outline" size="sm" className="font-sans border-destructive text-destructive hover:bg-destructive/10" onClick={() => handleAction('decline', s.id)} disabled={declineSession.isPending}>
                          <X className="w-4 h-4 mr-1" /> Decline
                        </Button>
                        <Button size="sm" className="font-sans bg-green-500 hover:bg-green-600 text-white" onClick={() => handleAction('accept', s.id)} disabled={acceptSession.isPending}>
                          <Check className="w-4 h-4 mr-1" /> Accept
                        </Button>
                      </>
                    )}

                    {s.status === 'accepted' && (
                      <Button size="sm" className="font-sans bg-primary hover:bg-primary/90 text-white" onClick={() => handleAction('start', s.id)} disabled={startSession.isPending}>
                        <Play className="w-4 h-4 mr-1" /> Start Now
                      </Button>
                    )}

                    {(s.status === 'in_progress' || s.status === 'completed' || s.status === 'declined') && (
                       <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="font-sans text-sm text-foreground">{formatDuration(s.billedSeconds)}</div>
                          <div className="font-sans text-sm text-muted-foreground">{formatCents(s.billedCents)}</div>
                        </div>
                        <Link href={`/sessions/${s.id}`}>
                          <Button variant={s.status === 'in_progress' ? 'default' : 'outline'} size="sm" className="font-sans">
                            {s.status === 'in_progress' ? 'Join' : 'View'}
                          </Button>
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-16 text-center">
              <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <h3 className="font-sans font-medium text-foreground mb-2">No sessions yet</h3>
              <p className="text-muted-foreground font-serif text-sm mb-6">Clients will appear here when they request a reading.</p>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
