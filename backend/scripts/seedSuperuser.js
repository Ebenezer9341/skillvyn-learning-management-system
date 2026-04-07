import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.model.js';

dotenv.config();

const validateEnvVars = () => {
    const required = ['MONGO_URL', 'SUPERUSER_EMAIL', 'SUPERUSER_PASSWORD'];
    const missing = required.filter(key => !process.env[key]);
    
    if (missing.length > 0) {
        throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }

    const password = process.env.SUPERUSER_PASSWORD;
    if (password.length < 8) {
        throw new Error('SUPERUSER_PASSWORD must be at least 8 characters');
    }
    if (!/[A-Z]/.test(password)) {
        throw new Error('SUPERUSER_PASSWORD must contain at least one uppercase letter');
    }
    if (!/[a-z]/.test(password)) {
        throw new Error('SUPERUSER_PASSWORD must contain at least one lowercase letter');
    }
    if (!/[0-9]/.test(password)) {
        throw new Error('SUPERUSER_PASSWORD must contain at least one number');
    }
};

const seedSuperuser = async () => {
    try {
        validateEnvVars();

        const superuserData = {
            firstName: 'System',
            lastName: 'Superuser',
            email: process.env.SUPERUSER_EMAIL,
            password: process.env.SUPERUSER_PASSWORD,
            role: 'superuser',
            dateOfBirth: '2000-05-15'
        };

        await mongoose.connect(process.env.MONGO_URL);
        console.log('✅ Connected to MongoDB for superuser seeding...');

        const existingUser = await User.findOne({ email: superuserData.email });
        if (existingUser) {
            if (existingUser.role !== superuserData.role) {
                existingUser.role = superuserData.role;
                await existingUser.save();
                console.log('✅ Superuser role updated to superuser!');
            } else {
                console.log('ℹ️  Superuser already exists. No changes made.');
            }
        } else {
            await User.create(superuserData);
            console.log('🌱 Superuser created successfully!');
        }

        await mongoose.connection.close();
        console.log('👋 Database connection closed.');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding superuser:', error.message);
        process.exit(1);
    }
};

seedSuperuser();
