import { AppLayout } from "@/components/AppLayout";
import { RequireRole } from "@/components/RequireRole";
import { useListAdminTransactions, useAdminRefundTransaction, getListAdminTransactionsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, RefreshCcw } from "lucide-react";
import { formatDateTime, formatCents } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

export default function AdminTransactionsPage() {
  return (
    <RequireRole role="admin">
      <AdminTransactionsContent />
    </RequireRole>
  );
}

function AdminTransactionsContent() {
  const { data: transactions, isLoading } = useListAdminTransactions({ limit: 100 });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [refundReason, setRefundReason] = useState("");
  const [refundAmountStr, setRefundAmountStr] = useState("");
  const [selectedTxId, setSelectedTxId] = useState<string | null>(null);

  const refundTx = useAdminRefundTransaction(selectedTxId as string, {
    mutation: {
      onSuccess: () => {
        toast({ title: "Refund successful" });
        queryClient.invalidateQueries({ queryKey: getListAdminTransactionsQueryKey() });
        setRefundReason("");
        setRefundAmountStr("");
        setSelectedTxId(null);
      },
      onError: (e) => {
        toast({ title: "Refund failed", description: e.message, variant: "destructive" });
      }
    }
  });

  const handleRefund = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTxId) return;
    const amountCents = Math.round(parseFloat(refundAmountStr) * 100);
    refundTx.mutate({ data: { amountCents, reason: refundReason }});
  };

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-12 max-w-6xl">
        <h1 className="font-display text-4xl text-secondary mb-8">Transactions</h1>
        
        <Card className="bg-card border-border shadow-lg">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-12 flex justify-center"><Loader2 className="animate-spin w-8 h-8 text-primary" /></div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border/50 hover:bg-transparent">
                      <TableHead className="font-sans">Date</TableHead>
                      <TableHead className="font-sans">Type</TableHead>
                      <TableHead className="font-sans">Amount</TableHead>
                      <TableHead className="font-sans">Details</TableHead>
                      <TableHead className="font-sans text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions?.map(tx => (
                      <TableRow key={tx.id} className="border-border/50 hover:bg-muted/10">
                        <TableCell className="font-sans text-sm text-muted-foreground whitespace-nowrap">
                          {formatDateTime(tx.createdAt)}
                        </TableCell>
                        <TableCell className="font-sans text-sm capitalize">
                          {tx.kind.replace('_', ' ')}
                        </TableCell>
                        <TableCell className={`font-sans font-medium ${tx.amountCents > 0 ? 'text-secondary' : 'text-foreground'}`}>
                          {tx.amountCents > 0 ? '+' : ''}{formatCents(tx.amountCents)}
                        </TableCell>
                        <TableCell className="font-serif text-sm text-muted-foreground">
                          {tx.description || '-'}
                        </TableCell>
                        <TableCell className="text-right">
                          {tx.kind === 'session_charge' && (
                             <Dialog open={selectedTxId === tx.id} onOpenChange={(open) => !open && setSelectedTxId(null)}>
                               <DialogTrigger asChild>
                                 <Button variant="outline" size="sm" className="font-sans h-8" onClick={() => {
                                   setSelectedTxId(tx.id);
                                   setRefundAmountStr((Math.abs(tx.amountCents) / 100).toString());
                                 }}>
                                   Refund
                                 </Button>
                               </DialogTrigger>
                               <DialogContent className="bg-card border-border">
                                 <DialogHeader>
                                   <DialogTitle className="font-display text-2xl text-secondary">Refund Transaction</DialogTitle>
                                 </DialogHeader>
                                 <form onSubmit={handleRefund} className="space-y-4 pt-4">
                                   <div>
                                     <Label className="font-sans">Refund Amount ($)</Label>
                                     <Input type="number" step="0.01" required value={refundAmountStr} onChange={(e) => setRefundAmountStr(e.target.value)} className="bg-input font-sans" max={Math.abs(tx.amountCents) / 100} />
                                   </div>
                                   <div>
                                     <Label className="font-sans">Reason</Label>
                                     <Input required value={refundReason} onChange={(e) => setRefundReason(e.target.value)} className="bg-input font-sans" placeholder="e.g. Reader disconnected" />
                                   </div>
                                   <Button type="submit" variant="destructive" className="w-full font-sans" disabled={refundTx.isPending}>
                                     {refundTx.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <RefreshCcw className="w-4 h-4 mr-2" />} Process Refund
                                   </Button>
                                 </form>
                               </DialogContent>
                             </Dialog>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                    {!transactions?.length && (
                      <TableRow>
                        <TableCell colSpan={5} className="h-24 text-center text-muted-foreground font-sans">
                          No transactions found.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
