import { useEffect } from "react";
import { useSearchParams } from "react-router";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "~/components/ui/button";

export const prototypeVariants = [
  { key: "A", name: "Course activity journal" },
  { key: "B", name: "Dashboard side panel" },
  { key: "C", name: "Split-view workbench" },
] as const;

export type PrototypeVariant = (typeof prototypeVariants)[number]["key"];

export function getPrototypeVariant(value: string | null): PrototypeVariant {
  return prototypeVariants.find((variant) => variant.key === value)?.key ?? "A";
}

export function PrototypeSwitcher() {
  const [params, setParams] = useSearchParams();
  const current = getPrototypeVariant(params.get("variant"));
  const index = prototypeVariants.findIndex(
    (variant) => variant.key === current
  );

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (
        event.defaultPrevented ||
        event.altKey ||
        event.ctrlKey ||
        event.metaKey ||
        event.shiftKey ||
        (event.key !== "ArrowLeft" && event.key !== "ArrowRight") ||
        (event.target instanceof Element &&
          event.target.closest(
            "input, textarea, select, [contenteditable]:not([contenteditable='false']), [role='textbox']"
          ))
      ) {
        return;
      }
      event.preventDefault();
      const step = event.key === "ArrowRight" ? 1 : -1;
      const next =
        prototypeVariants[
          (index + step + prototypeVariants.length) % prototypeVariants.length
        ];
      setParams(
        (previous) => {
          const updated = new URLSearchParams(previous);
          updated.set("variant", next.key);
          return updated;
        },
        { replace: true, preventScrollReset: true }
      );
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [index, setParams]);

  if (!import.meta.env.DEV) return null;

  function cycle(step: number) {
    const next =
      prototypeVariants[
        (index + step + prototypeVariants.length) % prototypeVariants.length
      ];
    setParams(
      (previous) => {
        const updated = new URLSearchParams(previous);
        updated.set("variant", next.key);
        return updated;
      },
      { replace: true, preventScrollReset: true }
    );
  }

  return (
    <nav
      aria-label="Prototype layout switcher"
      className="fixed bottom-4 left-1/2 z-50 flex w-max max-w-[95vw] -translate-x-1/2 items-center gap-2 rounded-full bg-slate-950 px-3 py-2 text-white shadow-xl"
    >
      <Button
        variant="ghost"
        size="icon"
        aria-label="Previous layout"
        onClick={() => cycle(-1)}
      >
        <ArrowLeft />
      </Button>
      <div className="min-w-48 text-center text-xs sm:min-w-64">
        <div className="font-semibold">
          {current} / {prototypeVariants[index].name}
        </div>
        <div className="mt-0.5 text-slate-300">
          Throwaway prototype / use arrow keys
        </div>
      </div>
      <Button
        variant="ghost"
        size="icon"
        aria-label="Next layout"
        onClick={() => cycle(1)}
      >
        <ArrowRight />
      </Button>
    </nav>
  );
}
