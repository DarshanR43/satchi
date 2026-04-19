"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../lib/api';
import { 
  Loader, 
  ChevronRight, 
  Trophy, 
  Info, 
  ArrowLeft,
  CalendarDays,
  Users
} from 'lucide-react';

import SubSubEventModal from '../Components/events/SubSubEventModal';

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
      try {
        setLoading(true);
        const config = token ? { headers: { 'Authorization': `Token ${token}` } } : {};
        const response = await axios.get(`${API_URL}/events/getEvents/`, config);
        setEvents(response.data);
        if (response.data?.length > 0 && !selectedEventId) {
          setSelectedEventId(response.data[0].id);
        }
      } catch (err) {
        console.error(err);
        setError("Failed to load events.");
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, [token]);

  const selectedEvent = useMemo(() => 
    events.find(e => e.id === selectedEventId), 
    [events, selectedEventId]
  );

  const handleRegister = (eventToRegister) => {
    if (!token) { navigate('/login'); return; }
    navigate(`/register/${eventToRegister.id}`);
  };

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-amber-50">
      <Loader className="animate-spin text-[#ff6a3c] mb-4" size={48} />
      <span className="text-gray-500 font-medium">Syncing Fest Data...</span>
    </div>
  );

  return (
    <div className="relative w-full min-h-screen font-body text-gray-800">
      {/* Admin Theme Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-white via-amber-50 to-orange-100 z-0" />
      <div className="absolute top-0 left-0 w-full h-full bg-grid-gray-200/[0.4] z-0" />

      <SubSubEventModal 
        subEvent={selectedSubEvent} 
        isOpen={!!selectedSubEvent} 
        onClose={() => setSelectedSubEvent(null)} 
        onRegister={handleRegister} 
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-24">
        
        {/* Header - Matching Admin Dashboard Style */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }} 
          animate={{ opacity: 1, y: 0 }}
          className="mb-12 text-center"
        >
          <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-[#ff6a3c] via-[#df9400] to-[#ff6a3c] bg-clip-text text-transparent pb-2">
            Events
          </h1>
          <p className="text-gray-600">Select a Event to explore competitions and workshops.</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT: Category Navigation (Large Scale Scalability) */}
          <div className="lg:col-span-3 space-y-3 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
            {events.map((event) => (
              <button
                key={event.id}
                onClick={() => setSelectedEventId(event.id)}
                className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all duration-300 ${
                  selectedEventId === event.id 
                  ? 'bg-white border-[#ff6a3c] shadow-md shadow-orange-200 text-[#ff6a3c]' 
                  : 'bg-white/50 border-gray-200 text-gray-500 hover:bg-white hover:border-gray-300'
                }`}
              >
                <span className="font-bold text-sm truncate uppercase tracking-wider">{event.name}</span>
                <ChevronRight size={18} className={selectedEventId === event.id ? 'opacity-100' : 'opacity-0'} />
              </button>
            ))}
          </div>

          {/* RIGHT: Detail View (The Hub) */}
          <div className="lg:col-span-9">
            <AnimatePresence mode="wait">
              {selectedEvent && (
                <motion.div
                  key={selectedEvent.id}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="space-y-6"
                >
                  {/* Event Summary Banner */}
                  <div className="bg-white/80 backdrop-blur-md rounded-3xl p-8 border border-white shadow-xl flex flex-col md:flex-row justify-between items-center gap-6">
                    <div>
                      <h2 className="text-3xl font-bold text-gray-900 mb-2">{selectedEvent.name}</h2>
                      <p className="text-gray-500 max-w-xl">{selectedEvent.description || "Browse the sub-events below to participate."}</p>
                    </div>
                    <div className="flex items-center gap-4 text-sm font-semibold text-gray-400">
                        <div className="flex items-center gap-1"><CalendarDays size={16}/> 2026</div>
                        <div className="flex items-center gap-1"><Users size={16}/> {selectedEvent.subEvents?.length || 0} Tracks</div>
                    </div>
                  </div>

                  {/* Sub-Event List (List format for better readability at scale) */}
                  <div className="space-y-4">
                    {selectedEvent.subEvents?.map((sub, idx) => (
                      <motion.div
                        key={sub.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="group bg-white/60 hover:bg-white backdrop-blur-sm border border-gray-100 rounded-2xl p-5 flex flex-col md:flex-row items-center justify-between transition-all hover:shadow-lg cursor-pointer"
                        onClick={() => setSelectedSubEvent(sub)}
                      >
                        <div className="flex items-center gap-6 mb-4 md:mb-0">
                          <div className="p-3 bg-orange-50 rounded-xl text-[#ff6a3c] group-hover:bg-[#ff6a3c] group-hover:text-white transition-colors">
                            <Trophy size={24} />
                          </div>
                          <div>
                            <h3 className="font-bold text-gray-800 text-lg group-hover:text-[#ff6a3c] transition-colors">{sub.name}</h3>
                            <div className="flex items-center gap-3 mt-1">
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${sub.isOpen ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                    {sub.isOpen ? 'ACTIVE' : 'LOCKED'}
                                </span>
                                <span className="text-xs text-gray-400 flex items-center gap-1 underline"><Info size={12}/> View Rounds</span>
                            </div>
                          </div>
                        </div>
                        <button className="w-full md:w-auto px-6 py-2.5 rounded-xl bg-gray-900 text-white font-bold text-sm group-hover:bg-[#ff6a3c] transition-all shadow-sm">
                          Explore Details
                        </button>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

        </div>
      </div>
    </div>
  );
};

export default EventsPage;
