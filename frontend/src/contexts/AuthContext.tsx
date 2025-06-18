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

// Simplified Token Manager - Pure SessionStorage
class TokenManager {
  private static readonly ACCESS_TOKEN_KEY = "movie_app_access_token";
  private static readonly REFRESH_TOKEN_KEY = "movie_app_refresh_token";
  private static readonly USER_KEY = "movie_app_user";

  static setTokens(accessToken: string, refreshToken: string, user: User) {
    sessionStorage.setItem(this.ACCESS_TOKEN_KEY, accessToken);
    sessionStorage.setItem(this.REFRESH_TOKEN_KEY, refreshToken);
    sessionStorage.setItem(this.USER_KEY, JSON.stringify(user));
  }

  static getAccessToken(): string | null {
    return sessionStorage.getItem(this.ACCESS_TOKEN_KEY);
  }

  static getRefreshToken(): string | null {
    return sessionStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  static getUser(): User | null {
    const userStr = sessionStorage.getItem(this.USER_KEY);
    return userStr ? JSON.parse(userStr) : null;
  }

  static clearTokens() {
    sessionStorage.removeItem(this.ACCESS_TOKEN_KEY);
    sessionStorage.removeItem(this.REFRESH_TOKEN_KEY);
    sessionStorage.removeItem(this.USER_KEY);
  }

  static updateUser(user: User) {
    sessionStorage.setItem(this.USER_KEY, JSON.stringify(user));
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

// API Service with Race Condition Protection
class AuthAPI {
  private static readonly BASE_URL = import.meta.env.VITE_AUTH_URL;
  private static refreshPromise: Promise<{
    accessToken: string;
    user: User;
  } | null> | null = null;

  static async refreshToken(): Promise<{
    accessToken: string;
    user: User;
  } | null> {
    // Prevent multiple simultaneous refresh calls
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    const refreshToken = TokenManager.getRefreshToken();
    if (!refreshToken) return null;

    this.refreshPromise = this.performTokenRefresh(refreshToken);

    try {
      const result = await this.refreshPromise;
      return result;
    } finally {
      this.refreshPromise = null;
    }
  }

  private static async performTokenRefresh(refreshToken: string): Promise<{
    accessToken: string;
    user: User;
  } | null> {
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
        throw new Error("Authentication failed - please login again");
      }

      TokenManager.setTokens(
        refreshResult.accessToken,
        TokenManager.getRefreshToken()!,
        refreshResult.user
      );
      accessToken = refreshResult.accessToken;
    }

    const response = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${accessToken}`,
      },
    });

    // If we get 401, try to refresh once more
    if (response.status === 401) {
      const refreshResult = await this.refreshToken();
      if (!refreshResult) {
        throw new Error("Authentication failed - please login again");
      }

      TokenManager.setTokens(
        refreshResult.accessToken,
        TokenManager.getRefreshToken()!,
        refreshResult.user
      );

      // Retry the original request with new token
      return fetch(url, {
        ...options,
        headers: {
          ...options.headers,
          Authorization: `Bearer ${refreshResult.accessToken}`,
        },
      });
    }

    return response;
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
      try {
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
              setUser(null);
            }
          } else {
            setUser(storedUser);
          }
        }
      } catch (error) {
        console.error("Auth initialization failed:", error);
        TokenManager.clearTokens();
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // Auto-refresh token before expiry
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(async () => {
      try {
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
      } catch (error) {
        console.error("Auto-refresh failed:", error);
        setUser(null);
      }
    }, 5 * 60 * 1000); // Check every 5 minutes

    return () => clearInterval(interval);
  }, [user]);

  const login = async (email: string, password: string) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_AUTH_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Login failed");
      }

      TokenManager.setTokens(data.accessToken, data.refreshToken, data.user);
      setUser(data.user);
    } catch (error) {
      console.error("Login failed:", error);
      throw error;
    }
  };

  const logout = async () => {
    const accessToken = TokenManager.getAccessToken();
    const refreshToken = TokenManager.getRefreshToken();

    // Always clear local tokens first
    TokenManager.clearTokens();
    setUser(null);

    // Then notify backend (don't fail logout if this fails)
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
        console.error("Backend logout failed:", error);
        // Don't throw error - local logout already succeeded
      }
    }
  };

  const logoutAll = async () => {
    const accessToken = TokenManager.getAccessToken();

    // Always clear local tokens first
    TokenManager.clearTokens();
    setUser(null);

    // Then notify backend (don't fail logout if this fails)
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
        console.error("Backend logout-all failed:", error);
        // Don't throw error - local logout already succeeded
      }
    }
  };

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
    TokenManager.updateUser(updatedUser);
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
