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
        src="https://img.freepik.com/free-vector/404-error-purple-background_24908-77785.jpg?ga=GA1.1.1216656388.1736710841&semt=ais_hybrid&w=740"
        alt="Error illustration"
        className="rounded-lg shadow-md mb-4 w-[300px] h-[300px]"
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
