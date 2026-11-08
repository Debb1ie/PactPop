import Image from "next/image";
import { cn } from "@/lib/cn";

/** Poppy, PactPop's pup. Each mood is a transparent sticker in /public/mascot. */
export type MascotMood =
  | "card-wave"
  | "love"
  | "crying"
  | "angry"
  | "laughing"
  | "thumbs-up"
  | "thinking"
  | "shocked"
  | "sleeping"
  | "party"
  | "wink-card"
  | "confused";

// intrinsic sizes of the stickers (width × height), so layout never jumps
const SIZE: Record<MascotMood, [number, number]> = {
  "card-wave": [474, 480],
  love: [480, 446],
  crying: [480, 439],
  angry: [480, 429],
  laughing: [480, 439],
  "thumbs-up": [480, 361],
  thinking: [480, 447],
  shocked: [480, 436],
  sleeping: [480, 390],
  party: [480, 459],
  "wink-card": [480, 421],
  confused: [480, 464],
};

const ALT: Record<MascotMood, string> = {
  "card-wave": "Poppy the PactPop pup waving with a card",
  love: "Poppy hugging a heart",
  crying: "Poppy looking sad",
  angry: "Poppy looking cross",
  laughing: "Poppy laughing",
  "thumbs-up": "Poppy giving a thumbs-up",
  thinking: "Poppy thinking",
  shocked: "Poppy looking surprised",
  sleeping: "Poppy asleep",
  party: "Poppy celebrating",
  "wink-card": "Poppy winking with a card",
  confused: "Poppy looking confused",
};

/** `width` is the rendered width in px; height follows the sticker's own proportions. */
export function Mascot({ mood, width = 120, className, decorative, priority }: { mood: MascotMood; width?: number; className?: string; decorative?: boolean; priority?: boolean }) {
  const [w, h] = SIZE[mood];
  return (
    <Image
      src={`/mascot/${mood}.webp`}
      alt={decorative ? "" : ALT[mood]}
      width={width}
      height={Math.round((width * h) / w)}
      priority={priority}
      className={cn("select-none drop-shadow-[0_10px_18px_rgb(30_20_80/0.18)]", className)}
      draggable={false}
    />
  );
}
