import { AppLayout } from "@/components/AppLayout";
import { RequireRole } from "@/components/RequireRole";
import { useListAdminUsers, getListAdminUsersQueryKey, useCreateReader } from "@workspace/api-client-react";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Search, Plus } from "lucide-react";
import { formatDateTime, formatCents } from "@/lib/format";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

export default function AdminReadersPage() {
  return (
    <RequireRole role="admin">
      <AdminReadersContent />
    </RequireRole>
  );
}

function AdminReadersContent() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: users, isLoading } = useListAdminUsers({
    search: debouncedSearch || undefined,
    role: "reader"
  }, {
    query: {
      queryKey: getListAdminUsersQueryKey({ search: debouncedSearch || undefined, role: "reader" })
    }
  });

  const createReader = useCreateReader({
    mutation: {
      onSuccess: () => {
        toast({ title: "Reader created" });
        queryClient.invalidateQueries({ queryKey: getListAdminUsersQueryKey() });
      }
    }
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setDebouncedSearch(search);
  };

  const [newReader, setNewReader] = useState({
    email: "",
    displayName: "",
    ratePerMinChatCents: 500,
    ratePerMinPhoneCents: 500,
    ratePerMinVideoCents: 500,
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createReader.mutate({ data: { ...newReader, specialties: [] } });
  };

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-12 max-w-6xl">
        <div className="flex justify-between items-center mb-8">
          <h1 className="font-display text-4xl text-secondary">Manage Readers</h1>
          
          <Dialog>
            <DialogTrigger asChild>
              <Button className="font-sans bg-secondary text-secondary-foreground hover:bg-secondary/90">
                <Plus className="w-4 h-4 mr-2" /> New Reader
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border">
              <DialogHeader>
                <DialogTitle className="font-display text-2xl text-secondary">Create Reader Account</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreate} className="space-y-4 pt-4">
                <div>
                  <Label className="font-sans">Email</Label>
                  <Input type="email" required value={newReader.email} onChange={e => setNewReader({...newReader, email: e.target.value})} className="bg-input font-sans" />
                </div>
                <div>
                  <Label className="font-sans">Display Name</Label>
                  <Input required value={newReader.displayName} onChange={e => setNewReader({...newReader, displayName: e.target.value})} className="bg-input font-sans" />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <Label className="font-sans">Chat ($/m)</Label>
                    <Input type="number" step="0.01" required value={newReader.ratePerMinChatCents/100} onChange={e => setNewReader({...newReader, ratePerMinChatCents: Math.round(parseFloat(e.target.value)*100)})} className="bg-input font-sans tabular-nums" />
                  </div>
                  <div>
                    <Label className="font-sans">Phone ($/m)</Label>
                    <Input type="number" step="0.01" required value={newReader.ratePerMinPhoneCents/100} onChange={e => setNewReader({...newReader, ratePerMinPhoneCents: Math.round(parseFloat(e.target.value)*100)})} className="bg-input font-sans tabular-nums" />
                  </div>
                  <div>
                    <Label className="font-sans">Video ($/m)</Label>
                    <Input type="number" step="0.01" required value={newReader.ratePerMinVideoCents/100} onChange={e => setNewReader({...newReader, ratePerMinVideoCents: Math.round(parseFloat(e.target.value)*100)})} className="bg-input font-sans tabular-nums" />
                  </div>
                </div>
                <Button type="submit" className="w-full font-sans mt-2" disabled={createReader.isPending}>
                  {createReader.isPending ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : null}
                  Create Account
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
        
        <form onSubmit={handleSearch} className="flex gap-2 mb-8 max-w-md">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search by name or email..." 
              className="pl-9 bg-card border-border/50 font-sans"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Button type="submit" variant="secondary" className="font-sans">Search</Button>
        </form>

        <Card className="bg-card border-border shadow-lg">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-12 flex justify-center"><Loader2 className="animate-spin w-8 h-8 text-primary" /></div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border/50 hover:bg-transparent">
                      <TableHead className="font-sans">Reader</TableHead>
                      <TableHead className="font-sans">Joined</TableHead>
                      <TableHead className="font-sans">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users?.map(user => (
                      <TableRow key={user.id} className="border-border/50 hover:bg-muted/10">
                        <TableCell>
                          <div className="font-sans font-medium">{user.displayName}</div>
                          <div className="text-xs text-muted-foreground font-sans">{user.email || 'No email'}</div>
                        </TableCell>
                        <TableCell className="font-sans text-sm text-muted-foreground">
                          {formatDateTime(user.createdAt)}
                        </TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 text-xs rounded-full uppercase font-sans ${user.status === 'active' ? 'bg-green-500/20 text-green-500' : 'bg-destructive/20 text-destructive'}`}>
                            {user.status}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                    {!users?.length && (
                      <TableRow>
                        <TableCell colSpan={3} className="h-24 text-center text-muted-foreground font-sans">
                          No readers found.
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
