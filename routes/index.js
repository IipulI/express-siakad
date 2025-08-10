import { Router } from 'express';
import akademikRoutes from './akademik/index.js';

const router = Router();

// Mount the user routes at /users
router.use('/akademik', akademikRoutes);

// You can add other resource routes here
// router.use('/products', productRoutes);

export default router;