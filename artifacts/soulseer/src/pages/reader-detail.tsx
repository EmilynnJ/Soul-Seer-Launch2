import { useGetReader, getGetReaderQueryKey, useListReaderReviews, getListReaderReviewsQueryKey, useRequestSession } from "@workspace/api-client-react";
import { AppLayout } from "@/components/AppLayout";
import { useParams, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, Video, Phone, MessageSquare, Loader2 } from "lucide-react";
import { formatCents, formatDate } from "@/lib/format";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useState } from "react";
import { ServiceType } from "@workspace/api-zod";

export default function ReaderDetailPage() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const { data: reader, isLoading } = useGetReader(id as string, {
    query: {
      enabled: !!id,
      queryKey: getGetReaderQueryKey(id as string),
    }
  });

  const { data: reviews } = useListReaderReviews(id as string, undefined, {
    query: {
      enabled: !!id,
      queryKey: getListReaderReviewsQueryKey(id as string),
    }
  });

  const reqSession = useRequestSession({
    mutation: {
      onSuccess: (session) => {
        setLocation(`/sessions/${session.id}`);
      },
      onError: (err) => {
        toast({ title: "Error requesting session", description: err.message, variant: "destructive" });
      }
    }
  });

  const [service, setService] = useState<ServiceType>("chat");

  if (isLoading) return <AppLayout><div className="flex justify-center py-20"><Loader2 className="animate-spin w-8 h-8 text-primary" /></div></AppLayout>;
  if (!reader) return <AppLayout><div className="text-center py-20 font-display text-3xl">Reader not found</div></AppLayout>;

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-12 max-w-5xl">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-1">
            <div className="bg-card border border-border rounded-xl p-6 text-center sticky top-24">
              <div className="w-32 h-32 rounded-full border-4 border-primary/50 mx-auto overflow-hidden mb-4 shadow-[0_0_20px_rgba(255,105,180,0.3)]">
                 {reader.avatarUrl ? (
                   <img src={reader.avatarUrl} alt={reader.displayName} className="w-full h-full object-cover" />
                 ) : (
                   <div className="w-full h-full bg-muted flex items-center justify-center font-display text-4xl">
                     {reader.displayName.charAt(0)}
                   </div>
                 )}
              </div>
              <h1 className="font-display text-4xl text-foreground mb-1">{reader.displayName}</h1>
              <p className="text-muted-foreground font-serif mb-4">{reader.tagline}</p>
              
              <div className="flex justify-center items-center gap-1 mb-6 text-secondary">
                <Star className="fill-current w-5 h-5" />
                <span className="font-sans font-bold">{reader.rating.toFixed(1)}</span>
                <span className="text-muted-foreground text-sm font-sans">({reader.reviewCount} reviews)</span>
              </div>

              <div className="space-y-4">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-sans text-lg h-12 shadow-[0_0_15px_rgba(255,105,180,0.3)]">
                      Start Session
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-card border-border sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle className="font-display text-3xl text-primary mb-2">Choose Service</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3">
                      {reader.ratePerMinChatCents > 0 && (
                        <button onClick={() => setService("chat")} className={`w-full flex items-center justify-between p-4 border rounded-lg transition-colors ${service === 'chat' ? 'border-primary bg-primary/10' : 'border-border hover:bg-muted'}`}>
                          <div className="flex items-center gap-3"><MessageSquare className="w-5 h-5 text-primary" /><span className="font-sans text-lg">Text Chat</span></div>
                          <span className="font-sans font-medium">{formatCents(reader.ratePerMinChatCents)}/min</span>
                        </button>
                      )}
                      {reader.ratePerMinPhoneCents > 0 && (
                        <button onClick={() => setService("phone")} className={`w-full flex items-center justify-between p-4 border rounded-lg transition-colors ${service === 'phone' ? 'border-primary bg-primary/10' : 'border-border hover:bg-muted'}`}>
                          <div className="flex items-center gap-3"><Phone className="w-5 h-5 text-primary" /><span className="font-sans text-lg">Voice Call</span></div>
                          <span className="font-sans font-medium">{formatCents(reader.ratePerMinPhoneCents)}/min</span>
                        </button>
                      )}
                      {reader.ratePerMinVideoCents > 0 && (
                        <button onClick={() => setService("video")} className={`w-full flex items-center justify-between p-4 border rounded-lg transition-colors ${service === 'video' ? 'border-primary bg-primary/10' : 'border-border hover:bg-muted'}`}>
                          <div className="flex items-center gap-3"><Video className="w-5 h-5 text-primary" /><span className="font-sans text-lg">Video Call</span></div>
                          <span className="font-sans font-medium">{formatCents(reader.ratePerMinVideoCents)}/min</span>
                        </button>
                      )}
                      <Button className="w-full mt-4" onClick={() => reqSession.mutate({ data: { readerId: reader.id, service }})} disabled={reqSession.isPending}>
                        {reqSession.isPending ? <Loader2 className="animate-spin" /> : "Request Now"}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>

              </div>
            </div>
          </div>

          <div className="md:col-span-2 space-y-8">
            <section className="bg-card border border-border p-8 rounded-xl">
              <h2 className="font-display text-3xl text-secondary mb-4 drop-shadow-[0_0_5px_rgba(212,175,55,0.3)]">About {reader.displayName}</h2>
              <div className="prose prose-invert max-w-none font-serif text-foreground/90 whitespace-pre-wrap">
                {reader.bio || "This reader hasn't provided a bio yet."}
              </div>
              
              <div className="mt-8">
                <h3 className="font-sans font-semibold mb-3 text-muted-foreground uppercase tracking-wider text-sm">Specialties</h3>
                <div className="flex flex-wrap gap-2">
                  {reader.specialties?.map(s => (
                    <Badge key={s} variant="secondary" className="bg-secondary/10 text-secondary border border-secondary/30 font-serif">
                      {s}
                    </Badge>
                  ))}
                </div>
              </div>
            </section>

            <section className="bg-card border border-border p-8 rounded-xl">
              <h2 className="font-display text-3xl text-primary mb-6">Recent Reviews</h2>
              {reviews?.length ? (
                <div className="space-y-6">
                  {reviews.map(r => (
                    <div key={r.id} className="border-b border-border/50 pb-6 last:border-0 last:pb-0">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <span className="font-sans font-semibold text-foreground">{r.clientName}</span>
                          <span className="text-muted-foreground text-xs ml-3 font-sans">{formatDate(r.createdAt)}</span>
                        </div>
                        <div className="flex text-secondary">
                          {Array.from({length: 5}).map((_, i) => (
                            <Star key={i} className={`w-4 h-4 ${i < r.rating ? 'fill-current' : 'opacity-30'}`} />
                          ))}
                        </div>
                      </div>
                      <p className="font-serif text-foreground/90">{r.body}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground font-serif italic">No reviews yet.</p>
              )}
            </section>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
