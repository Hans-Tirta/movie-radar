import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useTranslation } from "react-i18next";

const Logout = () => {
  const { t } = useTranslation();
  const { logout, logoutAll } = useAuth();
  const navigate = useNavigate();
  const [showOptions, setShowOptions] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogout = async () => {
    setShowOptions(false);
    setIsLoggingOut(true);
    setError(null);

    try {
      await logout();
      setTimeout(() => {
        navigate("/login", { replace: true });
      }, 500);
    } catch (error) {
      console.error("Logout failed:", error);
      setError(t("logout.localLogoutComplete"));
      setTimeout(() => {
        navigate("/login", { replace: true });
      }, 1500);
    }
  };

  const handleLogoutAll = async () => {
    setShowOptions(false);
    setIsLoggingOut(true);
    setError(null);

    try {
      await logoutAll();
      setTimeout(() => {
        navigate("/login", { replace: true });
      }, 500);
    } catch (error) {
      console.error("Logout all failed:", error);
      setError(t("logout.localLogoutComplete"));
      setTimeout(() => {
        navigate("/login", { replace: true });
      }, 1500);
    }
  };

  const handleCancel = () => {
    if (!isLoggingOut) {
      navigate(-1); // Go back to previous page
    }
  };

  // Auto-logout after 10 seconds if no action
  useEffect(() => {
    if (!showOptions) return;

    const timer = setTimeout(() => {
      handleLogout();
    }, 10000);

    return () => clearTimeout(timer);
  }, [showOptions]);

  if (isLoggingOut) {
    return (
      <div className="min-h-screen p-6 flex items-center justify-center bg-gray-900">
        <div className="text-center text-gray-400 bg-gray-800 p-8 rounded-lg shadow-lg">
          <div className="inline-block w-8 h-8 border-4 border-gray-400 border-t-transparent rounded-full animate-spin mb-4"></div>
          {error ? (
            <div>
              <p className="text-yellow-400 mb-2">{error}</p>
              <p className="text-sm text-gray-500">{t("logout.redirecting")}</p>
            </div>
          ) : (
            <p>{t("logout.loggingOut")}</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">
      <div className="w-full max-w-md p-8 bg-gray-800 rounded-lg shadow-lg">
        <h2 className="text-2xl font-semibold text-center mb-6">
          {t("logout.title")}
        </h2>

        <p className="text-gray-300 text-center mb-6">
          {t("logout.description")}
        </p>

        <div className="space-y-4">
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="w-full p-3 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {t("logout.thisDevice")}
          </button>

          <button
            onClick={handleLogoutAll}
            disabled={isLoggingOut}
            className="w-full p-3 bg-red-600 text-white font-semibold rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {t("logout.allDevices")}
          </button>

          <button
            onClick={handleCancel}
            disabled={isLoggingOut}
            className="w-full p-3 bg-gray-600 text-white font-semibold rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {t("logout.cancel")}
          </button>
        </div>

        <p className="text-xs text-gray-400 text-center mt-4">
          {t("logout.autoLogout")}
        </p>
      </div>
    </div>
  );
};

export default Logout;
