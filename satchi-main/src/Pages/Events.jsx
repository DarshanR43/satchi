import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, X, Loader } from 'lucide-react';
import axios from 'axios';

// --- API Service ---
// Use Vite's import.meta.env for environment variables
const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api/';

const getEvents = async () => {
  try {
    const response = await axios.get(`${API_URL}events/getEvents`, {
      headers: { 'Content-Type': 'application/json' },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching events:", error);
    throw error;
  }
};

// --- Sub-Sub-Event Modal Component ---
const SubSubEventsModal = ({ subEvent, isOpen, onClose, onRegister }) => {
  if (!isOpen || !subEvent) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, y: 50 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 50 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="bg-white/10 border border-white/20 backdrop-blur-lg rounded-xl w-full max-w-5xl mx-auto shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between p-4 border-b border-white/10">
            <h2 className="text-2xl font-bold text-white">{subEvent.name}</h2>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-white/20 transition-colors">
              <X size={24} className="text-gray-300" />
            </button>
          </div>
          <div className="p-6 max-h-[60vh] overflow-y-auto">
            <p className="text-gray-400 mb-6">{subEvent.description}</p>
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-accent border-b border-accent/30 pb-2 mb-4">
                Competitions & Workshops
              </h3>
              {subEvent.subSubEvents && subEvent.subSubEvents.length > 0 ? (
                subEvent.subSubEvents.map(ssEvent => {
                  const isRegistrationOpen = subEvent.isOpen && ssEvent.isOpen;
                  return (
                    <div
                      key={ssEvent.id}
                      className="bg-black/30 p-4 rounded-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
                    >
                      <div>
                        <h4 className="font-semibold text-white">{ssEvent.name}</h4>
                        <p className="text-sm text-gray-400 mt-1">{ssEvent.description}</p>
                      </div>
                      <button
                        onClick={() => onRegister(ssEvent)}
                        disabled={!isRegistrationOpen}
                        className="px-4 py-2 w-full sm:w-auto rounded-md text-sm font-bold bg-accent text-deepBlue transition-all duration-300 disabled:bg-gray-600 disabled:cursor-not-allowed hover:enabled:shadow-[0_0_15px_#FFAB00] flex-shrink-0"
                      >
                        Register
                      </button>
                    </div>
                  )
                })
              ) : (
                <p className="text-gray-500 text-center py-4">No specific events announced yet. Stay tuned!</p>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

// --- Main Events Component ---
const Events = () => {
  const [events, setEvents] = useState([]);
  const [expandedEvents, setExpandedEvents] = useState({});
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedSubEvent, setSelectedSubEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        const data = await getEvents();
        setEvents(data);

        if (data && data.length > 0) {
          setExpandedEvents({ [data[0].id]: true });
        }
      } catch (err) {
        setError("Failed to load events. Please check the connection or try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  const handleRegister = (eventToRegister) => {
    navigate(`/register/${eventToRegister.id}`);
  };

  const toggleExpand = (eventId) => {
    setExpandedEvents(prev => ({ ...prev, [eventId]: !prev[eventId] }));
  };

  const openModal = (subEvent) => {
    setSelectedSubEvent(subEvent);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelectedSubEvent(null);
  };

  return (
    <>
      <SubSubEventsModal
        subEvent={selectedSubEvent}
        isOpen={modalOpen}
        onClose={closeModal}
        onRegister={handleRegister}
      />
      <div className="relative w-full min-h-screen px-4 sm:px-6 lg:px-8 py-20 pt-32 text-white font-sans bg-black">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="text-center mb-12"
          >
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
              University Events
            </h1>
            <p className="text-lg text-gray-400 mt-4">
              Discover, participate, and innovate.
            </p>
          </motion.div>

          {loading && (
            <div className="flex justify-center items-center py-10">
              <Loader className="animate-spin text-accent" size={40} />
            </div>
          )}

          {error && (
            <div className="bg-red-500/20 border border-red-500 text-red-300 text-center p-4 rounded-lg">
              <p>{error}</p>
            </div>
          )}

          {!loading && !error && (
            <div className="space-y-6">
              <AnimatePresence>
                {events.map((event) => (
                  <motion.div
                    key={event.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.5, ease: 'easeInOut' }}
                    className="bg-white/5 border border-white/10 rounded-xl overflow-hidden backdrop-blur-sm"
                  >
                    <div
                      className="flex items-center justify-between p-4 sm:p-6 cursor-pointer hover:bg-white/10 transition-colors"
                      onClick={() => toggleExpand(event.id)}
                    >
                      <div className="flex items-center gap-4">
                        <span className={`w-3 h-3 rounded-full ${event.isOpen ? 'bg-green-500' : 'bg-red-500'}`}></span>
                        <h2 className="text-xl sm:text-2xl font-bold">{event.name}</h2>
                        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${event.isOpen ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>
                          {event.isOpen ? 'Open' : 'Closed'}
                        </span>
                      </div>
                      <div className="flex items-center gap-4">
                        <ChevronDown size={24} className={`transition-transform duration-300 ${expandedEvents[event.id] ? 'rotate-180' : ''}`} />
                      </div>
                    </div>

                    <AnimatePresence>
                      {expandedEvents[event.id] && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.4, ease: 'easeInOut' }}
                          className="border-t border-white/10"
                        >
                          <div className="p-4 sm:p-6 space-y-4">
                            {event.subEvents.map((subEvent) => {
                              const isClickable = event.isOpen;
                              return (
                                <button
                                  key={subEvent.id}
                                  onClick={() => isClickable && openModal(subEvent)}
                                  disabled={!isClickable}
                                  className="w-full text-left flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-black/20 p-4 rounded-lg hover:bg-black/40 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                                >
                                  <div className="flex-grow">
                                    <div className="flex items-center gap-3 mb-1">
                                      <span className={`text-xs font-semibold px-2 py-1 rounded-full ${subEvent.isOpen ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>
                                        {subEvent.isOpen ? 'Open' : 'Closed'}
                                      </span>
                                      <h3 className="font-semibold text-lg">{subEvent.name}</h3>
                                    </div>
                                    <p className="text-gray-400 text-sm">{subEvent.description}</p>
                                  </div>
                                  <div className="flex items-center gap-2 self-end sm:self-center flex-shrink-0">
                                    <span className="text-xs text-gray-400">View</span>
                                    <ChevronDown size={20} className="-rotate-90" />
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Events;
