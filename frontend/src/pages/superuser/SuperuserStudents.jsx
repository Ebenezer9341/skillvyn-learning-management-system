import React from 'react'
import Students from '../shared/Students'

const SuperuserStudents = () => {
    return (
        <Students 
            mode="all" 
            title="Global Student Directory" 
            description="Platform-wide overview of candidate progress and engagement"
        />
    )
}

export default SuperuserStudents;