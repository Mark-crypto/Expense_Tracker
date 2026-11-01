import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { LogOut, Pencil, ShieldCheck, Trash2 } from "lucide-react";
import axiosInstance from "@/axiosInstance";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, ErrorState, PageHeader } from "@/components/ui/common";
import Loading from "@/components/Loading";
import ProfileForm from "@/components/ProfileForm";
import { useAuth } from "@/hooks/useAuth";
import { initials, titleCase } from "@/lib/format";

const Detail = ({ label, value }) => (
  <div>
    <dt className="text-xs text-muted-foreground">{label}</dt>
    <dd className="mt-0.5 text-sm break-words">{value || "Not set"}</dd>
  </div>
);

const Profile = () => {
  const { id } = useParams();
  const { isAdmin, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const { mutate: deleteAccount, isPending: isDeleting } = useMutation({
    mutationFn: async () => await axiosInstance.delete(`/profile/${parseInt(id)}`),
    onSuccess: () => logout(),
    onError: () => toast.error("Could not delete your account. Please try again."),
  });

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["profile", id],
    queryFn: async () => await axiosInstance.get(`/profile/${parseInt(id)}`),
  });

  if (isLoading) return <Loading />;
  if (error) return <ErrorState onRetry={refetch} />;

  const profile = data?.data?.data;

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title="Profile"
        actions={
          <Button variant="secondary" onClick={() => setOpen(true)}>
            <Pencil /> Edit profile
          </Button>
        }
      />

      <Card>
        <CardContent className="sm:p-6">
          <div className="flex items-center gap-4">
            <Avatar text={initials(profile?.name)} className="size-14 text-base" />
            <div className="min-w-0">
              <p className="truncate text-lg font-semibold">{titleCase(profile?.name)}</p>
              <p className="truncate text-sm text-muted-foreground">{profile?.email}</p>
            </div>
          </div>
          <dl className="mt-6 grid gap-5 border-t border-border pt-5 sm:grid-cols-2">
            <Detail label="Occupation" value={profile?.occupation} />
            <Detail label="Age" value={profile?.age} />
            <Detail label="Money goal" value={profile?.goal} />
          </dl>
        </CardContent>
      </Card>

      <div className="mt-4 flex flex-wrap gap-2 lg:hidden">
        {isAdmin && (
          <Link to="/admin-dashboard">
            <Button variant="secondary" tabIndex={-1}>
              <ShieldCheck /> Admin
            </Button>
          </Link>
        )}
        <Button variant="danger-ghost" onClick={logout}>
          <LogOut /> Log out
        </Button>
      </div>

      <Card className="mt-4">
        <CardContent className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium">Delete account</p>
            <p className="text-xs text-muted-foreground">
              Permanently removes your account and all your data.
            </p>
          </div>
          <Button variant="danger-ghost" onClick={() => setConfirmDelete(true)}>
            <Trash2 /> Delete account
          </Button>
        </CardContent>
      </Card>

      <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete your account?</DialogTitle>
            <DialogDescription>
              Your profile, expenses, budgets and alerts will be permanently deleted. This can't be
              undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setConfirmDelete(false)}>
              Cancel
            </Button>
            <Button variant="danger" loading={isDeleting} onClick={() => deleteAccount()}>
              Delete my account
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent aria-describedby={undefined} className="max-h-[90vh] max-w-[calc(100vw-2rem)] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit profile</DialogTitle>
          </DialogHeader>
          <ProfileForm profile={profile} onSaved={() => setOpen(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Profile;
