import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import apiRoutes from './routes/index.js';
import { errorMiddleware } from './middleware/error.middleware.js';

// Load environment variables from .env file
dotenv.config();

const app = express();

// --- Global Middleware ---
// Enable Cross-Origin Resource Sharing
app.use(cors());
// Parse incoming JSON requests
app.use(express.json());
// Parse URL-encoded bodies
app.use(express.urlencoded({ extended: true }));


// --- API Routes ---
app.get('/', (req, res) => {
    res.status(200).json({ message: 'Welcome to the Express ES6 Boilerplate API!' });
});
app.use('/api', apiRoutes);


// --- Error Handling Middleware ---
// This should be the last middleware to be used
app.use(errorMiddleware);

export default app;