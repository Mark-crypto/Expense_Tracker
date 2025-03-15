import { auth, googleProvider } from "../services/Firebase.js";
import { signInWithPopup, signOut } from "firebase/auth";

const Auth = () => {
  const signIn = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Login failed", error);
    }
  };

  const logout = () => signOut(auth);

  return (
    <div className="flex flex-col items-center">
      <button onClick={signIn} className="bg-blue-500 text-white p-2 rounded">
        Sign in with Google
      </button>
      <button onClick={logout} className="mt-2 text-red-500">
        Logout
      </button>
    </div>
  );
};

export default Auth;
