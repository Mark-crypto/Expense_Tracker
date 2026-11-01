import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Scan, UploadSimple } from "@phosphor-icons/react";
import axiosInstance from "@/axiosInstance";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState, ErrorState, PageHeader } from "@/components/ui/common";
import Loading from "@/components/Loading";
import MoneyXray from "@/components/MoneyXray";

const Insights = () => {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["xray"],
    queryFn: async () => await axiosInstance.get("/insights/xray"),
  });

  if (isLoading) return <Loading />;
  if (error) return <ErrorState onRetry={refetch} />;

  const xray = data?.data?.xray;
  const importButton = (
    <Link to="/import">
      <Button variant={xray ? "secondary" : "primary"} tabIndex={-1}>
        <UploadSimple /> Import M-Pesa
      </Button>
    </Link>
  );

  return (
    <>
      <PageHeader
        title="Money X-ray"
        description="What your M-Pesa statements show."
        actions={xray && importButton}
      />
      {xray ? (
        <MoneyXray xray={xray} />
      ) : (
        <Card>
          <EmptyState
            icon={Scan}
            title="No statements imported yet"
            description="Import an M-Pesa statement to see your fees, Fuliza repayments and biggest recipients."
            action={importButton}
          />
        </Card>
      )}
    </>
  );
};

export default Insights;
