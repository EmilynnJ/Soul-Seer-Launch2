import { Reader } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Star, Video, Phone, MessageSquare } from "lucide-react";
import { formatCents } from "@/lib/format";
import { Badge } from "@/components/ui/badge";

interface ReaderCardProps {
  reader: Reader;
}

export function ReaderCard({ reader }: ReaderCardProps) {
  const isOnline = reader.status === "online";
  const isBusy = reader.status === "busy";

  return (
    <Link href={`/readers/${reader.id}`}>
      <div className="group relative bg-card border border-border rounded-xl overflow-hidden cursor-pointer transition-all duration-300 hover:border-primary/50 hover:shadow-[0_0_20px_rgba(255,105,180,0.15)] flex flex-col h-full">
        {/* Top half: Avatar & Status */}
        <div className="p-6 pb-4 flex flex-col items-center text-center relative">
          <div className="relative mb-4">
            <div className={`w-24 h-24 rounded-full overflow-hidden border-2 transition-colors duration-300 ${isOnline ? 'border-primary shadow-[0_0_15px_rgba(255,105,180,0.4)]' : isBusy ? 'border-secondary shadow-[0_0_15px_rgba(212,175,55,0.3)]' : 'border-border'}`}>
              {reader.avatarUrl ? (
                <img src={reader.avatarUrl} alt={reader.displayName} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-muted flex items-center justify-center font-display text-3xl text-muted-foreground">
                  {reader.displayName.charAt(0)}
                </div>
              )}
            </div>
            
            {/* Status indicator indicator */}
            <div className={`absolute bottom-1 right-1 w-4 h-4 rounded-full border-2 border-card ${isOnline ? 'bg-primary' : isBusy ? 'bg-secondary' : 'bg-muted'}`} />
          </div>
          
          <h3 className="font-display text-2xl text-foreground mb-1 group-hover:text-primary transition-colors">{reader.displayName}</h3>
          {reader.tagline && (
            <p className="text-sm text-muted-foreground font-serif line-clamp-1">{reader.tagline}</p>
          )}

          {/* Rating */}
          <div className="flex items-center gap-1 mt-3 text-secondary">
            <Star className="w-4 h-4 fill-current" />
            <span className="font-sans font-medium text-sm text-foreground">{reader.rating.toFixed(1)}</span>
            <span className="font-sans text-xs text-muted-foreground ml-1">({reader.reviewCount})</span>
          </div>
        </div>

        {/* Bottom half: Services & Rates */}
        <div className="p-6 pt-4 bg-muted/20 border-t border-border mt-auto">
          <div className="flex flex-wrap justify-center gap-2 mb-4">
            {reader.specialties?.slice(0, 3).map((spec: string) => (
              <Badge key={spec} variant="outline" className="bg-background border-border text-muted-foreground font-serif text-xs px-2 py-0.5">
                {spec}
              </Badge>
            ))}
          </div>

          <div className="flex justify-center items-center gap-4 text-muted-foreground">
            {reader.ratePerMinChatCents > 0 && (
              <div className="flex flex-col items-center" title="Chat readings available">
                <MessageSquare className="w-4 h-4 mb-1" />
                <span className="text-xs font-sans">{formatCents(reader.ratePerMinChatCents)}/m</span>
              </div>
            )}
            {reader.ratePerMinPhoneCents > 0 && (
              <div className="flex flex-col items-center" title="Phone readings available">
                <Phone className="w-4 h-4 mb-1" />
                <span className="text-xs font-sans">{formatCents(reader.ratePerMinPhoneCents)}/m</span>
              </div>
            )}
            {reader.ratePerMinVideoCents > 0 && (
              <div className="flex flex-col items-center" title="Video readings available">
                <Video className="w-4 h-4 mb-1" />
                <span className="text-xs font-sans">{formatCents(reader.ratePerMinVideoCents)}/m</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
