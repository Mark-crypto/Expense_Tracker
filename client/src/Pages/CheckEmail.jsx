import { useNavigate } from "react-router-dom";
import { MailCheck } from "lucide-react";
import StatusPage from "@/components/layout/StatusPage";

const CheckEmail = () => {
  const navigate = useNavigate();
  return (
    <StatusPage
      icon={MailCheck}
      code="Reset link sent"
      title="Check your email"
      message="We've sent a password reset link to your email address. If it isn't there, check your spam folder."
      actionLabel="Back to login"
      onAction={() => navigate("/")}
    />
  );
};

export default CheckEmail;
