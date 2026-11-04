import { useEffect, useRef, useState } from "react";
import { formatKES } from "@/lib/format";
import { groupColor, groupLabel, sourceLabel } from "@/lib/xray";

const BAR = 12;
const GAP = 8;
const MIN_SLOT = 20;
const BODY = 320;
const LABEL_SPACE = 200;
const LABEL_CHARS = 17;

const short = (text) => (text.length > LABEL_CHARS ? `${text.slice(0, LABEL_CHARS - 1).trimEnd()}…` : text);

const ribbon = (x0, y0, x1, y1, h) => {
  const c = (x0 + x1) / 2;
  return `M${x0},${y0}C${c},${y0} ${c},${y1} ${x1},${y1}L${x1},${y1 + h}C${c},${y1 + h} ${c},${y0 + h} ${x0},${y0 + h}Z`;
};

// Money in on the left, through M-Pesa, out to each group on the right.
const layout = (xray, width) => {
  const inputs = xray.sources.map(({ key, total }) => ({ key, label: sourceLabel(key), total }));
  const outputs = xray.map.map(({ key, total }) => ({ key, label: groupLabel(key), total, fill: groupColor(key) }));
  if (xray.kept > 0) outputs.push({ key: "left", label: groupLabel("left"), total: xray.kept, fill: groupColor("left") });
  if (xray.kept < 0) inputs.push({ key: "balance", label: groupLabel("balance"), total: -xray.kept });

  const through = Math.max(xray.moneyIn, xray.moneyOut, 1);
  const scale = BODY / through;
  const leftX = 132;
  const midX = Math.round(width * 0.42);
  const rightX = width - LABEL_SPACE;
  const slots = outputs.map((row) => Math.max(row.total * scale, MIN_SLOT));
  const height = Math.max(slots.reduce((sum, slot) => sum + slot + GAP, 0), inputs.length * 44, BODY) + 24;
  const midTop = (height - through * scale) / 2;

  let inY = midTop - ((inputs.length - 1) * 12) / 2;
  let midIn = midTop;
  const left = inputs.map((row) => {
    const h = row.total * scale;
    const node = { ...row, y: inY, h, path: ribbon(leftX + BAR, inY, midX, midIn, h) };
    inY += h + 12;
    midIn += h;
    return node;
  });

  let slotY = 12;
  let midOut = midTop;
  const right = outputs.map((row, index) => {
    const h = row.total * scale;
    const y = slotY + (slots[index] - h) / 2;
    const node = { ...row, y, h, labelY: slotY + slots[index] / 2, path: ribbon(midX + BAR, midOut, rightX, y, h) };
    slotY += slots[index] + GAP;
    midOut += h;
    return node;
  });

  return { left, right, leftX, midX, rightX, midTop, midH: through * scale, height, width };
};

const MoneyMap = ({ xray, selected, onSelect }) => {
  const box = useRef(null);
  const [width, setWidth] = useState(0);
  const [hover, setHover] = useState(null);

  useEffect(() => {
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    observer.observe(box.current);
    return () => observer.disconnect();
  }, []);

  const positive = [...xray.map.map((row) => ({ ...row, fill: groupColor(row.key) })), ...(xray.kept > 0 ? [{ key: "left", total: xray.kept, fill: groupColor("left") }] : [])];
  const map = width >= 640 ? layout(xray, width) : null;
  const pickable = (key) => !["left", "rest"].includes(key);
  const shareOf = (total) => Math.round((total / Math.max(xray.moneyOut, 1)) * 100);

  return (
    <div ref={box} className="relative mt-3">
      {map ? (
        <svg
          width={map.width}
          height={map.height}
          viewBox={`0 0 ${map.width} ${map.height}`}
          role="img"
          aria-label={`${formatKES(xray.moneyIn)} came in and ${formatKES(xray.moneyOut)} went out. The list below has every amount.`}
          className="block"
          onMouseLeave={() => setHover(null)}
        >
          {map.left.map((node) => (
            <g key={`in-${node.key}`}>
              <path d={node.path} fill="var(--primary)" opacity={0.18} />
              <rect x={map.leftX} y={node.y} width={BAR} height={Math.max(node.h, 2)} rx={3} fill="var(--primary)" />
              <text x={map.leftX - 8} y={node.y + node.h / 2 - 2} textAnchor="end" className="fill-foreground text-xs">
                {node.label}
              </text>
              <text x={map.leftX - 8} y={node.y + node.h / 2 + 12} textAnchor="end" className="fill-foreground text-xs font-semibold tabular-nums">
                {formatKES(node.total)}
              </text>
            </g>
          ))}

          <rect x={map.midX} y={map.midTop} width={BAR} height={map.midH} rx={3} fill="var(--primary)" />
          <text x={map.midX + BAR / 2} y={map.midTop - 8} textAnchor="middle" className="fill-muted-foreground text-[11px]">
            M-Pesa
          </text>

          {map.right.map((node) => {
            const active = hover?.key === node.key || selected === node.key;
            const events = pickable(node.key)
              ? {
                  onMouseMove: (e) => {
                    const bounds = box.current.getBoundingClientRect();
                    setHover({ key: node.key, label: node.label, total: node.total, x: e.clientX - bounds.left, y: e.clientY - bounds.top });
                  },
                  onClick: () => onSelect(node.key),
                  style: { cursor: "pointer" },
                }
              : {};
            return (
              <g key={`out-${node.key}`} {...events}>
                <path d={node.path} fill={node.fill} opacity={active ? 0.6 : 0.28} className="transition-opacity" />
                <rect x={map.rightX} y={node.y} width={BAR} height={Math.max(node.h, 2)} rx={3} fill={node.fill} />
                <text x={map.rightX + BAR + 8} y={node.labelY + 4} className={`fill-foreground text-xs ${selected === node.key ? "font-semibold" : ""}`}>
                  <title>{node.label}</title>
                  {short(node.label)}
                </text>
                <text x={map.width} y={node.labelY + 4} textAnchor="end" className="fill-foreground text-xs font-semibold tabular-nums">
                  {formatKES(node.total)}
                </text>
              </g>
            );
          })}
        </svg>
      ) : (
        <div>
          <div className="flex h-3.5 gap-0.5 overflow-hidden rounded-full" aria-hidden>
            {positive.map((row) => (
              <span key={row.key} style={{ flex: row.total, background: row.fill }} />
            ))}
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Each colour is a share of the money that moved. The list below has every amount.
          </p>
        </div>
      )}

      {hover && (
        <div
          className="pointer-events-none absolute z-10 rounded-lg border border-border bg-card px-2.5 py-1.5 text-xs shadow-lg"
          style={{ left: Math.min(hover.x + 12, width - 200), top: hover.y + 12 }}
        >
          <p className="font-semibold">{hover.label}</p>
          <p className="text-muted-foreground tabular-nums">
            {formatKES(hover.total)}, {shareOf(hover.total)}% of money out
          </p>
        </div>
      )}
    </div>
  );
};

export default MoneyMap;
