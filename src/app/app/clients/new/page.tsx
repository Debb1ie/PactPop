import type { Metadata } from "next";
import { Card, CardBody, PageHeader } from "@/components/ui/primitives";
import { requireAuth } from "@/server/auth/session";
import { createClientAction } from "../actions";
import { ClientForm } from "../client-form";

export const metadata: Metadata = { title: "Add client" };

export default async function NewClientPage() {
  await requireAuth();
  return (
    <div className="max-w-2xl">
      <PageHeader title="Add client" description="Clients can also add themselves through your request portal." />
      <Card>
        <CardBody>
          <ClientForm action={createClientAction} submitLabel="Create client" />
        </CardBody>
      </Card>
    </div>
  );
}
