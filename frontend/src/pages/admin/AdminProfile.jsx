import React from 'react';
import Profile from '../../components/shared/Profile';

const AdminProfile = () => {
    return (
        <div className="pt-8 bg-[#f8fafc] min-h-screen">
            <Profile userRole="Admin" />
        </div>
    );
};

export default AdminProfile;
