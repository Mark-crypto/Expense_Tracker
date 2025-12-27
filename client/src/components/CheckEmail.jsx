import { Link } from "react-router-dom";

const CheckEmail = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-sm w-full text-center space-y-6">
        <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 rounded-full">
          <svg
            className="w-6 h-6 text-green-600"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Check your email
          </h2>
          <p className="text-green-600 font-medium mb-1">
            Reset link sent successfully
          </p>
          <p className="text-gray-600 text-sm">
            We've sent a password reset link to your email address.
          </p>
        </div>

        <Link
          to="/"
          className="inline-block text-blue-600 hover:text-blue-800 font-medium hover:underline"
        >
          ← Back to Login
        </Link>
      </div>
    </div>
  );
};

export default CheckEmail;
