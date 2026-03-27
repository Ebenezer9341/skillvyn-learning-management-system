import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import app from '../app.js';

describe('Authentication API', () => {
    
    // Wait for the database connection before running tests
    beforeAll(async () => {
        if (mongoose.connection.readyState !== 1) {
            await new Promise(resolve => {
                mongoose.connection.once('connected', resolve);
            });
        }
    });

    // Close the connection after tests to prevent handle leaks
    afterAll(async () => {
        await mongoose.connection.close();
    });
    
    it('should fail to login with missing credentials (Validator check)', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({});
            
        expect(res.status).toBe(400);
        expect(res.body.status).toBe('fail');
        expect(res.body.message).toContain('Please provide a valid email address');
    });

    it('should fail to login with invalid email format', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({
                email: 'not-an-email',
                password: 'password123'
            });
            
        expect(res.status).toBe(400);
        expect(res.body.status).toBe('fail');
        expect(res.body.message).toContain('Please provide a valid email address');
    });

    it('should fail with 401 for non-existent user', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({
                email: 'ghost@skillvyn.com',
                password: 'password123'
            });
            
        // Our controller returns 401 for incorrect email/password
        // Note: This hits your real DB if it's connected
        expect(res.status).toBe(401);
        expect(res.body.message).toBe('Incorrect email or password');
    });
});
