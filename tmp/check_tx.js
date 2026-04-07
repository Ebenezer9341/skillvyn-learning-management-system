import mongoose from 'mongoose';
import Transaction from './backend/models/Transaction.model.js';
import Bundle from './backend/models/Bundle.model.js';
import dotenv from 'dotenv';
dotenv.config({ path: './backend/.env' });

const MONGO_URI = process.env.DATABASE || 'mongodb://localhost:27017/skillvyn';

async function checkData() {
    try {
        await mongoose.connect(MONGO_URI);
        const txCount = await Transaction.countDocuments({ bundle: { $exists: true } });
        const allTx = await Transaction.find({ bundle: { $exists: true } }).limit(5);
        const bundleEnrollments = await Bundle.aggregate([
            { $group: { _id: null, total: { $sum: '$enrollmentCount' } } }
        ]);

        console.log('--- DATA CHECK ---');
        console.log('Transactions with Bundle:', txCount);
        console.log('Sample Transactions:', allTx.map(t => ({ id: t._id, date: t.createdAt, bundle: t.bundle })));
        console.log('Aggregated Bundle EnrollmentCount:', bundleEnrollments[0]?.total || 0);
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkData();
