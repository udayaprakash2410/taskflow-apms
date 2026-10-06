import {
  BrowserRouter,
  Navigate,
  Outlet,
  Route,
  Routes,
  useParams,
} from "react-router-dom";

import {
  AuthProvider,
  useAuth,
} from "./Context/WorkspaceContext";

import DashboardLayout from "./Layouts/DashboardLayout";

import Dashboard from "./Pages/Dashboard";
import Projects from "./Pages/Projects";
import ProjectDetails from "./Pages/ProjectDetails";
import MyTasks from "./Pages/MyTasks";
import Calendar from "./Pages/Calendar";
import Analytics from "./Pages/Analytics";
import Notifications from "./Pages/Notifications";
import Announcements from "./Pages/Announcements";
import Settings from "./Pages/Settings";
import People from "./Pages/People";
import Leave from "./Pages/Leave";
import Login from "./Pages/Login";
import Activity from "./Pages/Activity";

function HomeRedirect() {
  const { currentUser } = useAuth();

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  return (
    <Navigate
      to={`/${currentUser.role}`}
      replace
    />
  );
}

function ProtectedPanel() {
  const { role: routeRole } = useParams();
  const { currentUser } = useAuth();

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (routeRole !== currentUser.role) {
    return (
      <Navigate
        to={`/${currentUser.role}`}
        replace
      />
    );
  }

  return <DashboardLayout />;
}

function RoleAccess({ allowed }) {
  const { role } = useAuth();

  if (!allowed.includes(role)) {
    return (
      <Navigate
        to={`/${role}`}
        replace
      />
    );
  }

  return <Outlet />;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<HomeRedirect />} />
          <Route path="/login" element={<Login />} />

          <Route path="/:role" element={<ProtectedPanel />}>
            <Route index element={<Dashboard />} />

            <Route
              element={
                <RoleAccess
                  allowed={[
                    "manager",
                    "employee",
                  ]}
                />
              }
            >
              <Route path="projects" element={<Projects />} />
              <Route
                path="projects/:projectId"
                element={<ProjectDetails />}
              />
              <Route path="tasks" element={<MyTasks />} />
              <Route path="calendar" element={<Calendar />} />
            </Route>

            <Route
              element={
                <RoleAccess
                  allowed={[
                    "manager",
                    "hr",
                  ]}
                />
              }
            >
              <Route path="people" element={<People />} />
            </Route>

            <Route
              element={
                <RoleAccess
                  allowed={[
                    "employee",
                    "hr",
                    "manager",
                  ]}
                />
              }
            >
              <Route path="leave" element={<Leave />} />
            </Route>

            <Route
              element={
                <RoleAccess
                  allowed={[
                    "manager",
                    "employee",
                  ]}
                />
              }
            >
              <Route path="activity" element={<Activity />} />
            </Route>

            {/* ANNOUNCEMENTS - ALL ROLES */}
            <Route
              element={
                <RoleAccess
                  allowed={[
                    "manager",
                    "hr",
                    "employee",
                  ]}
                />
              }
            >
              <Route
                path="announcements"
                element={<Announcements />}
              />
            </Route>

            <Route path="analytics" element={<Analytics />} />
            <Route path="notifications" element={<Notifications />} />
            <Route path="settings" element={<Settings />} />
          </Route>

          <Route path="*" element={<HomeRedirect />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
