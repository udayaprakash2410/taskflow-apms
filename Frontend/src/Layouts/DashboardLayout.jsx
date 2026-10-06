import { Outlet } from "react-router-dom";
import Sidebar from "../Components/Layout/Sidebar";
import Navbar from "../Components/Layout/Navbar";
export default function DashboardLayout() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar />
      <div className="min-h-screen lg:ml-72">
        <Navbar />
        <main className="p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
