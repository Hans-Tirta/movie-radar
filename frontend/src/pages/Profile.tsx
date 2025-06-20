import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  getProfile,
  updateUsername,
  updatePassword,
  deleteProfile,
} from "../services/profileApi";
import { User, Lock, Trash2, Edit, Eye, EyeOff } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useTranslation } from "react-i18next";

interface UserProfile {
  id: string;
  username: string;
  email: string;
  createdAt: string;
}

function Profile() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Edit states
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [isEditingPassword, setIsEditingPassword] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Form states
  const [newUsername, setNewUsername] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  // Loading states for individual actions
  const [usernameLoading, setUsernameLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const {
    isAuthenticated,
    loading: authLoading,
    logout,
    updateUser,
    user,
  } = useAuth();

  useEffect(() => {
    // Wait for auth loading to complete
    if (authLoading) return;

    // Check authentication status from context
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    fetchProfile();
  }, [navigate, isAuthenticated, authLoading]);

  const fetchProfile = async () => {
    setLoading(true);
    setError("");

    try {
      const profileData = await getProfile();
      setProfile(profileData.user);
      setNewUsername(profileData.user.username);
    } catch (err) {
      console.error("Error fetching profile:", err);
      setError(t("profile.failedToLoadProfile"));

      // If unauthorized, redirect to login
      if (err instanceof Error && err.message.includes("401")) {
        logout();
        navigate("/login");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUsernameUpdate = async () => {
    if (!newUsername.trim() || newUsername === profile?.username) {
      setIsEditingUsername(false);
      setNewUsername(profile?.username || "");
      return;
    }

    setUsernameLoading(true);
    setError("");

    try {
      const response = await updateUsername(newUsername.trim());
      setProfile(response.user);
      setIsEditingUsername(false);

      if (user) {
        updateUser({
          ...user,
          username: response.user.username,
        });
      }
    } catch (err) {
      console.error("Error updating username:", err);
      setError(
        err instanceof Error ? err.message : t("profile.failedToUpdateUsername")
      );
      setNewUsername(profile?.username || "");
    } finally {
      setUsernameLoading(false);
    }
  };

  const handlePasswordUpdate = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      setError(t("profile.allPasswordFieldsRequired"));
      return;
    }

    if (newPassword !== confirmPassword) {
      setError(t("profile.passwordsDoNotMatch"));
      return;
    }

    if (newPassword.length < 6) {
      setError(t("profile.passwordMinLength"));
      return;
    }

    setPasswordLoading(true);
    setError("");

    try {
      await updatePassword(currentPassword, newPassword);
      setIsEditingPassword(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      // Show success message briefly
      setError(t("profile.passwordUpdatedSuccess"));
      setTimeout(() => setError(""), 3000);
    } catch (err) {
      console.error("Error updating password:", err);
      setError(
        err instanceof Error ? err.message : t("profile.failedToUpdatePassword")
      );
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleDeleteProfile = async () => {
    setDeleteLoading(true);
    setError("");

    try {
      await deleteProfile();
      logout();
      navigate("/login");
    } catch (err) {
      console.error("Error deleting profile:", err);
      setError(
        err instanceof Error ? err.message : t("profile.failedToDeleteProfile")
      );
      setDeleteLoading(false);
    }
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const cancelEdit = () => {
    setIsEditingUsername(false);
    setIsEditingPassword(false);
    setNewUsername(profile?.username || "");
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setError("");
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen p-6 flex items-center justify-center">
        <div className="text-center text-gray-400">
          <div className="inline-block w-8 h-8 border-4 border-gray-400 border-t-transparent rounded-full animate-spin mb-2"></div>
          <p>{t("profile.loading")}</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen p-6 flex items-center justify-center">
        <div className="text-center text-red-500">
          <p>{t("profile.failedToLoad")}</p>
          <button
            onClick={fetchProfile}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            <button>{t("profile.retry")}</button>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-2xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-8">
          {t("profile.title")}
        </h2>

        {error && (
          <div
            className={`text-center mb-6 p-3 rounded ${
              error.includes("successfully")
                ? "bg-green-900/20 text-green-400 border border-green-700"
                : "bg-red-900/20 text-red-400 border border-red-700"
            }`}
          >
            {error}
          </div>
        )}

        <div className="bg-gray-800 rounded-lg p-6 space-y-6">
          {/* Email (Read-only) */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-300">
              {t("profile.email")}
            </label>
            <div className="flex items-center space-x-3 p-3 bg-gray-700 rounded-lg">
              <User size={20} className="text-gray-400" />
              <span className="text-gray-300">{profile.email}</span>
            </div>
          </div>

          {/* Username */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-300">
              {t("profile.username")}
            </label>
            {isEditingUsername ? (
              <div className="space-y-3">
                <input
                  type="text"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  placeholder={t("profile.enterNewUsername")}
                  disabled={usernameLoading}
                />
                <div className="flex space-x-2">
                  <button
                    onClick={handleUsernameUpdate}
                    disabled={usernameLoading}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {usernameLoading ? t("profile.saving") : t("profile.save")}
                  </button>
                  <button
                    onClick={cancelEdit}
                    disabled={usernameLoading}
                    className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                  >
                    {t("profile.cancel")}
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                <div className="flex items-center space-x-3">
                  <User size={20} className="text-gray-400" />
                  <span className="text-gray-300">{profile.username}</span>
                </div>
                <button
                  onClick={() => setIsEditingUsername(true)}
                  className="p-2 text-gray-400 hover:text-blue-400 transition-colors"
                  title={t("profile.editUsername")}
                >
                  <Edit size={16} />
                </button>
              </div>
            )}
          </div>

          {/* Password */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-300">
              {t("profile.password")}
            </label>
            {isEditingPassword ? (
              <div className="space-y-3">
                <div className="relative">
                  <input
                    type={showCurrentPassword ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500 pr-12"
                    placeholder={t("profile.currentPassword")}
                    disabled={passwordLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300"
                  >
                    {showCurrentPassword ? (
                      <EyeOff size={16} />
                    ) : (
                      <Eye size={16} />
                    )}
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500 pr-12"
                    placeholder={t("profile.newPassword")}
                    disabled={passwordLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300"
                  >
                    {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  placeholder={t("profile.confirmNewPassword")}
                  disabled={passwordLoading}
                />
                <div className="flex space-x-2">
                  <button
                    onClick={handlePasswordUpdate}
                    disabled={passwordLoading}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {passwordLoading
                      ? t("profile.updating")
                      : t("profile.updatePassword")}
                  </button>
                  <button
                    onClick={cancelEdit}
                    disabled={passwordLoading}
                    className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                  >
                    {t("profile.cancel")}
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Lock size={20} className="text-gray-400" />
                  <span className="text-gray-300">••••••••</span>
                </div>
                <button
                  onClick={() => setIsEditingPassword(true)}
                  className="p-2 text-gray-400 hover:text-blue-400 transition-colors"
                  title={t("profile.changePassword")}
                >
                  <Edit size={16} />
                </button>
              </div>
            )}
          </div>

          {/* Member Since */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-300">
              {t("profile.memberSince")}
            </label>
            <div className="flex items-center space-x-3 p-3 bg-gray-700 rounded-lg">
              <User size={20} className="text-gray-400" />
              <span className="text-gray-300">
                {formatDate(profile.createdAt)}
              </span>
            </div>
          </div>

          {/* Delete Account */}
          <div className="pt-6 border-t border-gray-700">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-red-400">
                {t("profile.dangerZone")}
              </label>
              <div className="p-4 bg-red-900/20 border border-red-700 rounded-lg">
                <p className="text-sm text-red-300 mb-3">
                  {t("profile.deleteWarning")}
                </p>
                {showDeleteConfirm ? (
                  <div className="space-y-3">
                    <p className="text-sm text-red-200 font-medium">
                      {t("profile.deleteConfirm")}
                    </p>
                    <div className="flex space-x-2">
                      <button
                        onClick={handleDeleteProfile}
                        disabled={deleteLoading}
                        className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                      >
                        <Trash2 size={16} />
                        <span>
                          {deleteLoading
                            ? t("profile.deleting")
                            : t("profile.yesDeleteAccount")}
                        </span>
                      </button>
                      <button
                        onClick={() => setShowDeleteConfirm(false)}
                        disabled={deleteLoading}
                        className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                      >
                        {t("profile.cancel")}
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 flex items-center space-x-2"
                  >
                    <Trash2 size={16} />
                    <span>{t("profile.deleteAccount")}</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Profile;
