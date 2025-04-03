import { useNavigate } from "react-router-dom";

const ErrorPage = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center h-screen text-center bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-white">
      <h1 className="text-4xl font-bold mb-4">Oops! Something went wrong</h1>
      <p className="text-lg mb-6">
        We couldn't process your request. Try again or return home.
      </p>
      <img
        src="https://source.unsplash.com/400x300/?error"
        alt="Error illustration"
        className="rounded-lg shadow-md mb-4"
      />
      <div>
        <button
          onClick={() => navigate("/")}
          className="px-6 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700"
        >
          Go Home
        </button>
        <button
          onClick={() => window.location.reload()}
          className="ml-4 px-6 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
        >
          Retry
        </button>
      </div>
    </div>
  );
};

export default ErrorPage;
