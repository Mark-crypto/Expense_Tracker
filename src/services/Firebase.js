// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCsJwqvCrxV9LtAR4QxOrX6gUABsIiDxAo",
  authDomain: "expense-tracker-58245.firebaseapp.com",
  projectId: "expense-tracker-58245",
  storageBucket: "expense-tracker-58245.firebasestorage.app",
  messagingSenderId: "1090103333720",
  appId: "1:1090103333720:web:93846f70527b69aa200b2d",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
// const googleProvider = new GoogleAuthProvider();

export { app, auth };

// import { initializeApp } from "firebase/app";

// import { getFirestore } from "firebase/firestore";
// import { getAuth, GoogleAuthProvider } from "firebase/auth";
// const firebaseConfig = {
//   apiKey: "YOUR_FIREBASE_API_KEY",
//   authDomain: "your-app.firebaseapp.com",
//   projectId: "your-app-id",
//   storageBucket: "your-app.appspot.com",
//   messagingSenderId: "your-messaging-sender-id",
//   appId: "your-app-id",
// };

// // Initialize Firebase
// const app = initializeApp(firebaseConfig);
// const auth = getAuth(app);
// const db = getFirestore(app);
// const googleProvider = new GoogleAuthProvider();

// export { auth, googleProvider, db };
