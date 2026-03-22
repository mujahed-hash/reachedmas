"use client";

import { ThemeToggle } from "@/components/theme-toggle";

/** Marketing landing only: frees sticky header space so the full wordmark fits; toggle lives in the hero. */
export function LandingHeroThemeToggle() {
    return (
        <div className="flex w-full justify-center mb-3 sm:mb-4">
            <ThemeToggle />
        </div>
    );
}
