import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.model.js';

dotenv.config();

const superuserData = {
    firstName: 'System',
    lastName: 'Superuser',
    email: 'superuser@gmail.com',
    password: 'superPassword123',
    role: 'superuser',
    dateOfBirth: '2000-05-15'
};

const seedSuperuser = async () => {
    try {
        const mongoUrl = process.env.MONGO_URL;
        if (!mongoUrl) {
            throw new Error('MONGO_URL not found in environment variables');
        }

        await mongoose.connect(mongoUrl);
        console.log('✅ Connected to MongoDB for superuser seeding...');

        // 1. Check if superuser already exists
        const existingUser = await User.findOne({ email: superuserData.email });
        if (existingUser) {
            console.log('ℹ️  Superuser already exists. Updating password and role...');
            existingUser.password = superuserData.password;
            existingUser.role = superuserData.role;
            await existingUser.save();
            console.log('✅ Superuser updated successfully!');
        } else {
            // 2. Create the superuser
            await User.create({
                firstName: superuserData.firstName,
                lastName: superuserData.lastName,
                email: superuserData.email,
                password: superuserData.password,
                role: superuserData.role,
                dateOfBirth: superuserData.dateOfBirth
            });
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
