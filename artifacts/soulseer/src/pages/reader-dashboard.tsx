import { AppLayout } from "@/components/AppLayout";
import { RequireRole } from "@/components/RequireRole";
import { useGetMyEarnings, useGetMyReaderAnalytics } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCents, formatDuration } from "@/lib/format";
import { Loader2, Clock, Users, Star, BarChart3 } from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, XAxis, Tooltip } from "recharts";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useEffect } from "react";
import { useAuth0 } from "@auth0/auth0-react";

const API_BASE = import.meta.env.BASE_URL.replace(/\/$/, "") + "/api";

function useReaderHeartbeat() {
  const { getAccessTokenSilently } = useAuth0();
  useEffect(() => {
    let cancelled = false;
    const beat = async () => {
      try {
        const token = await getAccessTokenSilently();
        await fetch(`${API_BASE}/readers/me/heartbeat`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch { /* silent */ }
    };
    beat();
    const iv = setInterval(beat, 60_000);
    return () => { cancelled = true; clearInterval(iv); };
  }, [getAccessTokenSilently]);
}

export default function ReaderDashboardPage() {
  return (
    <RequireRole role="reader">
      <ReaderDashboardContent />
    </RequireRole>
  );
}

function ReaderDashboardContent() {
  useReaderHeartbeat();
  const { data: earnings, isLoading: earnLoading } = useGetMyEarnings();
  const { data: analytics, isLoading: anaLoading } = useGetMyReaderAnalytics();

  if (earnLoading || anaLoading) {
    return <AppLayout><div className="flex justify-center py-20"><Loader2 className="animate-spin w-8 h-8 text-primary" /></div></AppLayout>;
  }

  const chartData = analytics?.sessionsLast30Days?.map(d => ({
    date: d.date.substring(5), // roughly MM-DD
    earnings: d.earningsCents / 100
  })) || [];

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-12 max-w-6xl">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <h1 className="font-display text-4xl text-primary drop-shadow-[0_0_8px_rgba(255,105,180,0.3)]">Reader Dashboard</h1>
          <div className="flex gap-3">
            <Link href="/reader/profile"><Button variant="outline" className="font-sans">Edit Profile</Button></Link>
            <Link href="/reader/availability"><Button variant="outline" className="font-sans border-secondary text-secondary hover:bg-secondary/10">Availability</Button></Link>
            <Link href="/reader/sessions"><Button className="font-sans shadow-[0_0_15px_rgba(255,105,180,0.2)]">Sessions</Button></Link>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-card border-border shadow-lg">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-sans font-medium text-muted-foreground">Today's Earnings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-display text-secondary">{formatCents(earnings?.todayCents)}</div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border shadow-lg">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-sans font-medium text-muted-foreground">Last 7 Days</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-display text-foreground">{formatCents(earnings?.last7DaysCents)}</div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border shadow-lg">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-sans font-medium text-muted-foreground">Pending Payout</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-display text-primary">{formatCents(earnings?.pendingPayoutCents)}</div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border shadow-lg">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-sans font-medium text-muted-foreground">All Time</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-display text-muted-foreground">{formatCents(earnings?.allTimeCents)}</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          <Card className="bg-card border-border shadow-lg lg:col-span-2">
            <CardHeader>
              <CardTitle className="font-sans flex items-center"><BarChart3 className="w-5 h-5 mr-2 text-primary" /> 30-Day Earnings Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorEarnings" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(330 100% 71%)" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="hsl(330 100% 71%)" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="date" stroke="#666" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'hsl(0 0% 7%)', borderColor: 'hsl(0 0% 15%)', color: '#fff' }}
                      itemStyle={{ color: 'hsl(330 100% 71%)' }}
                      formatter={(value: number) => [`$${value.toFixed(2)}`, 'Earnings']}
                    />
                    <Area type="monotone" dataKey="earnings" stroke="hsl(330 100% 71%)" strokeWidth={2} fillOpacity={1} fill="url(#colorEarnings)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card className="bg-card border-border shadow-lg">
              <CardHeader>
                <CardTitle className="font-sans">Analytics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center pb-2 border-b border-border/50">
                  <span className="text-muted-foreground font-sans text-sm flex items-center"><Users className="w-4 h-4 mr-2" /> Total Sessions</span>
                  <span className="font-medium font-sans">{analytics?.totalSessions}</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-border/50">
                  <span className="text-muted-foreground font-sans text-sm flex items-center"><Users className="w-4 h-4 mr-2" /> Returning</span>
                  <span className="font-medium font-sans">{analytics?.returningClients}</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-border/50">
                  <span className="text-muted-foreground font-sans text-sm flex items-center"><Clock className="w-4 h-4 mr-2" /> Avg Duration</span>
                  <span className="font-medium font-sans">{formatDuration(analytics?.avgDurationSeconds)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground font-sans text-sm flex items-center"><Star className="w-4 h-4 mr-2 text-secondary" /> Avg Rating</span>
                  <span className="font-medium font-sans">{analytics?.avgRating.toFixed(1)} / 5.0</span>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-card border-border shadow-lg">
              <CardHeader>
                <CardTitle className="font-sans">Service Breakdown</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center pb-2 border-b border-border/50">
                  <span className="text-muted-foreground font-sans text-sm">Text Chat</span>
                  <span className="font-medium font-sans">{formatCents(earnings?.breakdown?.chatCents)}</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-border/50">
                  <span className="text-muted-foreground font-sans text-sm">Voice Call</span>
                  <span className="font-medium font-sans">{formatCents(earnings?.breakdown?.phoneCents)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground font-sans text-sm">Video Call</span>
                  <span className="font-medium font-sans">{formatCents(earnings?.breakdown?.videoCents)}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
