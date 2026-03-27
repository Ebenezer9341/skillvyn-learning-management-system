import mongoose from 'mongoose';
import Course from './backend/models/Course.models.js';
import Enrollment from './backend/models/Enrollment.model.js';
import dotenv from 'dotenv';
dotenv.config({ path: './backend/.env' });

const verifyData = async () => {
    console.log("Verifying Course Data Consistency...");
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/skillvyn';
  try {
    await mongoose.connect(mongoUri);
    const courses = await Course.find();
    
    for (const course of courses) {
      const actualEnrollments = await Enrollment.countDocuments({ course: course._id });
      console.log(`Course: ${course.title} | Shown Enrollment: ${course.enrollmentCount} | Actual Enrollment: ${actualEnrollments}`);
      
      if (course.enrollmentCount !== actualEnrollments) {
        console.log(`Mismatch detected for "${course.title}". Fixing it now...`);
        course.enrollmentCount = actualEnrollments;
        await course.save();
      }
    }
    
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

verifyData();
