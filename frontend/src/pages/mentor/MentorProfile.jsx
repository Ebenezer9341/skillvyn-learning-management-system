import React from 'react';
import Profile from '../../components/shared/Profile';

const MentorProfile = () => {
    return (
        <div className="pt-8 bg-[#f8fafc] min-h-screen">
            <Profile userRole="Mentor" />
        </div>
    );
};

export default MentorProfile;