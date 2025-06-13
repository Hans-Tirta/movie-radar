import { AuthAPI } from "../contexts/AuthContext";

const AUTH_BASE_URL = "http://localhost:5001/api";

interface ProfileResponse {
  message: string;
  user: {
    id: string;
    username: string;
    email: string;
    createdAt: string;
  };
}

interface UpdateResponse {
  message: string;
  user: {
    id: string;
    username: string;
    email: string;
    createdAt: string;
  };
}

interface MessageResponse {
  message: string;
}

// Get user profile
export const getProfile = async (): Promise<ProfileResponse> => {
  try {
    const response = await AuthAPI.makeAuthenticatedRequest(
      `${AUTH_BASE_URL}/profile`
    );

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error("Unauthorized - please log in again");
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching profile:", error);
    throw error;
  }
};

// Update username
export const updateUsername = async (
  username: string
): Promise<UpdateResponse> => {
  try {
    const response = await AuthAPI.makeAuthenticatedRequest(
      `${AUTH_BASE_URL}/profile/username`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to update username");
    }

    return await response.json();
  } catch (error) {
    console.error("Error updating username:", error);
    throw error;
  }
};

// Update password
export const updatePassword = async (
  currentPassword: string,
  newPassword: string
): Promise<MessageResponse> => {
  try {
    const response = await AuthAPI.makeAuthenticatedRequest(
      `${AUTH_BASE_URL}/profile/password`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to update password");
    }

    return await response.json();
  } catch (error) {
    console.error("Error updating password:", error);
    throw error;
  }
};

// Delete profile
export const deleteProfile = async (): Promise<MessageResponse> => {
  try {
    const response = await AuthAPI.makeAuthenticatedRequest(
      `${AUTH_BASE_URL}/profile`,
      {
        method: "DELETE",
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to delete profile");
    }

    return await response.json();
  } catch (error) {
    console.error("Error deleting profile:", error);
    throw error;
  }
};
