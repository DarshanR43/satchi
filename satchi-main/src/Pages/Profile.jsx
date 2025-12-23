import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';
import { User, Mail, Phone, School, GraduationCap, BookOpen, Hash, Briefcase, Calendar, UserCheck, Layers, Users, CalendarRange } from 'lucide-react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

const ProfileDetail = ({ icon, label, value }) => {
    if (!value) return null;
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
    const { user, isAuthenticated } = useAuth();
    const [registrations, setRegistrations] = useState([]);
    const [registrationsLoading, setRegistrationsLoading] = useState(true);
    const [registrationsError, setRegistrationsError] = useState(null);

    useEffect(() => {
        const fetchRegistrations = async () => {
            if (!isAuthenticated) {
                setRegistrationsLoading(false);
                return;
            }
            try {
                const response = await axios.get(`${API_URL}/api/my-registrations/`);
                setRegistrations(response.data?.registrations || []);
                setRegistrationsError(null);
            } catch (error) {
                console.error('Failed to load registrations:', error);
                setRegistrationsError('Could not load your registered events right now.');
            } finally {
                setRegistrationsLoading(false);
            }
        };

        fetchRegistrations();
    }, [isAuthenticated]);

    const formatDateTime = (isoString) => {
        if (!isoString) return 'Unknown';
        const date = new Date(isoString);
        if (Number.isNaN(date.getTime())) {
            return 'Unknown';
        }
        return date.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
    };

    const RegistrationCard = ({ registration }) => {
        const { event, subEvent, mainEvent, teamName, projectTopic, role, registeredAt } = registration;
        return (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="bg-white/75 border border-gray-200 rounded-2xl p-5 shadow-md backdrop-blur"
            >
                <p className="text-xs font-semibold text-[#df9400] uppercase tracking-wide mb-1">{role}</p>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{event?.name || 'Event'}</h3>
                <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                        <Layers size={16} className="text-[#ff6a3c]" />
                        <span>{[mainEvent?.name, subEvent?.name, event?.name].filter(Boolean).join(' › ')}</span>
                    </div>
                    {teamName && (
                        <div className="flex items-center gap-2">
                            <Users size={16} className="text-[#ff6a3c]" />
                            <span className="font-medium text-gray-700">Team: {teamName}</span>
                        </div>
                    )}
                    {projectTopic && (
                        <p className="text-gray-500 leading-5">{projectTopic}</p>
                    )}
                    <div className="flex items-center gap-2 text-gray-500">
                        <CalendarRange size={16} className="text-[#ff6a3c]" />
                        <span>Registered on {formatDateTime(registeredAt)}</span>
                    </div>
                </div>
            </motion.div>
        );
    };

    if (!isAuthenticated) {
        return <Navigate to="/login" />;
    }

    return (
        <div className="relative w-full min-h-screen px-4 sm:px-6 lg:px-8 py-20 font-body text-gray-800">
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
                        <ProfileDetail icon={<GraduationCap size={20} />} label="Degree" value={user?.degree} />
                        <ProfileDetail icon={<BookOpen size={20} />} label="Course" value={user?.course} />
                        <ProfileDetail icon={<Hash size={20} />} label="Roll Number" value={user?.roll_no} />
                        <ProfileDetail icon={<Calendar size={20} />} label="Current Year" value={user?.current_year} />
                        
                        <ProfileDetail icon={<Briefcase size={20} />} label="Position" value={user?.position} />
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                    className="mt-10 bg-white/80 border border-gray-200/90 rounded-2xl p-6 sm:p-8 backdrop-blur-lg shadow-xl"
                >
                    <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
                        <h2 className="text-2xl font-bold text-gray-800">Your Registered Events</h2>
                        <span className="text-sm text-gray-500">{registrations.length} registrations</span>
                    </div>

                    {registrationsLoading && (
                        <p className="text-sm text-gray-500">Fetching your registrations...</p>
                    )}

                    {!registrationsLoading && registrationsError && (
                        <div className="bg-red-100 border border-red-300 text-red-700 text-sm rounded-lg p-3">
                            {registrationsError}
                        </div>
                    )}

                    {!registrationsLoading && !registrationsError && registrations.length === 0 && (
                        <p className="text-sm text-gray-500">You have not registered for any events yet. Head to the events page to explore opportunities.</p>
                    )}

                    {!registrationsLoading && !registrationsError && registrations.length > 0 && (
                        <div className="grid grid-cols-1 gap-4">
                            {registrations.map((registration) => (
                                <RegistrationCard key={`${registration.projectId}-${registration.role}`} registration={registration} />
                            ))}
                        </div>
                    )}
                </motion.div>
            </div>
        </div>
    );
};

export default ProfilePage;
