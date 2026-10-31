import { useNavigate } from "react-router-dom";
import { Compass } from "lucide-react";
import StatusPage from "@/components/layout/StatusPage";

const NotFound = () => {
  const navigate = useNavigate();
  return (
    <StatusPage
      icon={Compass}
      code="404"
      title="Page not found"
      message="This page doesn't exist or has been moved."
      actionLabel="Back to home"
      onAction={() => navigate("/")}
    />
  );
};

export default NotFound;
