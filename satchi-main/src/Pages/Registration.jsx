import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Loader, AlertTriangle, BookOpen } from 'lucide-react';
import RegistrationForm from '../Components/RegistrationForm';

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api/';

// New component to display event rules
const EventRules = ({ event }) => (
    <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-10 bg-white/5 border border-white/10 rounded-xl p-6 backdrop-blur-md"
    >
        <div className="flex items-center gap-3 mb-4">
            <BookOpen className="text-accent" size={24} />
            <h2 className="text-2xl font-bold text-white">Rules for: <span className="text-accent">{event.name}</span></h2>
        </div>
        <div className="prose prose-invert prose-sm text-gray-300 whitespace-pre-wrap">
            {event.rules || "No specific rules provided for this event."}
        </div>
    </motion.div>
);

const Registration = () => {
    const { eventId } = useParams(); // Get eventId from URL
    const [event, setEvent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        // If there's no eventId, we don't need to fetch anything
        if (!eventId) {
            setLoading(false);
            return;
        }

        const fetchEventDetails = async () => {
            try {
                setLoading(true);
                const response = await axios.get(`${API_URL}events/details/${eventId}/`);
                setEvent(response.data);
            } catch (err) {
                console.error("Failed to fetch event details:", err);
                setError("Could not load event details. Please try again.");
            } finally {
                setLoading(false);
            }
        };

        fetchEventDetails();
    }, [eventId]);

    return (
        <div className="relative w-full min-h-screen px-6 pb-20 pt-24 text-white font-body overflow-hidden bg-darkBg">
            {loading && (
                <div className="flex justify-center items-center py-10">
                    <Loader className="animate-spin text-accent" size={40} />
                </div>
            )}

            {error && (
                <div className="max-w-3xl mx-auto bg-red-500/20 border border-red-500 text-red-300 text-center p-4 rounded-lg mb-8">
                    <AlertTriangle className="inline-block mr-2" />
                    {error}
                </div>
            )}
            
            {/* If an event was fetched, display its rules */}
            {event && <EventRules event={event} />}

            {/* Pass event details down to the form */}
            <RegistrationForm
                eventId={event?.id}
                minTeamSize={event?.minTeamSize}
                maxTeamSize={event?.maxTeamSize}
                isFacultyMentorRequired={event?.isFacultyMentorRequired}
            />
        </div>
    );
};

export default Registration;
