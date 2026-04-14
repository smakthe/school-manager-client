import { createBrowserRouter, Navigate } from "react-router-dom";
import App from "./App";
import { RootLayout } from "./components/layout/RootLayout";
import { PrivateRoute } from "./components/shared/PrivateRoute";
import { LoginPage } from "./pages/auth/LoginPage";
import { AdminDashboard } from "./pages/admin/AdminDashboard";
import { ProfilePage } from "./pages/admin/ProfilePage";
import { Explore } from "./pages/admin/Explore";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      {
        path: "",
        element: <Navigate to="/login" replace />,
      },
      {
        path: "login",
        element: <LoginPage />,
      },
      {
        path: "admin",
        element: <PrivateRoute role="admin" />,
        children: [
          {
            element: <RootLayout />,
            children: [
              { index: true, element: <AdminDashboard /> },
              { path: "profile", element: <ProfilePage /> },
              { path: "explore", element: <Explore /> },
            ],
          },
        ],
      },
      // Placeholders for other roles
      {
        path: "principal",
        element: <PrivateRoute role="principal" />,
        children: [
          {
            element: <RootLayout />,
            children: [
              { index: true, element: <div>Principal Dashboard</div> },
            ],
          },
        ],
      },
      {
        path: "teacher",
        element: <PrivateRoute role="teacher" />,
        children: [
          {
            element: <RootLayout />,
            children: [{ index: true, element: <div>Teacher Dashboard</div> }],
          },
        ],
      },
    ],
  },
]);
