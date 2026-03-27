import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import app from '../app.js';

describe('Transaction API', () => {
    
    beforeAll(async () => {
        if (mongoose.connection.readyState !== 1) {
            await new Promise(resolve => mongoose.connection.once('connected', resolve));
        }
    });

    afterAll(async () => {
        await mongoose.connection.close();
    });

    it('should prevent access to my transactions without authentication', async () => {
        const res = await request(app)
            .get('/api/transactions/my');
            
        expect(res.status).toBe(401);
    });

    it('should prevent unauthorized access to global transactions (Role check)', async () => {
        const res = await request(app)
            .get('/api/transactions/')
            .set('Authorization', 'Bearer fake-token');
            
        // Should be caught by the protect middleware first since it's a fake token
        expect(res.status).toBe(401);
    });

    it('should fail with 401 for specific transaction detail access unauthenticated', async () => {
        const res = await request(app)
            .get('/api/transactions/507f1f77bcf86cd799439011');
            
        expect(res.status).toBe(401);
    });
});
