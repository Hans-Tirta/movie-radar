import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const Logout = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const logout = async () => {
      const token = localStorage.getItem("token");

      if (token) {
        await fetch(`${import.meta.env.VITE_AUTH_URL}/logout`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });
      }

      // Clear token from local storage
      localStorage.removeItem("token");

      // Redirect to login page
      navigate("/login");

      // Force a page reload
      window.location.reload();
    };

    logout();
  }, [navigate]);

  return null;
};

export default Logout;
