import mongoose from 'mongoose';
import Course from './models/Course.model.js';
import Enrollment from './models/Enrollment.model.js';
import User from './models/User.model.js';
import dotenv from 'dotenv';
dotenv.config();

const auditSystem = async () => {
    console.log("-----------------------------------------");
    console.log("Skillvyn Global Integrity Audit");
    console.log("-----------------------------------------");
    const mongoUri = process.env.MONGO_URL || 'mongodb://localhost:27017/skillvynDB';
    
    try {
        await mongoose.connect(mongoUri);
        
        // 1. Audit Candidates
        const candidates = await User.find({ role: 'candidate' });
        console.log(`CANDIDATES IN DB: ${candidates.length}`);
        candidates.forEach(c => console.log(`- ${c.firstName} ${c.lastName} (${c.email})`));
        
        // 2. Audit Enrollments
        const enrollments = await Enrollment.find().populate('candidate', 'email').populate('course', 'title');
        console.log(`TOTAL ENROLLMENT RECORDS: ${enrollments.length}`);
        enrollments.forEach(e => {
            console.log(`- Student: ${e.candidate?.email || 'Unknown'} -> Course: ${e.course?.title || 'Unknown'}`);
        });

        // 3. Sync Course Counts
        const courses = await Course.find();
        for (const course of courses) {
            const actualCount = await Enrollment.countDocuments({ course: course._id });
            if (course.enrollmentCount !== actualCount) {
                console.log(`SYNC ALERT: "${course.title}" was showing ${course.enrollmentCount}, fixing to ${actualCount}`);
                course.enrollmentCount = actualCount;
                await course.save();
            }
        }
        
        console.log("-----------------------------------------");
        console.log("Audit Complete.");
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

auditSystem();
