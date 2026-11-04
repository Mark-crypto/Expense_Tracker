import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import axiosInstance from "@/axiosInstance";
import { refreshMoneyData } from "@/lib/refresh";
import { cn } from "@/lib/utils";

export const chipStyles = (active) =>
  cn(
    "h-8 rounded-full border border-border px-3 text-xs font-medium transition-colors hover:bg-muted",
    active && "border-primary bg-accent text-accent-foreground"
  );

export const useSave = (onClose) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ method = "post", path, body }) => await axiosInstance[method](path, body),
    onSuccess: ({ data }) => {
      toast.success(data.message);
      refreshMoneyData(queryClient);
      onClose();
    },
    onError: (error) => toast.error(error.response?.data?.message || "This could not be saved."),
  });
};
