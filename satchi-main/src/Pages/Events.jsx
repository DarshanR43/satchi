import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Plus, ChevronDown, Edit, ToggleLeft, ToggleRight } from 'lucide-react';

// --- Mock Initial Data ---
const initialEvents = [
  {
    id: 1,
    name: 'Anokha',
    isOpen: true,
    subEvents: [
      { id: 101, name: 'Anokha 2025', isOpen: true, description: 'Our annual national-level tech fest, showcasing innovation and talent from across the country.' },
      { id: 102, name: 'Anokha 2024', isOpen: false, description: 'A look back at the groundbreaking projects and events from last year.' },
    ],
  },
  {
    id: 2,
    name: 'Amritotsavam',
    isOpen: true,
    subEvents: [
        { id: 201, name: 'Amritotsavam 2025', isOpen: false, description: 'The upcoming grand celebration of arts, culture, and our university\'s founding principles.' },
    ],
  },
];

// --- Main Events Component ---
const Events = () => {
  const [events, setEvents] = useState(initialEvents);
  const [isAdmin, setIsAdmin] = useState(false); // Simulate admin login
  const [newEventName, setNewEventName] = useState('');
  const [newSubEvent, setNewSubEvent] = useState({ parentId: null, name: '', description: '' });
  const [expandedEvents, setExpandedEvents] = useState({1: true});

  // Hook for navigation
  const navigate = useNavigate();

  // --- Admin Functions ---
  const handleAddEvent = (e) => {
    e.preventDefault();
    if (!newEventName.trim()) return;
    const newEvent = {
      id: Date.now(),
      name: newEventName,
      isOpen: true,
      subEvents: [],
    };
    setEvents([newEvent, ...events]);
    setNewEventName('');
  };

  const handleAddSubEvent = (e) => {
    e.preventDefault();
    if (!newSubEvent.name.trim() || !newSubEvent.parentId) return;
    const updatedEvents = events.map((event) => {
      if (event.id === newSubEvent.parentId) {
        const subEvent = {
          id: Date.now(),
          name: `${event.name} ${newSubEvent.name}`,
          description: newSubEvent.description,
          isOpen: true,
        };
        return { ...event, subEvents: [subEvent, ...event.subEvents] };
      }
      return event;
    });
    setEvents(updatedEvents);
    setNewSubEvent({ parentId: null, name: '', description: '' });
  };

  const toggleEventStatus = (eventId) => {
    setEvents(
      events.map((event) => {
        if (event.id === eventId) {
          const newIsOpen = !event.isOpen;
          // If the main event is closing, automatically close all its sub-events.
          const updatedSubEvents = newIsOpen
            ? event.subEvents
            : event.subEvents.map((sub) => ({ ...sub, isOpen: false }));
          return { ...event, isOpen: newIsOpen, subEvents: updatedSubEvents };
        }
        return event;
      })
    );
  };

  const toggleSubEventStatus = (eventId, subEventId) => {
    setEvents(
      events.map((event) => {
        if (event.id === eventId) {
           // Prevent opening a sub-event if the main event is closed.
          if (!event.isOpen) return event;
          return {
            ...event,
            subEvents: event.subEvents.map((sub) =>
              sub.id === subEventId ? { ...sub, isOpen: !sub.isOpen } : sub
            ),
          };
        }
        return event;
      })
    );
  };
  
  const handleRegister = () => {
    // Navigate to the registration page
    navigate('/register');
  }

  const toggleExpand = (eventId) => {
    setExpandedEvents(prev => ({...prev, [eventId]: !prev[eventId]}));
  }

  return (
    <div className="relative w-full min-h-screen px-4 sm:px-6 lg:px-8 py-20 pt-32 text-white font-body bg-black">
      <div className="max-w-4xl mx-auto">
        {/* --- Page Header --- */}
        <motion.div 
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold bg-gradient-to-r from-accent to-vibrant bg-clip-text text-transparent">
            University Events
          </h1>
          <p className="text-lg text-gray-400 mt-4">
            Discover, participate, and innovate.
          </p>
        </motion.div>

        {/* --- Admin Toggle --- */}
        <div className="flex justify-end mb-8">
          <button
            onClick={() => setIsAdmin(!isAdmin)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-sm font-semibold hover:bg-white/20 transition-all duration-300"
          >
            {isAdmin ? <ToggleRight className="text-accent" /> : <ToggleLeft />}
            {isAdmin ? 'Admin View: ON' : 'Admin View: OFF'}
          </button>
        </div>

        {/* --- Admin: Add Event Form --- */}
        <AnimatePresence>
        {isAdmin && (
          <motion.form
            onSubmit={handleAddEvent}
            initial={{ opacity: 0, height: 0, y: -20 }}
            animate={{ opacity: 1, height: 'auto', y: 0 }}
            exit={{ opacity: 0, height: 0, y: -20 }}
            className="bg-white/5 border border-dashed border-white/20 rounded-xl p-6 mb-8 backdrop-blur-sm"
          >
            <h3 className="text-xl font-semibold mb-4">Add New Main Event</h3>
            <div className="flex flex-col sm:flex-row gap-4">
              <input
                type="text"
                value={newEventName}
                onChange={(e) => setNewEventName(e.target.value)}
                placeholder="e.g., Tech Expo"
                className="flex-grow px-4 py-2 rounded-md bg-black/20 text-white border border-white/10 focus:outline-none focus:ring-2 focus:ring-accent"
              />
              <button
                type="submit"
                className="flex items-center justify-center gap-2 px-6 py-2 rounded-md bg-accent text-black font-bold hover:bg-[#FF805A] transition"
              >
                <Plus size={18} /> Add Event
              </button>
            </div>
          </motion.form>
        )}
        </AnimatePresence>

        {/* --- Events List --- */}
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
              {/* --- Main Event Header --- */}
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
                  {isAdmin && (
                    <button onClick={(e) => { e.stopPropagation(); toggleEventStatus(event.id); }} className="p-2 rounded-md hover:bg-white/20"><Edit size={16}/></button>
                  )}
                  <ChevronDown size={24} className={`transition-transform duration-300 ${expandedEvents[event.id] ? 'rotate-180' : ''}`} />
                </div>
              </div>

              {/* --- Sub Events Section (Collapsible) --- */}
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
                      // An event is available for registration only if both the main event and sub-event are open
                      const isRegistrationOpen = event.isOpen && subEvent.isOpen;
                      return (
                        <div key={subEvent.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-black/20 p-4 rounded-lg">
                          <div className="flex-grow">
                            <div className="flex items-center gap-3 mb-1">
                              <span className={`text-xs font-semibold px-2 py-1 rounded-full ${isRegistrationOpen ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>
                                  {isRegistrationOpen ? 'Open' : 'Closed'}
                              </span>
                              <h3 className="font-semibold text-lg">{subEvent.name}</h3>
                            </div>
                            <p className="text-gray-400 text-sm ml-12 sm:ml-0">{subEvent.description}</p>
                          </div>
                          <div className="flex items-center gap-2 self-end sm:self-center">
                            {isAdmin && (
                              <button onClick={() => toggleSubEventStatus(event.id, subEvent.id)} className="p-2 rounded-md hover:bg-white/20 disabled:opacity-50" disabled={!event.isOpen}><Edit size={14}/></button>
                            )}
                            <button
                              onClick={handleRegister}
                              disabled={!isRegistrationOpen}
                              className="px-4 py-2 rounded-md text-sm font-bold bg-accent text-deepBlue transition-all duration-300 disabled:bg-gray-600 disabled:cursor-not-allowed hover:enabled:shadow-[0_0_15px_#FFAB00]"
                            >
                              Register
                            </button>
                          </div>
                        </div>
                      );
                    })}
                     {/* --- Admin: Add Sub-Event Form --- */}
                    {isAdmin && (
                      <div className="pt-4 mt-4 border-t border-dashed border-white/10">
                         {newSubEvent.parentId === event.id ? (
                            <form onSubmit={handleAddSubEvent} className="space-y-3">
                                <h4 className="font-semibold">Add Sub-Event to {event.name}</h4>
                                <input
                                    type="text"
                                    value={newSubEvent.name}
                                    onChange={(e) => setNewSubEvent({...newSubEvent, name: e.target.value})}
                                    placeholder="Sub-event name (e.g., 2026, Workshop)"
                                    className="w-full px-4 py-2 rounded-md bg-black/20 text-white border border-white/10 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                />
                                <textarea
                                    value={newSubEvent.description}
                                    onChange={(e) => setNewSubEvent({...newSubEvent, description: e.target.value})}
                                    placeholder="Brief description..."
                                    rows="2"
                                    className="w-full px-4 py-2 rounded-md bg-black/20 text-white border border-white/10 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                />
                                <div className="flex gap-4">
                                    <button type="submit" className="px-4 py-2 rounded-md bg-cyan-500 text-black font-bold text-sm">Save Sub-Event</button>
                                    <button type="button" onClick={() => setNewSubEvent({parentId: null, name: '', description: ''})} className="px-4 py-2 rounded-md bg-white/10 text-white font-bold text-sm">Cancel</button>
                                </div>
                            </form>
                         ) : (
                            <button onClick={() => setNewSubEvent({parentId: event.id, name: '', description: ''})} className="w-full text-left flex items-center gap-2 px-4 py-2 rounded-md bg-black/20 hover:bg-black/40 transition disabled:opacity-50 disabled:cursor-not-allowed" disabled={!event.isOpen}>
                                <Plus size={16}/> Add Sub-Event
                            </button>
                         )
                        }
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
              </AnimatePresence>
            </motion.div>
          ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default Events;
