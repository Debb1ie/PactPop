/** A milestone the client may pay by checkout right now: the deposit, or work the owner approved. */
export function isDueForCheckout(m: { kind: string; status: string }) {
  return (m.kind === "deposit" && m.status === "pending") || m.status === "approved";
}
