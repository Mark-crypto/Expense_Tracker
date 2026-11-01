import { useEffect, useRef } from "react";
import { animate, useReducedMotion } from "framer-motion";
import { formatKES } from "@/lib/format";

const AnimatedAmount = ({ value, className }) => {
  const element = useRef(null);
  const shown = useRef(null);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const node = element.current;
    const from = shown.current ?? value * 0.85;
    if (reduceMotion) {
      node.textContent = formatKES(value);
      return;
    }
    const controls = animate(from, value, {
      duration: 0.6,
      ease: "easeOut",
      onUpdate: (latest) => {
        shown.current = latest;
        node.textContent = formatKES(latest);
      },
    });
    return () => controls.stop();
  }, [value, reduceMotion]);

  return (
    <span ref={element} className={className}>
      {formatKES(value)}
    </span>
  );
};

export default AnimatedAmount;
