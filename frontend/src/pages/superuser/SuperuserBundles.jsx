import React from 'react';
import Bundles from '../shared/Bundles';

const SuperuserBundles = () => {
    return (
        <Bundles 
            mode="all" 
            title="Global Bundle Management" 
            description="Superuser control over all educational bundles"
        />
    );
};

export default SuperuserBundles;
