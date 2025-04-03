import { BrowserRouter, Routes, Route } from "react-router-dom";
import { lazy, Suspense } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import Login from "./pages/Login";
import LoadingSpinner from "./components/LoadingSpinner";

const Register = lazy(() => import("./pages/Register"));
const Profile = lazy(() => import("./pages/Profile"));
const Settings = lazy(() => import("./pages/Settings"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Prediction = lazy(() => import("./pages/Prediction"));
const Budget = lazy(() => import("./pages/Budget"));
const History = lazy(() => import("./pages/History"));
const Dash = lazy(() => import("./pages/Dash"));
const ExpenseForm = lazy(() => import("./components/ExpenseForm"));

//Add id to the url

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Suspense fallback={<LoadingSpinner />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/dashboard" element={<Dash />} />
          <Route path="/register" element={<Register />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/expense-form" element={<ExpenseForm />} />
          <Route path="/prediction" element={<Prediction />} />
          <Route path="/budget" element={<Budget />} />
          <Route path="/history" element={<History />} />
        </Suspense>
        {/* predictions budget history */}
      </Routes>
    </BrowserRouter>
  );
}

export default App;
