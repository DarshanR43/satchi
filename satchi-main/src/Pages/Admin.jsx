import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, ChevronDown, Edit, Trash2, X, CheckSquare, Square, AlertTriangle, Users, Power } from 'lucide-react'; // Added Power icon
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

// --- Reusable Modals (Themed) ---

const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, message }) => {
  if (!isOpen) return null;
  return (
    <motion.div 
        className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" 
        onClick={onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
    >
      <motion.div 
        initial={{ scale: 0.9, y: 50 }} 
        animate={{ scale: 1, y: 0 }} 
        exit={{ scale: 0.9, y: -50 }} 
        className="bg-white rounded-2xl w-full max-w-md mx-auto shadow-xl overflow-hidden" 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="text-red-600" size={28} />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">{title}</h3>
            <p className="text-gray-500">{message}</p>
        </div>
        <div className="p-4 bg-gray-50 flex justify-center gap-4 border-t border-gray-200">
            <button onClick={onClose} className="px-6 py-2 rounded-lg bg-gray-200 text-gray-700 font-semibold hover:bg-gray-300 transition">Cancel</button>
            <button onClick={onConfirm} className="px-6 py-2 rounded-lg bg-red-600 text-white font-bold hover:bg-red-700 transition">Confirm Delete</button>
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
        name: '', description: '', rules: '', minMembers: 1, maxMembers: 1,
        facultyMentor: false, minFemaleMembers: 0, ...creationContext,
      });
    }
  }, [isOpen, creationContext]);

  const subEventOptions = useMemo(() => {
    if (!formData.parentId) return [];
    const parentEvent = allEvents.find((e) => e.id === parseInt(formData.parentId));
    return parentEvent ? parentEvent.subEvents : [];
  }, [formData.parentId, allEvents]);

  if (!isOpen) return null;

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSaveClick = (e) => {
    e.preventDefault();
    onSave(eventType, formData);
  };

  return (
    <motion.div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <motion.div initial={{ scale: 0.9, y: 50 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: -50 }} className="bg-white rounded-2xl w-full max-w-2xl mx-auto shadow-xl" onClick={(e) => e.stopPropagation()}>
        <form onSubmit={handleSaveClick}>
          <div className="flex items-center justify-between p-5 border-b border-gray-200"><h2 className="text-2xl font-bold text-gray-800">Create New Event</h2><button type="button" onClick={onClose} className="p-2 rounded-full hover:bg-gray-100"><X size={24} className="text-gray-500" /></button></div>
          <div className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
            <div className="form-group"><label>Event Type</label><select value={eventType} onChange={(e) => setEventType(e.target.value)}>{['main', 'sub', 'subsub'].map((type) => (<option key={type} value={type}>{type.replace('subsub', 'Competition/Workshop').replace('sub', 'Sub-Event').replace('main', 'Main Event')}</option>))}</select></div>
            {eventType !== 'main' && (<div className="form-group"><label>Parent Main Event</label><select name="parentId" value={formData.parentId || ''} onChange={handleInputChange} required disabled={!!creationContext.parentId}><option value="">Select Main Event...</option>{allEvents.map((event) => (<option key={event.id} value={event.id}>{event.name}</option>))}</select></div>)}
            {eventType === 'subsub' && (<div className="form-group"><label>Parent Sub-Event</label><select name="subParentId" value={formData.subParentId || ''} onChange={handleInputChange} required disabled={!!creationContext.subParentId}><option value="">Select Sub-Event...</option>{subEventOptions.map((sub) => (<option key={sub.id} value={sub.id}>{sub.name}</option>))}</select></div>)}
            <div className="form-group"><label>Title</label><input type="text" name="name" value={formData.name || ''} onChange={handleInputChange} required/></div>
            <div className="form-group"><label>Description</label><textarea name="description" value={formData.description || ''} onChange={handleInputChange} rows="3"/></div>
            {eventType === 'subsub' && (<><hr className="border-gray-200 my-2" /><div className="form-group"><label>Rules</label><textarea name="rules" value={formData.rules || ''} onChange={handleInputChange} rows="4"/></div><div className="grid grid-cols-2 gap-4"><div className="form-group"><label>Min Team Members</label><input type="number" name="minMembers" value={formData.minMembers || 1} onChange={handleInputChange} min="1"/></div><div className="form-group"><label>Max Team Members</label><input type="number" name="maxMembers" value={formData.maxMembers || 1} onChange={handleInputChange} min={formData.minMembers || 1}/></div><div className="form-group"><label>Min Female Members</label><input type="number" name="minFemaleMembers" value={formData.minFemaleMembers || 0} onChange={handleInputChange} min="0"/></div><div className="flex items-center pt-6"><label htmlFor="facultyMentor" className="flex items-center cursor-pointer"><input id="facultyMentor" type="checkbox" name="facultyMentor" checked={!!formData.facultyMentor} onChange={handleInputChange} className="hidden"/>{formData.facultyMentor ? <CheckSquare className="text-[#ff6a3c]" /> : <Square className="text-gray-400" />}<span className="ml-2 font-semibold text-gray-700">Faculty Mentor Required</span></label></div></div></>)}
          </div>
          <div className="p-4 bg-gray-50 border-t border-gray-200 flex justify-end"><button type="submit" className="px-6 py-2 rounded-lg bg-[#ff6a3c] text-white font-bold hover:shadow-lg hover:shadow-orange-500/50 transition">Save Event</button></div>
        </form>
      </motion.div>
    </motion.div>
  );
};

const ManageRolesModal = ({ isOpen, onClose, onSave, event, eventLevel, api }) => {
    const [roles, setRoles] = useState({ admins: [], managers: [] });
    const [newEmails, setNewEmails] = useState({ admins: '', managers: '' });

    useEffect(() => {
        const fetchRoles = async () => {
            if (event && api) {
                try {
                    const response = await api.get(`/events/get_event_users/${eventLevel}/${event.id}/`);
                    setRoles(response.data);
                } catch (error) {
                    console.error("Failed to fetch event roles:", error);
                    setRoles({ admins: [], managers: [] }); 
                }
            }
        };
        if (isOpen) fetchRoles();
    }, [event, isOpen, api, eventLevel]);

    if (!isOpen || !event) return null;

    const handleAddRole = (roleType) => {
        const email = newEmails[roleType].trim().toLowerCase();
        if (email && !roles[roleType].some((p) => p.email === email)) {
            const name = email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
            setRoles((prev) => ({ ...prev, [roleType]: [...prev[roleType], { name, email }] }));
            setNewEmails((prev) => ({ ...prev, [roleType]: '' }));
        }
    };
    const handleRemoveRole = (roleType, email) => setRoles((prev) => ({ ...prev, [roleType]: prev[roleType].filter((p) => p.email !== email) }));
    const handleSave = () => { onSave(event.id, eventLevel, roles); };
    const handleEmailInputChange = (e, roleType) => { setNewEmails((prev) => ({ ...prev, [roleType]: e.target.value })); };

    return (
        <motion.div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
            <motion.div initial={{ scale: 0.9, y: 50 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: -50 }} className="bg-white rounded-2xl w-full max-w-2xl mx-auto shadow-xl" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between p-5 border-b border-gray-200"><h2 className="text-2xl font-bold text-gray-800">Manage Roles: <span className="text-[#ff6a3c]">{event.name}</span></h2><button type="button" onClick={onClose} className="p-2 rounded-full hover:bg-gray-100"><X size={24} className="text-gray-500" /></button></div>
                <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
                    {[ 'admins', 'managers' ].map(roleType => (
                        <div className="space-y-2" key={roleType}>
                            <h4 className="font-bold text-lg text-gray-800 capitalize">{roleType}</h4>
                            <div className="space-y-2 max-h-32 overflow-y-auto pr-2">{roles[roleType]?.map((person) => (<div key={person.email} className="flex items-center justify-between bg-gray-100 p-2 rounded-md border border-gray-200">
                            <div>
                              <p className="text-sm font-semibold text-gray-500">{person.name}</p>
                              <p className="text-xs text-gray-500">{person.email}</p>
                              </div>
                              <button onClick={() => handleRemoveRole(roleType, person.email)} 
                                className="p-1 text-red-500 hover:bg-red-100 rounded-full">
                                <X size={14} />
                                </button>
                              </div>))}
                            </div>
                            <div className="flex gap-2 pt-2">
                              <input 
                              type="email" 
                              placeholder={`Add ${roleType.slice(0, -1)} email...`} 
                              value={newEmails[roleType]} onChange={(e) => handleEmailInputChange(e, roleType)} 
                              className="w-full p-2 rounded-lg bg-gray-100 border-gray-300 text-sm focus:ring-[#ff6a3c] focus:border-[#ff6a3c]" />
                              <button onClick={() => handleAddRole(roleType)} className="px-4 py-2 rounded-md bg-[#df9400]/90 text-white font-bold text-sm hover:bg-[#df9400]">Add</button>
                            </div>
                        </div>
                    ))}
                </div>
                <div className="p-4 bg-gray-50 border-t border-gray-200 flex justify-end"><button onClick={handleSave} className="px-6 py-2 rounded-lg bg-[#ff6a3c] text-white font-bold hover:shadow-lg hover:shadow-orange-500/50 transition">Save Changes</button></div>
            </motion.div>
        </motion.div>
    );
};

// --- Helper Component ---
// This component was used but not defined, causing the error.
const ActionButton = ({ onClick, icon: Icon, colorClass, title, disabled = false }) => (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`p-2 rounded-full transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed 
                  ${colorClass === 'red' && 'text-red-500 hover:bg-red-100'}
                  ${colorClass === 'orange' && 'text-orange-500 hover:bg-orange-100'}
                  ${colorClass === 'green' && 'text-green-500 hover:bg-green-100'}`}
      title={title}
    >
      <Icon className="w-5 h-5" />
    </button>
);

// --- Main Admin Component (Themed) ---
const AdminPage = () => {
  const { user, isAuthenticated, token } = useAuth();

  const api = useMemo(() => {
    const instance = axios.create({ baseURL: API_URL });
    instance.interceptors.request.use((config) => {
      if (token) {
        config.headers.Authorization = `Token ${token}`;
      }
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
      const payload = response.data.events || response.data;
      const structuredEvents = structureEvents(payload);
      setEvents(structuredEvents);
      setError(null);
    } catch (err) {
      if (err.response?.status === 401) {
        setError('Your token is invalid or expired. Please log in again.');
      } else {
        setError('Failed to load your event data. You may not be assigned to any events.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
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

  const handleCreateEvent = async (eventType, data) => {
    try {
      await api.post('/events/create_event/', { eventType, ...data });
      setIsAddEventModalOpen(false);
      fetchAdminData();
    } catch (error) {
      console.error("Create event error:", error);
      alert('Error: Could not create event.');
    }
  };

  const handleDeleteEvent = async () => {
    if (!modalContext) return;
    try {
      await api.delete(`/events/delete_event/${modalContext.level}/${modalContext.id}/`);
      setIsDeleteModalOpen(false);
      setModalContext(null);
      fetchAdminData();
    } catch (error) {
      console.error("Delete event error:", error);
      alert('Error: Could not delete event.');
    }
  };

  const handleSaveRoles = async (eventId, level, newRoles) => {
    try {
      await api.post(`/events/update_event_users/`, {
        eventId: modalContext.id,
        level: modalContext.level,
        roles: newRoles
      });
      setIsRolesModalOpen(false);
      fetchAdminData();
    } catch (error) {
      console.error("Save roles error:", error);
      const msg = error.response?.data?.error || 'Error: Could not save roles.';
      alert(msg);
    }
  };

  // This function was called by ActionButton but was not defined.
  const handleToggleStatus = async (eventId, level) => {
    try {
      // NOTE: You need to implement this API endpoint on your backend.
      // It should toggle the 'isOpen' status of the event.
      await api.post(`/events/toggle_status/${level}/${eventId}/`);
      // Refresh data to show the change
      fetchAdminData();
    } catch (error) {
      console.error("Toggle status error:", error);
      alert('Error: Could not update the event status.');
    }
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
        api={api}
      />

      <div className="relative w-full min-h-screen px-4 sm:px-6 lg:px-8 py-20 font-body text-gray-800">
        <div className="absolute inset-0 bg-gradient-to-br from-white via-amber-50 to-orange-100 z-0"></div>
        <div className="absolute top-0 left-0 w-full h-full bg-grid-gray-200/[0.4] z-0"></div>

        <div className="relative max-w-5xl mx-auto pt-16 z-10">
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
            <h1 className="text-4xl sm:text-5xl font-heading font-bold bg-gradient-to-r from-[#ff6a3c] via-[#df9400] to-[#ff6a3c] bg-clip-text text-transparent">Admin Dashboard</h1>
            <p className="text-lg text-gray-600 mt-4">Manage your assigned events and roles.</p>
          </motion.div>

          <div className="flex justify-between items-center gap-4 mb-8 p-4 bg-white/70 border border-gray-200 rounded-2xl backdrop-blur-md shadow-sm">
            <p className="text-sm text-gray-600">Logged in as: <span className="font-bold text-[#ff6a3c]">{user?.full_name}</span> (<span className="font-semibold text-gray-500">{user?.role}</span>)</p>
            {user?.role === 'SUPERADMIN' && (<button onClick={() => openCreateModal()} className="flex items-center gap-2 px-5 py-2 rounded-lg bg-[#ff6a3c] text-white font-bold hover:shadow-lg hover:shadow-orange-500/50 transition-shadow"><Plus size={18} /> Create Event</button>)}
          </div>

          <div className="space-y-6">
            {events.map((event) => (
              <motion.div key={event.id} layout className="bg-white/80 border border-gray-200/90 rounded-2xl overflow-hidden backdrop-blur-lg shadow-lg">
                <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50/50" onClick={() => toggleExpand(event.id)}>
                  <div className="flex items-center gap-3"><h2 className="text-xl font-bold">{event.name}</h2><span className="text-xs font-mono text-gray-500">({event.role})</span></div>
                  <div className="flex items-center gap-1">
                    <ActionButton onClick={(e) => { e.stopPropagation(); handleToggleStatus(event.id, 'main'); }} icon={Power} colorClass={event.isOpen ? 'green' : 'red'} title={event.isOpen ? 'Close Event' : 'Open Event'} />
                    <ActionButton onClick={(e) => { e.stopPropagation(); openRolesModal(event, 'main'); }} icon={Users} colorClass="orange" title="Manage Roles" />
                    {user?.role === 'SUPERADMIN' && (<ActionButton onClick={(e) => { e.stopPropagation(); openDeleteModal(event.id, 'main', event.name); }} icon={Trash2} colorClass="red" title="Delete Event" />)}
                    <ChevronDown size={24} className={`transition-transform duration-300 ${expandedEvents[event.id] ? 'rotate-180' : ''}`} />
                  </div>
                </div>
                <AnimatePresence>
                  {expandedEvents[event.id] && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="border-t border-gray-200/80 p-4 space-y-4 bg-gray-50/50">
                      {user?.role === 'SUPERADMIN' && (<button onClick={() => openCreateModal({ parentId: event.id })} className="w-full flex items-center justify-center gap-2 py-2 rounded-md bg-orange-100/70 text-[#df9400] font-semibold hover:bg-orange-200/70 transition"><Plus size={16} /> Add Sub-Event</button>)}
                      {event.subEvents.map((subEvent) => (
                        <div key={subEvent.id} className="bg-white/80 p-4 rounded-lg border border-gray-200/90">
                          <div className="flex items-center justify-between cursor-pointer" onClick={() => toggleExpand(subEvent.id)}>
                            <div className="flex items-center gap-3"><h3 className="font-semibold text-lg text-[#ff6a3c]">{subEvent.name}</h3><span className="text-xs font-mono text-gray-500">({subEvent.role})</span></div>
                            <div className="flex items-center gap-1">
                               <ActionButton onClick={(e) => { e.stopPropagation(); handleToggleStatus(subEvent.id, 'sub'); }} icon={Power} colorClass={subEvent.isOpen ? 'green' : 'red'} title={subEvent.isOpen ? 'Close Sub-Event' : 'Open Sub-Event'} disabled={!event.isOpen}/>
                               <ActionButton onClick={(e) => { e.stopPropagation(); openRolesModal(subEvent, 'sub'); }} icon={Users} colorClass="orange" title="Manage Roles" />
                               {user?.role === 'SUPERADMIN' && (<ActionButton onClick={(e) => { e.stopPropagation(); openDeleteModal(subEvent.id, 'sub', subEvent.name); }} icon={Trash2} colorClass="red" title="Delete Sub-Event" />)}
                               <ChevronDown size={20} className={`transition-transform duration-300 ${expandedEvents[subEvent.id] ? 'rotate-180' : ''}`} />
                            </div>
                          </div>
                          <AnimatePresence>
                            {expandedEvents[subEvent.id] && (
                              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="border-t border-gray-200 mt-3 pt-3 pl-4 space-y-3">
                                {user?.role === 'SUPERADMIN' && (<button onClick={() => openCreateModal({ parentId: event.id, subParentId: subEvent.id })} className="w-full flex items-center justify-center gap-2 py-1.5 rounded-md bg-orange-100/70 text-sm text-[#df9400] font-semibold hover:bg-orange-200/70 transition"><Plus size={14} /> Add Competition</button>)}
                                {subEvent.subSubEvents.map((ssEvent) => (
                                  <div key={ssEvent.id} className="flex items-center justify-between">
                                    <div className="flex items-center gap-3"><p>{ssEvent.name}</p><span className="text-xs font-mono text-gray-500">({ssEvent.role})</span></div>
                                    <div className="flex items-center gap-1">
                                      <ActionButton onClick={(e) => { e.stopPropagation(); handleToggleStatus(ssEvent.id, 'subsub'); }} icon={Power} colorClass={ssEvent.isOpen ? 'green' : 'red'} title={ssEvent.isOpen ? 'Close Competition' : 'Open Competition'} disabled={!subEvent.isOpen} />
                                      <ActionButton onClick={(e) => { e.stopPropagation(); openRolesModal(ssEvent, 'subsub'); }} icon={Users} colorClass="orange" title="Manage Roles" />
                                      {user?.role === 'SUPERADMIN' && (<ActionButton onClick={(e) => { e.stopPropagation(); openDeleteModal(ssEvent.id, 'subsub', ssEvent.name); }} icon={Trash2} colorClass="red" title="Delete Competition" />)}
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

// Helper CSS classes for form styling in the modal
const css = `
.form-group {
    display: flex;
    flex-direction: column;
}
.form-group label {
    font-weight: 600;
    color: #4a5568; /* gray-700 */
    margin-bottom: 0.5rem;
}
.form-group input, .form-group select, .form-group textarea {
    width: 100%;
    padding: 0.75rem;
    border-radius: 0.5rem;
    background-color: #f7fafc; /* gray-100 */
    border: 1px solid #e2e8f0; /* gray-300 */
    transition: box-shadow 0.2s;
}
.form-group input:focus, .form-group select:focus, .form-group textarea:focus {
    outline: none;
    --tw-ring-color: #ff6a3c;
    box-shadow: 0 0 0 2px var(--tw-ring-color);
    border-color: #ff6a3c;
}
`;
const style = document.createElement('style');
style.textContent = css;
document.head.append(style);