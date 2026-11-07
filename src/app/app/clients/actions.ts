"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAuth } from "@/server/auth/session";
import { getDb } from "@/server/db/client";
import { clientInput, createClient, updateClient } from "@/server/services/clients";

export type ClientFormState = { error?: string; fieldErrors?: Record<string, string>; ok?: boolean } | undefined;

function readForm(form: FormData) {
  const v = (k: string) => {
    const x = form.get(k);
    return typeof x === "string" && x.trim() !== "" ? x : undefined;
  };
  return { name: v("name") ?? "", email: v("email"), company: v("company"), phone: v("phone"), website: v("website"), notes: v("notes") };
}

function errors(e: z.ZodError) {
  const out: Record<string, string> = {};
  for (const i of e.issues) out[String(i.path[0])] ??= i.message;
  return out;
}

export async function createClientAction(_: ClientFormState, form: FormData): Promise<ClientFormState> {
  const ctx = await requireAuth();
  const parsed = clientInput.safeParse(readForm(form));
  if (!parsed.success) return { fieldErrors: errors(parsed.error) };
  const db = await getDb();
  const client = await createClient(db, ctx.business.id, ctx.user.id, parsed.data);
  revalidatePath("/app/clients");
  redirect(`/app/clients/${client.id}`);
}

export async function updateClientAction(clientId: string, _: ClientFormState, form: FormData): Promise<ClientFormState> {
  const ctx = await requireAuth();
  if (!z.string().uuid().safeParse(clientId).success) return { error: "Invalid client" };
  const parsed = clientInput.safeParse(readForm(form));
  if (!parsed.success) return { fieldErrors: errors(parsed.error) };
  const db = await getDb();
  try {
    await updateClient(db, ctx.business.id, ctx.user.id, clientId, parsed.data);
  } catch {
    return { error: "Client not found" };
  }
  revalidatePath(`/app/clients/${clientId}`);
  return { ok: true };
}
