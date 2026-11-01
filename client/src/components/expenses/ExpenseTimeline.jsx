import { useEffect, useMemo, useRef, useState } from "react";
import { formatDate, formatKES, localToday } from "@/lib/format";

const HEIGHT = 92;
const AXIS = 18;

const buildDays = () => {
  const today = localToday();
  const cursor = new Date(`${today}T00:00`);
  cursor.setMonth(cursor.getMonth() - 6, 1);
  const days = [];
  while (cursor.toLocaleDateString("en-CA") <= today) {
    days.push(cursor.toLocaleDateString("en-CA"));
    cursor.setDate(cursor.getDate() + 1);
  }
  return days;
};

// Drag across the bars to filter the table to those dates.
const ExpenseTimeline = ({ rows, range, onRangeChange }) => {
  const box = useRef(null);
  const dragStart = useRef(null);
  const [width, setWidth] = useState(0);
  const [hover, setHover] = useState(null);
  const days = useMemo(buildDays, []);

  useEffect(() => {
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    observer.observe(box.current);
    return () => observer.disconnect();
  }, []);

  const totals = useMemo(() => {
    const byDay = new Map();
    rows.forEach((row) => byDay.set(row.date, (byDay.get(row.date) ?? 0) + Number(row.amount)));
    return byDay;
  }, [rows]);

  const highest = Math.max(...totals.values(), 1);
  const barWidth = width / days.length;
  const barHeight = (value) => Math.max(3, (HEIGHT - AXIS - 4) * Math.sqrt(value / highest));

  const dayAt = (e) => {
    const left = box.current.getBoundingClientRect().left;
    const index = Math.floor((e.clientX - left) / barWidth);
    return days[Math.max(0, Math.min(days.length - 1, index))];
  };

  const onPointerMove = (e) => {
    const date = dayAt(e);
    setHover({ date, left: e.clientX - box.current.getBoundingClientRect().left });
    if (dragStart.current) onRangeChange([dragStart.current, date].sort());
  };

  const onPointerUp = (e) => {
    if (dragStart.current === dayAt(e)) onRangeChange(null);
    dragStart.current = null;
  };

  return (
    <div className="min-w-0 select-none">
      <div className="mb-0.5 flex justify-between text-xs text-muted-foreground">
        <span className={range ? "font-medium text-primary" : undefined}>
          {range ? `${formatDate(range[0])} to ${formatDate(range[1])}` : "Last 6 months"}
        </span>
        <span>{range ? "Click the chart to clear" : "Drag across the chart to filter by date"}</span>
      </div>
      <div
        ref={box}
        role="img"
        aria-label="Spending by day. Drag to filter the table by date."
        className="relative cursor-crosshair touch-none"
        style={{ height: HEIGHT }}
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          dragStart.current = dayAt(e);
        }}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={() => setHover(null)}
      >
        <svg width={width} height={HEIGHT} className="block">
          {range && (
            <rect
              x={days.indexOf(range[0]) * barWidth}
              width={(days.indexOf(range[1]) - days.indexOf(range[0]) + 1) * barWidth}
              height={HEIGHT - AXIS + 2}
              rx="3"
              fill="var(--chart-mark)"
              opacity="0.08"
            />
          )}
          {days.map((date, index) => {
            const value = totals.get(date);
            const inRange = !range || (date >= range[0] && date <= range[1]);
            return (
              <g key={date}>
                {value && (
                  <rect
                    x={index * barWidth}
                    y={HEIGHT - AXIS - barHeight(value)}
                    width={Math.max(barWidth - 1, 1.5)}
                    height={barHeight(value)}
                    rx="1"
                    fill="var(--chart-mark)"
                    opacity={inRange ? 1 : 0.2}
                  />
                )}
                {date.endsWith("-01") && index * barWidth < width - 28 && (
                  <text x={index * barWidth} y={HEIGHT - 3} fontSize="11" fill="var(--chart-tick)">
                    {new Date(`${date}T00:00`).toLocaleString("en-KE", { month: "short" })}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
        {hover && (
          <span
            className="pointer-events-none absolute top-0 z-10 -translate-x-1/2 rounded-md bg-foreground px-2 py-1 text-xs whitespace-nowrap text-background tabular-nums"
            style={{ left: Math.max(60, Math.min(width - 60, hover.left)) }}
          >
            {formatDate(hover.date)} · {formatKES(totals.get(hover.date) ?? 0)}
          </span>
        )}
      </div>
    </div>
  );
};

export default ExpenseTimeline;
