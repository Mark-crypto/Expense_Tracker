import { BrowserRouter, Routes, Route } from "react-router-dom";
import Register from "./pages/Register";
import Login from "./pages/Login";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import Dashboard from "./pages/Dashboard";
import ExpenseForm from "./components/ExpenseForm";
import Budget from "./components/Budget";
import Prediction from "./components/Prediction";
import "bootstrap/dist/css/bootstrap.min.css";
import History from "./components/History";
import Dash from "./pages/Dash";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/dashboard" element={<Dash />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/expense-form" element={<ExpenseForm />} />
        <Route path="/predictions" element={<Prediction />} />
        <Route path="/budget" element={<Budget />} />
        <Route path="/history" element={<History />} />

        {/* predictions budget history */}
      </Routes>
    </BrowserRouter>
  );
}

export default App;
