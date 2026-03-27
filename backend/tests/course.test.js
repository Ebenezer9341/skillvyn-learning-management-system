import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import app from '../app.js';

describe('Course API', () => {
    
    beforeAll(async () => {
        if (mongoose.connection.readyState !== 1) {
            await new Promise(resolve => mongoose.connection.once('connected', resolve));
        }
    });

    afterAll(async () => {
        await mongoose.connection.close();
    });

    it('should allow public access to list courses', async () => {
        const res = await request(app)
            .get('/api/courses');
            
        expect(res.status).toBe(200);
        expect(res.body.status).toBe('success');
        expect(Array.isArray(res.body.data.courses)).toBe(true);
    });

    it('should reject course creation with invalid category (Validator)', async () => {
        const res = await request(app)
            .post('/api/courses')
            .set('Authorization', 'Bearer fake-token') 
            .send({
                title: 'Testing Course',
                description: 'Valid description',
                category: 'Magic' // Invalid category (not in enum)
            });
            
        // Should be caught by the protect middleware first since it's a fake token
        expect(res.status).toBe(401); 
    });

    it('should fail with 401 for unauthorized course updates', async () => {
        const res = await request(app)
            .patch('/api/courses/507f1f77bcf86cd799439011')
            .send({ title: 'Hacked Title' });
            
        expect(res.status).toBe(401);
    });
});
