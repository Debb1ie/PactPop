import {
  Archive,
  BarChart3,
  Bot,
  CheckCheck,
  FileText,
  Handshake,
  LayoutDashboard,
  type LucideIcon,
  PackageCheck,
  Settings,
  Sparkles,
  Users,
  Wallet,
} from "lucide-react";

export type NavItem = { href: string; label: string; icon: LucideIcon; group: "work" | "money" | "system"; ready: boolean };

/**
 * App navigation. `ready: false` items are hidden until their module ships, so the UI never
 * links to a placeholder page.
 */
export const NAV_ITEMS: NavItem[] = [
  { href: "/app/dashboard", label: "Dashboard", icon: LayoutDashboard, group: "work", ready: true },
  { href: "/app/command", label: "Command Center", icon: Sparkles, group: "work", ready: false },
  { href: "/app/commitments", label: "Commitments", icon: Handshake, group: "work", ready: false },
  { href: "/app/clients", label: "Clients", icon: Users, group: "work", ready: true },
  { href: "/app/proposals", label: "Proposals", icon: FileText, group: "work", ready: false },
  { href: "/app/deliverables", label: "Deliverables", icon: PackageCheck, group: "work", ready: false },
  { href: "/app/payments", label: "Payments", icon: Wallet, group: "money", ready: false },
  { href: "/app/approvals", label: "Approval Center", icon: CheckCheck, group: "money", ready: false },
  { href: "/app/evidence", label: "Evidence Vault", icon: Archive, group: "money", ready: false },
  { href: "/app/reports", label: "Reports", icon: BarChart3, group: "money", ready: false },
  { href: "/app/agents", label: "AI Agents", icon: Bot, group: "system", ready: false },
  { href: "/app/settings", label: "Settings", icon: Settings, group: "system", ready: false },
];

export const NAV_GROUPS: { key: NavItem["group"]; label: string }[] = [
  { key: "work", label: "Work" },
  { key: "money", label: "Money & trust" },
  { key: "system", label: "System" },
];
