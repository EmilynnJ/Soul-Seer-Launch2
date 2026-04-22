import { AppLayout } from "@/components/AppLayout";
import { RequireRole } from "@/components/RequireRole";
import { useGetMyBalance, useListMyTransactions, useCreateTopup, useSetAutoReload } from "@workspace/api-client-react";
import { formatCents, formatDateTime } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Wallet, CreditCard, ArrowUpRight, ArrowDownRight, RefreshCw, Loader2, Zap } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { customFetch } from "@workspace/api-client-react";

export default function WalletPage() {
  return (
    <RequireRole role="client">
      <WalletContent />
    </RequireRole>
  );
}

function WalletContent() {
  const { data: balance, isLoading: balanceLoading } = useGetMyBalance();
  const { data: transactions, isLoading: txLoading } = useListMyTransactions({ limit: 50 });
  const [topupAmount, setTopupAmount] = useState("50");
  const { toast } = useToast();
  
  const createTopup = useCreateTopup({
    mutation: {
      onSuccess: (data) => {
        if (data.url) {
          window.location.href = data.url;
        }
      },
      onError: (err) => {
        toast({ title: "Top-up failed", description: err.message, variant: "destructive" });
      }
    }
  });

  const handleTopup = (e: React.FormEvent) => {
    e.preventDefault();
    const amountCents = parseInt(topupAmount) * 100;
    if (isNaN(amountCents) || amountCents < 1000) {
      toast({ title: "Invalid amount", description: "Minimum top-up is $10", variant: "destructive" });
      return;
    }
    createTopup.mutate({ data: { amountCents } });
  };

  // Dev credit
  const queryClient = useQueryClient();
  const [isDevCreditLoading, setIsDevCreditLoading] = useState(false);
  const handleDevCredit = async () => {
    setIsDevCreditLoading(true);
    try {
      await customFetch('/api/dev/grant-credit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amountCents: 10000 })
      });
      toast({ title: "Granted $100 dev credit" });
      queryClient.invalidateQueries();
    } catch (e: any) {
      toast({ title: "Dev credit failed", description: e.message, variant: "destructive" });
    } finally {
      setIsDevCreditLoading(false);
    }
  };

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <h1 className="font-display text-4xl text-primary mb-8">Wallet & Balance</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          <Card className="bg-card border-border shadow-lg">
            <CardHeader>
              <CardTitle className="font-sans flex items-center gap-2">
                <Wallet className="w-5 h-5 text-secondary" /> Current Balance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-5xl font-display text-secondary mb-6 drop-shadow-[0_0_5px_rgba(212,175,55,0.3)]">
                {balanceLoading ? <Loader2 className="animate-spin w-8 h-8" /> : formatCents(balance?.balanceCents)}
              </div>
              
              <Dialog>
                <DialogTrigger asChild>
                  <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-sans text-lg h-12 shadow-[0_0_15px_rgba(255,105,180,0.2)]">
                    <CreditCard className="w-5 h-5 mr-2" /> Add Funds
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-card border-border sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle className="font-display text-3xl text-primary">Add Funds</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleTopup} className="space-y-6 pt-4">
                    <div className="space-y-2">
                      <Label htmlFor="amount" className="font-sans">Amount (USD)</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                        <Input 
                          id="amount" 
                          type="number" 
                          min="10" 
                          step="1" 
                          value={topupAmount}
                          onChange={(e) => setTopupAmount(e.target.value)}
                          className="pl-8 bg-input border-border/50 text-lg font-sans"
                        />
                      </div>
                      <p className="text-xs text-muted-foreground font-sans">Minimum $10.00</p>
                    </div>
                    <Button type="submit" className="w-full font-sans" disabled={createTopup.isPending}>
                      {createTopup.isPending ? <Loader2 className="animate-spin mr-2 w-4 h-4" /> : null}
                      Checkout with Stripe
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>

              {/* Dev tool only visible on localhost/replit */}
              <div className="mt-4 pt-4 border-t border-border/50">
                <Button variant="outline" size="sm" onClick={handleDevCredit} disabled={isDevCreditLoading} className="w-full text-xs font-mono bg-background text-muted-foreground border-dashed">
                  <Zap className="w-3 h-3 mr-1" /> DEV TOOL: Grant $100
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border shadow-lg">
            <CardHeader>
              <CardTitle className="font-sans flex items-center gap-2">
                <RefreshCw className="w-5 h-5 text-primary" /> Auto-Reload
              </CardTitle>
              <CardDescription className="font-serif">Never run out of minutes during a reading.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-4 border border-border/50 rounded-lg bg-muted/20 mb-4">
                <div>
                  <h4 className="font-sans font-medium">Enable Auto-Reload</h4>
                  <p className="text-xs text-muted-foreground font-serif">Automatically add funds when low</p>
                </div>
                <Switch checked={balance?.autoReloadEnabled || false} disabled />
              </div>
              <p className="text-sm text-muted-foreground font-sans text-center mt-6 italic">
                Auto-reload configuration is currently managed via Stripe billing portal during checkout.
              </p>
            </CardContent>
          </Card>
        </div>

        <h2 className="font-display text-3xl text-foreground mb-6">Transaction History</h2>
        <Card className="bg-card border-border shadow-lg">
          <CardContent className="p-0">
            {txLoading ? (
              <div className="flex justify-center p-12"><Loader2 className="animate-spin w-8 h-8 text-primary" /></div>
            ) : transactions?.length ? (
              <div className="divide-y divide-border/50">
                {transactions.map(tx => (
                  <div key={tx.id} className="p-4 sm:p-6 flex items-center justify-between hover:bg-muted/10 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${tx.amountCents > 0 ? 'bg-secondary/10 text-secondary' : 'bg-primary/10 text-primary'}`}>
                        {tx.amountCents > 0 ? <ArrowDownRight className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                      </div>
                      <div>
                        <h4 className="font-sans font-medium capitalize">{tx.kind.replace('_', ' ')}</h4>
                        <p className="text-xs text-muted-foreground font-sans mt-0.5">{formatDateTime(tx.createdAt)}</p>
                        {tx.description && <p className="text-xs text-muted-foreground font-serif mt-1">{tx.description}</p>}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`font-sans font-medium ${tx.amountCents > 0 ? 'text-secondary' : 'text-foreground'}`}>
                        {tx.amountCents > 0 ? '+' : ''}{formatCents(tx.amountCents)}
                      </div>
                      <div className="text-xs text-muted-foreground font-sans mt-0.5">
                        Bal: {formatCents(tx.balanceAfterCents)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-12 text-center text-muted-foreground font-serif">
                No transactions yet.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
