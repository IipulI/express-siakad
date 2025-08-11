import models from '../models/index.js'
const { User, Mahasiswa, Dosen } = models;

export const attachUser = async (req, res, next) => {
    try {
        // Check if the token verification middleware has run and added the `auth` object.
        if (!req.auth || !req.auth.id) {
            return res.status(401).json({ message: 'Authentication error: User ID missing from token.' });
        }

        // Get the user ID from the token payload. 'sub' (subject) is standard for user ID.
        const userId = req.auth.id;

        // Fetch the full, current user data from the 'siak_user' table.
        const userFromDb = await User.findOne({
            attributes: ["id", "eportalUserId"],
            where: {
                eportalUserId: userId,
            },
            include: [
                {
                    attributes: ["id", "nama"],
                    model: Mahasiswa,
                    as: "mahasiswa"
                },
                {
                    attributes: ["id", "nama"],
                    model: Dosen,
                    as: "dosen"
                }
            ]
        });

        if (!userFromDb) {
            // This is an important security check. The token is valid, but the user
            // no longer exists in the database (e.g., they were deleted).
            return res.status(401).json({ message: 'User not found.' });
        }

        // Attach the full user object to the request.
        req.user = userFromDb;

        next();
    } catch (error) {
        // Handle potential database errors.
        res.status(500).json({ message: 'Error fetching user data.', error: error.message });
    }
};