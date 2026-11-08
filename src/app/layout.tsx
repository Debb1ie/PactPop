import type { Metadata, Viewport } from "next";
import { Archivo, JetBrains_Mono, Sora } from "next/font/google";
import { ToastProvider } from "@/components/ui/toast";
import { themeScript } from "@/components/ui/theme";
import "./globals.css";

// Sora is kept for the PactPop wordmark only.
const sora = Sora({ variable: "--font-sora", subsets: ["latin"], weight: ["600"] });
// Archivo is variable on weight and width: wide cuts for headings, normal width for text.
const archivo = Archivo({ variable: "--font-archivo", subsets: ["latin"], axes: ["wdth"] });
const jetbrains = JetBrains_Mono({ variable: "--font-jetbrains", subsets: ["latin"], weight: ["400", "500", "600"] });

export const metadata: Metadata = {
  title: { default: "PactPop — Make promises. Make progress. Get paid.", template: "%s · PactPop" },
  description:
    "PactPop's AI agents manage your client agreements, track deliverables, catch scope changes, coordinate approvals and collect payment through PayPal.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f4f4f6" },
    { media: "(prefers-color-scheme: dark)", color: "#08080a" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" suppressHydrationWarning className={`${sora.variable} ${archivo.variable} ${jetbrains.variable} h-full antialiased`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-full">
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
