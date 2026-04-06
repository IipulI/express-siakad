/**
 * A base class for all custom HTTP errors.
 * It ensures that every error has a status code and a message.
 */
class HttpError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.status = statusCode;
    }
}

// ## 4xx Client Errors ##

/**
 * 400 Bad Request
 * The server cannot or will not process the request due to something that is perceived to be a client error.
 */
export class BadRequestError extends HttpError {
    constructor(message = 'Bad request') {
        super(message, 400);
    }
}

/**
 * 401 Unauthorized
 * The client must authenticate itself to get the requested response.
 */
export class UnauthorizedError extends HttpError {
    constructor(message = 'Unauthorized: Authentication is required and has failed or has not yet been provided.') {
        super(message, 401);
    }
}

/**
 * 403 Forbidden
 * The client does not have access rights to the content; i.e., they are unauthorized.
 */
export class ForbiddenError extends HttpError {
    constructor(message = 'Forbidden: You do not have permission to access this resource.') {
        super(message, 403);
    }
}

/**
 * 404 Not Found
 * The server can not find the requested resource.
 */
export class NotFoundError extends HttpError {
    constructor(message = 'Resource not found') {
        super(message, 404);
    }
}

/**
 * 409 Conflict
 * This response is sent when a request conflicts with the current state of the server.
 */
export class ConflictError extends HttpError {
    constructor(message = 'Conflict with the current state of the resource') {
        super(message, 409);
    }
}

/**
 * 422 Unprocessable Entity
 * The request was well-formed but was unable to be followed due to semantic errors.
 */
export class UnprocessableEntityError extends HttpError {
    constructor(message = 'Unprocessable entity') {
        super(message, 422);
    }
}


// ## 5xx Server Errors ##

/**
 * 500 Internal Server Error
 * The server has encountered a situation it doesn't know how to handle.
 */
export class InternalServerError extends HttpError {
    constructor(message = 'Internal server error') {
        super(message, 500);
    }
}