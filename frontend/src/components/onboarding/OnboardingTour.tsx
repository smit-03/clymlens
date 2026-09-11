import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { Button } from "../ui/Button";
import { CalendarIcon, DatabaseIcon, LayersIcon, MapPinIcon } from "../ui/icons";
import { useSidebarUI } from "../../context/SidebarUIContext";
import { completeOnboarding } from "./onboardingStorage";

const STEPS = [
  {
    target: "location-date",
    title: "Choose a location and date range",
    description:
      "Search for a place or enter coordinates, then choose up to 31 days of historical weather.",
    icon: MapPinIcon,
  },
  {
    target: "fetch-store",
    title: "Fetch & store the weather",
    description:
      "Fetch the weather data for your selected range and save it for later inspection.",
    icon: CalendarIcon,
  },
  {
    target: "stored-datasets",
    title: "Return to stored datasets",
    description:
      "Your saved requests appear here. Select any dataset to load it into the workspace.",
    icon: LayersIcon,
  },
  {
    target: "chart-table",
    title: "Explore the chart and table",
    description:
      "Review summary stats, follow the temperature trend, and inspect each daily observation.",
    icon: DatabaseIcon,
  },
] as const;

interface OnboardingTourProps {
  open: boolean;
  onClose: () => void;
}

export function OnboardingTour({ open, onClose }: OnboardingTourProps) {
  const { setCollapsed } = useSidebarUI();
  const [stepIndex, setStepIndex] = useState(0);
  const [popoverPosition, setPopoverPosition] = useState<"top" | "bottom">("bottom");
  const nextButtonRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLElement>(null);
  const step = STEPS[stepIndex];
  const StepIcon = step.icon;

  const finish = useCallback(() => {
    completeOnboarding();
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (!open) return;
    setStepIndex(0);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    if (step.target === "stored-datasets") setCollapsed(false);
    const target = document.querySelector<HTMLElement>(`[data-tour-target="${step.target}"]`);
    if (target) {
      target.scrollIntoView?.({ behavior: "smooth", block: "center" });
      const updateTargetRect = () => {
        const rect = target.getBoundingClientRect();
        const popoverHeight = popoverRef.current?.getBoundingClientRect().height ?? 240;
        const spaceAbove = rect.top - 16;
        const spaceBelow = window.innerHeight - rect.bottom - 16;
        setPopoverPosition(
          spaceBelow >= popoverHeight || spaceBelow >= spaceAbove ? "bottom" : "top",
        );
      };
      const timer = window.setTimeout(updateTargetRect, 250);
      updateTargetRect();
      window.requestAnimationFrame(updateTargetRect);
      window.addEventListener("resize", updateTargetRect);
      window.addEventListener("scroll", updateTargetRect, true);
      target.classList.add("clymlens-tour-target");
      nextButtonRef.current?.focus();
      return () => {
        window.clearTimeout(timer);
        window.removeEventListener("resize", updateTargetRect);
        window.removeEventListener("scroll", updateTargetRect, true);
        target.classList.remove("clymlens-tour-target");
      };
    }
    nextButtonRef.current?.focus();
  }, [open, setCollapsed, step.target]);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") finish();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [finish, open]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[1000]" role="presentation">
      <button
        type="button"
        aria-label="Skip tour"
        onClick={finish}
        className="absolute inset-0 h-full w-full cursor-default bg-slate-950/25 backdrop-blur-[1px]"
      />
      <section
        ref={popoverRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="onboarding-tour-title"
        aria-describedby="onboarding-tour-description"
        className={`absolute left-4 right-4 z-[1002] mx-auto max-w-md overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_18px_50px_-20px_rgba(15,23,42,0.45)] ${
          popoverPosition === "top" ? "top-4 sm:top-8" : "bottom-4 sm:bottom-8"
        }`}
      >
        <div className="h-1 bg-brand-500" style={{ width: `${((stepIndex + 1) / STEPS.length) * 100}%` }} />
        <div className="p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
              <StepIcon className="h-5 w-5" />
            </span>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-brand-600">
                ClymLens tour · {stepIndex + 1} of {STEPS.length}
              </p>
              <h2 id="onboarding-tour-title" className="mt-1 text-base font-semibold text-slate-900">
                {step.title}
              </h2>
            </div>
          </div>
          <p id="onboarding-tour-description" className="mt-3 text-sm leading-6 text-slate-600">
            {step.description}
          </p>
          <div className="mt-5 flex items-center justify-between gap-3">
            <Button variant="ghost" size="sm" onClick={finish}>
              Skip
            </Button>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setStepIndex((current) => current - 1)}
                disabled={stepIndex === 0}
              >
                Back
              </Button>
              {stepIndex === STEPS.length - 1 ? (
                <Button size="sm" onClick={finish}>
                  Done
                </Button>
              ) : (
                <Button ref={nextButtonRef} size="sm" onClick={() => setStepIndex((current) => current + 1)}>
                  Next
                </Button>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>,
    document.body,
  );
}
