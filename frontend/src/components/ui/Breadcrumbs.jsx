import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

const Breadcrumbs = () => {
    const location = useLocation();
    
    // Split the pathname and filter out empty strings
    const pathnames = location.pathname.split('/').filter(x => x);

    // If there is no specific route (e.g., just '/'), do not render the breadcrumb
    if (pathnames.length === 0) return null;

    // Define implied sub-routes for our base roles since they were mapped directly to the root
    const roleLabels = {
        'superuser': 'Platform Admin',
        'admin': 'Admin Control',
        'mentor': 'Instructor Hub',
        'candidate': 'Learning Path'
    };

    const breadcrumbItems = [];
    
    pathnames.forEach((name, index) => {
        // Skip Role Route if it's the first element and there are sub-routes
        // This ensures "User Management" starts the breadcrumb instead of "Platform Admin > Users"
        if (index === 0 && roleLabels[name] && pathnames.length > 1) {
            return;
        }

        let routeTo = `/${pathnames.slice(0, index + 1).join('/')}`;
        let label = name;
        
        // Handle Role Roots (when it's the only segment)
        if (index === 0 && roleLabels[name]) {
            label = roleLabels[name];
        } 
        // Handle Feature Transformations
        else if (name === 'users' || name === 'user') {
            label = 'User Management';
            // Force link to redirect to the plural /users list regardless of segment used
            const roleRoot = pathnames[0];
            routeTo = `/${roleRoot}/users`;
        }
        else if (name === 'courses' || name === 'course') {
            label = 'Course Management';
            const roleRoot = pathnames[0];
            routeTo = `/${roleRoot}/courses`;
        }
        else if (name === 'auditLogs') {
            label = 'Audit Logs';
        }
        else if (name === 'mentors') {
            label = 'Mentor Directory';
        }
        else if (name === 'analytics') {
            label = 'Course Analytics';
            const roleRoot = pathnames[0];
            routeTo = `/${roleRoot}/courses`;
        }
        else if (name === 'platform') {
            label = 'Platform Insights';
        }
        else if (name === 'invoices') {
            label = 'Finances & Billing';
            const roleRoot = pathnames[0];
            routeTo = `/${roleRoot}/invoices`;
        }
        else if (name === 'students') {
            label = 'Student Management';
            const roleRoot = pathnames[0];
            routeTo = `/${roleRoot}/students`;
        }
        // Handle Dynamic IDs
        else if (name.length > 20 || /^[0-9a-fA-F-]+$/.test(name)) {
            const parent = pathnames[index - 1];
            if (parent === 'edit') label = 'Editor';
            else if (parent === 'view') label = 'Viewer';
            else if (parent === 'user' || parent === 'users') label = 'Profile Details';
            else if (parent === 'analytics') label = 'Detailed Report';
            else if (parent === 'invoices') label = 'Billing History';
            else label = 'View';
        }

        breadcrumbItems.push({
            name: label,
            path: routeTo
        });
    });

    return (
        <nav className="bg-white/50 backdrop-blur-sm border-b border-slate-100 px-4 md:px-8 py-3 flex items-center text-sm md:text-xs">
            <Link 
                to="/" 
                className="text-slate-400 hover:text-primary transition-colors flex items-center gap-1.5 focus:outline-none"
                title="Home"
            >
                <Home size={14} />
            </Link>
            
            {breadcrumbItems.map((item, index) => {
                const isLast = index === breadcrumbItems.length - 1;
                
                // Format the URL slug: uppercase the first letter and replace dashes with spaces
                const formattedName = item.name
                    .replace(/-/g, ' ')
                    .replace(/\b\w/g, char => char.toUpperCase());

                return (
                    <React.Fragment key={`${item.name}-${index}`}>
                        <ChevronRight size={14} className="text-slate-300 mx-2 flex-shrink-0" />
                        {isLast ? (
                            <span className="text-secondary font-bold truncate max-w-[150px] md:max-w-md tracking-wide">
                                {formattedName}
                            </span>
                        ) : (
                            <Link 
                                to={item.path} 
                                className="text-slate-400 hover:text-primary transition-colors font-bold tracking-wide truncate max-w-[100px] md:max-w-xs focus:outline-none"
                            >
                                {formattedName}
                            </Link>
                        )}
                    </React.Fragment>
                );
            })}
        </nav>
    );
};

export default Breadcrumbs;
