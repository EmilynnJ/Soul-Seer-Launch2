import { Switch, Route, Router as WouterRouter, Redirect, useLocation } from "wouter";
import { QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Auth0Provider, useAuth0 } from "@auth0/auth0-react";
import { setAuthTokenGetter } from "@workspace/api-client-react";
import { useEffect, useRef } from "react";

import { queryClient } from "./lib/queryClient";
import Home from "@/pages/home";
import ReadersPage from "@/pages/readers";
import ReaderDetailPage from "@/pages/reader-detail";
import AboutPage from "@/pages/about";
import HelpPage from "@/pages/help";
import PrivacyPage from "@/pages/privacy";
import DashboardPage from "@/pages/dashboard";
import WalletPage from "@/pages/wallet";
import SessionsPage from "@/pages/sessions";
import SessionRoomPage from "@/pages/session-room";
import CommunityPage from "@/pages/community";
import ForumPage from "@/pages/forum";
import ForumTopicPage from "@/pages/forum-topic";
import ForumNewPage from "@/pages/forum-new";
import ReaderDashboardPage from "@/pages/reader-dashboard";
import ReaderProfilePage from "@/pages/reader-profile";
import ReaderSessionsPage from "@/pages/reader-sessions";

import AdminDashboardPage from "@/pages/admin/index";
import AdminUsersPage from "@/pages/admin/users";
import AdminReadersPage from "@/pages/admin/readers";
import AdminTransactionsPage from "@/pages/admin/transactions";
import AdminFlagsPage from "@/pages/admin/flags";
import AdminAnnouncementsPage from "@/pages/admin/announcements";
import NotFound from "@/pages/not-found";
import { Loader2 } from "lucide-react";

const auth0Domain = import.meta.env.VITE_AUTH0_DOMAIN as string | undefined;
const auth0ClientId = import.meta.env.VITE_AUTH0_CLIENT_ID as string | undefined;
const auth0Audience = import.meta.env.VITE_AUTH0_AUDIENCE as string | undefined;
const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

function AuthBootstrap() {
  const { getAccessTokenSilently, isAuthenticated } = useAuth0();
  const qc = useQueryClient();
  const lastAuthRef = useRef<boolean | null>(null);

  useEffect(() => {
    setAuthTokenGetter(async () => {
      if (!isAuthenticated) return null;
      try {
        return await getAccessTokenSilently({
          authorizationParams: { audience: auth0Audience },
        });
      } catch {
        return null;
      }
    });
    return () => setAuthTokenGetter(null);
  }, [getAccessTokenSilently, isAuthenticated]);

  useEffect(() => {
    if (lastAuthRef.current !== null && lastAuthRef.current !== isAuthenticated) {
      qc.clear();
    }
    lastAuthRef.current = isAuthenticated;
  }, [isAuthenticated, qc]);

  return null;
}

function SignInPage() {
  const { loginWithRedirect } = useAuth0();
  const [, setLocation] = useLocation();
  useEffect(() => {
    loginWithRedirect({
      authorizationParams: { audience: auth0Audience },
    }).catch(() => setLocation("/"));
  }, [loginWithRedirect, setLocation]);
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );
}

function SignUpPage() {
  const { loginWithRedirect } = useAuth0();
  const [, setLocation] = useLocation();
  useEffect(() => {
    loginWithRedirect({
      authorizationParams: { audience: auth0Audience, screen_hint: "signup" },
    }).catch(() => setLocation("/"));
  }, [loginWithRedirect, setLocation]);
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );
}

function HomeRoute() {
  const { isAuthenticated, isLoading } = useAuth0();
  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }
  if (isAuthenticated) return <Redirect to="/dashboard" />;
  return <Home />;
}

function NotConfiguredBanner() {
  return (
    <div className="bg-primary/15 border-b border-primary/30 text-primary text-center text-sm font-sans py-2 px-4">
      Sign-in is offline — set <code className="text-secondary">VITE_AUTH0_DOMAIN</code>,{" "}
      <code className="text-secondary">VITE_AUTH0_CLIENT_ID</code>, and{" "}
      <code className="text-secondary">VITE_AUTH0_AUDIENCE</code> to enable accounts.
    </div>
  );
}

function NotConfiguredRedirect() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
      <h1 className="font-display text-4xl text-primary mb-3">Account features are offline</h1>
      <p className="font-serif text-muted-foreground max-w-md mb-6">
        This part of the parlor needs sign-in, which requires Auth0 to be configured. You can still browse readers and
        the community.
      </p>
    </div>
  );
}

function PublicOnlyRoutes() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/readers" component={ReadersPage} />
      <Route path="/readers/:id" component={ReaderDetailPage} />
      <Route path="/about" component={AboutPage} />
      <Route path="/help" component={HelpPage} />
      <Route path="/privacy" component={PrivacyPage} />
      <Route path="/community" component={CommunityPage} />
      <Route path="/forum" component={ForumPage} />
      <Route path="/forum/topics/:topicId" component={ForumTopicPage} />
      <Route component={NotConfiguredRedirect} />
    </Switch>
  );
}

function AppRoutes() {
  return (
    <Switch>
      <Route path="/" component={HomeRoute} />
      <Route path="/sign-in" component={SignInPage} />
      <Route path="/sign-up" component={SignUpPage} />

      {/* Public */}
      <Route path="/readers" component={ReadersPage} />
      <Route path="/readers/:id" component={ReaderDetailPage} />
      <Route path="/about" component={AboutPage} />
      <Route path="/help" component={HelpPage} />
      <Route path="/privacy" component={PrivacyPage} />
      <Route path="/community" component={CommunityPage} />
      <Route path="/forum" component={ForumPage} />
      <Route path="/forum/new" component={ForumNewPage} />
      <Route path="/forum/topics/:topicId" component={ForumTopicPage} />

      {/* Client */}
      <Route path="/dashboard" component={DashboardPage} />
      <Route path="/wallet" component={WalletPage} />
      <Route path="/sessions" component={SessionsPage} />
      <Route path="/sessions/:sessionId" component={SessionRoomPage} />

      {/* Reader */}
      <Route path="/reader" component={ReaderDashboardPage} />
      <Route path="/reader/profile" component={ReaderProfilePage} />
      <Route path="/reader/sessions" component={ReaderSessionsPage} />

      {/* Admin */}
      <Route path="/admin" component={AdminDashboardPage} />
      <Route path="/admin/users" component={AdminUsersPage} />
      <Route path="/admin/readers" component={AdminReadersPage} />
      <Route path="/admin/transactions" component={AdminTransactionsPage} />
      <Route path="/admin/flags" component={AdminFlagsPage} />
      <Route path="/admin/announcements" component={AdminAnnouncementsPage} />

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  if (!auth0Domain || !auth0ClientId || !auth0Audience) {
    return (
      <QueryClientProvider client={queryClient}>
        <WouterRouter base={basePath}>
          <TooltipProvider>
            <NotConfiguredBanner />
            <PublicOnlyRoutes />
            <Toaster />
          </TooltipProvider>
        </WouterRouter>
      </QueryClientProvider>
    );
  }

  return (
    <Auth0Provider
      domain={auth0Domain}
      clientId={auth0ClientId}
      authorizationParams={{
        redirect_uri: `${window.location.origin}${basePath || ""}/`,
        audience: auth0Audience,
      }}
      cacheLocation="localstorage"
    >
      <QueryClientProvider client={queryClient}>
        <AuthBootstrap />
        <WouterRouter base={basePath}>
          <TooltipProvider>
            <AppRoutes />
            <Toaster />
          </TooltipProvider>
        </WouterRouter>
      </QueryClientProvider>
    </Auth0Provider>
  );
}

export default App;
