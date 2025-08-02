import { Router } from 'express';
import userRoutes from './user.router.js';
import akademikRoutes from './akademik/index.js';

const router = Router();

// Mount the user routes at /users
router.use('/users', userRoutes);
router.use('/akademik', akademikRoutes);

// You can add other resource routes here
// router.use('/products', productRoutes);

export default router;