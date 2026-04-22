import { Link } from "wouter";

export function Footer() {
  return (
    <footer className="bg-card border-t border-border mt-auto">
      <div className="container mx-auto px-4 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-12">
          <div className="md:col-span-2">
            <h3 className="font-display text-3xl text-primary mb-2 drop-shadow-[0_0_8px_rgba(255,105,180,0.3)]">SoulSeer</h3>
            <p className="text-sm text-secondary tracking-widest uppercase font-sans mb-6">A Community of Gifted Psychics</p>
            <p className="text-muted-foreground font-serif max-w-sm leading-relaxed">
              A sacred ethical space where gifted readers are honored and clients receive authentic guidance at fair, transparent rates.
            </p>
          </div>
          
          <div>
            <h4 className="font-sans font-semibold text-foreground mb-4">Explore</h4>
            <ul className="flex flex-col gap-3 font-sans text-sm text-muted-foreground">
              <li><Link href="/readers" className="hover:text-primary transition-colors">Browse Readers</Link></li>
              <li><Link href="/community" className="hover:text-primary transition-colors">Community</Link></li>
              <li><Link href="/forum" className="hover:text-primary transition-colors">Forum</Link></li>
              <li><Link href="/about" className="hover:text-primary transition-colors">Our Mission</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-sans font-semibold text-foreground mb-4">Connect</h4>
            <ul className="flex flex-col gap-3 font-sans text-sm text-muted-foreground">
              <li><a href="https://discord.gg/soulseer" target="_blank" rel="noreferrer" className="hover:text-primary transition-colors">Discord</a></li>
              <li><a href="https://facebook.com/soulseer" target="_blank" rel="noreferrer" className="hover:text-primary transition-colors">Facebook</a></li>
              <li><Link href="/sign-up" className="hover:text-primary transition-colors">Join Community</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="mt-12 pt-8 border-t border-border/50 text-center text-xs text-muted-foreground/60 font-sans flex flex-col md:flex-row justify-between items-center">
          <p>© {new Date().getFullYear()} SoulSeer. All rights reserved.</p>
          <div className="flex items-center gap-2 mt-2 md:mt-0">
            <span>Made with intention.</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
