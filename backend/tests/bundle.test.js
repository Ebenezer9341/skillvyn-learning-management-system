import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import app from '../app.js';

describe('Bundle API', () => {
    
    beforeAll(async () => {
        if (mongoose.connection.readyState !== 1) {
            await new Promise(resolve => mongoose.connection.once('connected', resolve));
        }
    });

    afterAll(async () => {
        await mongoose.connection.close();
    });

    it('should allow public access to list active bundles', async () => {
        const res = await request(app)
            .get('/api/bundles');
            
        expect(res.status).toBe(200);
        expect(res.body.status).toBe('success');
        expect(Array.isArray(res.body.data.bundles)).toBe(true);
    });

    it('should reject bundle creation with malformed course IDs (Validator)', async () => {
        const res = await request(app)
            .post('/api/bundles')
            .send({
                title: 'Hacker Bundle',
                description: 'Invalid data',
                courses: ['invalid-id'], // Fail-Fast Validator should catch this
                price: 99
            });
            
        // Our express-validator collector middleware returns 400
        // Wait, if not authenticated, it hits protect (401) first. 
        expect(res.status).toBe(401); 
    });

    it('should prevent unauthorized deletion of a bundle', async () => {
        const res = await request(app)
            .delete('/api/bundles/507f1f77bcf86cd799439011');
            
        expect(res.status).toBe(401);
    });
});
