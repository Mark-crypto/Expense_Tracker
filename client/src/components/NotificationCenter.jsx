import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Bell, Warning } from "@phosphor-icons/react";
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

const destination = ({ type, budget_id: budgetId }) => {
  if (type === "bill") return "/bills";
  if (type === "goal") return "/accounts#goals";
  return budgetId ? `/budget/${budgetId}` : null;
};

const NotificationCenter = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

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

  const openNotification = async (notification) => {
    const target = destination(notification);
    setIsOpen(false);
    if (target) navigate(target);
    await axiosInstance.patch(`/notifications/mark-as-read/${notification.id}`);
    refetch();
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

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-h-[85vh] max-w-[calc(100vw-2rem)] overflow-y-auto sm:max-w-md">
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
                    onClick={() => openNotification(notification)}
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
        </DialogContent>
      </Dialog>
    </>
  );
};

export default NotificationCenter;
