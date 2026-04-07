import mongoose from 'mongoose';

/**
 * Higher-order function to execute a callback within a Mongoose session/transaction
 * if the environment supports it (Replica Set). Otherwise, it executes the
 * callback without a session.
 * 
 * @param {Function} callback - Async function that receives the session object
 * @returns {Promise<any>} - Results of the callback
 */
export const runTransaction = async (callback) => {
    // 1. Check if the connection supports sessions/transactions
    // Standard standalone MongoDB doesn't support transactions.
    const isReplicaSet = mongoose.connection.getClient().topology?.description?.type?.includes('ReplicaSet') || 
                       mongoose.connection.getClient().topology?.description?.servers?.size > 1;

    // If we're not on a replica set, just execute the callback without a session
    if (!isReplicaSet) {
        console.warn('⚠️ MongoDB is running in Standalone mode. Transactions are disabled. Data atomicity is NOT guaranteed.');
        return await callback(null);
    }

    // 2. Execute with Transaction
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const result = await callback(session);
        await session.commitTransaction();
        return result;
    } catch (error) {
        // If it's the specific replica set error (even though we checked, topologies vary)
        if (error.message.includes('replica set') || error.codeName === 'InvalidOptions') {
            console.warn('⚠️ Transaction attempted but failed due to Standalone mode. Retrying without session.');
            session.endSession();
            return await callback(null); // Fallback
        }

        // Real error - Rollback
        await session.abortTransaction();
        throw error;
    } finally {
        session.endSession();
    }
};
