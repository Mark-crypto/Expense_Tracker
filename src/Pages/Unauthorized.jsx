import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const Unauthorized = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const timeout = setTimeout(() => {
      navigate("/");
    }, 5000);

    return () => clearTimeout(timeout);
  }, [navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white shadow-xl rounded-2xl p-10 text-center max-w-md">
        <h1 className="text-6xl font-bold text-red-500">401</h1>
        <h2 className="text-xl font-semibold mt-4 text-gray-800">
          Unauthorized Access
        </h2>
        <p className="mt-2 text-gray-600">
          You are not authorized to view this page.
        </p>
        <p className="mt-1 text-gray-500 text-sm">
          Redirecting to login page in 5 seconds...
        </p>
        <button
          onClick={() => navigate("/login")}
          className="mt-6 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg shadow-md transition duration-300"
        >
          Go to Login
        </button>
      </div>
    </div>
  );
};
export default Unauthorized;
