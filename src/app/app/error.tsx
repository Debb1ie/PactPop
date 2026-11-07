"use client";

import { Button } from "@/components/ui/button";
import { ErrorNotice } from "@/components/ui/primitives";

export default function AppError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="mx-auto max-w-lg space-y-4 py-16">
      <ErrorNotice title="This page couldn't load" message={error.digest ? `Reference: ${error.digest}` : error.message} />
      <Button variant="outline" onClick={reset}>
        Try again
      </Button>
    </div>
  );
}
