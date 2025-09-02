import React from 'react';
import { motion } from 'framer-motion';
// import { useAuth } from '../context/AuthContext'; // This will be used in your actual project
import { Navigate } from 'react-router-dom';
import { User, Mail, Phone, School, GraduationCap, BookOpen, Hash, Briefcase, Calendar, UserCheck } from 'lucide-react';

const ProfileDetail = ({ icon, label, value }) => {
    if (!value) return null; // Don't render if value is not present
    return (
        <div className="flex items-start gap-4">
            <div className="text-[#df9400] mt-1">{icon}</div>
            <div>
                <p className="text-sm text-gray-500">{label}</p>
                <p className="font-semibold text-gray-800">{value}</p>
            </div>
        </div>
    );
};

const ProfilePage = () => {
    // A placeholder hook to provide auth context since the original file cannot be resolved.
    const useAuth = () => ({
        isAuthenticated: true,
        user: {
            full_name: 'Satchi User',
            email: 'satchi.user@amrita.edu',
            phone: '9876543210',
            role: 'Student',
            school: 'Amrita School of Engineering',
            degree: 'B.Tech',
            course: 'Computer Science and Engineering',
            roll_no: 'CB.EN.U4CSE21001',
            current_year: '3',
            position: null, // This won't be rendered as it's null
        }
    });

    const { user, isAuthenticated } = useAuth();

    // If the user is not authenticated, redirect to the login page
    if (!isAuthenticated) {
        return <Navigate to="/login" />;
    }

    return (
        <div className="relative w-full min-h-screen px-4 sm:px-6 lg:px-8 py-20 font-body text-gray-800">
            {/* Themed Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-white via-amber-50 to-orange-100 z-0"></div>
            <div className="absolute top-0 left-0 w-full h-full bg-grid-gray-200/[0.4] z-0"></div>

            <div className="relative z-10 max-w-4xl mx-auto pt-16">
                <motion.div
                    initial={{ opacity: 0, y: -50 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7 }}
                    className="text-center mb-12"
                >
                    <h1 className="text-4xl sm:text-5xl md:text-6xl font-heading font-bold bg-gradient-to-r from-[#ff6a3c] via-[#df9400] to-[#ff6a3c] bg-clip-text text-transparent">
                        User Profile
                    </h1>
                    <p className="text-lg text-gray-600 mt-4">
                        Welcome, {user?.full_name || 'User'}!
                    </p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="bg-white/80 border border-gray-200/90 rounded-2xl p-6 sm:p-8 backdrop-blur-lg shadow-xl"
                >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                        <ProfileDetail icon={<User size={20} />} label="Full Name" value={user?.full_name} />
                        <ProfileDetail icon={<Mail size={20} />} label="Email" value={user?.email} />
                        <ProfileDetail icon={<Phone size={20} />} label="Phone" value={user?.phone} />
                        <ProfileDetail icon={<UserCheck size={20} />} label="Role" value={user?.role} />

                        {/* Student-specific fields */}
                        <ProfileDetail icon={<School size={20} />} label="School" value={user?.school} />
                        <ProfileDetail icon={<GraduationCap size={20} />} label="Degree" value={user?.degree} />
                        <ProfileDetail icon={<BookOpen size={20} />} label="Course" value={user?.course} />
                        <ProfileDetail icon={<Hash size={20} />} label="Roll Number" value={user?.roll_no} />
                        <ProfileDetail icon={<Calendar size={20} />} label="Current Year" value={user?.current_year} />
                        
                        {/* Faculty-specific fields */}
                        <ProfileDetail icon={<Briefcase size={20} />} label="Position" value={user?.position} />
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default ProfilePage;