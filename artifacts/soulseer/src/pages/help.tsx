import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const faqs = [
  {
    q: "How do pay-per-minute readings work?",
    a: "Top up your balance with any amount of $5 or more, then pick an online reader. Once both of you join the session, billing begins at the reader's per-minute rate. The minute count and remaining balance are visible the entire time, and either of you can end the session whenever you'd like.",
  },
  {
    q: "What's the minimum balance to start a reading?",
    a: "You need at least $5 in your balance to request a reading. We'll warn you when fewer than two minutes of runway remain, and the session will end automatically if your balance reaches $0.",
  },
  {
    q: "Can I get a refund?",
    a: "Top-ups are non-refundable as a general rule, but if you experience a technical issue please reach out and we'll look into it. Reader payouts are released after our internal review window.",
  },
  {
    q: "How do I become a reader?",
    a: "Reader spots are added by our admin team after a review. If you'd like to join the roster, send a note through the community page or contact your friendly neighbourhood admin directly.",
  },
  {
    q: "What about the community forum?",
    a: "The forum is free to read for everyone. Sign up to post and reply. Be kind, share generously, and flag anything that doesn't belong — our admins will take it from there.",
  },
];

export default function HelpPage() {
  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-12 max-w-3xl">
        <div className="text-center mb-12">
          <h1 className="font-display text-5xl text-primary mb-4">Help & FAQ</h1>
          <p className="font-serif text-muted-foreground">Answers to common questions about SoulSeer.</p>
        </div>
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="font-display text-2xl text-secondary">Frequently Asked</CardTitle>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible>
              {faqs.map((f, i) => (
                <AccordionItem key={i} value={`q${i}`}>
                  <AccordionTrigger className="font-sans text-left">{f.q}</AccordionTrigger>
                  <AccordionContent className="font-serif text-foreground/80 leading-relaxed">{f.a}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
