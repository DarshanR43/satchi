import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Loader } from 'lucide-react';

import EventSidebar from '../components/events/EventCards';
import EventContent from '../components/events/StatusPill';
import SubSubEventModal from '../components/events/SubSubEventModal';

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

const EventsPage = () => {
  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState(null);
  const [selectedSubEvent, setSelectedSubEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { token } = useAuth();

  useEffect(() => {
    const fetchEvents = async () => {
      if (!token) {
        setError("You must be logged in to view events.");
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const response = await axios.get(`${API_URL}/events/getEvents/`, {
          headers: { 'Authorization': `Token ${token}` },
        });
        setEvents(response.data);
        if (response.data && response.data.length > 0) {
          setSelectedEventId(response.data[0].id);
        }
      } catch (err) {
        setError("Failed to load events. Please try again later.");
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, [token]);

  const handleRegister = (eventToRegister) => {
    navigate(`/register/${eventToRegister.id}`);
  };

  const handleOpenModal = (subEvent) => {
    setSelectedSubEvent(subEvent);
  };
  
  const handleCloseModal = () => {
    setSelectedSubEvent(null);
  };

  const selectedEvent = events.find(e => e.id === selectedEventId);

  return (
    <>
      <SubSubEventModal 
        subEvent={selectedSubEvent} 
        isOpen={!!selectedSubEvent} 
        onClose={handleCloseModal} 
        onRegister={handleRegister} 
      />
      <div className="w-full min-h-screen bg-gradient-to-br from-white via-amber-50 to-orange-100 font-body text-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
            <motion.div 
                initial={{ opacity: 0, y: -40 }} 
                animate={{ opacity: 1, y: 0 }} 
                transition={{ duration: 0.7 }} 
                className="text-center mt-12 mb-12"
            >
                <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-[#ff6a3c] via-[#df9400] to-[#ff6a3c] bg-clip-text text-transparent pb-2">
                    Tech Fest Events
                </h1>
                <p className="text-lg text-gray-600 mt-3">Discover, participate, and innovate.</p>
            </motion.div>

            {loading && (
                <div className="flex justify-center items-center py-10"><Loader className="animate-spin text-[#ff6a3c]" size={40} /></div>
            )}
            
            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 text-center p-4 rounded-md max-w-2xl mx-auto"><p>{error}</p></div>
            )}

            {!loading && !error && events.length > 0 && (
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    <EventSidebar 
                        events={events}
                        selectedEventId={selectedEventId}
                        onSelectEvent={setSelectedEventId}
                    />
                    <div className="lg:col-span-3">
                        {selectedEvent && (
                            <EventContent 
                                key={selectedEvent.id} // Important for re-animation
                                event={selectedEvent}
                                onOpenModal={handleOpenModal}
                            />
                        )}
                    </div>
                </div>
            )}
        </div>
      </div>
    </>
  );
};

export default EventsPage;