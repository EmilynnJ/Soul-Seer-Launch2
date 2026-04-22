import { useGetMe, getGetMeQueryKey } from "@workspace/api-client-react";
import { ReactNode } from "react";
import { UserRole } from "@workspace/api-zod";
import { Loader2 } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

interface RequireRoleProps {
  role: "reader" | "admin" | "client";
  children: ReactNode;
}

export function RequireRole({ role, children }: RequireRoleProps) {
  const { data: me, isLoading } = useGetMe({
    query: {
      queryKey: getGetMeQueryKey(),
    }
  });

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!me || (role === "admin" && me.role !== "admin") || (role === "reader" && me.role !== "reader" && me.role !== "admin")) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
        <h2 className="font-display text-4xl text-primary mb-4">Sacred Space</h2>
        <p className="text-muted-foreground font-sans max-w-md mb-8">
          This area of the parlor is reserved for {role}s only. If you believe this is an error, please contact support.
        </p>
        <Link href="/">
          <Button variant="outline" className="border-primary/30 text-primary hover:bg-primary/10">
            Return to the Parlor
          </Button>
        </Link>
      </div>
    );
  }

  return <>{children}</>;
}
