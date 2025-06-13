import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

// Types
interface User {
  id: string;
  username: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  logoutAll: () => Promise<void>;
  updateUser: (updatedUser: User) => void;
  loading: boolean;
}

// Token Management Class
class TokenManager {
  private static readonly ACCESS_TOKEN_KEY = "movie_app_access_token";
  private static readonly REFRESH_TOKEN_KEY = "movie_app_refresh_token";
  private static readonly USER_KEY = "movie_app_user";

  private static memoryAccessToken: string | null = null;
  private static memoryRefreshToken: string | null = null;
  private static memoryUser: User | null = null;

  static setTokens(accessToken: string, refreshToken: string, user: User) {
    this.memoryAccessToken = accessToken;
    this.memoryRefreshToken = refreshToken;
    this.memoryUser = user;

    // Use sessionStorage instead of localStorage for better security
    sessionStorage.setItem(this.ACCESS_TOKEN_KEY, accessToken);
    sessionStorage.setItem(this.REFRESH_TOKEN_KEY, refreshToken);
    sessionStorage.setItem(this.USER_KEY, JSON.stringify(user));
  }

  static getAccessToken(): string | null {
    return (
      this.memoryAccessToken || sessionStorage.getItem(this.ACCESS_TOKEN_KEY)
    );
  }

  static getRefreshToken(): string | null {
    return (
      this.memoryRefreshToken || sessionStorage.getItem(this.REFRESH_TOKEN_KEY)
    );
  }

  static getUser(): User | null {
    if (this.memoryUser) return this.memoryUser;

    const userStr = sessionStorage.getItem(this.USER_KEY);
    return userStr ? JSON.parse(userStr) : null;
  }

  static clearTokens() {
    this.memoryAccessToken = null;
    this.memoryRefreshToken = null;
    this.memoryUser = null;

    sessionStorage.removeItem(this.ACCESS_TOKEN_KEY);
    sessionStorage.removeItem(this.REFRESH_TOKEN_KEY);
    sessionStorage.removeItem(this.USER_KEY);
  }

  static isAccessTokenExpired(): boolean {
    const token = this.getAccessToken();
    if (!token) return true;

    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      const currentTime = Date.now() / 1000;
      return payload.exp < currentTime + 60; // Refresh 1 minute before expiry
    } catch {
      return true;
    }
  }
}

// API Service
class AuthAPI {
  private static readonly BASE_URL = import.meta.env.VITE_AUTH_URL;

  static async refreshToken(): Promise<{
    accessToken: string;
    user: User;
  } | null> {
    const refreshToken = TokenManager.getRefreshToken();
    if (!refreshToken) return null;

    try {
      const response = await fetch(`${this.BASE_URL}/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) {
        TokenManager.clearTokens();
        return null;
      }

      const data = await response.json();
      return { accessToken: data.accessToken, user: data.user };
    } catch (error) {
      console.error("Token refresh failed:", error);
      TokenManager.clearTokens();
      return null;
    }
  }

  static async makeAuthenticatedRequest(
    url: string,
    options: RequestInit = {}
  ): Promise<Response> {
    let accessToken = TokenManager.getAccessToken();

    // Check if token needs refresh
    if (!accessToken || TokenManager.isAccessTokenExpired()) {
      const refreshResult = await this.refreshToken();
      if (!refreshResult) {
        throw new Error("Authentication failed");
      }

      TokenManager.setTokens(
        refreshResult.accessToken,
        TokenManager.getRefreshToken()!,
        refreshResult.user
      );
      accessToken = refreshResult.accessToken;
    }

    return fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${accessToken}`,
      },
    });
  }
}

// Context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider Component
export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Initialize auth state
  useEffect(() => {
    const initializeAuth = async () => {
      const storedUser = TokenManager.getUser();
      const accessToken = TokenManager.getAccessToken();

      if (storedUser && accessToken) {
        // Check if token is expired
        if (TokenManager.isAccessTokenExpired()) {
          // Try to refresh
          const refreshResult = await AuthAPI.refreshToken();
          if (refreshResult) {
            TokenManager.setTokens(
              refreshResult.accessToken,
              TokenManager.getRefreshToken()!,
              refreshResult.user
            );
            setUser(refreshResult.user);
          } else {
            TokenManager.clearTokens();
          }
        } else {
          setUser(storedUser);
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  // Auto-refresh token before expiry
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(async () => {
      if (TokenManager.isAccessTokenExpired()) {
        const refreshResult = await AuthAPI.refreshToken();
        if (refreshResult) {
          TokenManager.setTokens(
            refreshResult.accessToken,
            TokenManager.getRefreshToken()!,
            refreshResult.user
          );
          setUser(refreshResult.user);
        } else {
          setUser(null);
        }
      }
    }, 5 * 60 * 1000); // Check every 5 minutes

    return () => clearInterval(interval);
  }, [user]);

  // Cleanup on page unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      // Optional: Clear tokens on page close for extra security
      // TokenManager.clearTokens();
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);

  const login = async (email: string, password: string) => {
    const response = await fetch(`${import.meta.env.VITE_AUTH_URL}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Login failed");
    }

    // Backend now returns accessToken and refreshToken
    TokenManager.setTokens(data.accessToken, data.refreshToken, data.user);
    setUser(data.user);
  };

  const logout = async () => {
    const accessToken = TokenManager.getAccessToken();
    const refreshToken = TokenManager.getRefreshToken();

    if (accessToken) {
      try {
        await fetch(`${import.meta.env.VITE_AUTH_URL}/logout`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ refreshToken }),
        });
      } catch (error) {
        console.error("Logout request failed:", error);
      }
    }

    TokenManager.clearTokens();
    setUser(null);
  };

  const logoutAll = async () => {
    const accessToken = TokenManager.getAccessToken();

    if (accessToken) {
      try {
        await fetch(`${import.meta.env.VITE_AUTH_URL}/logout-all`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
        });
      } catch (error) {
        console.error("Logout all request failed:", error);
      }
    }

    TokenManager.clearTokens();
    setUser(null);
  };

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
    // Also update in sessionStorage
    if (TokenManager.getAccessToken() && TokenManager.getRefreshToken()) {
      TokenManager.setTokens(
        TokenManager.getAccessToken()!,
        TokenManager.getRefreshToken()!,
        updatedUser
      );
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        login,
        logout,
        logoutAll,
        updateUser,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Hook
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

// Export AuthAPI for use in other components
export { AuthAPI };
