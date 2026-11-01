// Canvas charts can't read Tailwind classes, so resolve the theme's CSS variables.
export const chartTokens = () => {
  const style = getComputedStyle(document.documentElement);
  const read = (name) => style.getPropertyValue(name).trim();

  return {
    mark: read("--chart-mark"),
    grid: read("--chart-grid"),
    tick: read("--chart-tick"),
    tooltip: {
      backgroundColor: read("--popover"),
      titleColor: read("--muted-foreground"),
      bodyColor: read("--popover-foreground"),
      borderColor: read("--border"),
      borderWidth: 1,
      padding: 10,
      cornerRadius: 8,
      titleFont: { weight: "500", size: 11 },
      bodyFont: { weight: "600", size: 13 },
    },
  };
};

export const compactNumber = (value) =>
  Intl.NumberFormat("en-KE", { notation: "compact" }).format(value);
