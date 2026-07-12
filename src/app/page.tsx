import { Dashboard } from "@/components/dashboard/Dashboard";
import { DashboardProvider } from "@/components/dashboard/DashboardProvider";

export default function Home() {
  return (
    <DashboardProvider>
      <Dashboard />
    </DashboardProvider>
  );
}
