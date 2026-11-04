import { BrowserRouter, Routes, Route } from "react-router-dom";
import { lazy, Suspense } from "react";
import { ToastContainer } from "react-toastify";
import Login from "./Pages/Login";
import Loading from "./components/Loading";
import SessionGuard from "./SessionGuard";
import ProtectedRoute from "./components/ProtectedRoute";
import AppLayout from "./components/layout/AppLayout";

const Register = lazy(() => import("./Pages/Register"));
const Profile = lazy(() => import("./Pages/Profile"));
const Dashboard = lazy(() => import("./Pages/Dashboard"));
const Prediction = lazy(() => import("./Pages/Prediction"));
const Insights = lazy(() => import("./Pages/Insights"));
const Budget = lazy(() => import("./Pages/Budget"));
const History = lazy(() => import("./Pages/History"));
const Import = lazy(() => import("./Pages/Import"));
const Bills = lazy(() => import("./Pages/Bills"));
const Accounts = lazy(() => import("./Pages/Accounts"));
const Help = lazy(() => import("./Pages/Help"));
const Security = lazy(() => import("./Pages/Security"));
const Privacy = lazy(() => import("./Pages/Privacy"));
const AddExpense = lazy(() => import("./Pages/AddExpense"));
const AddRedirect = lazy(() => import("./Pages/AddRedirect"));
const AdminDashboard = lazy(() => import("./Pages/AdminDashboard"));
const Unauthorized = lazy(() => import("./Pages/Unauthorized"));
const NotAdmin = lazy(() => import("./Pages/NotAdmin"));
const NotFound = lazy(() => import("./Pages/NotFound"));
const ForgotPassword = lazy(() => import("./Pages/ForgotPassword"));
const CheckEmail = lazy(() => import("./Pages/CheckEmail"));
const ResetPassword = lazy(() => import("./Pages/ResetPassword"));

function App() {
  return (
    <>
      <BrowserRouter>
        <Suspense fallback={<Loading fullScreen />}>
          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/check-email" element={<CheckEmail />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/401" element={<Unauthorized />} />
            <Route path="/403" element={<NotAdmin />} />

            <Route
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/expense-form" element={<AddRedirect />} />
              <Route path="/expenses/new" element={<AddExpense />} />
              <Route path="/import" element={<Import />} />
              <Route path="/bills" element={<Bills />} />
              <Route path="/bills/new" element={<Bills />} />
              <Route path="/bills/:id/edit" element={<Bills />} />
              <Route path="/accounts" element={<Accounts />} />
              <Route path="/help" element={<Help />} />
              <Route path="/security" element={<Security />} />
              <Route path="/history" element={<History />} />
              <Route path="/history/:id" element={<History />} />
              <Route path="/budget" element={<Budget />} />
              <Route path="/budget/plan" element={<Budget />} />
              <Route path="/budget/new" element={<Budget />} />
              <Route path="/budget/:id" element={<Budget />} />
              <Route path="/budget/:id/edit" element={<Budget />} />
              <Route path="/predictions" element={<Prediction />} />
              <Route path="/insights" element={<Insights />} />
              <Route path="/new/profile/:id" element={<Profile />} />
              <Route path="/admin-dashboard" element={<AdminDashboard />} />
            </Route>

            <Route path="/*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
      <ToastContainer position="top-right" autoClose={4000} theme="light" />
      <SessionGuard />
    </>
  );
}

export default App;
