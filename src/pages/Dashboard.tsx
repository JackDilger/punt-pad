import { ActivityOverview } from "@/components/dashboard/ActivityOverview";
import { BetEntry } from "@/components/dashboard/BetEntry";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";

const Dashboard = () => {
  const { session } = useAuth();

  if (!session) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <AuthLayout>
      <div className="grid gap-6 lg:grid-cols-2">
        <div>
          <BetEntry />
        </div>
        <div>
          <ActivityOverview />
        </div>
      </div>
    </AuthLayout>
  );
};

export default Dashboard;
