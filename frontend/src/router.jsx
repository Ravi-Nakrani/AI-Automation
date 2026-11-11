import { createBrowserRouter, Navigate } from "react-router-dom";
import MainLayout from "./components/layout/MainLayout";
import AuthRoute from "./components/AuthRoute";
import Protected from "./components/Protected";
import Login from "./pages/Login";
import Home from "./pages/Home";
import CreateAgent from "./pages/CreateAgent";
import Agents from "./pages/Agents";
import NotFound from "./pages/NotFound";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <MainLayout />,
    children: [
      { index: true, element: <Navigate to="/home" replace /> },
      {
        element: <AuthRoute />,
        children: [
          {
            path: "login",
            element: <Login />,
          },
        ],
      },
      {
        element: <Protected />,
        children: [
          {
            path: "home",
            element: <Home />,
          },
          {
            path: "create-agent",
            element: <CreateAgent />,
          },
          {
            path: "agents",
            element: <Agents />,
          },
        ],
      },
      { path: "*", element: <NotFound /> },
    ],
  },
]);
