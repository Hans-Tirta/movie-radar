import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const Logout = () => {
  const { logout, logoutAll } = useAuth();
  const navigate = useNavigate();
  const [showOptions, setShowOptions] = useState(true);

  const handleLogout = async () => {
    setShowOptions(false);
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      console.error("Logout failed:", error);
      navigate("/login");
    }
  };

  const handleLogoutAll = async () => {
    setShowOptions(false);
    try {
      await logoutAll();
      navigate("/login");
    } catch (error) {
      console.error("Logout all failed:", error);
      navigate("/login");
    }
  };

  const handleCancel = () => {
    navigate(-1); // Go back to previous page
  };

  // Auto-logout after 10 seconds if no action
  useEffect(() => {
    const timer = setTimeout(() => {
      if (showOptions) {
        handleLogout();
      }
    }, 10000);

    return () => clearTimeout(timer);
  }, [showOptions]);

  if (!showOptions) {
    return (
      <div className="flex items-center justify-center min-h-screen text-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white mx-auto mb-4"></div>
          <p>Logging out...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen text-white">
      <div className="w-full max-w-md p-8 bg-gray-800 rounded-lg shadow-lg">
        <h2 className="text-2xl font-semibold text-center mb-6">
          Logout Options
        </h2>

        <p className="text-gray-300 text-center mb-6">
          How would you like to logout?
        </p>

        <div className="space-y-4">
          <button
            onClick={handleLogout}
            className="w-full p-3 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600"
          >
            Logout from this device
          </button>

          <button
            onClick={handleLogoutAll}
            className="w-full p-3 bg-red-600 text-white font-semibold rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-600"
          >
            Logout from all devices
          </button>

          <button
            onClick={handleCancel}
            className="w-full p-3 bg-gray-600 text-white font-semibold rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-600"
          >
            Cancel
          </button>
        </div>

        <p className="text-xs text-gray-400 text-center mt-4">
          Auto-logout in 10 seconds if no selection
        </p>
      </div>
    </div>
  );
};

export default Logout;
