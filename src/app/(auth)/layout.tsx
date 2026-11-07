import Link from "next/link";
import { Logo, LogoMark } from "@/components/brand/logo";
import { ThemeToggle } from "@/components/ui/theme";

export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="grid min-h-screen lg:grid-cols-[1fr_1.1fr]">
      <aside className="relative hidden overflow-hidden bg-aubergine p-12 text-lilac lg:flex lg:flex-col">
        <Link href="/" aria-label="PactPop home">
          <Logo tone="light" />
        </Link>
        <div className="my-auto max-w-md">
          <LogoMark variant="mark" className="h-16 w-16 text-white" />
          <p className="mt-8 font-display text-3xl font-semibold leading-tight text-white">Make promises. Make progress. Get paid.</p>
          <p className="mt-4 text-lilac/70">Every request, agreement, deliverable and PayPal payment, connected on one record.</p>
        </div>
        <div className="pointer-events-none absolute -bottom-40 -right-40 h-[28rem] w-[28rem] rounded-full bg-violet/30 blur-3xl" />
      </aside>
      <main className="flex flex-col px-4 py-8 sm:px-10">
        <div className="flex items-center justify-between">
          <Link href="/" className="lg:invisible" aria-label="PactPop home">
            <Logo />
          </Link>
          <ThemeToggle />
        </div>
        <div className="mx-auto my-auto w-full max-w-md py-10">{children}</div>
      </main>
    </div>
  );
}
