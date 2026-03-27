import React from 'react';
import Students from '../shared/Students';

const MentorStudents = () => {
    return (
        <Students 
            mode="mentor" 
            title="My Student Directory" 
            description="Monitor and support your enrolled candidates across all your courses"
        />
    );
};

export default MentorStudents;