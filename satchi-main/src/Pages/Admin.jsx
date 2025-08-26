import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, ChevronDown, Edit, Trash2, X, CheckSquare, Square, AlertTriangle, Users } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

// --- #################### Reusable Modal Components #################### ---

const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, message }) => {
  if (!isOpen) return null;
  return (
    <motion.div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <motion.div
        initial={{ scale: 0.9, y: 50 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: -50 }}
        className="bg-gray-800 border border-red-500/50 rounded-xl w-full max-w-md mx-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 text-center">
          <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="text-red-500" size={28} />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
          <p className="text-gray-400">{message}</p>
        </div>
        <div className="p-4 bg-black/20 flex justify-center gap-4">
          <button onClick={onClose} className="px-6 py-2 rounded-md bg-white/10 text-white font-semibold hover:bg-white/20 transition">
            Cancel
          </button>
          <button onClick={onConfirm} className="px-6 py-2 rounded-md bg-red-600 text-white font-bold hover:bg-red-700 transition">
            Confirm Delete
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

const AddEventModal = ({ isOpen, onClose, onSave, allEvents, creationContext = {} }) => {
  const [eventType, setEventType] = useState('main');
  const [formData, setFormData] = useState({});

  useEffect(() => {
    if (isOpen) {
      const defaultType = creationContext.parentId ? (creationContext.subParentId ? 'subsub' : 'sub') : 'main';
      setEventType(defaultType);
      setFormData({
        name: '',
        description: '',
        rules: '',
        minMembers: 1,
        maxMembers: 1,
        facultyMentor: false,
        minFemaleMembers: 0,
        ...creationContext,
      });
    }
  }, [isOpen, creationContext]);

  if (!isOpen) return null;

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSaveClick = (e) => {
    e.preventDefault();
    onSave(eventType, formData);
  };

  const subEventOptions = useMemo(() => {
    if (!formData.parentId) return [];
    const parentEvent = allEvents.find((e) => e.id === parseInt(formData.parentId));
    return parentEvent ? parentEvent.subEvents : [];
  }, [formData.parentId, allEvents]);

  return (
    <motion.div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <motion.div
        initial={{ scale: 0.9, y: 50 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: -50 }}
        className="bg-gray-900 border border-white/20 rounded-xl w-full max-w-2xl mx-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <form onSubmit={handleSaveClick}>
          <div className="flex items-center justify-between p-4 border-b border-white/10">
            <h2 className="text-2xl font-bold text-white">Create New Event</h2>
            <button type="button" onClick={onClose} className="p-2 rounded-full hover:bg-white/10">
              <X size={24} className="text-gray-400" />
            </button>
          </div>
          <div className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
            <div>
              <label className="font-semibold block mb-2">Event Type</label>
              <select
                value={eventType}
                onChange={(e) => setEventType(e.target.value)}
                className="w-full p-2 rounded bg-black/40 border border-white/10"
              >
                {['main', 'sub', 'subsub'].map((type) => (
                  <option key={type} value={type}>
                    {type.replace('subsub', 'Competition/Workshop').replace('sub', 'Sub-Event').replace('main', 'Main Event')}
                  </option>
                ))}
              </select>
            </div>

            {eventType !== 'main' && (
              <div>
                <label className="font-semibold block mb-2">Parent Main Event</label>
                <select
                  name="parentId"
                  value={formData.parentId || ''}
                  onChange={handleInputChange}
                  className="w-full p-2 rounded bg-black/40 border border-white/10"
                  required
                  disabled={!!creationContext.parentId}
                >
                  <option value="">Select Main Event...</option>
                  {allEvents.map((event) => (
                    <option key={event.id} value={event.id}>
                      {event.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {eventType === 'subsub' && (
              <div>
                <label className="font-semibold block mb-2">Parent Sub-Event</label>
                <select
                  name="subParentId"
                  value={formData.subParentId || ''}
                  onChange={handleInputChange}
                  className="w-full p-2 rounded bg-black/40 border border-white/10"
                  required
                  disabled={!!creationContext.subParentId}
                >
                  <option value="">Select Sub-Event...</option>
                  {subEventOptions.map((sub) => (
                    <option key={sub.id} value={sub.id}>
                      {sub.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="font-semibold block mb-2">Title</label>
              <input
                type="text"
                name="name"
                value={formData.name || ''}
                onChange={handleInputChange}
                className="w-full p-2 rounded bg-black/40 border border-white/10"
                required
              />
            </div>

            <div>
              <label className="font-semibold block mb-2">Description</label>
              <textarea
                name="description"
                value={formData.description || ''}
                onChange={handleInputChange}
                rows="3"
                className="w-full p-2 rounded bg-black/40 border border-white/10"
              />
            </div>

            {eventType === 'subsub' && (
              <>
                <hr className="border-white/10 my-2" />
                <div>
                  <label className="font-semibold block mb-2">Rules</label>
                  <textarea
                    name="rules"
                    value={formData.rules || ''}
                    onChange={handleInputChange}
                    rows="4"
                    className="w-full p-2 rounded bg-black/40 border border-white/10"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="font-semibold block mb-2">Min Team Members</label>
                    <input
                      type="number"
                      name="minMembers"
                      value={formData.minMembers || 1}
                      onChange={handleInputChange}
                      className="w-full p-2 rounded bg-black/40 border border-white/10"
                      min="1"
                    />
                  </div>
                  <div>
                    <label className="font-semibold block mb-2">Max Team Members</label>
                    <input
                      type="number"
                      name="maxMembers"
                      value={formData.maxMembers || 1}
                      onChange={handleInputChange}
                      className="w-full p-2 rounded bg-black/40 border border-white/10"
                      min={formData.minMembers || 1}
                    />
                  </div>
                  <div>
                    <label className="font-semibold block mb-2">Min Female Members</label>
                    <input
                      type="number"
                      name="minFemaleMembers"
                      value={formData.minFemaleMembers || 0}
                      onChange={handleInputChange}
                      className="w-full p-2 rounded bg-black/40 border border-white/10"
                      min="0"
                    />
                  </div>
                  <div className="flex items-center pt-6">
                    <label htmlFor="facultyMentor" className="flex items-center cursor-pointer">
                      <input
                        id="facultyMentor"
                        type="checkbox"
                        name="facultyMentor"
                        checked={!!formData.facultyMentor}
                        onChange={handleInputChange}
                        className="hidden"
                      />
                      {formData.facultyMentor ? <CheckSquare className="text-accent" /> : <Square />}
                      <span className="ml-2 font-semibold">Faculty Mentor Required</span>
                    </label>
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="p-4 bg-black/20 border-t border-white/10 flex justify-end">
            <button type="submit" className="px-6 py-2 rounded-md bg-accent text-black font-bold hover:bg-[#FF805A] transition">
              Save Event
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

const ManageRolesModal = ({ isOpen, onClose, onSave, event, eventLevel }) => {
  const [roles, setRoles] = useState({ admins: [], managers: [] });
  const [newEmails, setNewEmails] = useState({ admins: '', managers: '' });

  useEffect(() => {
    if (event) setRoles(event.roles || { admins: [], managers: [] });
  }, [event]);

  if (!isOpen || !event) return null;

  const handleAddRole = (roleType) => {
    const email = newEmails[roleType].trim().toLowerCase();
    if (email && !roles[roleType].some((p) => p.email === email)) {
      const name = email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
      setRoles((prev) => ({ ...prev, [roleType]: [...prev[roleType], { name, email }] }));
      setNewEmails((prev) => ({ ...prev, [roleType]: '' }));
    }
  };

  const handleRemoveRole = (roleType, email) => {
    setRoles((prev) => ({ ...prev, [roleType]: prev[roleType].filter((p) => p.email !== email) }));
  };

  const handleSave = () => {
    onSave(event.id, eventLevel, roles);
  };

  const handleEmailInputChange = (e, roleType) => {
    setNewEmails((prev) => ({ ...prev, [roleType]: e.target.value }));
  };

  return (
    <motion.div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <motion.div
        initial={{ scale: 0.9, y: 50 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: -50 }}
        className="bg-gray-900 border border-white/20 rounded-xl w-full max-w-2xl mx-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <h2 className="text-2xl font-bold text-white">
            Manage Roles: <span className="text-accent">{event.name}</span>
          </h2>
          <button type="button" onClick={onClose} className="p-2 rounded-full hover:bg-white/10">
            <X size={24} className="text-gray-400" />
          </button>
        </div>
        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          <div className="space-y-2">
            <h4 className="font-bold text-lg text-white">Administrators</h4>
            <div className="space-y-2 max-h-32 overflow-y-auto pr-2">
              {roles.admins?.map((person) => (
                <div key={person.email} className="flex items-center justify-between bg-black/30 p-2 rounded-md">
                  <div>
                    <p className="text-sm font-semibold">{person.name}</p>
                    <p className="text-xs text-gray-400">{person.email}</p>
                  </div>
                  <button onClick={() => handleRemoveRole('admins', person.email)} className="p-1 text-red-500 hover:bg-red-500/20 rounded-full">
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2 pt-2">
              <input
                type="email"
                placeholder="Add admin email..."
                value={newEmails.admins}
                onChange={(e) => handleEmailInputChange(e, 'admins')}
                className="w-full p-2 rounded bg-black/40 border border-white/10 text-sm"
              />
              <button onClick={() => handleAddRole('admins')} className="px-4 py-2 rounded-md bg-accent/80 text-black font-bold text-sm">
                Add
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="font-bold text-lg text-white">Managers</h4>
            <div className="space-y-2 max-h-32 overflow-y-auto pr-2">
              {roles.managers?.map((person) => (
                <div key={person.email} className="flex items-center justify-between bg-black/30 p-2 rounded-md">
                  <div>
                    <p className="text-sm font-semibold">{person.name}</p>
                    <p className="text-xs text-gray-400">{person.email}</p>
                  </div>
                  <button onClick={() => handleRemoveRole('managers', person.email)} className="p-1 text-red-500 hover:bg-red-500/20 rounded-full">
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2 pt-2">
              <input
                type="email"
                placeholder="Add manager email..."
                value={newEmails.managers}
                onChange={(e) => handleEmailInputChange(e, 'managers')}
                className="w-full p-2 rounded bg-black/40 border border-white/10 text-sm"
              />
              <button onClick={() => handleAddRole('managers')} className="px-4 py-2 rounded-md bg-accent/80 text-black font-bold text-sm">
                Add
              </button>
            </div>
          </div>
        </div>
        <div className="p-4 bg-black/20 border-t border-white/10 flex justify-end">
          <button onClick={handleSave} className="px-6 py-2 rounded-md bg-accent text-black font-bold hover:bg-[#FF805A] transition">
            Save Changes
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

// --- #################### Main Admin Component #################### ---
const AdminPage = () => {
  const { user, isAuthenticated } = useAuth();

  // token from AuthContext (recommended) or fallback to localStorage
  const token = user?.token || localStorage.getItem('authToken');

  // axios instance that auto-injects the Token header
  const api = useMemo(() => {
    const instance = axios.create({ baseURL: API_URL });
    instance.interceptors.request.use((config) => {
      if (token) config.headers.Authorization = `Token ${token}`;
      return config;
    });
    return instance;
  }, [token]);

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedEvents, setExpandedEvents] = useState({});

  const [isAddEventModalOpen, setIsAddEventModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isRolesModalOpen, setIsRolesModalOpen] = useState(false);
  const [modalContext, setModalContext] = useState(null);

  const fetchAdminData = async () => {
    if (!isAuthenticated || !token) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const response = await api.get('/events/admin-data/');
      const payload = response.data.events || response.data; // supports both shapes
      const structuredEvents = structureEvents(payload);
      setEvents(structuredEvents);
      setError(null);
    } catch (err) {
      if (err.response?.status === 401) setError('Your token is invalid or expired. Please log in again.');
      else setError('Failed to load your event data. You may not be assigned to any events.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, token]);

  const structureEvents = (flatList) => {
    const mainEvents = {};
    const subEvents = {};
    flatList.forEach((item) => {
      if (item.level === 'main') mainEvents[item.id] = { ...item, subEvents: [] };
      else if (item.level === 'sub') subEvents[item.id] = { ...item, subSubEvents: [] };
    });
    flatList.forEach((item) => {
      if (item.level === 'sub' && mainEvents[item.parentId]) mainEvents[item.parentId].subEvents.push(subEvents[item.id]);
      else if (item.level === 'subsub' && subEvents[item.subParentId]) subEvents[item.subParentId].subSubEvents.push(item);
    });
    return Object.values(mainEvents);
  };

  const openDeleteModal = (id, level, name) => {
    setModalContext({ id, level, name });
    setIsDeleteModalOpen(true);
  };
  const openRolesModal = (event, level) => {
    setModalContext({ ...event, level });
    setIsRolesModalOpen(true);
  };
  const openCreateModal = (context = {}) => {
    setModalContext(context);
    setIsAddEventModalOpen(true);
  };
  const toggleExpand = (id) => setExpandedEvents((prev) => ({ ...prev, [id]: !prev[id] }));

  // --- API actions with auth header via axios instance ---

   const handleCreateEvent = async (eventType, data) => {
    try {
      await api.post('events/create_event/', { eventType, ...data });
      setIsAddEventModalOpen(false);
      fetchAdminData();
    } catch (error) {
      alert('Error: Could not create event.');
    }
  };

  const handleDeleteEvent = async () => {
    if (!modalContext) return;
    try {
      await api.delete(`events/delete_event/${modalContext.level}/${modalContext.id}/`);
      setIsDeleteModalOpen(false);
      setModalContext(null);
      fetchAdminData();
    } catch (error) {
      alert('Error: Could not delete event.');
    }
  };

  const handleSaveRoles = async (eventId, level, newRoles) => {
    try {
      await api.post('events/update_event_users/', { eventId, level, roles: newRoles });
      setIsRolesModalOpen(false);
      fetchAdminData();
    } catch (error) {
      const msg = error.response?.data?.error || 'Error: Could not save roles.';
      alert(msg);
    }
  };

  if (loading) return <div className="flex justify-center items-center min-h-screen">Loading Dashboard...</div>;
  if (error) return <div className="flex justify-center items-center min-h-screen text-red-400">{error}</div>;
  if (!isAuthenticated) return <Navigate to="/login" />;

  return (
    <>
      <AddEventModal
        isOpen={isAddEventModalOpen}
        onClose={() => setIsAddEventModalOpen(false)}
        onSave={handleCreateEvent}
        allEvents={events}
        creationContext={modalContext}
      />

      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteEvent}
        title="Confirm Deletion"
        message={`Are you sure you want to delete "${modalContext?.name}"?`}
      />

      <ManageRolesModal
        isOpen={isRolesModalOpen}
        onClose={() => setIsRolesModalOpen(false)}
        onSave={handleSaveRoles}
        event={modalContext}
        eventLevel={modalContext?.level}
      />

      <div className="relative w-full min-h-screen px-4 sm:px-6 lg:px-8 py-20 pt-32 text-white font-body bg-black">
        <div className="max-w-5xl mx-auto">
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
            <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-accent to-vibrant bg-clip-text text-transparent">
              Admin Dashboard
            </h1>
            <p className="text-lg text-gray-400 mt-4">Manage your assigned events and roles.</p>
          </motion.div>

          <div className="flex justify-between items-center gap-4 mb-8 p-4 bg-white/5 border border-white/10 rounded-xl">
            <p className="text-sm text-gray-300">
              Logged in as: <span className="font-bold text-accent">{user?.full_name}</span>{' '}
              (<span className="font-semibold text-gray-400">{user?.role}</span>)
            </p>
            {user?.role === 'SUPERADMIN' && (
              <button
                onClick={() => openCreateModal()}
                className="flex items-center gap-2 px-6 py-2 rounded-md bg-accent text-black font-bold"
              >
                <Plus size={18} /> Create Event
              </button>
            )}
          </div>

          <div className="space-y-6">
            {events.map((event) => (
              <motion.div key={event.id} layout className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
                <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-white/10" onClick={() => toggleExpand(event.id)}>
                  <h2 className="text-xl font-bold flex items-center gap-3">
                    {event.name} <span className="text-xs font-mono text-gray-500">({event.role})</span>
                  </h2>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openRolesModal(event, 'main');
                      }}
                      className="p-2 rounded-md text-accent hover:bg-accent/20"
                    >
                      <Users size={16} />
                    </button>
                    {user?.role === 'SUPERADMIN' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openDeleteModal(event.id, 'main', event.name);
                        }}
                        className="p-2 rounded-md text-red-500 hover:bg-red-500/20"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                    <ChevronDown size={24} className={`transition-transform duration-300 ${expandedEvents[event.id] ? 'rotate-180' : ''}`} />
                  </div>
                </div>

                <AnimatePresence>
                  {expandedEvents[event.id] && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="border-t border-white/10 p-4 space-y-4"
                    >
                      {user?.role === 'SUPERADMIN' && (
                        <button
                          onClick={() => openCreateModal({ parentId: event.id })}
                          className="w-full flex items-center justify-center gap-2 py-2 rounded-md bg-accent/20 text-accent font-semibold hover:bg-accent/30 transition"
                        >
                          <Plus size={16} /> Add Sub-Event
                        </button>
                      )}

                      {event.subEvents.map((subEvent) => (
                        <div key={subEvent.id} className="bg-black/20 p-4 rounded-lg">
                          <div className="flex items-center justify-between cursor-pointer" onClick={() => toggleExpand(subEvent.id)}>
                            <h3 className="font-semibold text-lg text-accent flex items-center gap-3">
                              {subEvent.name} <span className="text-xs font-mono text-gray-500">({subEvent.role})</span>
                            </h3>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openRolesModal(subEvent, 'sub');
                                }}
                                className="p-2 rounded-md text-accent hover:bg-accent/20"
                              >
                                <Users size={14} />
                              </button>
                              {user?.role === 'SUPERADMIN' && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openDeleteModal(subEvent.id, 'sub', subEvent.name);
                                  }}
                                  className="p-2 rounded-md text-red-500 hover:bg-red-500/20"
                                >
                                  <Trash2 size={14} />
                                </button>
                              )}
                              <ChevronDown size={20} className={`transition-transform duration-300 ${expandedEvents[subEvent.id] ? 'rotate-180' : ''}`} />
                            </div>
                          </div>

                          <AnimatePresence>
                            {expandedEvents[subEvent.id] && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="border-t border-white/10 mt-3 pt-3 pl-4 space-y-3"
                              >
                                {user?.role === 'SUPERADMIN' && (
                                  <button
                                    onClick={() => openCreateModal({ parentId: event.id, subParentId: subEvent.id })}
                                    className="w-full flex items-center justify-center gap-2 py-1.5 rounded-md bg-accent/20 text-accent font-semibold text-sm hover:bg-accent/30 transition"
                                  >
                                    <Plus size={14} /> Add Competition
                                  </button>
                                )}

                                {subEvent.subSubEvents.map((ssEvent) => (
                                  <div key={ssEvent.id} className="flex items-center justify-between">
                                    <p className="flex items-center gap-3">
                                      {ssEvent.name} <span className="text-xs font-mono text-gray-500">({ssEvent.role})</span>
                                    </p>
                                    <div className="flex items-center gap-1">
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          openRolesModal(ssEvent, 'subsub');
                                        }}
                                        className="p-1 rounded-md text-accent hover:bg-accent/20"
                                      >
                                        <Users size={12} />
                                      </button>
                                      {user?.role === 'SUPERADMIN' && (
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            openDeleteModal(ssEvent.id, 'subsub', ssEvent.name);
                                          }}
                                          className="p-1 rounded-md text-red-500 hover:bg-red-500/20"
                                        >
                                          <Trash2 size={12} />
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default AdminPage;