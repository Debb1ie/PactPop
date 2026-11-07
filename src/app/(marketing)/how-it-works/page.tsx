import type { Metadata } from "next";
import { CtaBand, FaqSection, HowItWorks, PayPalSection, Problem } from "@/components/marketing/sections";

export const metadata: Metadata = { title: "How it works" };

export default function HowItWorksPage() {
  return (
    <>
      <div className="mx-auto max-w-6xl px-4 pt-16 sm:px-6">
        <h1 className="text-4xl font-semibold sm:text-5xl">Request → Agreement → Delivery → Approval → Payment</h1>
        <p className="mt-4 max-w-2xl text-lg text-muted">Follow a $1,500 website redesign from the client&apos;s first message to a PayPal-confirmed payment.</p>
      </div>
      <Problem />
      <HowItWorks />
      <PayPalSection />
      <FaqSection />
      <CtaBand />
    </>
  );
}
