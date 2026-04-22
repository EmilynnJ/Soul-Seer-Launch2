import { AppLayout } from "@/components/AppLayout";
import { RequireRole } from "@/components/RequireRole";
import { useListMyFavorites } from "@workspace/api-client-react";
import { ReaderCard } from "@/components/ReaderCard";
import { Loader2, Heart } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function FavoritesPage() {
  return (
    <RequireRole role="client">
      <FavoritesContent />
    </RequireRole>
  );
}

function FavoritesContent() {
  const { data: favorites, isLoading } = useListMyFavorites();

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-12">
        <h1 className="font-display text-5xl text-primary mb-3">Favorite Readers</h1>
        <p className="font-serif text-muted-foreground max-w-2xl text-lg mb-12">
          The guides and psychics you've connected with.
        </p>

        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : favorites?.length === 0 ? (
          <div className="text-center py-20 bg-card border border-border/50 rounded-xl shadow-lg max-w-2xl mx-auto">
            <div className="w-20 h-20 bg-muted/30 rounded-full flex items-center justify-center mx-auto mb-6">
              <Heart className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="font-display text-3xl text-foreground mb-3">No favorites yet</h3>
            <p className="text-muted-foreground font-serif mb-8 max-w-md mx-auto">
              When you find a reader you connect with, add them to your favorites for quick access later.
            </p>
            <Link href="/readers">
              <Button className="bg-primary text-primary-foreground font-sans px-8">Browse Readers</Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {favorites?.map((reader) => (
              <ReaderCard key={reader.id} reader={reader} />
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
