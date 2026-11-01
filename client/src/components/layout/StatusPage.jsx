import { Button } from "@/components/ui/button";

const StatusPage = ({ icon: Icon, code, title, message, actionLabel, onAction }) => (
  <div className="flex min-h-screen items-center justify-center px-5">
    <div className="max-w-sm text-center">
      <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-accent">
        <Icon className="size-5 text-accent-foreground" aria-hidden />
      </div>
      <p className="text-sm font-medium text-muted-foreground">{code}</p>
      <h1 className="mt-1 text-2xl font-semibold tracking-tight">{title}</h1>
      <p className="mt-2 text-sm text-muted-foreground">{message}</p>
      <Button className="mt-6" onClick={onAction}>
        {actionLabel}
      </Button>
    </div>
  </div>
);

export default StatusPage;
