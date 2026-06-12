import { defaultUsers } from "../data/emotions";

export function readJson(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

export function normalizeUsers(savedUsers) {
  if (!Array.isArray(savedUsers) || savedUsers.length === 0) {
    return [...defaultUsers];
  }

  return savedUsers.map((user, index) => {
    if (typeof user === "string") {
      return {
        name: user,
        avatar: defaultUsers[index]?.avatar || "🙂",
        password: "0000",
      };
    }

    return {
      name: user.name || `사용자${index + 1}`,
      avatar: user.avatar || "🙂",
      password: user.password || "0000",
    };
  });
}

export function getSavedCurrentUserName(users) {
  const savedUser = localStorage.getItem("currentEmotionUser");

  if (!savedUser) {
    return users[0].name;
  }

  try {
    const parsedUser = JSON.parse(savedUser);
    return parsedUser.name || savedUser;
  } catch {
    return savedUser;
  }
}
