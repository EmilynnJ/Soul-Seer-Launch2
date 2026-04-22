import { AppLayout } from "@/components/AppLayout";

export default function PrivacyPage() {
  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-12 max-w-3xl prose prose-invert font-serif">
        <h1 className="font-display text-5xl text-primary mb-6">Privacy Policy</h1>
        <p className="text-muted-foreground">Last updated: today.</p>
        <p>
          SoulSeer respects your privacy. This is a static placeholder summarizing how we plan to handle your information
          when you use the platform.
        </p>
        <h2 className="font-display text-3xl text-secondary mt-8">Information we collect</h2>
        <p>
          We collect the email address and basic profile data you provide via Auth0 sign-in, your reading history, and
          the messages and forum posts you submit while using the platform.
        </p>
        <h2 className="font-display text-3xl text-secondary mt-8">How we use it</h2>
        <p>
          Your information is used to operate the platform — match you with readers, process Stripe payments, deliver
          per-minute billing, and surface community activity.
        </p>
        <h2 className="font-display text-3xl text-secondary mt-8">Sharing</h2>
        <p>
          We share data with our infrastructure providers (Auth0 for authentication, Stripe for payments, Agora for
          real-time communication) strictly to operate the service. We do not sell your data.
        </p>
        <h2 className="font-display text-3xl text-secondary mt-8">Contact</h2>
        <p>For questions, reach out via the help page.</p>
      </div>
    </AppLayout>
  );
}
