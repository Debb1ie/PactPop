import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { Card, CardBody, PageHeader } from "@/components/ui/primitives";
import { requireAuth } from "@/server/auth/session";
import { createClientAction } from "../actions";
import { ClientForm } from "../client-form";

export const metadata: Metadata = { title: "Add client" };

export default async function NewClientPage() {
  await requireAuth();
  return (
    <div className="max-w-2xl">
      <Link href="/app/clients" className="-ml-1 mb-2 inline-flex items-center text-[1.0625rem] text-accent hover:opacity-70">
        <ChevronLeft className="h-5 w-5" /> Clients
      </Link>
      <PageHeader title="Add client" description="Add someone you are making commitments to." />
      <Card>
        <CardBody>
          <ClientForm action={createClientAction} submitLabel="Create client" />
        </CardBody>
      </Card>
    </div>
  );
}
