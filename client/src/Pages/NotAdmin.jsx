import { useNavigate } from "react-router-dom";
import { Lock } from "@phosphor-icons/react";
import StatusPage from "@/components/layout/StatusPage";

const NotAdmin = () => {
  const navigate = useNavigate();
  return (
    <StatusPage
      icon={Lock}
      code="403"
      title="You don't have access"
      message="This area is for administrators. Contact an administrator if you think this is a mistake."
      actionLabel="Go to dashboard"
      onAction={() => navigate("/dashboard")}
    />
  );
};

export default NotAdmin;
