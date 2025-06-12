const AUTH_BASE_URL = "http://localhost:5001/api"; // Your auth service URL

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

// Helper function to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  if (!token) {
    throw new Error("No authentication token found");
  }

  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
};

// Get user profile
export const getProfile = async (): Promise<ProfileResponse> => {
  try {
    const response = await fetch(`${AUTH_BASE_URL}/profile`, {
      method: "GET",
      headers: getAuthHeaders(),
    });

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
    const response = await fetch(`${AUTH_BASE_URL}/profile/username`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify({ username }),
    });

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
    const response = await fetch(`${AUTH_BASE_URL}/profile/password`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify({ currentPassword, newPassword }),
    });

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
    const response = await fetch(`${AUTH_BASE_URL}/profile`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });

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
