import User from '../models/user.models.js';

// Services contain the core business logic.
// They should be independent of the HTTP layer.

export async function createUser(userData) {
    // You can add more complex logic here, like hashing passwords
    return User.create(userData);
}

export async function getAllUsers() {
    return User.findAll();
}

export async function getUserById(id) {
    return User.findByPk(id);
}

export async function updateUser(id, userData) {
    // The `update` method returns an array with the number of affected rows
    return User.update(userData, {
        where: { id },
    });
}

export async function deleteUser(id) {
    // The `destroy` method returns the number of deleted rows
    return User.destroy({
        where: { id },
    });
}