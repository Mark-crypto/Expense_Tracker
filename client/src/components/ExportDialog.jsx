import { useState } from "react";
import { toast } from "react-toastify";
import { DownloadSimple } from "@phosphor-icons/react";
import axiosInstance from "@/axiosInstance";
import { chipStyles } from "@/components/accounts/dialogKit";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Field, Input } from "@/components/ui/field";
import { localToday } from "@/lib/format";

const pad = (value) => String(value).padStart(2, "0");
const ymd = (date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

const presets = (today) => {
  const [year, month] = today.split("-").map(Number);
  const first = (y, m) => ymd(new Date(y, m - 1, 1));
  const last = (y, m) => ymd(new Date(y, m, 0));
  return [
    ["month", "This month", [first(year, month), today]],
    ["last", "Last month", [first(year, month - 1), last(year, month - 1)]],
    ["three", "Last 3 months", [first(year, month - 2), today]],
    ["year", "This year", [`${year}-01-01`, today]],
    ["all", "Everything", [null, null]],
    ["custom", "Choose dates", null],
  ];
};

const download = async (endpoint, params, filename) => {
  const response = await axiosInstance.get(`${endpoint}?${params}`, { responseType: "blob" });
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

/*
 * Export with a chosen period. `months` asks for whole months (budgets); `filters` is the page's
 * other filters as a query string, offered as "only what's filtered now" when `filtersText` is set.
 */
const ExportDialog = ({ title, description, endpoint, filename, months = false, filters = "", filtersText, initialRange, onClose }) => {
  const today = localToday();
  const options = presets(today).filter(([id]) => !(months && id === "all"));
  const [choice, setChoice] = useState(initialRange ? "custom" : "month");
  const [from, setFrom] = useState(initialRange?.[0] ?? `${today.slice(0, 8)}01`);
  const [to, setTo] = useState(initialRange?.[1] ?? today);
  const [useFilters, setUseFilters] = useState(true);
  const [busy, setBusy] = useState(false);

  const range = choice === "custom" ? [from, to] : options.find(([id]) => id === choice)[2];
  const [start, end] = months && range[0] ? [`${range[0].slice(0, 7)}-01`, range[1]] : range;
  const invalid = choice === "custom" && (!from || !to || from > to);

  const run = async () => {
    const params = new URLSearchParams(useFilters ? filters : "");
    params.delete("from");
    params.delete("to");
    if (start) params.set("from", start);
    if (end) params.set("to", end);
    const span = start ? `${months ? start.slice(0, 7) : start}-to-${months ? end.slice(0, 7) : end}` : "everything";
    setBusy(true);
    try {
      await download(endpoint, params.toString(), `${filename}-${span}.xlsx`);
      onClose();
    } catch (error) {
      if (error.response?.status !== 423) toast.error("The export could not be made. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <p className="text-sm font-medium">Period</p>
            <div className="flex flex-wrap gap-1.5" role="group" aria-label="Period">
              {options.map(([id, label]) => (
                <button key={id} type="button" aria-pressed={choice === id} className={chipStyles(choice === id)} onClick={() => setChoice(id)}>
                  {label}
                </button>
              ))}
            </div>
          </div>
          {choice === "custom" && (
            <div className="grid grid-cols-2 gap-3">
              <Field label="From" htmlFor="exportFrom">
                <Input
                  id="exportFrom"
                  type={months ? "month" : "date"}
                  max={months ? today.slice(0, 7) : today}
                  value={months ? from.slice(0, 7) : from}
                  onChange={(e) => setFrom(months ? `${e.target.value}-01` : e.target.value)}
                />
              </Field>
              <Field label="To" htmlFor="exportTo" error={invalid && from && to ? "Pick an end after the start" : undefined}>
                <Input
                  id="exportTo"
                  type={months ? "month" : "date"}
                  max={months ? today.slice(0, 7) : today}
                  value={months ? to.slice(0, 7) : to}
                  onChange={(e) => setTo(months ? `${e.target.value}-28` : e.target.value)}
                />
              </Field>
            </div>
          )}
          {filtersText && (
            <label className="flex items-start gap-2.5 text-sm">
              <input type="checkbox" className="mt-0.5 size-4" checked={useFilters} onChange={(e) => setUseFilters(e.target.checked)} />
              <span>
                Only what&apos;s filtered now
                <span className="block text-xs text-muted-foreground">{filtersText}</span>
              </span>
            </label>
          )}
          <Button className="w-full" loading={busy} disabled={invalid} onClick={run}>
            {!busy && <DownloadSimple />} Download Excel file
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ExportDialog;
