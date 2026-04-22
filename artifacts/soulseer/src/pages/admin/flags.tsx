import { AppLayout } from "@/components/AppLayout";
import { RequireRole } from "@/components/RequireRole";
import { useListAdminFlags, getListAdminFlagsQueryKey, useResolveFlag } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Flag as FlagIcon, CheckCircle, Trash2 } from "lucide-react";
import { formatDateTime } from "@/lib/format";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { ResolveFlagBodyAction } from "@workspace/api-zod";

export default function AdminFlagsPage() {
  return (
    <RequireRole role="admin">
      <AdminFlagsContent />
    </RequireRole>
  );
}

function AdminFlagsContent() {
  const { data: flags, isLoading } = useListAdminFlags();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const resolveFlag = useResolveFlag({
    mutation: {
      onSuccess: () => {
        toast({ title: "Flag resolved" });
        queryClient.invalidateQueries({ queryKey: getListAdminFlagsQueryKey() });
      }
    }
  });

  const handleResolve = (flagId: string, action: ResolveFlagBodyAction) => {
    resolveFlag.mutate({ flagId, data: { action } });
  };

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <h1 className="font-display text-4xl text-secondary mb-8">Flagged Content</h1>
        
        <div className="space-y-6">
          {isLoading ? (
            <div className="flex justify-center p-12"><Loader2 className="animate-spin w-8 h-8 text-primary" /></div>
          ) : flags?.length ? (
            flags.map(flag => (
              <Card key={flag.id} className="bg-card border-border shadow-lg">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-2">
                      <FlagIcon className="w-5 h-5 text-destructive" />
                      <span className="font-sans font-semibold text-foreground capitalize">{flag.postType}</span>
                      <span className="text-xs text-muted-foreground font-sans ml-2">{formatDateTime(flag.createdAt)}</span>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded font-sans uppercase ${flag.status === 'open' ? 'bg-destructive/20 text-destructive' : 'bg-muted text-muted-foreground'}`}>
                      {flag.status}
                    </span>
                  </div>
                  
                  <div className="bg-muted/30 p-4 rounded-md mb-4 border border-border/50">
                    <p className="font-serif text-foreground/90 italic mb-2">"{flag.snippet || 'Content hidden'}"</p>
                    <p className="text-xs font-sans text-muted-foreground">Reported by {flag.flaggedByName || 'Unknown'}</p>
                  </div>
                  
                  <div className="mb-6">
                    <p className="font-sans text-sm font-medium mb-1">Reason for report:</p>
                    <p className="font-serif text-muted-foreground">{flag.reason}</p>
                  </div>

                  {flag.status === 'open' && (
                    <div className="flex gap-3 justify-end pt-4 border-t border-border/50">
                      <Button 
                        variant="outline" 
                        className="font-sans border-border/50"
                        onClick={() => handleResolve(flag.id, 'dismiss')}
                        disabled={resolveFlag.isPending}
                      >
                        <CheckCircle className="w-4 h-4 mr-2 text-green-500" /> Dismiss Flag
                      </Button>
                      <Button 
                        variant="destructive" 
                        className="font-sans"
                        onClick={() => handleResolve(flag.id, 'remove')}
                        disabled={resolveFlag.isPending}
                      >
                        <Trash2 className="w-4 h-4 mr-2" /> Remove Content
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          ) : (
            <Card className="bg-card border-border shadow-lg">
              <CardContent className="p-16 text-center">
                <FlagIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                <h3 className="font-sans font-medium text-foreground mb-2">No open flags</h3>
                <p className="text-muted-foreground font-serif text-sm">The community is peaceful.</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
