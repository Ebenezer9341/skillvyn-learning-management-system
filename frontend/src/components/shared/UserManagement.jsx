import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, 
    Mail, 
    User, 
    Users,
    ShieldCheck, 
    RefreshCw, 
    AlertCircle, 
    Edit, 
    Shield, 
    Download, 
    Calendar, 
    X,
    UserPlus,
    MoreVertical,
    ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    useFloating, 
    autoUpdate, 
    offset, 
    flip, 
    shift, 
    useInteractions, 
    useDismiss, 
    useRole, 
    useClick,
    FloatingPortal, 
    FloatingFocusManager 
} from '@floating-ui/react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import EditUserModal from './EditUserModal';
import CreateUserModal from './CreateUserModal';

const UserRowActions = ({ user, currentUser, onEdit }) => {
    const [isOpen, setIsOpen] = useState(false);
    const navigate = useNavigate();

    const { x, y, strategy, refs, context } = useFloating({
        open: isOpen,
        onOpenChange: setIsOpen,
        middleware: [
            offset(8),
            flip({ fallbackAxisSideDirection: 'end' }),
            shift({ padding: 10 })
        ],
        whileElementsMounted: autoUpdate,
        placement: 'bottom-end'
    });

    const click = useClick(context);
    const dismiss = useDismiss(context);
    const role = useRole(context);

    const { getReferenceProps, getFloatingProps } = useInteractions([
        click,
        dismiss,
        role
    ]);

    return (
        <>
            <button 
                ref={refs.setReference}
                {...getReferenceProps()}
                className={`p-2 rounded-2xl transition-all shadow-sm flex items-center justify-center ${
                    isOpen ? 'bg-secondary text-white shadow-lg shadow-secondary/10' : 'bg-slate-50 text-slate-400 hover:text-secondary hover:bg-slate-100'
                }`} 
                title="More options"
            >
                <MoreVertical size={16} />
            </button>

            <FloatingPortal>
                <AnimatePresence>
                    {isOpen && (
                        <FloatingFocusManager context={context} modal={false}>
                            <motion.div
                                ref={refs.setFloating}
                                style={{
                                    position: strategy,
                                    top: y ?? 0,
                                    left: x ?? 0,
                                    width: 'max-content',
                                    zIndex: 9999
                                }}
                                {...getFloatingProps()}
                                initial={{ opacity: 0, scale: 0.95, y: -5 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: -5 }}
                                className="w-44 bg-white rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-slate-100 p-1.5 text-left overflow-hidden ring-4 ring-slate-900/5"
                            >
                                <button
                                    onClick={() => {
                                        setIsOpen(false);
                                        onEdit(user);
                                    }}
                                    className="w-full flex items-center gap-2.5 px-3 py-2.5 text-slate-600 hover:bg-primary/5 hover:text-primary rounded-2xl transition-all duration-200 shadow-sm sm:shadow-none"
                                >
                                    <Edit size={14} className="opacity-70" />
                                    <span className="text-[10px] font-black uppercase tracking-widest">Edit User</span>
                                </button>
                                
                                <div className="h-px bg-slate-50 my-1 mx-2" />

                                <button
                                    onClick={() => {
                                        setIsOpen(false);
                                        navigate(`/${currentUser.role}/user/${user._id}`);
                                    }}
                                    className="w-full flex items-center gap-2.5 px-3 py-2.5 text-slate-600 hover:bg-slate-50 rounded-2xl transition-all duration-200"
                                >
                                    <ExternalLink size={14} className="opacity-70" />
                                    <span className="text-[10px] font-black uppercase tracking-widest">View Profile</span>
                                </button>
                            </motion.div>
                        </FloatingFocusManager>
                    )}
                </AnimatePresence>
            </FloatingPortal>
        </>
    );
};

const UserManagement = () => {
    const { user: currentUser } = useAuth();
    const navigate = useNavigate();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState('all');
    
    // Advanced Filters State
    const [statusFilter, setStatusFilter] = useState('all');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    // Edit Modal State
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    // Create Modal State
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);

    // Determine available roles based on requester
    const availableRoles = currentUser?.role === 'superuser' 
        ? ['all', 'admin', 'mentor', 'candidate']
        : ['all', 'mentor', 'candidate'];

    const fetchUsers = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await api.get('/api/users');
            setUsers(response.data.data.users);
        } catch (err) {
            console.error('Error fetching users:', err);
            setError('Failed to load users. Please verify your permissions and try again.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const filteredUsers = users.filter(user => {
        const matchesSearch = `${user.firstName} ${user.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            user.email.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesTab = activeTab === 'all' || user.role === activeTab;
        
        // Status Filter
        const isActive = user.isActive !== false;
        const matchesStatus = statusFilter === 'all' || 
                            (statusFilter === 'active' && isActive) || 
                            (statusFilter === 'inactive' && !isActive);
        
        // Date Filter
        const joinedDate = new Date(user.createdAt);
        const matchesStartDate = !startDate || joinedDate >= new Date(startDate);
        const matchesEndDate = !endDate || joinedDate <= new Date(endDate + 'T23:59:59'); // Include the whole end day

        return matchesSearch && matchesTab && matchesStatus && matchesStartDate && matchesEndDate;
    });

    const getRoleBadge = (role) => {
        switch (role) {
            case 'admin':
                return 'bg-accent/10 text-accent border-accent/20 font-bold uppercase tracking-tighter shadow-sm';
            case 'mentor':
                return 'bg-primary/10 text-primary border-primary/20 font-bold uppercase tracking-tighter shadow-sm';
            case 'candidate':
                return 'bg-secondary/10 text-secondary border-secondary/20 font-bold uppercase tracking-tighter shadow-sm';
            default:
                return 'bg-slate-100 text-slate-700 border-slate-200 font-bold uppercase tracking-tighter';
        }
    };

    const getRoleIcon = (role) => {
        switch (role) {
            case 'admin': return <Shield size={14} />;
            case 'mentor': return <ShieldCheck size={14} />;
            case 'candidate': return <User size={14} />;
            default: return <User size={14} />;
        }
    };

    const handleEditClick = (user) => {
        setSelectedUser(user);
        setIsEditModalOpen(true);
    };

    const clearFilters = () => {
        setSearchQuery('');
        setStatusFilter('all');
        setStartDate('');
        setEndDate('');
        setActiveTab('all');
    };

    const handleExport = () => {
        if (filteredUsers.length === 0) {
            toast.info('No users found matching current filters to export.');
            return;
        }

        const headers = ['First Name', 'Last Name', 'Email', 'Role', 'Status', 'Joined Date'];
        const csvRows = [
            headers.join(','),
            ...filteredUsers.map(user => [
                user.firstName,
                user.lastName,
                user.email,
                user.role,
                user.isActive !== false ? 'Active' : 'Inactive',
                new Date(user.createdAt).toLocaleDateString()
            ].map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))
        ];

        const csvString = csvRows.join('\n');
        const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `skillvyn_users_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        toast.success(`Exported ${filteredUsers.length} users successfully!`);
    };

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center p-12 bg-white rounded-2xl shadow-sm border border-slate-100">
                <AlertCircle size={48} className="text-rose-500 mb-4" />
                <h3 className="text-xl font-bold text-slate-800 mb-2">Access Denied or Error</h3>
                <p className="text-slate-500 mb-6 text-center max-w-md">{error}</p>
                <button 
                    onClick={fetchUsers}
                    className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white rounded-xl hover:bg-primary/90 transition-all font-semibold"
                >
                    <RefreshCw size={18} />
                    Try Again
                </button>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl md:text-2xl font-bold text-secondary flex items-center gap-2">
                        <Users size={24} className="text-primary" />
                        User Management
                    </h1>
                    <p className="text-slate-500 mt-1 text-sm">
                        {currentUser?.role === 'superuser' 
                            ? 'Manage all platform roles including Admins, Mentors, and Candidates.' 
                            : 'Manage your assigned Mentors and Candidates.'}
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-3">
                    <div className="relative group w-full sm:w-80">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                            <Search size={18} className="text-slate-400 group-focus-within:text-primary transition-colors" />
                        </div>
                        <input
                            type="text"
                            placeholder="Search names or emails..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="block w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-2xl text-slate-600 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-slate-400 shadow-sm"
                        />
                    </div>
                    
                    <button 
                        onClick={handleExport}
                        className="flex items-center justify-center gap-2 bg-white border border-slate-200 text-slate-600 px-4 py-2 rounded-2xl text-sm font-semibold hover:bg-slate-50 transition-all shadow-sm w-full sm:w-auto active:scale-95"
                    >
                        <Download size={16} />
                        <span>Export Data</span>
                    </button>

                    <button 
                        onClick={() => setIsCreateModalOpen(true)}
                        className="flex items-center justify-center gap-2 bg-primary text-white px-4 py-2 rounded-2xl text-sm font-semibold hover:bg-primary/90 transition-all shadow-sm shadow-primary/20 w-full sm:w-auto active:scale-95"
                    >
                        <UserPlus size={16} />
                        <span>Add User</span>
                    </button>
                </div>
            </div>

            {/* Filters Section */}
            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm space-y-4">
                <div className="flex flex-wrap items-center gap-4">
                    {/* Role Tabs Integrated into filter bar */}
                    <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-2xl">
                        {availableRoles.map((role) => (
                            <button
                                key={role}
                                onClick={() => setActiveTab(role)}
                                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all capitalize whitespace-nowrap ${
                                    activeTab === role 
                                    ? 'bg-white text-primary shadow-sm rounded-xl' 
                                    : 'text-slate-500 hover:text-slate-700'
                                }`}
                            >
                                {role}
                            </button>
                        ))}
                    </div>

                    <div className="h-6 w-px bg-slate-200 hidden md:block"></div>

                    {/* Status Toggle */}
                    <select 
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="bg-slate-50 border border-slate-100 text-slate-600 text-xs font-bold px-3 py-2 rounded-2xl focus:outline-none hover:bg-slate-100 transition-all cursor-pointer shadow-sm"
                    >
                        <option value="all">All Status</option>
                        <option value="active">Active Only</option>
                        <option value="inactive">Inactive Only</option>
                    </select>

                    <div className="h-6 w-px bg-slate-200 hidden md:block"></div>

                    {/* Date Pickers */}
                    <div className="flex items-center gap-2">
                        <div className="relative">
                            <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input 
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="bg-slate-50 border border-slate-100 text-slate-600 text-[11px] font-bold pl-9 pr-3 py-2 rounded-2xl focus:outline-none shadow-sm w-36"
                                placeholder="From Date"
                            />
                        </div>
                        <span className="text-slate-300 text-xs">-</span>
                        <div className="relative">
                            <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input 
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="bg-slate-50 border border-slate-100 text-slate-600 text-[11px] font-bold pl-9 pr-3 py-2 rounded-xl focus:outline-none shadow-sm w-36"
                                placeholder="To Date"
                            />
                        </div>
                    </div>

                    {(searchQuery || statusFilter !== 'all' || startDate || endDate || activeTab !== 'all') && (
                        <button 
                            onClick={clearFilters}
                            className="flex items-center gap-1.5 text-rose-500 hover:text-rose-600 font-bold text-xs ml-auto transition-colors"
                        >
                            <X size={14} />
                            Reset Filters
                        </button>
                    )}
                </div>
            </div>

            {/* Table Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-100">
                                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">User</th>
                                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Role</th>
                                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Joined Date</th>
                                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Status</th>
                                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {loading ? (
                                [...Array(5)].map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-slate-100 rounded-full"></div>
                                                <div className="space-y-2">
                                                    <div className="h-4 w-24 bg-slate-100 rounded"></div>
                                                    <div className="h-3 w-32 bg-slate-100 rounded"></div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5"><div className="h-6 w-20 bg-slate-100 rounded-full"></div></td>
                                        <td className="px-6 py-5"><div className="h-4 w-24 bg-slate-100 rounded"></div></td>
                                        <td className="px-6 py-5"><div className="h-6 w-16 bg-slate-100 rounded-full"></div></td>
                                        <td className="px-6 py-5 text-right"><div className="h-8 w-8 bg-slate-50 rounded-lg ml-auto"></div></td>
                                    </tr>
                                ))
                            ) : filteredUsers.length > 0 ? (
                                filteredUsers.map((user) => (
                                    <tr key={user._id} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="px-6 py-5">
                                            <div 
                                                className="flex items-center gap-3 cursor-pointer group/user"
                                                onClick={() => navigate(`/${currentUser.role}/user/${user._id}`)}
                                            >
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-slate-600 font-bold border border-slate-200 inner-shadow group-hover/user:border-primary/50 transition-all group-hover/user:bg-primary/5">
                                                    {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                                                </div>
                                                <div>
                                                    <div className="font-semibold text-slate-700 group-hover/user:text-primary transition-colors">{user.firstName} {user.lastName}</div>
                                                    <div className="text-xs text-slate-500 flex items-center gap-1 group-hover/user:text-slate-400 font-medium">
                                                        <Mail size={10} />
                                                        {user.email}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-2xl text-[10px] border capitalize ${getRoleBadge(user.role)}`}>
                                                {getRoleIcon(user.role)}
                                                {user.role}
                                            </span>
                                        </td>
                                        <td className="px-6 py-5 text-slate-500 text-sm">
                                            {new Date(user.createdAt).toLocaleDateString('en-US', {
                                                month: 'short',
                                                day: 'numeric',
                                                year: 'numeric'
                                            })}
                                        </td>
                                        <td className="px-6 py-5">
                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                                                user.isActive !== false 
                                                ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                                                : 'bg-slate-50 text-slate-400 border-slate-100'
                                            }`}>
                                                {user.isActive !== false ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-5 text-right">
                                            <div className="flex items-center justify-end">
                                                <UserRowActions user={user} currentUser={currentUser} onEdit={handleEditClick} />
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="5" className="px-6 py-12 text-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="p-4 bg-slate-50 rounded-full">
                                                <User size={32} className="text-slate-300" />
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-slate-500 font-bold">No results found</p>
                                                <p className="text-slate-400 text-xs">Try adjusting your filters or search query.</p>
                                            </div>
                                            <button 
                                                onClick={clearFilters}
                                                className="mt-2 text-primary text-xs font-bold hover:underline"
                                            >
                                                Clear all filters
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Edit User Modal */}
            <EditUserModal 
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                onSuccess={fetchUsers}
                user={selectedUser}
            />

            {/* Create User Modal */}
            <CreateUserModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onSuccess={fetchUsers}
                requesterRole={currentUser?.role}
            />
        </div>
    );
};

export default UserManagement;