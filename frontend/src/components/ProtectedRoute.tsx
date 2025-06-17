import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useTranslation } from "react-i18next";

const ProtectedRoute = () => {
  const { t } = useTranslation();
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen p-6 flex items-center justify-center">
        <div className="text-center text-gray-400">
          <div className="inline-block w-8 h-8 border-4 border-gray-400 border-t-transparent rounded-full animate-spin mb-2"></div>
          <p>{t("protectedRoutes.loading")}</p>
        </div>
      </div>
    );
  }

  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
};

export default ProtectedRoute;
