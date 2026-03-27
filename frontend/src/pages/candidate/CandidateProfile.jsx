import React from 'react';
import Profile from '../../components/shared/Profile';

const CandidateProfile = () => {
    return (
        <div className="pt-8 bg-[#f8fafc] min-h-screen">
            <Profile userRole="Candidate" />
        </div>
    );
};

export default CandidateProfile;
