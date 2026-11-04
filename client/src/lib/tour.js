import { driver } from "driver.js";
import "driver.js/dist/driver.css";

let active = null;

const isVisible = (element) => !!element && element.getClientRects().length > 0;

const findVisible = (selector) => [...document.querySelectorAll(selector)].find(isVisible) ?? null;

const button = (label, className, onClick) => {
  const element = document.createElement("button");
  element.type = "button";
  element.className = className;
  element.textContent = label;
  element.addEventListener("click", onClick);
  return element;
};

/*
 * Runs a spotlight tour. Each stop: { target, fallback, fallbackText, title, text, action, optional }.
 * A stop whose target isn't on screen uses its fallback, then sits in the middle of the
 * screen, unless it's optional, when it's left out. Returns false when nothing could be shown.
 */
export const startTour = ({ stops, from = 0, doneText = "Done", skipText = "Skip tour", onAction, onFinish }) => {
  active?.destroy();
  const steps = stops
    .map((stop) => {
      const target = findVisible(stop.target);
      const fallback = !target && stop.fallback ? findVisible(stop.fallback) : null;
      if (!target && !fallback && stop.optional) return null;
      return {
        stop,
        element: target ?? fallback ?? undefined,
        popover: {
          title: stop.title,
          description: fallback && stop.fallbackText ? `${stop.text} ${stop.fallbackText}` : stop.text,
          side: stop.side,
          align: "start",
        },
      };
    })
    .filter(Boolean);
  if (steps.length === 0) return false;

  let pausing = false;
  const tour = driver({
    steps: steps.map(({ element, popover }) => ({ element, popover })),
    showProgress: steps.length > 1,
    progressText: "{{current}} of {{total}}",
    nextBtnText: "Next",
    prevBtnText: "Back",
    doneBtnText: doneText,
    showButtons: ["next", "previous"],
    popoverClass: "app-tour",
    overlayColor: "rgb(14, 12, 28)",
    overlayOpacity: 0.62,
    stagePadding: 6,
    stageRadius: 10,
    smoothScroll: true,
    onPopoverRender: (popover, { state }) => {
      const { stop } = steps[state.activeIndex];
      if (stop.action) {
        const row = document.createElement("div");
        row.className = "app-tour-action";
        const hint = document.createElement("span");
        hint.textContent = stop.action.hint ?? "";
        row.append(
          hint,
          button(stop.action.label, "app-tour-action-btn", () => {
            pausing = true;
            const index = state.activeIndex;
            tour.destroy();
            onAction?.(stop.action, index);
          })
        );
        popover.description.after(row);
      }
      if (!tour.isLastStep()) {
        popover.footer.prepend(button(skipText, "app-tour-skip", () => tour.destroy()));
      }
      // Start keyboard users on the main way forward.
      setTimeout(() => popover.nextButton.focus(), 0);
    },
    onDestroyed: () => {
      if (active === tour) active = null;
      if (!pausing) onFinish?.();
    },
  });
  active = tour;
  tour.drive(Math.min(from, steps.length - 1));
  return true;
};

export const stopTour = () => active?.destroy();
