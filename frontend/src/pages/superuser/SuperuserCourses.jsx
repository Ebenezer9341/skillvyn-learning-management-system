import React from 'react'
import Courses from '../shared/Courses'

const SuperuserCourses = () => {
    return (
        <Courses 
            mode="all" 
            title="Global Course Management" 
            description="Audit and oversee all educational content across the platform"
        />
    )
}

export default SuperuserCourses;