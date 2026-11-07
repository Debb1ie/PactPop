/**
 * Deterministic text analysers used in rule-based mode (no AI key) and as a fallback.
 * They only extract what is literally present in the text. Missing facts become questions,
 * never guesses.
 */
import { normalizeFeature } from "@/server/services/pricing";

const NUMBER_WORDS: Record<string, number> = {
  one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12,
};

function toNumber(token: string): number | null {
  const t = token.toLowerCase();
  if (/^\d+$/.test(t)) return Number(t);
  return NUMBER_WORDS[t] ?? null;
}

/** Feature keyword → pricing-catalogue key. */
const FEATURE_PATTERNS: [RegExp, string][] = [
  [/\b(mobile|phones?|responsive|tablets?)\b/i, "responsive design"],
  [/\bseo\b|search engine|near me/i, "basic seo"],
  [/\bbook(ing)?\b|appointments?|reservations?|schedule a lesson|book a lesson/i, "booking system"],
  [/\bblog\b|articles|news(letter)?\b/i, "blog"],
  [/e-?commerce|online (shop|store)|checkout|sell products|product catalog(ue)?/i, "e-commerce"],
  [/contact form|enquiry form|inquiry form/i, "contact form"],
  [/\bcms\b|edit (it|the site) (myself|ourselves)|content management/i, "cms integration"],
  [/analytics|tracking/i, "analytics setup"],
  [/copywriting|write the (copy|text)/i, "copywriting"],
  [/\blogo\b/i, "logo design"],
];

export function detectFeatures(text: string): string[] {
  const out = new Set<string>();
  for (const [re, key] of FEATURE_PATTERNS) if (re.test(text)) out.add(normalizeFeature(key));
  return [...out];
}

/** "5 pages", "five pages", "4 pages plus booking" */
export function detectPageCount(text: string): number | null {
  const m = /\b(\d+|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve)\s+(?:\w+\s+)?pages?\b/i.exec(text);
  return m ? toNumber(m[1]) : null;
}

/** Named pages after a colon, e.g. "5 pages: Home, Menu, About and Contact" */
export function detectPageNames(text: string): string[] {
  const m = /pages?\s*[:\-]\s*([^.\n]+)/i.exec(text);
  if (!m) return [];
  return m[1]
    .split(/,|\band\b/i)
    .map((s) => s.trim().replace(/^the\s+/i, ""))
    .filter((s) => s.length > 1 && s.length < 30);
}

/** "$1,500", "1500 USD", "budget is around 2k" → minor units */
export function detectBudgetMinor(text: string): number | null {
  const m = /\$\s?([\d,]+(?:\.\d{1,2})?)\s*(k)?\b|\b([\d,]+)\s*(?:usd|dollars)\b/i.exec(text);
  if (!m) return null;
  const raw = (m[1] ?? m[3] ?? "").replace(/,/g, "");
  if (!raw) return null;
  const major = Number(raw) * (m[2] ? 1000 : 1);
  return Number.isFinite(major) ? Math.round(major * 100) : null;
}

/** "two weeks", "14 days", "within a month" → days */
export function detectTimelineDays(text: string): number | null {
  const m = /\b(\d+|a|an|one|two|three|four|five|six)\s+(day|week|month)s?\b/i.exec(text);
  if (!m) return null;
  const n = m[1].toLowerCase() === "a" || m[1].toLowerCase() === "an" ? 1 : toNumber(m[1]);
  if (!n) return null;
  return n * (m[2].toLowerCase() === "day" ? 1 : m[2].toLowerCase() === "week" ? 7 : 30);
}

export function classifyProjectType(text: string): string {
  if (/web ?site|landing page|web pages?/i.test(text)) return /redesign|refresh|revamp|new look/i.test(text) ? "Website redesign" : "Website";
  if (/\bapp\b|mobile app/i.test(text)) return "App development";
  if (/logo|brand/i.test(text)) return "Branding";
  if (/copy|content/i.test(text)) return "Content";
  return "Custom project";
}

export type RequestAnalysis = {
  projectType: string;
  summary: string;
  requirements: string[];
  deliverables: string[];
  budgetMinor: number | null;
  timelineDays: number | null;
  constraints: string[];
  missingInfo: string[];
  followUpQuestions: string[];
  estimate: { pages: number; features: string[]; extraHours: number };
};

export function analyzeRequestText(raw: string): RequestAnalysis {
  const pages = detectPageCount(raw);
  const pageNames = detectPageNames(raw);
  const features = detectFeatures(raw);
  const budgetMinor = detectBudgetMinor(raw);
  const timelineDays = detectTimelineDays(raw);
  const projectType = classifyProjectType(raw);

  const missingInfo: string[] = [];
  const followUpQuestions: string[] = [];
  if (pages == null && pageNames.length === 0) {
    missingInfo.push("Number of pages");
    followUpQuestions.push("Which pages do you need, and roughly how many?");
  }
  if (budgetMinor == null) {
    missingInfo.push("Budget");
    followUpQuestions.push("Do you have a budget range in mind?");
  }
  if (timelineDays == null) {
    missingInfo.push("Deadline");
    followUpQuestions.push("When do you need this live?");
  }
  if (!/photo|image|copy|content|text/i.test(raw)) {
    missingInfo.push("Content and photography");
    followUpQuestions.push("Will you provide the text and photos, or should we include them?");
  }

  const constraints: string[] = [];
  const launch = /before ([^.,]+)/i.exec(raw);
  if (launch) constraints.push(`Before ${launch[1].trim()}`);

  const pageCount = pages ?? (pageNames.length || 0);
  const requirements = [
    pageCount ? `${pageCount} page${pageCount === 1 ? "" : "s"}` : null,
    ...features.map((f) => f[0].toUpperCase() + f.slice(1)),
  ].filter(Boolean) as string[];

  return {
    projectType,
    summary: `${projectType}${pageCount ? ` with ${pageCount} page${pageCount === 1 ? "" : "s"}` : ""}${features.length ? `, ${features.join(", ")}` : ""}.`,
    requirements,
    deliverables: pageNames.length ? pageNames : pageCount ? [`${pageCount} designed pages`] : [],
    budgetMinor,
    timelineDays,
    constraints,
    missingInfo,
    followUpQuestions,
    estimate: { pages: pageCount, features, extraHours: 0 },
  };
}

export type ScopeAddition = { item: string; rationale: string; pages: number; hours: number };
export type ScopeClassification = "included" | "clarification" | "revision" | "additional";

/**
 * Compare a change request against the agreed scope (page names + features).
 * Additions are only what the text names and the agreement doesn't contain.
 */
export function analyzeScopeText(requestText: string, agreed: { pageNames: string[]; pageCount: number; features: string[] }, featureHours: Record<string, number>) {
  const additions: ScopeAddition[] = [];
  const agreedNames = agreed.pageNames.map((p) => p.toLowerCase());

  // named pages: "a Team page", "Gallery", "FAQ"
  const named = new Set<string>();
  for (const m of requestText.matchAll(/\b(?:an?\s+)?([A-Z][a-zA-Z]+)\s+page\b/g)) named.add(m[1]);
  // A list of capitalised items after a verb ("add", "asked for", "wants"...) or at the start.
  const firstSentence = requestText.split(/[.?!]\s/)[0];
  const listMatch = /(?:^|\b(?:add|also|plus|include|for|wants?|like|need)\s+)(?:an?\s+|the\s+)?([A-Z][\w ]*(?:,\s*(?:an?\s+|the\s+)?[A-Z][\w ]*)*(?:,?\s+and\s+(?:an?\s+|the\s+)?[A-Z][\w ]*)?)/.exec(firstSentence);
  if (listMatch) {
    for (const part of listMatch[1].split(/,|\band\b/)) {
      const name = part.trim().replace(/^(an?|the)\s+/i, "").replace(/\s+page$/i, "");
      if (name && /^[A-Z]/.test(name) && name.split(" ").length <= 3) named.add(name);
    }
  }
  for (const name of named) {
    const key = name.toLowerCase();
    if (FEATURE_PATTERNS.some(([re]) => re.test(name))) continue; // e.g. "Booking" handled as a feature
    if (agreedNames.some((a) => a.includes(key))) continue;
    additions.push({ item: `${name} page`, rationale: `Not among the ${agreed.pageCount} agreed pages.`, pages: 1, hours: 0 });
  }

  const countMatch = detectPageCount(requestText);
  if (additions.length === 0 && countMatch && /more|extra|additional|another/i.test(requestText)) {
    additions.push({ item: `${countMatch} additional page${countMatch === 1 ? "" : "s"}`, rationale: `The agreement covers ${agreed.pageCount} pages.`, pages: countMatch, hours: 0 });
  }

  for (const f of detectFeatures(requestText)) {
    if (agreed.features.includes(f)) continue;
    const hours = featureHours[f];
    if (hours === undefined) continue;
    additions.push({ item: f[0].toUpperCase() + f.slice(1), rationale: "Not part of the agreed scope.", pages: 0, hours });
  }

  let classification: ScopeClassification = "additional";
  if (additions.length === 0) {
    classification = /change|instead|swap|different|tweak|adjust/i.test(requestText) ? "revision" : /clarif|what does|confirm|does .* include/i.test(requestText) ? "clarification" : "included";
  }
  return { classification, additions };
}
