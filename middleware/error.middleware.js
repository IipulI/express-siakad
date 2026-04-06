export function errorMiddleware(err, req, res, next) {
    console.error(err.stack);

    const statusCode = err.statusCode || 500;
    const message = err.message || 'Internal Server Error';

    res.status(statusCode).json({
        status: 'error',
        statusCode,
        message,
    });
}

// /middleware/errorHandler.js
import fs from 'fs/promises';
import ResponseBuilder from '../utils/response.js';

// A helper function to safely delete a file
const cleanupFile = async (filePath) => {
    try {
        if (filePath) {
            await fs.unlink(filePath);
            console.log(`Successfully cleaned up orphaned file: ${filePath}`);
        }
    } catch (err) {
        // Log the error but don't throw, as we still want to send the original error response
        console.error(`Error cleaning up file ${filePath}:`, err.message);
    }
};

// The main error handling and cleanup middleware
export const handleErrorsAndCleanup = async (err, req, res, next) => {
    console.error(err); // Log the error for debugging

    // Check if files were uploaded by Multer
    if (req.files) {
        console.log('An error occurred after file upload, cleaning up files...');
        const files = req.files;

        const cleanupPromises = [];

        // Loop through the fields (e.g., 'thumbnail', 'file')
        for (const field in files) {
            // Loop through each file in the field
            files[field].forEach(file => {
                cleanupPromises.push(cleanupFile(file.path));
            });
        }

        // Wait for all file deletions to complete
        await Promise.all(cleanupPromises);
    }

    if (err.name === 'UnauthorizedError') {
        return new ResponseBuilder(res)
            .status('failure')
            .code(401)
            .message('Invalid or missing authentication token.')
            .json();
    }

    // Send a standardized error response
    new ResponseBuilder(res)
        .status('failure')
        .code(err.status || 500)
        .message(err.message || 'An internal server error occurred.')
        .json();
};