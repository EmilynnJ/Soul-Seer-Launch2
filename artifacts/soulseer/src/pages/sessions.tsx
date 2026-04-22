import { AppLayout } from "@/components/AppLayout";
import { RequireRole } from "@/components/RequireRole";
import { useListMySessions } from "@workspace/api-client-react";
import { Link } from "wouter";
import { formatCents, formatDateTime, formatDuration } from "@/lib/format";
import { Clock, Video, Phone, MessageSquare, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function SessionsPage() {
  return (
    <RequireRole role="client">
      <SessionsContent />
    </RequireRole>
  );
}

function SessionsContent() {
  const { data: sessions, isLoading } = useListMySessions({ limit: 100 });

  const getServiceIcon = (service: string) => {
    switch (service) {
      case 'video': return <Video className="w-4 h-4" />;
      case 'phone': return <Phone className="w-4 h-4" />;
      case 'chat': return <MessageSquare className="w-4 h-4" />;
      default: return null;
    }
  };

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h1 className="font-display text-4xl text-primary mb-2">My Sessions</h1>
            <p className="font-serif text-muted-foreground">Your reading history and transcripts.</p>
          </div>
          <Link href="/readers">
            <Button className="font-sans">New Reading</Button>
          </Link>
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
                      {s.readerAvatarUrl ? <img src={s.readerAvatarUrl} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full bg-muted flex items-center justify-center font-display text-xl">{s.readerName.charAt(0)}</div>}
                    </div>
                    <div>
                      <h4 className="font-display text-2xl text-foreground mb-1">{s.readerName}</h4>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground font-sans">
                        <span className="flex items-center"><Clock className="w-3 h-3 mr-1" /> {formatDateTime(s.createdAt)}</span>
                        <span className="flex items-center capitalize px-2 py-0.5 bg-muted/30 rounded-full border border-border/50">
                          <span className="mr-1">{getServiceIcon(s.service)}</span> {s.service}
                        </span>
                        <span className={`capitalize px-2 py-0.5 rounded-full border ${s.status === 'completed' ? 'bg-secondary/10 text-secondary border-secondary/30' : s.status === 'in_progress' ? 'bg-primary/10 text-primary border-primary/30' : 'bg-muted/30 text-muted-foreground border-border/50'}`}>
                          {s.status.replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-6 w-full sm:w-auto justify-between sm:justify-end mt-4 sm:mt-0">
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
                </div>
              ))}
            </div>
          ) : (
            <div className="p-16 text-center">
              <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <h3 className="font-sans font-medium text-foreground mb-2">No sessions yet</h3>
              <p className="text-muted-foreground font-serif text-sm mb-6">Connect with a reader to begin your spiritual journey.</p>
              <Link href="/readers">
                <Button className="bg-primary hover:bg-primary/90 text-primary-foreground font-sans">Browse Readers</Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
