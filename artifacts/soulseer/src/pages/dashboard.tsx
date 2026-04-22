import { AppLayout } from "@/components/AppLayout";
import { RequireRole } from "@/components/RequireRole";
import { useGetMe, getGetMeQueryKey, useMessageAdmin } from "@workspace/api-client-react";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Mail } from "lucide-react";
import { Link } from "wouter";

export default function DashboardPage() {
  return (
    <RequireRole role="client">
      <DashboardContent />
    </RequireRole>
  );
}

function DashboardContent() {
  const { data: me } = useGetMe({ query: { queryKey: getGetMeQueryKey() }});
  
  const { toast } = useToast();
  const [supportMessage, setSupportMessage] = useState("");
  
  const sendMessage = useMessageAdmin({
    mutation: {
      onSuccess: () => {
        toast({ title: "Message sent to support", description: "We will get back to you shortly." });
        setSupportMessage("");
      }
    }
  });

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-12 max-w-6xl">
        <h1 className="font-display text-4xl text-primary mb-8">Dashboard</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <Card className="bg-card border-border shadow-lg">
            <CardContent className="p-6">
              <h3 className="font-sans font-medium text-foreground mb-4">Quick Links</h3>
              <div className="flex flex-col gap-2 font-sans">
                <Link href="/readers" className="text-primary hover:underline">Find a Reader</Link>
                <Link href="/wallet" className="text-primary hover:underline">Wallet & Balance</Link>
                <Link href="/sessions" className="text-primary hover:underline">My Sessions</Link>
                <Link href="/community" className="text-primary hover:underline">Community Hub</Link>
                <Link href="/forum" className="text-primary hover:underline">Forum</Link>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-card border-border shadow-lg md:col-span-2">
             <CardContent className="p-6">
               <h3 className="font-sans font-medium text-foreground mb-4 flex items-center gap-2"><Mail className="w-4 h-4 text-primary" /> Contact Support</h3>
               <form onSubmit={(e) => { e.preventDefault(); if(supportMessage) sendMessage.mutate({ data: { body: supportMessage }}); }}>
                 <Textarea 
                   className="bg-input border-border/50 min-h-[100px] mb-4 font-serif" 
                   placeholder="How can we help you today?"
                   value={supportMessage}
                   onChange={e => setSupportMessage(e.target.value)}
                 />
                 <div className="flex justify-end">
                   <Button disabled={sendMessage.isPending || !supportMessage.trim()} className="font-sans px-8">
                     {sendMessage.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null} Send Message
                   </Button>
                 </div>
               </form>
             </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
