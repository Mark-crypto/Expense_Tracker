import { BrowserRouter, Routes, Route } from "react-router-dom";
import { lazy, Suspense } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import Login from "./pages/Login";
import Loading from "./components/Loading";
import SilentRefresh from "./SilentRefresh";
import Unauthorized from "./Pages/Unauthorized";
import ErrorPage from "./components/404Error";
import ProfileForm from "./components/ProfileForm";

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
    <>
      <Suspense fallback={<Loading />}>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/dash" element={<Dash />} />
            <Route path="/register" element={<Register />} />
            <Route path="/new/profile/:id" element={<Profile />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/expense-form" element={<ExpenseForm />} />
            <Route path="/predictions" element={<Prediction />} />
            <Route path="/budget" element={<Budget />} />
            <Route path="/history" element={<History />} />
            <Route path="/401" element={<Unauthorized />} />
            <Route path="/profile/:id/edit-form" element={<ProfileForm />} />
            <Route path="/*" element={<ErrorPage />} />
          </Routes>
        </BrowserRouter>
      </Suspense>
      <SilentRefresh />
    </>
  );
}

export default App;
