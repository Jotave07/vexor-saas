import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";

const Dashboard = () => {
  const { isMasterAdmin, isCompanyAdmin, isCompanyStaff, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (isMasterAdmin) return <Navigate to="/admin" replace />;
  if (isCompanyAdmin || isCompanyStaff) return <Navigate to="/panel" replace />;
  return <Navigate to="/unauthorized" replace />;
};

export default Dashboard;
