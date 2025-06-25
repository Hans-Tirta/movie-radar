const USER_CACHE = new Map<string, { username: string; timestamp: number }>();
const CACHE_TTL = 30 * 1000;
const AUTH_SERVICE_URL =
  process.env.AUTH_SERVICE_URL || "http://localhost:5001";

export const getUserInfo = async (
  userId: string
): Promise<{ username: string }> => {
  const cached = USER_CACHE.get(userId);

  // Check if cache exists and is still fresh
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return { username: cached.username };
  }

  try {
    const res = await fetch(`${AUTH_SERVICE_URL}/api/auth/user/${userId}`);
    if (!res.ok) throw new Error("Failed to fetch user");

    const data = await res.json();
    const username = data.user?.username || "Unknown";

    USER_CACHE.set(userId, { username, timestamp: Date.now() });
    return { username };
  } catch (err) {
    console.error(`Failed to fetch user info for ${userId}:`, err);
    // Return stale cache if available, otherwise "Unknown"
    return { username: cached?.username || "Unknown" };
  }
};
