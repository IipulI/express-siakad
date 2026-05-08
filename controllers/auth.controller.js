import * as authService from '../services/auth.service.js'
import ResponseBuilder from '../utils/response.js'

export const login = async(req, res) => {
    const responseBuilder = new ResponseBuilder(res);

    try {
        const data = await authService.login(req.body);

        responseBuilder
            .code(200)
            .message("Berhasil")
            .json(data);
    }
    catch (error) {
        // If it's one of our expected business logic errors, send a 401 Unauthorized
        if (error.message === "User not found" || error.message === "Passwords don't match") {
            return responseBuilder
                .code(401)
                .message(error.message)
                .json(null);
        }

        // If it's a real server crash (like database down), send 500
        console.error("Login System Error:", error);
        responseBuilder
            .code(500)
            .message("Terjadi kesalahan pada server");
    }
}