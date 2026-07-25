const blacklistedUsers = new Map();

export const addUserToBlacklist = (userId) => {
    blacklistedUsers.set(String(userId), Date.now());
    console.log(`[Blacklist] User ${userId} ditambahkan ke blacklist SIAKAD`);
};

export const isUserBlacklisted = (userId) => {
    return blacklistedUsers.has(String(userId));
};

export const removeUserFromBlacklist = (userId) => {
    blacklistedUsers.delete(String(userId));
    console.log(`[Blacklist] User ${userId} dihapus dari blacklist SIAKAD`);
};