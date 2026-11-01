import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { ArrowLeft, Bell, Warning } from "@phosphor-icons/react";
import axiosInstance from "@/axiosInstance";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/common";
import { Input, Label } from "@/components/ui/field";
import { cn } from "@/lib/utils";

const actions = [
  {
    value: "keep-active",
    title: "Keep budget as it is",
    description: "Stay on the current limit and keep tracking.",
  },
  {
    value: "increase-budget",
    title: "Increase limit by 15%",
    description: "Raises the limit to match your spending.",
  },
  {
    value: "set-custom-limit",
    title: "Set a new limit",
    description: "Choose the amount yourself.",
  },
  {
    value: "deactivate-budget",
    title: "Stop tracking this budget",
    description: "Turns the budget off.",
  },
];

const NotificationCenter = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedOption, setSelectedOption] = useState("");
  const [customAmount, setCustomAmount] = useState("");
  const [selected, setSelected] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["limit-notification"],
    queryFn: async () => {
      const res = await axiosInstance.get("/notifications");
      return res.data;
    },
    refetchInterval: 30000,
  });

  const notifications = data?.data || [];
  const unreadCount = notifications.length;

  const backToList = () => {
    setSelected(null);
    setSelectedOption("");
    setCustomAmount("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selected) return;
    setIsSubmitting(true);
    try {
      await axiosInstance.post(`/notifications/action/${selected.id}`, {
        action: selectedOption,
        newAmount: selectedOption === "set-custom-limit" ? customAmount : null,
      });
      await axiosInstance.patch(`/notifications/mark-as-read/${selected.id}`);
      backToList();
      setIsOpen(false);
      refetch();
      toast.success("Budget updated");
    } catch {
      toast.error("That didn't go through. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        aria-label={`Notifications, ${unreadCount} unread`}
        className="relative"
        onClick={() => setIsOpen(true)}
      >
        <Bell />
        {unreadCount > 0 && (
          <span className="absolute top-0.5 right-0.5 flex size-4 items-center justify-center rounded-full bg-destructive text-[10px] font-semibold text-destructive-foreground">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </Button>

      <Dialog
        open={isOpen}
        onOpenChange={(open) => {
          setIsOpen(open);
          if (!open) backToList();
        }}
      >
        <DialogContent className="max-h-[85vh] max-w-[calc(100vw-2rem)] overflow-y-auto sm:max-w-md">
          {selected ? (
            <>
              <DialogHeader>
                <button
                  type="button"
                  onClick={backToList}
                  className="mb-1 flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                >
                  <ArrowLeft className="size-3.5" /> All notifications
                </button>
                <DialogTitle>{selected.type === "info" ? "Budget almost used" : selected.type === "system" ? "Budget on pace to go over" : "Budget limit exceeded"}</DialogTitle>
                <DialogDescription>{selected.message}</DialogDescription>
              </DialogHeader>

              <form onSubmit={handleSubmit} className="space-y-2">
                <fieldset className="space-y-2">
                  <legend className="mb-2 text-sm font-medium">What would you like to do?</legend>
                  {actions.map(({ value, title, description }) => (
                    <label
                      key={value}
                      className={cn(
                        "flex cursor-pointer items-start gap-3 rounded-lg border border-border p-3 transition-colors hover:bg-muted/60",
                        selectedOption === value && "border-primary bg-accent/60"
                      )}
                    >
                      <input
                        type="radio"
                        name="budgetAction"
                        value={value}
                        checked={selectedOption === value}
                        onChange={(e) => setSelectedOption(e.target.value)}
                        className="mt-0.5 size-4"
                      />
                      <span>
                        <span className="block text-sm font-medium">{title}</span>
                        <span className="block text-xs text-muted-foreground">{description}</span>
                      </span>
                    </label>
                  ))}
                </fieldset>

                {selectedOption === "set-custom-limit" && (
                  <div className="space-y-1.5 pt-1">
                    <Label htmlFor="customAmount">New limit (KES)</Label>
                    <Input
                      id="customAmount"
                      type="number"
                      min="0"
                      step="100"
                      value={customAmount}
                      onChange={(e) => setCustomAmount(e.target.value)}
                    />
                  </div>
                )}

                <Button
                  type="submit"
                  className="mt-2 w-full"
                  loading={isSubmitting}
                  disabled={
                    !selectedOption || (selectedOption === "set-custom-limit" && !customAmount)
                  }
                >
                  Confirm
                </Button>
              </form>
            </>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle>Notifications</DialogTitle>
                <DialogDescription>
                  {unreadCount > 0
                    ? `${unreadCount} ${unreadCount === 1 ? "alert needs" : "alerts need"} your attention`
                    : "You're all caught up"}
                </DialogDescription>
              </DialogHeader>

              {isLoading ? (
                <p className="py-6 text-center text-sm text-muted-foreground">Loading...</p>
              ) : error ? (
                <div className="py-6 text-center">
                  <p className="mb-3 text-sm text-danger">Failed to load notifications</p>
                  <Button variant="secondary" size="sm" onClick={() => refetch()}>
                    Try again
                  </Button>
                </div>
              ) : notifications.length === 0 ? (
                <EmptyState icon={Bell} title="No notifications" className="py-6" />
              ) : (
                <ul className="space-y-2">
                  {notifications.map((notification) => (
                    <li key={notification.id}>
                      <button
                        type="button"
                        onClick={() => setSelected(notification)}
                        className="flex w-full items-start gap-3 rounded-lg border border-border p-3 text-left transition-colors hover:bg-muted/60"
                      >
                        <Warning className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden />
                        <span className="min-w-0">
                          <span className="line-clamp-3 block text-sm">{notification.message}</span>
                          <span className="mt-1 block text-xs text-muted-foreground">
                            {new Date(notification.created_at).toLocaleString("en-KE")}
                          </span>
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default NotificationCenter;
