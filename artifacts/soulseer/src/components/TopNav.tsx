import { Link } from "wouter";
import { Show, useClerk } from "@clerk/react";
import { useGetMe, getGetMeQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Menu, User, Wallet, LogOut, ChevronDown } from "lucide-react";
import { formatCents } from "@/lib/format";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export function TopNav() {
  const { signOut } = useClerk();
  const queryClient = useQueryClient();
  const { data: me } = useGetMe({
    query: {
      queryKey: getGetMeQueryKey(),
      retry: false,
    }
  });

  const handleSignOut = () => {
    signOut(() => {
      queryClient.clear();
      window.location.href = "/";
    });
  };

  const NavLinks = () => (
    <>
      <Link href="/readers" className="text-foreground hover:text-primary transition-colors font-sans text-sm">Browse Readers</Link>
      <Link href="/community" className="text-foreground hover:text-primary transition-colors font-sans text-sm">Community</Link>
      <Link href="/forum" className="text-foreground hover:text-primary transition-colors font-sans text-sm">Forum</Link>
      <Link href="/about" className="text-foreground hover:text-primary transition-colors font-sans text-sm">About</Link>
    </>
  );

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex flex-col">
            <span className="font-display text-2xl text-primary drop-shadow-[0_0_8px_rgba(255,105,180,0.5)]">SoulSeer</span>
          </Link>
          <nav className="hidden md:flex items-center gap-6 ml-6">
            <NavLinks />
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <Show when="signed-in">
            {me && (
              <div className="hidden sm:flex items-center gap-4">
                <Link href="/wallet">
                  <div className="flex items-center gap-2 bg-secondary/10 border border-secondary/30 px-3 py-1.5 rounded-full cursor-pointer hover:bg-secondary/20 transition-colors">
                    <Wallet className="w-4 h-4 text-secondary" />
                    <span className="font-sans text-sm font-medium text-secondary">{formatCents(me.balanceCents)}</span>
                  </div>
                </Link>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-9 rounded-full border-border/50 pr-2 pl-3 hover:bg-muted/50">
                      <div className="flex items-center gap-2">
                        <span className="font-sans text-sm truncate max-w-[100px]">{me.displayName}</span>
                        {me.avatarUrl ? (
                          <img src={me.avatarUrl} alt="" className="w-6 h-6 rounded-full object-cover" />
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-medium">
                            {me.displayName.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <ChevronDown className="w-3 h-3 text-muted-foreground" />
                      </div>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard" className="cursor-pointer w-full">Dashboard</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/messages" className="cursor-pointer w-full flex justify-between">
                        <span>Messages</span>
                        {me.unreadMessages ? (
                          <span className="bg-primary text-primary-foreground text-[10px] px-1.5 rounded-full">{me.unreadMessages}</span>
                        ) : null}
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/sessions" className="cursor-pointer w-full">My Sessions</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/favorites" className="cursor-pointer w-full">Favorites</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/wallet" className="cursor-pointer w-full">Wallet</Link>
                    </DropdownMenuItem>
                    
                    {me.role === "reader" && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                          <Link href="/reader" className="cursor-pointer w-full text-primary">Reader Dashboard</Link>
                        </DropdownMenuItem>
                      </>
                    )}
                    
                    {me.role === "admin" && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                          <Link href="/admin" className="cursor-pointer w-full text-secondary">Admin Area</Link>
                        </DropdownMenuItem>
                      </>
                    )}
                    
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut} className="text-destructive cursor-pointer">
                      <LogOut className="w-4 h-4 mr-2" />
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
          </Show>

          <Show when="signed-out">
            <div className="hidden sm:flex items-center gap-4">
              <Link href="/sign-in" className="text-foreground hover:text-primary transition-colors font-sans text-sm">Sign In</Link>
              <Link href="/sign-up" className="bg-primary/10 border border-primary/30 text-primary px-4 py-2 rounded text-sm hover:bg-primary/20 transition-all shadow-[0_0_10px_rgba(255,105,180,0.1)]">Join</Link>
            </div>
          </Show>

          {/* Mobile Menu */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="w-5 h-5 text-foreground" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="bg-card border-l border-border/50">
              <div className="flex flex-col gap-6 mt-8">
                <div className="flex flex-col gap-4 font-sans text-lg">
                  <NavLinks />
                </div>
                
                <hr className="border-border/50" />
                
                <Show when="signed-in">
                  {me && (
                    <div className="flex flex-col gap-4 font-sans">
                      <Link href="/dashboard" className="text-foreground hover:text-primary">Dashboard</Link>
                      <Link href="/wallet" className="text-foreground hover:text-primary flex justify-between">
                        <span>Wallet</span>
                        <span className="text-secondary">{formatCents(me.balanceCents)}</span>
                      </Link>
                      <Link href="/messages" className="text-foreground hover:text-primary">Messages</Link>
                      <Link href="/sessions" className="text-foreground hover:text-primary">My Sessions</Link>
                      
                      {me.role === "reader" && (
                        <Link href="/reader" className="text-primary hover:text-primary/80 mt-2">Reader Dashboard</Link>
                      )}
                      
                      {me.role === "admin" && (
                        <Link href="/admin" className="text-secondary hover:text-secondary/80 mt-2">Admin Area</Link>
                      )}
                      
                      <button onClick={handleSignOut} className="text-left text-destructive mt-4">Sign Out</button>
                    </div>
                  )}
                </Show>
                
                <Show when="signed-out">
                  <div className="flex flex-col gap-4 font-sans">
                    <Link href="/sign-in" className="text-foreground hover:text-primary">Sign In</Link>
                    <Link href="/sign-up" className="text-primary">Join Community</Link>
                  </div>
                </Show>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
