import { AppLayout } from "@/components/AppLayout";
import { useGetCommunityLinks, useListAnnouncements } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { MessageCircle, Users, Pin, ArrowRight } from "lucide-react";
import { formatDate } from "@/lib/format";

export default function CommunityPage() {
  const { data: links } = useGetCommunityLinks();
  const { data: announcements } = useListAnnouncements();

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-12 max-w-5xl">
        <div className="text-center mb-16">
          <h1 className="font-display text-5xl md:text-6xl text-primary mb-4 drop-shadow-[0_0_10px_rgba(255,105,180,0.3)]">The SoulSeer Community</h1>
          <p className="font-serif text-lg text-muted-foreground max-w-2xl mx-auto">
            A sacred gathering place for seekers and guides. Connect, share experiences, and learn together.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <Card className="bg-card border-border/50 hover:border-primary/50 transition-colors group cursor-pointer" onClick={() => window.location.href = '/forum'}>
            <CardContent className="p-8 text-center flex flex-col items-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <MessageCircle className="w-8 h-8 text-primary" />
              </div>
              <h2 className="font-display text-3xl text-foreground mb-3">The Forum</h2>
              <p className="font-serif text-muted-foreground text-sm mb-6 flex-grow">
                Discuss tarot, astrology, spiritual awakening, and share your reading experiences.
              </p>
              <Button variant="outline" className="w-full font-sans border-primary/30 text-primary group-hover:bg-primary/10">
                Enter Forum <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-card border-border/50 hover:border-[#5865F2]/50 transition-colors group cursor-pointer" onClick={() => links?.discordUrl && window.open(links.discordUrl, '_blank')}>
            <CardContent className="p-8 text-center flex flex-col items-center">
              <div className="w-16 h-16 bg-[#5865F2]/10 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Users className="w-8 h-8 text-[#5865F2]" />
              </div>
              <h2 className="font-display text-3xl text-foreground mb-3">Discord</h2>
              <p className="font-serif text-muted-foreground text-sm mb-6 flex-grow">
                Join our real-time chat server for live events, voice channels, and casual connection.
              </p>
              <Button variant="outline" className="w-full font-sans border-[#5865F2]/30 text-[#5865F2] group-hover:bg-[#5865F2]/10">
                Join Discord <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-card border-border/50 hover:border-[#1877F2]/50 transition-colors group cursor-pointer" onClick={() => links?.facebookUrl && window.open(links.facebookUrl, '_blank')}>
            <CardContent className="p-8 text-center flex flex-col items-center">
              <div className="w-16 h-16 bg-[#1877F2]/10 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Users className="w-8 h-8 text-[#1877F2]" />
              </div>
              <h2 className="font-display text-3xl text-foreground mb-3">Facebook Group</h2>
              <p className="font-serif text-muted-foreground text-sm mb-6 flex-grow">
                Connect with our wider community, share articles, and participate in daily prompts.
              </p>
              <Button variant="outline" className="w-full font-sans border-[#1877F2]/30 text-[#1877F2] group-hover:bg-[#1877F2]/10">
                Join Group <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        </div>

        <h2 className="font-display text-4xl text-secondary mb-8 drop-shadow-[0_0_5px_rgba(212,175,55,0.3)]">Platform Announcements</h2>
        <div className="space-y-6">
          {announcements?.length ? (
            announcements.map((announcement) => (
              <Card key={announcement.id} className={`bg-card border-border ${announcement.isPinned ? 'border-secondary/50 shadow-[0_0_15px_rgba(212,175,55,0.1)]' : ''}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3 mb-1">
                    {announcement.isPinned && <Pin className="w-4 h-4 text-secondary fill-secondary/20" />}
                    <span className="text-xs text-muted-foreground font-sans">{formatDate(announcement.createdAt)}</span>
                  </div>
                  <CardTitle className="font-display text-2xl text-foreground">{announcement.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="font-serif text-foreground/80 leading-relaxed whitespace-pre-wrap">{announcement.body}</p>
                </CardContent>
              </Card>
            ))
          ) : (
            <p className="text-muted-foreground font-serif italic p-8 text-center bg-card border border-border/50 rounded-xl">No recent announcements.</p>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
