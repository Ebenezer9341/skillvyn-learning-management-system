import React from 'react';
import Profile from '../../components/shared/Profile';

const SuperuserProfile = () => {
    return (
        <div className="pt-8 bg-[#f8fafc] min-h-screen">
            <Profile userRole="Superuser" />
        </div>
    );
};

export default SuperuserProfile;
