import React, { useEffect, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { motion } from "framer-motion";
import { AlertTriangle, ArrowLeft, Loader, ShieldCheck } from "lucide-react";

import ProjectSubmissionForm from "../Components/projects/ProjectSubmissionForm";
import { useAuth } from "../context/AuthContext";
import { API_URL } from "../lib/api";

const ManualTeamEntryPage = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!eventId) {
      setLoading(false);
      setError("No competition selected for manual entry.");
      return;
    }

    const fetchEventDetails = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${API_URL}/events/details/${eventId}/`);
        setEvent(response.data);
      } catch (requestError) {
        console.error("Failed to load event details:", requestError);
        setError("Could not load competition details.");
      } finally {
        setLoading(false);
      }
    };

    fetchEventDetails();
  }, [eventId]);

  const submitProject = async (payload) => {
    await axios.post(`${API_URL}/api/submit-project/${event.eventId}/`, payload, {
      headers: { "Content-Type": "application/json" },
    });
  };

  const allowedRoles = [
    "SUPERADMIN",
    "EVENTADMIN",
    "EVENTMANAGER",
    "SUBEVENTADMIN",
    "SUBEVENTMANAGER",
    "SUBSUBEVENTMANAGER",
  ];

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  if (user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/admin" />;
  }

  return (
    <div className="relative min-h-screen w-full px-4 py-20 font-body text-gray-800 sm:px-6 lg:px-8">
      <div className="absolute inset-0 z-0 bg-gradient-to-br from-white via-amber-50 to-orange-100" />
      <div className="absolute left-0 top-0 z-0 h-full w-full bg-grid-gray-200/[0.4]" />

      <div className="relative z-10 mx-auto max-w-6xl pt-16">
        <motion.div
          initial={{ opacity: 0, y: -40 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 flex flex-col gap-4 rounded-3xl border border-gray-200 bg-white/75 p-5 shadow-sm backdrop-blur-md sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="flex items-start gap-4">
            <button
              type="button"
              onClick={() => navigate("/admin")}
              className="mt-1 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-100 text-[#ff6a3c] transition hover:bg-orange-200"
              aria-label="Back to admin dashboard"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="bg-gradient-to-r from-[#ff6a3c] via-[#df9400] to-[#ff6a3c] bg-clip-text pb-1 text-3xl font-bold text-transparent sm:text-5xl">
                Manual Team Entry
              </h1>
              <p className="mt-2 max-w-3xl text-sm text-gray-600 sm:text-base">
                Add a project, the full team, TRL, and SDGs on behalf of a competition team.
              </p>
            </div>
          </div>
          <div className="self-start rounded-2xl bg-gray-100 px-4 py-3 text-sm font-semibold text-gray-600">
            Acting as <span className="text-gray-900">{user?.full_name || user?.email}</span>
          </div>
        </motion.div>

        {loading && (
          <div className="flex items-center justify-center py-10">
            <Loader className="animate-spin text-[#ff6a3c]" size={40} />
          </div>
        )}

        {error && (
          <div className="mb-8 rounded-2xl border border-red-300 bg-red-100 p-4 text-red-700">
            <div className="flex items-center gap-2 font-semibold">
              <AlertTriangle size={18} />
              {error}
            </div>
          </div>
        )}

        {event && (
          <div className="mb-8 rounded-2xl border border-blue-100 bg-blue-50/80 p-5 text-sm text-gray-600 shadow-sm">
            <div className="mb-2 flex items-center gap-2 font-semibold text-gray-800">
              <ShieldCheck size={16} className="text-blue-500" />
              Competition context
            </div>
            <p className="leading-6">
              You are adding a team for <span className="font-semibold text-gray-900">{event.name}</span>. The backend
              still validates team size and mentor requirements against this competition.
            </p>
          </div>
        )}

        {event && (
          <ProjectSubmissionForm
            event={event}
            captainDefaults={{}}
            submitLabel="Save Team Entry"
            submitProject={submitProject}
            successRedirectPath="/admin"
            successMessage="Team saved successfully. Returning to the dashboard..."
          />
        )}
      </div>
    </div>
  );
};

export default ManualTeamEntryPage;
