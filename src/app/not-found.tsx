import { ButtonLink } from "@/components/ui/button";
import { LogoMark } from "@/components/brand/logo";

export default function NotFound() {
  return (
    <div className="grid min-h-[70vh] place-items-center px-4 text-center">
      <div>
        <LogoMark className="mx-auto h-14 w-14" />
        <h1 className="mt-6 text-3xl font-semibold">We couldn&apos;t find that page</h1>
        <p className="mt-2 text-muted">It may have moved, or you might not have access to it.</p>
        <ButtonLink href="/" className="mt-6">
          Go home
        </ButtonLink>
      </div>
    </div>
  );
}
