import { AppLayout } from "@/components/AppLayout";

export default function AboutPage() {
  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <h1 className="font-display text-5xl text-primary mb-12 text-center drop-shadow-[0_0_10px_rgba(255,105,180,0.3)]">Our Mission</h1>
        
        <div className="flex flex-col md:flex-row gap-12 items-center md:items-start mb-20">
          <div className="w-full md:w-1/3 flex-shrink-0">
            <div className="rounded-xl overflow-hidden border border-secondary/30 shadow-[0_0_20px_rgba(212,175,55,0.15)] relative aspect-[3/4]">
              <img 
                src="https://i.postimg.cc/s2ds9RtC/FOUNDER.jpg" 
                alt="Emily, Founder of SoulSeer" 
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
              <div className="absolute bottom-4 left-4">
                <p className="font-display text-2xl text-secondary">Emily</p>
                <p className="font-sans text-xs text-white/80 uppercase tracking-widest">Founder</p>
              </div>
            </div>
          </div>
          
          <div className="w-full md:w-2/3">
            <div className="bg-card/50 backdrop-blur border border-border/50 rounded-xl p-8 shadow-lg relative">
              <div className="absolute -top-4 -left-4 text-6xl text-primary/20 font-serif opacity-50">"</div>
              <p className="font-serif text-lg leading-relaxed text-foreground/90 relative z-10 italic">
                SoulSeer was founded by Emily, a gifted psychic medium with over a decade of experience guiding souls. Frustrated by exploitative practices in the psychic industry — exorbitant fees, unethical platform cuts, and a lack of respect for genuine practitioners — she built SoulSeer as a sacred ethical space. Here, gifted readers are honored and clients receive authentic guidance at fair, transparent rates. SoulSeer is more than a platform — it is a community.
              </p>
            </div>
          </div>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8 text-center">
          <div className="p-6 bg-card border border-border/40 rounded-xl">
            <div className="w-12 h-12 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-4 border border-primary/30">
              1
            </div>
            <h3 className="font-display text-2xl text-foreground mb-2">Authentic Connections</h3>
            <p className="font-serif text-muted-foreground text-sm">We vet every reader carefully to ensure you receive genuine, heartfelt guidance when you need it most.</p>
          </div>
          
          <div className="p-6 bg-card border border-border/40 rounded-xl">
            <div className="w-12 h-12 bg-secondary/10 text-secondary rounded-full flex items-center justify-center mx-auto mb-4 border border-secondary/30">
              2
            </div>
            <h3 className="font-display text-2xl text-foreground mb-2">Fair Practices</h3>
            <p className="font-serif text-muted-foreground text-sm">Readers keep the majority of their earnings. We believe spiritual gifts should be honored, not exploited.</p>
          </div>
          
          <div className="p-6 bg-card border border-border/40 rounded-xl">
            <div className="w-12 h-12 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-4 border border-primary/30">
              3
            </div>
            <h3 className="font-display text-2xl text-foreground mb-2">Sacred Space</h3>
            <p className="font-serif text-muted-foreground text-sm">Your readings and messages are completely private and secure. A modern platform with the intimacy of a candlelit parlor.</p>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
