import { BrowserRouter as Router, Routes, Route, Outlet, Navigate } from 'react-router-dom';
import { useState } from 'react';
import { Menu } from 'lucide-react';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';

// Superuser Pages
import SuperuserDashboard from './pages/superuser/SuperuserDashboard';
import SuperuserUserManagement from './pages/superuser/SuperuserUserManagement';
import SuperuserAuditLog from './pages/superuser/SuperuserAuditLog';
import SuperuserMentors from './pages/superuser/SuperuserMentors';
import SuperuserProfile from './pages/superuser/SuperuserProfile';
import SuperuserCourseEditor from './pages/superuser/SuperuserCourseEditor';
import SuperuserCourseAnalytics from './pages/superuser/SuperuserCourseAnalytics';
import SuperuserReviews from './pages/superuser/SuperuserReviews';
import SuperuserStudents from './pages/superuser/SuperuserStudents';
import SuperuserCourses from './pages/superuser/SuperuserCourses';
import SuperuserBundles from './pages/superuser/SuperuserBundles';
import SuperuserCourseForum from './pages/superuser/SuperuserCourseForum';
import SuperuserCoupons from './pages/superuser/SuperuserCoupons';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminMentors from './pages/admin/AdminMentors';
import AdminUserManagement from './pages/admin/AdminUserManagement';
import AdminAuditLog from './pages/admin/AdminAuditLog';
import AdminProfile from './pages/admin/AdminProfile';
import AdminCourseEditor from './pages/admin/AdminCourseEditor';
import AdminCourseAnalytics from './pages/admin/AdminCourseAnalytics';
import AdminReviews from './pages/admin/AdminReviews';
import AdminCourses from './pages/admin/AdminCourses';
import AdminBundles from './pages/admin/AdminBundles';
import AdminCourseForum from './pages/admin/AdminCourseForum';
import AdminCoupons from './pages/admin/AdminCoupons';

// Mentor Pages
import MentorDashboard from './pages/mentor/MentorDashboard';
import MentorCourses from './pages/mentor/MentorCourses';
import MentorBundles from './pages/mentor/MentorBundles';
import MentorProfile from './pages/mentor/MentorProfile';
import MentorStudents from './pages/mentor/MentorStudents'; 
import MentorReviews from './pages/mentor/MentorReviews';
import MentorAuditLog from './pages/mentor/MentorAuditLog';
import MentorCourseEditor from './pages/mentor/MentorCourseEditor';
import MentorCourseAnalytics from './pages/mentor/MentorCourseAnalytics';
import MentorCourseForum from './pages/mentor/MentorCourseForum';
import MentorCoupons from './pages/mentor/MentorCoupons';

// Candidate Pages
import CandidateCurriculums from './pages/candidate/CandidateCurriculums';
import CandidateCourses from './pages/candidate/CandidateCourses';
import CandidateBundles from './pages/candidate/CandidateBundles';
import CandidateAchievements from './pages/candidate/CandidateAchievements';
import CandidateProfile from './pages/candidate/CandidateProfile';
import Certificate from './pages/candidate/Certificate';
import PaymentGateway from './pages/candidate/PaymentGateway';
import CartCheckout from './pages/candidate/CartCheckout';
import CandidatePurchases from './pages/candidate/CandidatePurchases';
import UserProfileView from './pages/shared/UserProfileView';
import PlatformInsights from './pages/shared/PlatformInsights';
import StudentInvoices from './pages/shared/StudentInvoices';
import AllInvoices from './pages/shared/AllInvoices';
import AdminStudents from './pages/admin/AdminStudents';
import CandidateCourseForum from './pages/candidate/CandidateCourseForum';

// Components
import ProtectedRoute from './components/auth/ProtectedRoute';
import Layout from './components/layouts/Layout';
import CourseViewer from './components/shared/CourseViewer';
import CertificationHub from './components/shared/CertificationHub';

// Contexts
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';

function App() {
    return (
        <AuthProvider>
            <CartProvider>
                <Router>
                    <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} newestOnTop />
                    <Routes>
                        {/* Public Routes */}
                        <Route path="/" element={<Home />} />
                        <Route path="/login" element={<Login />} />
                        <Route path="/register" element={<Register />} />

                        {/* Superuser Protected Routes */}
                        <Route element={<ProtectedRoute allowedRoles={['superuser']} />}>
                            <Route element={<Layout />}>
                                <Route path="/superuser" element={<SuperuserDashboard />} />
                                <Route path="/superuser/users" element={<SuperuserUserManagement />} />
                                <Route path="/superuser/mentors" element={<SuperuserMentors />} />
                                <Route path="/superuser/students" element={<SuperuserStudents />} />
                                <Route path="/superuser/user/:id" element={<UserProfileView />} />
                                <Route path="/superuser/auditLogs" element={<SuperuserAuditLog />} />
                                <Route path="/superuser/analytics/platform" element={<PlatformInsights />} />
                                <Route path="/superuser/courses" element={<SuperuserCourses />} />
                                <Route path="/superuser/bundles" element={<SuperuserBundles />} />
                                <Route path="/superuser/course/analytics/:id" element={<SuperuserCourseAnalytics />} />
                                <Route path="/superuser/course/forum/:courseId" element={<SuperuserCourseForum />} />
                                <Route path="/superuser/course/:id" element={<SuperuserCourseEditor />} />
                                <Route path="/superuser/reviews" element={<SuperuserReviews />} />
                                <Route path="/superuser/invoices" element={<AllInvoices />} />
                                <Route path="/superuser/invoices/:candidateId" element={<StudentInvoices />} />
                                <Route path="/superuser/coupons" element={<SuperuserCoupons />} />
                                <Route path="/superuser/profile" element={<SuperuserProfile />} />
                            </Route>
                        </Route>

                        {/* Admin Protected Routes */}
                        <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
                            <Route element={<Layout />}>
                                <Route path="/admin" element={<AdminDashboard />} />
                                <Route path="/admin/users" element={<AdminUserManagement />} />
                                <Route path="/admin/mentors" element={<AdminMentors />} />
                                <Route path="/admin/students" element={<AdminStudents />} />
                                <Route path="/admin/user/:id" element={<UserProfileView />} />
                                <Route path="/admin/auditLogs" element={<AdminAuditLog />} />
                                <Route path="/admin/analytics/platform" element={<PlatformInsights />} />
                                <Route path="/admin/courses" element={<AdminCourses />} />
                                <Route path="/admin/bundles" element={<AdminBundles />} />
                                <Route path="/admin/course/analytics/:id" element={<AdminCourseAnalytics />} />
                                <Route path="/admin/course/forum/:courseId" element={<AdminCourseForum />} />
                                <Route path="/admin/course/:id" element={<AdminCourseEditor />} />
                                <Route path="/admin/reviews" element={<AdminReviews />} />
                                <Route path="/admin/invoices" element={<AllInvoices />} />
                                <Route path="/admin/invoices/:candidateId" element={<StudentInvoices />} />
                                <Route path="/admin/coupons" element={<AdminCoupons />} />
                                <Route path="/admin/profile" element={<AdminProfile />} />
                            </Route>
                        </Route>

                        {/* Mentor Protected Routes */}
                        <Route element={<ProtectedRoute allowedRoles={['mentor']} />}>
                            <Route element={<Layout />}>
                                <Route path="/mentor" element={<MentorDashboard />} />
                                <Route path="/mentor/students" element={<MentorStudents />} />
                                <Route path="/mentor/audit-logs" element={<MentorAuditLog />} />
                                <Route path="/mentor/courses" element={<MentorCourses />} />
                                <Route path="/mentor/bundles" element={<MentorBundles />} />
                                <Route path="/mentor/course/analytics/:id" element={<MentorCourseAnalytics />} />
                                <Route path="/mentor/course/forum/:courseId" element={<MentorCourseForum />} />
                                <Route path="/mentor/course/:id" element={<MentorCourseEditor />} />
                                <Route path="/mentor/reviews" element={<MentorReviews />} />
                                <Route path="/mentor/invoices" element={<AllInvoices />} />
                                <Route path="/mentor/invoices/:candidateId" element={<StudentInvoices />} />
                                <Route path="/mentor/coupons" element={<MentorCoupons />} />
                                <Route path="/mentor/profile" element={<MentorProfile />} />
                            </Route>
                        </Route>

                        {/* Immersive Course Viewer — No Layout */}
                        <Route element={<ProtectedRoute allowedRoles={['mentor', 'candidate', 'admin', 'superuser']} />}>
                            <Route path="/courses/view/:id" element={<CourseViewer />} />
                            <Route path="/courses/certification/:id" element={<CertificationHub />} />
                            <Route path="/courses/certificate/:id" element={<Certificate />} />
                        </Route>

                        {/* Candidate Protected Routes */}
                        <Route element={<ProtectedRoute allowedRoles={['candidate']} />}>
                            <Route element={<Layout />}>
                                <Route path="/candidate" element={<CandidateCurriculums />} />
                                <Route path="/candidate/courses" element={<CandidateCourses />} />
                                <Route path="/candidate/bundles" element={<CandidateBundles />} />
                                <Route path="/candidate/achievements" element={<CandidateAchievements />} />
                                <Route path="/candidate/profile" element={<CandidateProfile />} />
                                <Route path="/candidate/payment" element={<PaymentGateway />} />
                                <Route path="/candidate/cart/checkout" element={<CartCheckout />} />
                                <Route path="/candidate/purchases" element={<CandidatePurchases />} />
                                <Route path="/candidate/course/forum/:courseId" element={<CandidateCourseForum />} />
                            </Route>
                        </Route>

                        {/* Catch-all Redirect */}
                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                </Router>
            </CartProvider>
        </AuthProvider>
    );
}

export default App;
