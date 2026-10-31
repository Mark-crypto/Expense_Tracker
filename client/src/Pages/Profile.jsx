import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { LogOut, Pencil, ShieldCheck } from "lucide-react";
import axiosInstance from "@/axiosInstance";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
