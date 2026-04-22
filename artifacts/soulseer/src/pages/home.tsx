import { Link } from "wouter";
import { useListOnlineReaders, useListAnnouncements, useSubscribeNewsletter } from "@workspace/api-client-react";
import { ReaderCard } from "@/components/ReaderCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { Loader2 } from "lucide-react";

export default function Home() {
  const { data: onlineReaders, isLoading: readersLoading } = useListOnlineReaders();
  const { data: announcements } = useListAnnouncements();
  
  const [email, setEmail] = useState("");
  const { toast } = useToast();
  
  const subscribe = useSubscribeNewsletter({
    mutation: {
      onSuccess: () => {
        toast({ title: "Subscribed successfully", description: "Welcome to our newsletter." });
        setEmail("");
      },
      onError: () => {
        toast({ title: "Subscription failed", variant: "destructive" });
      }
    }
  });

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    subscribe.mutate({ data: { email } });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="absolute top-0 left-0 right-0 z-50 p-6 flex justify-between items-center bg-gradient-to-b from-black/80 to-transparent">
        <div className="flex flex-col">
          <span className="font-display text-3xl text-primary drop-shadow-[0_0_8px_rgba(255,105,180,0.5)]">SoulSeer</span>
          <span className="text-xs text-secondary tracking-widest uppercase font-sans mt-1">A Community of Gifted Psychics</span>
        </div>
        <nav className="hidden md:flex items-center gap-6 font-sans text-sm tracking-wide">
          <Link href="/readers" className="text-foreground hover:text-primary transition-colors">Browse Readers</Link>
          <Link href="/community" className="text-foreground hover:text-primary transition-colors">Community</Link>
          <Link href="/about" className="text-foreground hover:text-primary transition-colors">About</Link>
          <Link href="/sign-in" className="text-foreground hover:text-primary transition-colors">Sign In</Link>
          <Link href="/sign-up" className="bg-primary/10 border border-primary/30 text-primary px-4 py-2 rounded hover:bg-primary/20 transition-all shadow-[0_0_15px_rgba(255,105,180,0.15)]">Join</Link>
        </nav>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative h-[80vh] min-h-[600px] flex items-center justify-center text-center px-4 overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://i.postimg.cc/tRLSgCPb/HERO-IMAGE-1.jpg')] bg-cover bg-center bg-no-repeat" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/60 to-background" />
          
          <div className="relative z-10 max-w-3xl mx-auto flex flex-col items-center">
            <h1 className="font-display text-5xl md:text-7xl lg:text-8xl text-primary mb-6 drop-shadow-[0_0_15px_rgba(255,105,180,0.4)]">Discover Your Path</h1>
            <p className="font-serif text-lg md:text-xl text-foreground/90 mb-10 max-w-xl mx-auto leading-relaxed">
              Step into the parlor. Connect with gifted psychics, tarot readers, and spiritual guides in a sacred, private space.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/readers" className="bg-primary text-primary-foreground font-sans px-8 py-3 text-lg rounded shadow-[0_0_20px_rgba(255,105,180,0.3)] hover:shadow-[0_0_30px_rgba(255,105,180,0.5)] transition-all">
                Browse Readers
              </Link>
              <Link href="/sign-up" className="bg-card/50 backdrop-blur-sm border border-secondary/30 text-secondary font-sans px-8 py-3 text-lg rounded hover:bg-card/80 transition-all">
                Join Community
              </Link>
            </div>
          </div>
        </section>

        {/* Online Readers */}
        <section className="py-24 px-6 max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-display text-4xl text-primary mb-4">Gifted Readers Online Now</h2>
            <div className="h-px w-24 bg-gradient-to-r from-transparent via-secondary to-transparent mx-auto" />
          </div>
          
          {readersLoading ? (
            <div className="flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
          ) : onlineReaders?.length ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {onlineReaders.slice(0, 4).map(reader => (
                <ReaderCard key={reader.id} reader={reader} />
              ))}
            </div>
          ) : (
             <p className="text-center text-muted-foreground font-serif">No readers currently online. Please check back later or browse all readers.</p>
          )}
          
          <div className="text-center mt-12">
            <Link href="/readers">
              <Button variant="outline" className="font-sans border-primary/30 text-primary hover:bg-primary/10">View All Readers</Button>
            </Link>
          </div>
        </section>
        
        {/* Newsletter & Announcements */}
        <section className="py-24 px-6 bg-card border-y border-border">
          <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="font-display text-4xl text-secondary mb-4">The Spiritual Seeker's Newsletter</h2>
              <p className="font-serif text-muted-foreground mb-8">Receive weekly horoscopes, tarot insights, and platform updates directly in your inbox.</p>
              <form onSubmit={handleSubscribe} className="flex gap-2">
                <Input 
                  type="email" 
                  placeholder="Enter your email" 
                  value={email} 
                  onChange={e => setEmail(e.target.value)}
                  className="bg-background border-border/50 font-sans"
                />
                <Button type="submit" disabled={subscribe.isPending} className="bg-secondary text-secondary-foreground hover:bg-secondary/90 font-sans">
                  Subscribe
                </Button>
              </form>
            </div>
            
            {announcements && announcements.length > 0 && (
              <div className="bg-background border border-border p-8 rounded-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-full pointer-events-none" />
                <h3 className="font-display text-2xl text-primary mb-6 relative z-10">Latest from the Parlor</h3>
                <div className="space-y-6 relative z-10">
                  {announcements.slice(0, 2).map(ann => (
                    <div key={ann.id}>
                      <h4 className="font-sans font-medium text-foreground">{ann.title}</h4>
                      <p className="text-sm text-muted-foreground font-serif line-clamp-2 mt-1">{ann.body}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-6 pt-6 border-t border-border/50 relative z-10">
                  <Link href="/community" className="text-sm text-secondary hover:underline font-sans">Read all announcements &rarr;</Link>
                </div>
              </div>
            )}
          </div>
        </section>
      </main>

      <footer className="bg-background py-12 px-6 text-center border-t border-border">
        <div className="font-display text-2xl text-primary mb-2">SoulSeer</div>
        <p className="text-sm text-muted-foreground font-sans mb-8">A Community of Gifted Psychics</p>
        <div className="flex justify-center gap-6 font-sans text-sm">
          <a href="https://discord.gg/soulseer" target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-primary transition-colors">Discord</a>
          <a href="https://facebook.com/soulseer" target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-primary transition-colors">Facebook</a>
          <Link href="/about" className="text-muted-foreground hover:text-primary transition-colors">Our Mission</Link>
        </div>
      </footer>
    </div>
  );
}
