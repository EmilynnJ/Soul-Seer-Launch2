import { AppLayout } from "@/components/AppLayout";
import { RequireRole } from "@/components/RequireRole";
import { useListAdminUsers, getListAdminUsersQueryKey, useUpdateAdminUser, useAdminUpdateReader } from "@workspace/api-client-react";
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Search, Edit } from "lucide-react";
import { formatDateTime } from "@/lib/format";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";

export default function AdminUsersPage() {
  return (
    <RequireRole role="admin">
      <AdminUsersContent />
    </RequireRole>
  );
}

function AdminUsersContent() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: users, isLoading } = useListAdminUsers({
    search: debouncedSearch || undefined,
    role: "client"
  }, {
    query: {
      queryKey: getListAdminUsersQueryKey({ search: debouncedSearch || undefined, role: "client" })
    }
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setDebouncedSearch(search);
  };

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-12 max-w-6xl">
        <h1 className="font-display text-4xl text-secondary mb-8">Manage Clients</h1>
        
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
                      <TableHead className="font-sans">User</TableHead>
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
                          No clients found.
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
