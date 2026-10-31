import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { LogIn } from "lucide-react";
import StatusPage from "@/components/layout/StatusPage";

const Unauthorized = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const timeout = setTimeout(() => navigate("/"), 5000);
    return () => clearTimeout(timeout);
  }, [navigate]);

  return (
    <StatusPage
      icon={LogIn}
      code="401"
      title="Your session has ended"
      message="Log in again to continue. Taking you to the login page in 5 seconds."
      actionLabel="Go to login"
      onAction={() => navigate("/")}
    />
  );
};

export default Unauthorized;
