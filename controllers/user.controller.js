import * as userService from '../services/user.service.js';

// Controller functions are async to use await
export async function createUser(req, res, next) {
    try {
        // We only pass the body to the services
        const newUser = await userService.createUser(req.body);
        res.status(201).json(newUser);
    } catch (error) {
        // Pass error to the error handling middleware
        next(error);
    }
}

export async function getAllUsers(req, res, next) {
    try {
        const users = await userService.getAllUsers();
        res.status(200).json(users);
    } catch (error) {
        next(error);
    }
}

export async function getUserById(req, res, next) {
    try {
        const { id } = req.params;
        const user = await userService.getUserById(id);
        if (!user) {
            // If user not found, send a 404
            return res.status(404).json({ message: 'User not found' });
        }
        res.status(200).json(user);
    } catch (error) {
        next(error);
    }
}

export async function updateUser(req, res, next) {
    try {
        const { id } = req.params;
        const userData = req.body;
        const [updatedCount] = await userService.updateUser(id, userData);
        if (updatedCount === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.status(200).json({ message: 'User updated successfully' });
    } catch (error) {
        next(error);
    }
}

export async function deleteUser(req, res, next) {
    try {
        const { id } = req.params;
        const deletedCount = await userService.deleteUser(id);
        if (deletedCount === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        // Use 204 No Content for successful deletions with no response body
        res.status(204).send();
    } catch (error) {
        next(error);
    }
}