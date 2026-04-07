import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { motion } from "framer-motion";
import { AlertTriangle, BookOpen, Loader } from "lucide-react";

import { useAuth } from "../context/AuthContext";
import ProjectSubmissionForm from "../Components/projects/ProjectSubmissionForm";
import { API_URL } from "../lib/api";

const EventRules = ({ event }) => (
  <motion.div
    initial={{ opacity: 0, y: -20 }}
    animate={{ opacity: 1, y: 0 }}
    className="mx-auto mb-10 max-w-4xl rounded-2xl border border-gray-200/80 bg-white/70 p-6 shadow-xl backdrop-blur-lg"
  >
    <div className="mb-4 flex items-center gap-3">
      <BookOpen className="text-[#df9400]" size={24} />
      <h2 className="text-2xl font-bold text-gray-800">
        Rules for: <span className="text-[#ff6a3c]">{event.name}</span>
      </h2>
    </div>
    <div className="prose prose-sm whitespace-pre-wrap text-gray-600">
      {event.rules || "No specific rules provided for this event."}
    </div>
  </motion.div>
);

const Registration = () => {
  const { eventId } = useParams();
  const { user } = useAuth();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!eventId) {
      setLoading(false);
      setError("No event specified for registration.");
      return;
    }

    const fetchEventDetails = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${API_URL}/events/details/${eventId}/`);
        setEvent(response.data);
      } catch (requestError) {
        console.error("Failed to fetch event details:", requestError);
        setError("Could not load event details. Please try again.");
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

  return (
    <div className="relative min-h-screen w-full px-4 py-20 font-body text-gray-800 sm:px-6 lg:px-8">
      <div className="absolute inset-0 z-0 bg-gradient-to-br from-white via-amber-50 to-orange-100" />
      <div className="absolute left-0 top-0 z-0 h-full w-full bg-grid-gray-200/[0.4]" />

      <div className="relative z-10 pt-16">
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="mb-12 text-center"
        >
          <h1 className="bg-gradient-to-r from-[#ff6a3c] via-[#df9400] to-[#ff6a3c] bg-clip-text text-4xl font-bold text-transparent sm:text-5xl md:text-6xl">
            Event Registration
          </h1>
          <p className="mt-4 text-lg text-gray-600">
            Register your team, capture project details, and map every member properly.
          </p>
        </motion.div>

        {loading && (
          <div className="flex items-center justify-center py-10">
            <Loader className="animate-spin text-[#ff6a3c]" size={40} />
          </div>
        )}

        {error && (
          <div className="mx-auto mb-8 max-w-4xl rounded-lg border border-red-400 bg-red-100 p-4 text-center text-red-700">
            <AlertTriangle className="mr-2 inline-block" />
            {error}
          </div>
        )}

        {event && <EventRules event={event} />}

        {event ? (
          <ProjectSubmissionForm
            event={event}
            captainDefaults={user}
            lockCaptainIdentity
            submitLabel="Submit Registration"
            submitProject={submitProject}
            successRedirectPath="/events"
          />
        ) : (
          !loading && <p className="text-center text-gray-500">Please select an event to register.</p>
        )}
      </div>
    </div>
  );
};

export default Registration;
