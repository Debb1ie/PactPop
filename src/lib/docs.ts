/** Shapes shared by the server (tools, document pages) and the browser (chat, documents). */

export type ChartKind = "pie" | "donut" | "bar" | "line";

export type ChartSpec = {
  kind: ChartKind;
  title: string;
  subtitle?: string;
  /** "money" values are integer minor units; "count" values are plain numbers. */
  unit: "money" | "count";
  currency: string;
  series: { key: string; label: string }[];
  data: ({ label: string } & Record<string, number | string>)[];
};

export type InvoiceDocData = {
  kind: "invoice" | "sample";
  /** Sample invoices: the milestone they were built from. */
  milestoneId?: string;
  number: string;
  status: string;
  issuedAt: string | null;
  dueAt: string | null;
  paidAt?: string | null;
  business: { name: string; email?: string | null };
  client: { name: string; company?: string | null; email?: string | null };
  agreement: string;
  items: { name: string; description?: string; quantity: number; unitMinor: number; totalMinor: number }[];
  totalMinor: number;
  currency: string;
  note?: string;
  paypal?: { invoiceId?: string | null; payerUrl?: string | null; sandbox: boolean };
};
