import { AppLayout } from "@/components/AppLayout";
import { RequireRole } from "@/components/RequireRole";
import {
  useGetSession, getGetSessionQueryKey,
  useListSessionMessages, getListSessionMessagesQueryKey,
  usePostSessionMessage, useEndSession, useTickSession,
  useGetMe, getGetMeQueryKey, useReviewSession,
} from "@workspace/api-client-react";
import { useParams } from "wouter";
import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, Send, PhoneOff, Phone, Star, Mic, MicOff, VideoOff, Video } from "lucide-react";
import { formatDuration, formatCents } from "@/lib/format";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuth0 } from "@auth0/auth0-react";

const AGORA_APP_ID = import.meta.env.VITE_AGORA_APP_ID as string;
const API_BASE = import.meta.env.BASE_URL.replace(/\/$/, "") + "/api";

export default function SessionRoomPage() {
  return (
    <RequireRole role="client">
      <SessionRoomContent />
    </RequireRole>
  );
}

function useAgoraToken(sessionId: string | undefined, sessionStatus: string | undefined) {
  const { getAccessTokenSilently } = useAuth0();
  const [tokenData, setTokenData] = useState<{ token: string; channel: string; uid: number; appId: string } | null>(null);
  const [tokenError, setTokenError] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionId || sessionStatus !== "in_progress" || !AGORA_APP_ID) return;
    let cancelled = false;
    (async () => {
      try {
        const accessToken = await getAccessTokenSilently();
        const resp = await fetch(`${API_BASE}/rtc/agora-token`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
          body: JSON.stringify({ sessionId }),
        });
        if (!resp.ok) throw new Error(await resp.text());
        const data = await resp.json();
        if (!cancelled) setTokenData(data);
      } catch (e: any) {
        if (!cancelled) setTokenError(e.message);
      }
    })();
    return () => { cancelled = true; };
  }, [sessionId, sessionStatus, getAccessTokenSilently]);

  return { tokenData, tokenError };
}

function AgoraCall({
  service,
  sessionId,
  sessionStatus,
}: {
  service: string;
  sessionId: string;
  sessionStatus: string;
}) {
  const { tokenData, tokenError } = useAgoraToken(sessionId, sessionStatus);
  const [AgoraRTC, setAgoraRTC] = useState<any>(null);
  const clientRef = useRef<any>(null);
  const localVideoRef = useRef<any>(null);
  const localAudioRef = useRef<any>(null);
  const remoteContainerRef = useRef<HTMLDivElement>(null);
  const localContainerRef = useRef<HTMLDivElement>(null);
  const [joined, setJoined] = useState(false);
  const [audioMuted, setAudioMuted] = useState(false);
  const [videoMuted, setVideoMuted] = useState(false);
  const [remoteCount, setRemoteCount] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    import("agora-rtc-sdk-ng").then((m) => setAgoraRTC(m.default));
  }, []);

  const join = useCallback(async () => {
    if (!tokenData || !AgoraRTC || joined) return;
    try {
      const client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
      clientRef.current = client;

      client.on("user-published", async (user: any, mediaType: string) => {
        await client.subscribe(user, mediaType);
        if (mediaType === "video" && remoteContainerRef.current) {
          user.videoTrack?.play(remoteContainerRef.current);
          setRemoteCount((c: number) => c + 1);
        }
        if (mediaType === "audio") user.audioTrack?.play();
      });
      client.on("user-unpublished", (_user: any, mediaType: string) => {
        if (mediaType === "video") setRemoteCount((c: number) => Math.max(0, c - 1));
      });

      await client.join(tokenData.appId, tokenData.channel, tokenData.token, tokenData.uid);

      const audioTrack = await AgoraRTC.createMicrophoneAudioTrack();
      localAudioRef.current = audioTrack;

      if (service === "video") {
        const videoTrack = await AgoraRTC.createCameraVideoTrack();
        localVideoRef.current = videoTrack;
        if (localContainerRef.current) videoTrack.play(localContainerRef.current);
        await client.publish([audioTrack, videoTrack]);
      } else {
        await client.publish([audioTrack]);
      }

      setJoined(true);
    } catch (err: any) {
      toast({ title: "Could not join call", description: err.message, variant: "destructive" });
    }
  }, [tokenData, AgoraRTC, joined, service, toast]);

  useEffect(() => {
    if (tokenData && AgoraRTC && !joined) join();
  }, [tokenData, AgoraRTC, joined, join]);

  useEffect(() => {
    return () => {
      localVideoRef.current?.stop();
      localVideoRef.current?.close();
      localAudioRef.current?.stop();
      localAudioRef.current?.close();
      clientRef.current?.leave().catch(() => {});
    };
  }, []);

  const toggleAudio = async () => {
    if (!localAudioRef.current) return;
    await localAudioRef.current.setEnabled(audioMuted);
    setAudioMuted(!audioMuted);
  };

  const toggleVideo = async () => {
    if (!localVideoRef.current) return;
    await localVideoRef.current.setEnabled(videoMuted);
    setVideoMuted(!videoMuted);
  };

  if (sessionStatus !== "in_progress") return null;

  return (
    <div className="w-full md:w-2/3 bg-black rounded-xl border border-border overflow-hidden relative flex flex-col min-h-[280px]">
      <div className="flex-1 relative">
        <div ref={remoteContainerRef} className="absolute inset-0 bg-black flex items-center justify-center">
          {remoteCount === 0 && (
            <div className="text-center">
              {service === "video"
                ? <Video className="w-14 h-14 text-muted-foreground/30 mx-auto mb-3" />
                : <Phone className="w-14 h-14 text-muted-foreground/30 mx-auto mb-3" />}
              <p className="font-sans text-sm text-muted-foreground/50">
                {tokenError
                  ? "Unable to connect to call"
                  : joined
                  ? "Waiting for the other person…"
                  : "Connecting…"}
              </p>
            </div>
          )}
        </div>
        {service === "video" && (
          <div
            ref={localContainerRef}
            className="absolute bottom-3 right-3 w-28 h-20 bg-muted rounded-lg overflow-hidden border border-border/50 z-10"
          />
        )}
        {!joined && !tokenError && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        )}
      </div>

      {joined && (
        <div className="flex items-center justify-center gap-3 p-3 bg-background/90 border-t border-border">
          <Button variant={audioMuted ? "destructive" : "outline"} size="icon" onClick={toggleAudio} title={audioMuted ? "Unmute" : "Mute"}>
            {audioMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </Button>
          {service === "video" && (
            <Button variant={videoMuted ? "destructive" : "outline"} size="icon" onClick={toggleVideo} title={videoMuted ? "Show video" : "Hide video"}>
              {videoMuted ? <VideoOff className="w-4 h-4" /> : <Video className="w-4 h-4" />}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

function SessionRoomContent() {
  const { sessionId } = useParams();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: me } = useGetMe({ query: { queryKey: getGetMeQueryKey() } });

  const { data: session, isLoading } = useGetSession(sessionId as string, {
    query: {
      enabled: !!sessionId,
      queryKey: getGetSessionQueryKey(sessionId as string),
      refetchInterval: (q) => q.state.data?.status === "in_progress" ? 15000 : false,
    },
  });

  const { data: messages } = useListSessionMessages(sessionId as string, {
    query: {
      enabled: !!sessionId && (session?.status === "in_progress" || session?.status === "completed"),
      queryKey: getListSessionMessagesQueryKey(sessionId as string),
      refetchInterval: session?.status === "in_progress" ? 3000 : false,
    },
  });

  const [msgBody, setMsgBody] = useState("");
  const postMsg = usePostSessionMessage({
    mutation: {
      onSuccess: () => {
        setMsgBody("");
        queryClient.invalidateQueries({ queryKey: getListSessionMessagesQueryKey(sessionId as string) });
      },
    },
  });

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!msgBody.trim()) return;
    postMsg.mutate({ sessionId: sessionId as string, data: { body: msgBody } });
  };

  const messagesEndRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const endSess = useEndSession({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetSessionQueryKey(sessionId as string) });
        toast({ title: "Session ended" });
      },
    },
  });

  const tickSession = useTickSession({
    mutation: {
      onSuccess: (tick) => {
        if (tick.lowBalanceWarning) {
          toast({ title: "Low Balance", description: "You have less than 3 minutes remaining.", variant: "destructive" });
        }
        if (tick.status === "completed") {
          queryClient.invalidateQueries({ queryKey: getGetSessionQueryKey(sessionId as string) });
          toast({ title: "Session ended due to low balance" });
        }
      },
    },
  });

  useEffect(() => {
    if (session?.status !== "in_progress") return;
    const interval = setInterval(() => {
      tickSession.mutate({ sessionId: sessionId as string });
    }, 15000);
    return () => clearInterval(interval);
  }, [session?.status, sessionId]);

  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [reviewBody, setReviewBody] = useState("");

  useEffect(() => {
    if (session?.status === "completed") {
      const t = setTimeout(() => setIsReviewOpen(true), 1500);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [session?.status]);

  const submitReview = useReviewSession({
    mutation: {
      onSuccess: () => {
        toast({ title: "Review submitted" });
        setIsReviewOpen(false);
      },
    },
  });

  if (isLoading) return <AppLayout><div className="flex justify-center py-20"><Loader2 className="animate-spin w-8 h-8 text-primary" /></div></AppLayout>;
  if (!session) return <AppLayout><div className="text-center py-20 font-display text-3xl">Session not found</div></AppLayout>;

  const isClient = me?.id === session.clientId;
  const otherName = isClient ? session.readerName : session.clientName;

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8 h-[calc(100vh-140px)] flex flex-col">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4 bg-card border border-border p-4 rounded-xl shadow-lg">
          <div>
            <h1 className="font-display text-3xl text-primary">{otherName}</h1>
            <div className="flex items-center gap-3 text-sm text-muted-foreground font-sans mt-1">
              <span className="capitalize px-2 py-0.5 bg-muted rounded-full text-xs">{session.service}</span>
              <span className={`capitalize px-2 py-0.5 rounded-full text-xs border ${session.status === "in_progress" ? "bg-primary/10 text-primary border-primary/30 animate-pulse" : "bg-muted text-muted-foreground border-border/50"}`}>
                {session.status.replace("_", " ")}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-right">
              <div className="font-mono text-xl text-foreground">{formatDuration(session.billedSeconds)}</div>
              <div className="text-xs text-secondary font-sans">{formatCents(session.billedCents)}</div>
            </div>
            {session.status === "in_progress" && (
              <Button variant="destructive" onClick={() => endSess.mutate({ sessionId: sessionId as string })} disabled={endSess.isPending} size="sm">
                <PhoneOff className="w-4 h-4 mr-2" /> End
              </Button>
            )}
          </div>
        </div>

        {session.status === "pending" && (
          <div className="flex-1 flex items-center justify-center bg-card border border-border rounded-xl">
            <div className="text-center p-8">
              <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
              <h2 className="font-display text-3xl text-foreground mb-2">Waiting for {otherName}…</h2>
              <p className="font-serif text-muted-foreground">The session will begin when they accept.</p>
            </div>
          </div>
        )}

        {(session.status === "in_progress" || session.status === "completed") && (
          <div className="flex-1 flex flex-col md:flex-row gap-4 min-h-0">
            {session.service !== "chat" && (
              <AgoraCall
                service={session.service}
                sessionId={sessionId as string}
                sessionStatus={session.status}
              />
            )}

            <div className={`flex flex-col bg-card border border-border rounded-xl overflow-hidden ${session.service === "chat" ? "w-full" : "w-full md:w-1/3"}`}>
              <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-4">
                {messages?.length ? (
                  messages.map((msg) => (
                    <div key={msg.id} className={`flex flex-col max-w-[85%] ${msg.senderId === me?.id ? "self-end items-end" : "self-start items-start"}`}>
                      <div className={`px-4 py-2 rounded-2xl font-serif text-sm ${msg.senderId === me?.id ? "bg-primary text-primary-foreground rounded-br-none" : "bg-muted text-foreground rounded-bl-none"}`}>
                        {msg.body}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="h-full flex items-center justify-center text-muted-foreground font-serif italic text-sm">
                    No messages yet. Say hello.
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {session.status === "in_progress" ? (
                <form onSubmit={handleSend} className="p-3 border-t border-border bg-background flex gap-2">
                  <Input
                    placeholder="Type a message…"
                    className="flex-1 bg-input border-border/50 font-serif"
                    value={msgBody}
                    onChange={(e) => setMsgBody(e.target.value)}
                    disabled={postMsg.isPending}
                  />
                  <Button type="submit" size="icon" disabled={!msgBody.trim() || postMsg.isPending} className="shrink-0">
                    <Send className="w-4 h-4" />
                  </Button>
                </form>
              ) : (
                <div className="p-4 border-t border-border bg-muted/20 text-center font-sans text-sm text-muted-foreground">
                  This session has ended.
                </div>
              )}
            </div>
          </div>
        )}

        <Dialog open={isReviewOpen} onOpenChange={setIsReviewOpen}>
          <DialogContent className="bg-card border-border sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="font-display text-3xl text-primary">Leave a Review</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <p className="font-sans text-sm text-muted-foreground text-center">How was your reading with {otherName}?</p>
              <div className="flex justify-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`w-8 h-8 cursor-pointer ${star <= rating ? "fill-secondary text-secondary" : "text-muted"}`}
                    onClick={() => setRating(star)}
                  />
                ))}
              </div>
              <Textarea
                placeholder="Share your experience…"
                className="bg-input border-border/50 mt-4"
                value={reviewBody}
                onChange={(e) => setReviewBody(e.target.value)}
              />
              <Button
                className="w-full font-sans"
                onClick={() => submitReview.mutate({ sessionId: sessionId as string, data: { rating, body: reviewBody } })}
                disabled={submitReview.isPending}
              >
                {submitReview.isPending ? <Loader2 className="animate-spin mr-2 w-4 h-4" /> : null} Submit Review
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
