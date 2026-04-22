import { AppLayout } from "@/components/AppLayout";
import { useListForumCategories, useListForumTopics } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatDateTime } from "@/lib/format";
import { MessageCircle, Pin, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";

export default function ForumPage() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const { data: categories, isLoading: categoriesLoading } = useListForumCategories();
  const { data: topics, isLoading: topicsLoading } = useListForumTopics({ category: selectedCategory || undefined, limit: 50 });

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-12 max-w-6xl">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
          <div>
            <h1 className="font-display text-5xl text-primary mb-2">Community Forum</h1>
            <p className="font-serif text-muted-foreground text-lg">Discuss, share, and connect with fellow seekers.</p>
          </div>
          <Link href="/forum/new">
            <Button className="font-sans shadow-[0_0_15px_rgba(255,105,180,0.2)]">Create Topic</Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-1 space-y-6">
            <Card className="bg-card border-border">
              <CardHeader className="pb-3 border-b border-border/50">
                <CardTitle className="font-sans text-lg">Categories</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {categoriesLoading ? (
                  <div className="p-6 flex justify-center"><Loader2 className="animate-spin w-5 h-5 text-primary" /></div>
                ) : (
                  <div className="flex flex-col">
                    <button 
                      onClick={() => setSelectedCategory(null)}
                      className={`p-4 text-left font-sans transition-colors border-b border-border/50 last:border-0 ${!selectedCategory ? 'bg-primary/10 text-primary border-l-2 border-l-primary' : 'text-foreground hover:bg-muted/50 border-l-2 border-l-transparent'}`}
                    >
                      All Topics
                    </button>
                    {categories?.map(c => (
                      <button 
                        key={c.id}
                        onClick={() => setSelectedCategory(c.slug)}
                        className={`p-4 text-left transition-colors border-b border-border/50 last:border-0 ${selectedCategory === c.slug ? 'bg-primary/10 text-primary border-l-2 border-l-primary' : 'hover:bg-muted/50 border-l-2 border-l-transparent'}`}
                      >
                        <div className="font-sans font-medium mb-1">{c.name}</div>
                        <div className="text-xs text-muted-foreground font-serif">{c.description}</div>
                      </button>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-3">
            <Card className="bg-card border-border shadow-lg">
              <CardContent className="p-0">
                {topicsLoading ? (
                  <div className="p-12 flex justify-center"><Loader2 className="animate-spin w-8 h-8 text-primary" /></div>
                ) : topics?.length ? (
                  <div className="divide-y divide-border/50">
                    {topics.map(topic => (
                      <Link key={topic.id} href={`/forum/topics/${topic.id}`}>
                        <div className="p-6 hover:bg-muted/20 transition-colors cursor-pointer group">
                          <div className="flex items-start gap-4">
                            <div className="w-10 h-10 rounded-full border border-border overflow-hidden shrink-0 hidden sm:block">
                              {topic.authorAvatarUrl ? (
                                <img src={topic.authorAvatarUrl} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full bg-muted flex items-center justify-center font-display text-lg text-muted-foreground">
                                  {topic.authorName.charAt(0)}
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                {topic.isPinned && <Pin className="w-3.5 h-3.5 text-secondary fill-secondary/20 shrink-0" />}
                                <h3 className="font-sans text-lg font-medium text-foreground group-hover:text-primary transition-colors truncate">
                                  {topic.title}
                                </h3>
                              </div>
                              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground font-sans mt-2">
                                <Badge variant="outline" className="bg-background/50 text-[10px] py-0 border-border/50">
                                  {topic.categoryName}
                                </Badge>
                                <span>By <span className={topic.authorRole === 'reader' ? 'text-secondary' : 'text-foreground'}>{topic.authorName}</span></span>
                                <span>{formatDateTime(topic.createdAt)}</span>
                                <span className="flex items-center"><MessageCircle className="w-3 h-3 mr-1" /> {topic.replyCount}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="p-16 text-center">
                    <MessageCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                    <h3 className="font-sans font-medium text-foreground mb-2">No topics found</h3>
                    <p className="text-muted-foreground font-serif text-sm">Be the first to start a conversation in this category.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
