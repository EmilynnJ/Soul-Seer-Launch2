import { useListReaders, getListReadersQueryKey } from "@workspace/api-client-react";
import type { ListReadersStatus, ListReadersService } from "@workspace/api-client-react";
import { AppLayout } from "@/components/AppLayout";
import { ReaderCard } from "@/components/ReaderCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Search, SlidersHorizontal, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

export default function ReadersPage() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [status, setStatus] = useState<ListReadersStatus>("all");
  const [service, setService] = useState<ListReadersService | "all">("all");

  const { data: readers, isLoading } = useListReaders(
    { 
      status: status === "all" ? undefined : status, 
      service: service === "all" ? undefined : service,
      search: debouncedSearch || undefined 
    },
    {
      query: {
        queryKey: getListReadersQueryKey({ 
          status: status === "all" ? undefined : status, 
          service: service === "all" ? undefined : service,
          search: debouncedSearch || undefined 
        }),
      }
    }
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setDebouncedSearch(search);
  };

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <h1 className="font-display text-5xl text-primary mb-3">Gifted Readers</h1>
            <p className="font-serif text-muted-foreground max-w-2xl text-lg">
              Connect with vetted psychics, tarot readers, and spiritual guides.
            </p>
          </div>
          
          <form onSubmit={handleSearch} className="flex gap-2 max-w-md w-full">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Search by name or specialty..." 
                className="pl-9 bg-card border-border/50"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Button type="submit" variant="secondary" className="bg-secondary/10 text-secondary hover:bg-secondary/20">
              Search
            </Button>
          </form>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-8 pb-6 border-b border-border/40">
          <div className="flex items-center gap-2 text-sm text-muted-foreground font-sans">
            <SlidersHorizontal className="w-4 h-4" />
            <span>Filter by:</span>
          </div>
          
          <div className="flex gap-2">
            {(["all", "online"] as const).map(s => (
              <Button
                key={s}
                variant={status === s ? "default" : "outline"}
                size="sm"
                className={`font-sans rounded-full ${status === s ? 'bg-primary/20 text-primary border-primary/50' : 'border-border/50'}`}
                onClick={() => setStatus(s)}
              >
                {s === "all" ? "All Statuses" : "Online Now"}
              </Button>
            ))}
          </div>

          <div className="w-px h-6 bg-border/50 hidden sm:block" />

          <div className="flex gap-2">
            {(["all", "chat", "phone", "video"] as const).map(s => (
              <Button
                key={s}
                variant={service === s ? "default" : "outline"}
                size="sm"
                className={`font-sans rounded-full ${service === s ? 'bg-secondary/20 text-secondary border-secondary/50' : 'border-border/50'}`}
                onClick={() => setService(s)}
              >
                {s === "all" ? "All Services" : s.charAt(0).toUpperCase() + s.slice(1)}
              </Button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : readers?.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 bg-muted/50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="font-display text-2xl text-foreground mb-2">No readers found</h3>
            <p className="text-muted-foreground font-serif">Try adjusting your filters or search terms.</p>
            <Button 
              variant="link" 
              onClick={() => { setStatus("all"); setService("all"); setSearch(""); setDebouncedSearch(""); }}
              className="text-primary mt-4"
            >
              Clear filters
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {readers?.map((reader, i) => (
              <motion.div
                key={reader.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
              >
                <ReaderCard reader={reader} />
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
