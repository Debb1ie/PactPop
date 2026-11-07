import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { ThemeToggle } from "@/components/ui/theme";
import { getAuthContext } from "@/server/auth/session";

export default async function AuthLayout({ children }: LayoutProps<"/">) {
  // Already signed in → straight to the app (fixes login/register showing for active sessions).
  if (await getAuthContext()) redirect("/app/dashboard");
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="flex h-14 items-center justify-between px-4 sm:px-6">
        <Link href="/" className="-ml-1 inline-flex items-center text-[1.0625rem] text-accent hover:opacity-70">
          <ChevronLeft className="h-5 w-5" /> Home
        </Link>
        <ThemeToggle />
      </header>
      <main className="flex flex-1 items-start justify-center px-4 pb-16 pt-4 sm:items-center sm:pt-0">
        <div className="w-full max-w-[26rem]">{children}</div>
      </main>
    </div>
  );
}
