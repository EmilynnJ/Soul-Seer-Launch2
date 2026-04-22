import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ClerkProvider, SignIn, SignUp, Show, useClerk } from '@clerk/react';
import { dark } from '@clerk/themes';
import { useEffect, useRef } from "react";

import { queryClient } from "./lib/queryClient";
import Home from "@/pages/home";
import ReadersPage from "@/pages/readers";
import ReaderDetailPage from "@/pages/reader-detail";
import AboutPage from "@/pages/about";
import DashboardPage from "@/pages/dashboard";
import WalletPage from "@/pages/wallet";
import SessionsPage from "@/pages/sessions";
import SessionRoomPage from "@/pages/session-room";
import FavoritesPage from "@/pages/favorites";
import CommunityPage from "@/pages/community";
import MessagesPage from "@/pages/messages";
import MessageThreadPage from "@/pages/message-thread";
import ForumPage from "@/pages/forum";
import ForumTopicPage from "@/pages/forum-topic";
import ForumNewPage from "@/pages/forum-new";
import ReaderDashboardPage from "@/pages/reader-dashboard";
import ReaderProfilePage from "@/pages/reader-profile";
import ReaderAvailabilityPage from "@/pages/reader-availability";
import ReaderSessionsPage from "@/pages/reader-sessions";

import AdminDashboardPage from "@/pages/admin/index";
import AdminUsersPage from "@/pages/admin/users";
import AdminReadersPage from "@/pages/admin/readers";
import AdminTransactionsPage from "@/pages/admin/transactions";
import AdminFlagsPage from "@/pages/admin/flags";
import AdminAnnouncementsPage from "@/pages/admin/announcements";
import AdminMessagesPage from "@/pages/admin/messages";
import NotFound from "@/pages/not-found";

const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;
const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

function stripBase(path: string): string {
  return basePath && path.startsWith(basePath)
    ? path.slice(basePath.length) || "/"
    : path;
}

if (!clerkPubKey) {
  throw new Error('Missing VITE_CLERK_PUBLISHABLE_KEY in .env file');
}

const clerkAppearance = {
  theme: dark,
  cssLayerName: "clerk",
  options: {
    logoPlacement: "inside" as const,
    logoLinkUrl: basePath || "/",
    logoImageUrl: `${window.location.origin}${basePath}/logo.svg`,
  },
  variables: {
    colorPrimary: "hsl(330 100% 71%)",
    colorForeground: "hsl(0 0% 96%)",
    colorMutedForeground: "hsl(0 0% 63%)",
    colorDanger: "hsl(0 84% 60%)",
    colorBackground: "hsl(0 0% 7%)",
    colorInput: "hsl(0 0% 20%)",
    colorInputForeground: "hsl(0 0% 96%)",
    colorNeutral: "hsl(0 0% 15%)",
    colorModalBackdrop: "rgba(0,0,0,0.8)",
    fontFamily: "'Playfair Display', serif",
    borderRadius: "0.5rem",
  },
};

function SignInPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center px-4" style={{ backgroundImage: "url('https://i.postimg.cc/sXdsKGTK/BACKGROUND.jpg')", backgroundSize: 'cover', backgroundAttachment: 'fixed' }}>
      <div className="absolute inset-0 bg-black/60 pointer-events-none" />
      <div className="relative z-10">
        <SignIn routing="path" path={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`} />
      </div>
    </div>
  );
}

function SignUpPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center px-4" style={{ backgroundImage: "url('https://i.postimg.cc/sXdsKGTK/BACKGROUND.jpg')", backgroundSize: 'cover', backgroundAttachment: 'fixed' }}>
      <div className="absolute inset-0 bg-black/60 pointer-events-none" />
      <div className="relative z-10">
        <SignUp routing="path" path={`${basePath}/sign-up`} signInUrl={`${basePath}/sign-in`} />
      </div>
    </div>
  );
}

function HomeRedirect() {
  return (
    <>
      <Show when="signed-in">
        <Redirect to="/dashboard" />
      </Show>
      <Show when="signed-out">
        <Home />
      </Show>
    </>
  );
}

function ClerkQueryClientCacheInvalidator() {
  const { addListener } = useClerk();
  const queryClient = useQueryClient();
  const prevUserIdRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    const unsubscribe = addListener(({ user }) => {
      const userId = user?.id ?? null;
      if (
        prevUserIdRef.current !== undefined &&
        prevUserIdRef.current !== userId
      ) {
        queryClient.clear();
      }
      prevUserIdRef.current = userId;
    });
    return unsubscribe;
  }, [addListener, queryClient]);

  return null;
}

function ClerkProviderWithRoutes() {
  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      proxyUrl={clerkProxyUrl}
      appearance={clerkAppearance}
      localization={{
        signIn: {
          start: {
            title: "Welcome back to SoulSeer",
            subtitle: "Enter the parlor to continue your journey",
          },
        },
        signUp: {
          start: {
            title: "Join our Community",
            subtitle: "Begin your spiritual journey today",
          },
        },
      }}
    >
      <QueryClientProvider client={queryClient}>
        <ClerkQueryClientCacheInvalidator />
        <Switch>
          <Route path="/" component={HomeRedirect} />
          <Route path="/sign-in/*?" component={SignInPage} />
          <Route path="/sign-up/*?" component={SignUpPage} />
          
          {/* Public */}
          <Route path="/readers" component={ReadersPage} />
          <Route path="/readers/:id" component={ReaderDetailPage} />
          <Route path="/about" component={AboutPage} />
          <Route path="/community" component={CommunityPage} />
          <Route path="/forum" component={ForumPage} />
          <Route path="/forum/new" component={ForumNewPage} />
          <Route path="/forum/topics/:topicId" component={ForumTopicPage} />
          
          {/* Client */}
          <Route path="/dashboard" component={DashboardPage} />
          <Route path="/wallet" component={WalletPage} />
          <Route path="/sessions" component={SessionsPage} />
          <Route path="/sessions/:sessionId" component={SessionRoomPage} />
          <Route path="/favorites" component={FavoritesPage} />
          <Route path="/messages" component={MessagesPage} />
          <Route path="/messages/:threadId" component={MessageThreadPage} />
          
          {/* Reader */}
          <Route path="/reader" component={ReaderDashboardPage} />
          <Route path="/reader/profile" component={ReaderProfilePage} />
          <Route path="/reader/availability" component={ReaderAvailabilityPage} />
          <Route path="/reader/sessions" component={ReaderSessionsPage} />

          {/* Admin */}
          <Route path="/admin" component={AdminDashboardPage} />
          <Route path="/admin/users" component={AdminUsersPage} />
          <Route path="/admin/readers" component={AdminReadersPage} />
          <Route path="/admin/transactions" component={AdminTransactionsPage} />
          <Route path="/admin/flags" component={AdminFlagsPage} />
          <Route path="/admin/announcements" component={AdminAnnouncementsPage} />
          <Route path="/admin/messages" component={AdminMessagesPage} />
          
          <Route component={NotFound} />
        </Switch>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

function App() {
  return (
    <WouterRouter base={basePath}>
      <TooltipProvider>
        <ClerkProviderWithRoutes />
        <Toaster />
      </TooltipProvider>
    </WouterRouter>
  );
}

export default App;
