import { AppLayout } from "@/components/AppLayout";
import { RequireRole } from "@/components/RequireRole";
import { useGetAdminOverview } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCents } from "@/lib/format";
import { Loader2, Users, DollarSign, Activity, Flag } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, Tooltip } from "recharts";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function AdminDashboardPage() {
  return (
    <RequireRole role="admin">
      <AdminDashboardContent />
    </RequireRole>
  );
}

function AdminDashboardContent() {
  const { data: overview, isLoading } = useGetAdminOverview();

  if (isLoading) return <AppLayout><div className="flex justify-center py-20"><Loader2 className="animate-spin w-8 h-8 text-primary" /></div></AppLayout>;

  const chartData = overview?.revenueByDay?.map(d => ({
    date: d.date.substring(5),
    revenue: d.revenueCents / 100
  })) || [];

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-12 max-w-6xl">
        <div className="flex justify-between items-center mb-8">
          <h1 className="font-display text-4xl text-secondary drop-shadow-[0_0_8px_rgba(212,175,55,0.3)]">Admin Overview</h1>
          <div className="flex gap-2">
            <Link href="/admin/users"><Button variant="outline" className="font-sans border-secondary text-secondary">Users</Button></Link>
            <Link href="/admin/readers"><Button variant="outline" className="font-sans border-secondary text-secondary">Readers</Button></Link>
            <Link href="/admin/transactions"><Button variant="outline" className="font-sans border-secondary text-secondary">Transactions</Button></Link>
            <Link href="/admin/flags">
              <Button variant="outline" className="font-sans border-secondary text-secondary relative">
                Flags
                {overview?.openFlags ? <span className="absolute -top-2 -right-2 w-5 h-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center text-[10px]">{overview.openFlags}</span> : null}
              </Button>
            </Link>
            <Link href="/admin/announcements"><Button variant="outline" className="font-sans border-secondary text-secondary">Announce</Button></Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-card border-border shadow-lg">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-sans font-medium text-muted-foreground flex items-center"><Users className="w-4 h-4 mr-2 text-secondary" /> Total Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-display text-foreground">{overview?.totalUsers}</div>
              <p className="text-xs text-muted-foreground font-sans mt-1">{overview?.totalClients} clients, {overview?.totalReaders} readers</p>
            </CardContent>
          </Card>
          <Card className="bg-card border-border shadow-lg">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-sans font-medium text-muted-foreground flex items-center"><Activity className="w-4 h-4 mr-2 text-primary" /> Sessions Today</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-display text-foreground">{overview?.sessionsToday}</div>
              <p className="text-xs text-muted-foreground font-sans mt-1">{overview?.sessionsLast7Days} in last 7 days</p>
            </CardContent>
          </Card>
          <Card className="bg-card border-border shadow-lg">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-sans font-medium text-muted-foreground flex items-center"><DollarSign className="w-4 h-4 mr-2 text-green-500" /> Revenue Today</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-display text-foreground">{formatCents(overview?.revenueTodayCents)}</div>
              <p className="text-xs text-muted-foreground font-sans mt-1">{formatCents(overview?.revenueMonthCents)} this month</p>
            </CardContent>
          </Card>
          <Card className="bg-card border-border shadow-lg">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-sans font-medium text-muted-foreground flex items-center"><Flag className="w-4 h-4 mr-2 text-destructive" /> Open Flags</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-3xl font-display ${overview?.openFlags ? 'text-destructive' : 'text-muted-foreground'}`}>{overview?.openFlags || 0}</div>
              <p className="text-xs text-muted-foreground font-sans mt-1">Pending moderation</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <Card className="bg-card border-border shadow-lg lg:col-span-2">
            <CardHeader>
              <CardTitle className="font-sans text-secondary">Revenue Last 30 Days</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <XAxis dataKey="date" stroke="#666" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'hsl(0 0% 7%)', borderColor: 'hsl(0 0% 15%)', color: '#fff' }}
                      itemStyle={{ color: 'hsl(46 65% 52%)' }}
                      cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                      formatter={(value: number) => [`$${value.toFixed(2)}`, 'Revenue']}
                    />
                    <Bar dataKey="revenue" fill="hsl(46 65% 52%)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border shadow-lg">
            <CardHeader>
              <CardTitle className="font-sans text-secondary">Platform Share</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="font-sans text-sm text-muted-foreground">Platform Earnings</span>
                  <span className="font-sans font-medium">{formatCents(overview?.platformShareCents)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-sans text-sm text-muted-foreground">Reader Payouts</span>
                  <span className="font-sans font-medium">{formatCents(overview?.readerShareCents)}</span>
                </div>
              </div>
              <div className="pt-6 border-t border-border/50">
                <div className="flex justify-between items-center">
                  <span className="font-sans text-sm text-muted-foreground">Readers Online</span>
                  <span className="font-sans font-medium text-primary">{overview?.readersOnline}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
