import React from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';
import { User, Mail, Phone, School, GraduationCap, BookOpen, Hash, Briefcase, Calendar, UserCheck } from 'lucide-react';

const ProfileDetail = ({ icon, label, value }) => {
    if (!value) return null; // Don't render if value is not present
    return (
        <div className="flex items-start gap-4">
            <div className="text-accent mt-1">{icon}</div>
            <div>
                <p className="text-sm text-gray-400">{label}</p>
                <p className="font-semibold text-white">{value}</p>
            </div>
        </div>
    );
};

const ProfilePage = () => {
    const { user, isAuthenticated } = useAuth();

    // If the user is not authenticated, redirect to the login page
    if (!isAuthenticated) {
        return <Navigate to="/login" />;
    }

    return (
        <div className="relative w-full min-h-screen px-4 sm:px-6 lg:px-8 py-20 pt-32 text-white font-body bg-black">
            <div className="max-w-4xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: -50 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7 }}
                    className="text-center mb-12"
                >
                    <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold bg-gradient-to-r from-accent to-vibrant bg-clip-text text-transparent">
                        User Profile
                    </h1>
                    <p className="text-lg text-gray-400 mt-4">
                        Welcome, {user?.full_name || 'User'}!
                    </p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="bg-white/5 border border-white/10 rounded-xl p-6 sm:p-8 backdrop-blur-md"
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
