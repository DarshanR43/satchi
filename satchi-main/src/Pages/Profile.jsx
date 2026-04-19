import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Navigate } from "react-router-dom";
import {
  BookOpen,
  Briefcase,
  Calendar,
  CalendarRange,
  Cpu,
  GraduationCap,
  Hash,
  Layers,
  Mail,
  Phone,
  Target,
  User,
  UserCheck,
  Users,
} from "lucide-react";
import axios from "axios";

import { useAuth } from "../context/AuthContext";
import { API_URL } from "../lib/api";
import { getProjectCategoryLabel, SDG_OPTIONS } from "../lib/projectMeta";

const ProfileDetail = ({ icon, label, value }) => {
  if (!value) return null;
  return (
    <div className="flex items-start gap-4">
      <div className="mt-1 text-[#df9400]">{icon}</div>
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
        console.error("Failed to load registrations:", error);
        setRegistrationsError("Could not load your registered events right now.");
      } finally {
        setRegistrationsLoading(false);
      }
    };

    fetchRegistrations();
  }, [isAuthenticated]);

  const formatDateTime = (isoString) => {
    if (!isoString) return "Unknown";
    const date = new Date(isoString);
    if (Number.isNaN(date.getTime())) {
      return "Unknown";
    }
    return date.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
  };

  const RegistrationCard = ({ registration }) => {
    const {
      event,
      subEvent,
      mainEvent,
      teamName,
      projectTopic,
      projectCategory,
      role,
      registeredAt,
      captain,
      teamMembers,
      trlLevel,
      sdgs,
      facultyMentorName,
    } = registration;

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="rounded-2xl border border-gray-200 bg-white/75 p-5 shadow-md backdrop-blur"
      >
        <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-[#df9400]">{role}</p>
        <h3 className="mb-2 text-lg font-bold text-gray-900">{event?.name || "Event"}</h3>
        <div className="space-y-3 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <Layers size={16} className="text-[#ff6a3c]" />
            <span>{[mainEvent?.name, subEvent?.name, event?.name].filter(Boolean).join(" > ")}</span>
          </div>
          {teamName && (
            <div className="flex items-center gap-2">
              <Users size={16} className="text-[#ff6a3c]" />
              <span className="font-medium text-gray-700">Team: {teamName}</span>
            </div>
          )}
          {projectTopic && <p className="leading-5 text-gray-500">{projectTopic}</p>}
          {projectCategory && (
            <div className="flex items-center gap-2">
              <Cpu size={16} className="text-[#ff6a3c]" />
              <span>{getProjectCategoryLabel(projectCategory)}</span>
            </div>
          )}
          {trlLevel && (
            <div className="flex items-center gap-2">
              <Target size={16} className="text-[#ff6a3c]" />
              <span>TRL {trlLevel}</span>
            </div>
          )}
          {sdgs?.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {sdgs.map((sdg) => {
                const option = SDG_OPTIONS.find((entry) => entry.value === Number(sdg));
                return (
                  <span
                    key={`${registration.projectId}-sdg-${sdg}`}
                    className="rounded-full bg-orange-100 px-2.5 py-1 text-xs font-semibold text-[#df9400]"
                  >
                    {option?.label || `SDG ${sdg}`}
                  </span>
                );
              })}
            </div>
          )}
          {captain && (
            <div className="rounded-xl border border-gray-200 bg-white/80 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Captain</p>
              <p className="font-semibold text-gray-800">{captain.name}</p>
              <p>{captain.email}</p>
              {captain.phone && <p>{captain.phone}</p>}
            </div>
          )}
          {teamMembers?.length > 0 && (
            <div className="rounded-xl border border-gray-200 bg-white/80 p-3">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">Team Members</p>
              <div className="space-y-2">
                {teamMembers.map((member, index) => (
                  <div key={`${registration.projectId}-member-${member.email || index}`} className="text-sm text-gray-600">
                    <p className="font-medium text-gray-800">{member.name || "Unnamed member"}</p>
                    {member.email && <p>{member.email}</p>}
                    {member.phone && <p>{member.phone}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}
          {facultyMentorName && (
            <div className="flex items-center gap-2">
              <Briefcase size={16} className="text-[#ff6a3c]" />
              <span>Faculty Mentor: {facultyMentorName}</span>
            </div>
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
    <div className="relative min-h-screen w-full px-4 py-20 font-body text-gray-800 sm:px-6 lg:px-8">
      <div className="absolute inset-0 z-0 bg-gradient-to-br from-white via-amber-50 to-orange-100" />
      <div className="absolute left-0 top-0 z-0 h-full w-full bg-grid-gray-200/[0.4]" />

      <div className="relative z-10 mx-auto max-w-5xl pt-16">
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="mb-12 text-center"
        >
          <h1 className="bg-gradient-to-r from-[#ff6a3c] via-[#df9400] to-[#ff6a3c] bg-clip-text text-4xl font-bold text-transparent sm:text-5xl md:text-6xl">
            User Profile
          </h1>
          <p className="mt-4 text-lg text-gray-600">Welcome, {user?.full_name || "User"}!</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="rounded-2xl border border-gray-200/90 bg-white/80 p-6 shadow-xl backdrop-blur-lg sm:p-8"
        >
          <div className="grid grid-cols-1 gap-x-8 gap-y-6 md:grid-cols-2">
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
          className="mt-10 rounded-2xl border border-gray-200/90 bg-white/80 p-6 shadow-xl backdrop-blur-lg sm:p-8"
        >
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-2xl font-bold text-gray-800">Your Registered Events</h2>
            <span className="text-sm text-gray-500">{registrations.length} registrations</span>
          </div>

          {registrationsLoading && <p className="text-sm text-gray-500">Fetching your registrations...</p>}

          {!registrationsLoading && registrationsError && (
            <div className="rounded-lg border border-red-300 bg-red-100 p-3 text-sm text-red-700">
              {registrationsError}
            </div>
          )}

          {!registrationsLoading && !registrationsError && registrations.length === 0 && (
            <p className="text-sm text-gray-500">
              You have not registered for any events yet. Head to the events page to explore opportunities.
            </p>
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
