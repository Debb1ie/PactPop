import type { Metadata, Viewport } from "next";
import { JetBrains_Mono, Plus_Jakarta_Sans, Sora } from "next/font/google";
import { ToastProvider } from "@/components/ui/toast";
import { themeScript } from "@/components/ui/theme";
import "./globals.css";

// Sora is kept for the PactPop wordmark only.
const sora = Sora({ variable: "--font-sora", subsets: ["latin"], weight: ["600"] });
const jakarta = Plus_Jakarta_Sans({ variable: "--font-jakarta", subsets: ["latin"] });
const jetbrains = JetBrains_Mono({ variable: "--font-jetbrains", subsets: ["latin"], weight: ["400", "500", "600"] });

export const metadata: Metadata = {
  title: { default: "PactPop — Make promises. Make progress. Get paid.", template: "%s · PactPop" },
  description:
    "PactPop's AI agents manage your client agreements, track deliverables, catch scope changes, coordinate approvals and collect payment through PayPal.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f2f2f6" },
    { media: "(prefers-color-scheme: dark)", color: "#1c1d23" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" suppressHydrationWarning className={`${sora.variable} ${jakarta.variable} ${jetbrains.variable} h-full antialiased`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-full">
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
