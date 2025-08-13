import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, ChevronDown, Edit, Trash2, X, CheckSquare, Square, AlertTriangle, Users } from 'lucide-react';

// --- #################### Confirmation Modal Component #################### ---
const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, message }) => {
    if (!isOpen) return null;
    return (
        <motion.div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
            <motion.div initial={{ scale: 0.9, y: 50 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: -50 }} className="bg-gray-800 border border-red-500/50 rounded-xl w-full max-w-md mx-auto" onClick={(e) => e.stopPropagation()}>
                <div className="p-6 text-center">
                    <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4"><AlertTriangle className="text-red-500" size={28} /></div>
                    <h3 className="text-xl font-bold text-white mb-2">{title}</h3><p className="text-gray-400">{message}</p>
                </div>
                <div className="p-4 bg-black/20 flex justify-center gap-4">
                    <button onClick={onClose} className="px-6 py-2 rounded-md bg-white/10 text-white font-semibold hover:bg-white/20 transition">Cancel</button>
                    <button onClick={onConfirm} className="px-6 py-2 rounded-md bg-red-600 text-white font-bold hover:bg-red-700 transition">Confirm Delete</button>
                </div>
            </motion.div>
        </motion.div>
    );
};


// --- #################### Add Event Modal Component #################### ---
const AddEventModal = ({ isOpen, onClose, onSave, allEvents, user, creationContext = {} }) => {
    const [eventType, setEventType] = useState('sub');
    const [formData, setFormData] = useState({
        parentId: '',
        subParentId: '',
        name: '',
        description: '',
        rules: '',
        minMembers: 1,
        maxMembers: 1,
        facultyMentor: false,
        minFemaleMembers: 0,
    });

    // Determine what the user can create based on their permissions
    const creatableEventTypes = useMemo(() => {
        const types = [];
        if (user.is_superadmin) types.push('main', 'sub', 'subsub');
        // This logic can be expanded if non-superadmins can create events
        // For now, assuming only superadmin creates main events.
        // And event admins can create children. This logic is simplified here
        // and primarily controlled by the UI enabling the create buttons.
        else types.push('sub', 'subsub');
        return types;
    }, [user]);

    useEffect(() => {
        if (isOpen) {
            const defaultType = creatableEventTypes.includes('sub') ? 'sub' : 'subsub';
            setEventType(defaultType);
            const baseData = {
                parentId: '',
                subParentId: '',
                name: '',
                description: '',
                rules: '',
                minMembers: 1,
                maxMembers: 1,
                facultyMentor: false,
                minFemaleMembers: 0,
                ...creationContext,
            };
            setFormData(baseData);
        }
    }, [isOpen, creationContext, creatableEventTypes]);

    if (!isOpen) return null;

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };

    const handleSaveClick = (e) => {
        e.preventDefault();
        onSave(eventType, formData);
        onClose();
    };
    
    const subEventOptions = useMemo(() => {
        if (!formData.parentId) return [];
        const parentEvent = allEvents.find(e => e.id === parseInt(formData.parentId));
        return parentEvent ? parentEvent.subEvents : [];
    }, [formData.parentId, allEvents]);

    return (
        <motion.div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
            <motion.div initial={{ scale: 0.9, y: 50 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: -50 }} className="bg-gray-900 border border-white/20 rounded-xl w-full max-w-2xl mx-auto" onClick={(e) => e.stopPropagation()}>
                <form onSubmit={handleSaveClick}>
                    <div className="flex items-center justify-between p-4 border-b border-white/10"><h2 className="text-2xl font-bold text-white">Create New Event</h2><button type="button" onClick={onClose} className="p-2 rounded-full hover:bg-white/10"><X size={24} className="text-gray-400" /></button></div>
                    <div className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
                        <div><label className="font-semibold block mb-2">What do you want to create?</label><select value={eventType} onChange={e => setEventType(e.target.value)} className="w-full p-2 rounded bg-black/40 border border-white/10 focus:ring-accent focus:ring-1">{creatableEventTypes.map(type => <option key={type} value={type}>{type.replace('subsub', 'Sub-Sub Event').replace('sub', 'Sub Event').replace('main', 'Main Event')}</option>)}</select></div>
                        {eventType !== 'main' && (<div><label className="font-semibold block mb-2">Parent Main Event</label><select name="parentId" value={formData.parentId} onChange={handleInputChange} className="w-full p-2 rounded bg-black/40 border border-white/10" required disabled={!!creationContext.parentId}><option value="">Select a Main Event...</option>{allEvents.map(event => <option key={event.id} value={event.id}>{event.name}</option>)}</select></div>)}
                        {eventType === 'subsub' && formData.parentId && (<div><label className="font-semibold block mb-2">Parent Sub Event</label><select name="subParentId" value={formData.subParentId} onChange={handleInputChange} className="w-full p-2 rounded bg-black/40 border border-white/10" required disabled={!!creationContext.subParentId}><option value="">Select a Sub Event...</option>{subEventOptions.map(sub => <option key={sub.id} value={sub.id}>{sub.name}</option>)}</select></div>)}
                        <div><label className="font-semibold block mb-2">Event Title</label><input type="text" name="name" value={formData.name} onChange={handleInputChange} placeholder="e.g., CodeBlitz 2026" className="w-full p-2 rounded bg-black/40 border border-white/10" required /></div>
                        <div><label className="font-semibold block mb-2">Event Description</label><textarea name="description" value={formData.description} onChange={handleInputChange} placeholder="A brief summary of the event." rows="3" className="w-full p-2 rounded bg-black/40 border border-white/10"></textarea></div>
                        
                        {eventType === 'subsub' && (
                            <>
                                <div><label className="font-semibold block mb-2">Rules</label><textarea name="rules" value={formData.rules} onChange={handleInputChange} placeholder="List the rules for participants." rows="4" className="w-full p-2 rounded bg-black/40 border border-white/10"></textarea></div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div><label className="font-semibold block mb-2">Min Team Members</label><input type="number" name="minMembers" value={formData.minMembers} onChange={handleInputChange} className="w-full p-2 rounded bg-black/40 border border-white/10" min="1" /></div>
                                    <div><label className="font-semibold block mb-2">Max Team Members</label><input type="number" name="maxMembers" value={formData.maxMembers} onChange={handleInputChange} className="w-full p-2 rounded bg-black/40 border border-white/10" min={formData.minMembers} /></div>
                                    <div><label className="font-semibold block mb-2">Min Female Members</label><input type="number" name="minFemaleMembers" value={formData.minFemaleMembers} onChange={handleInputChange} className="w-full p-2 rounded bg-black/40 border border-white/10" min="0" /></div>
                                    <div className="flex items-center pt-6"><label htmlFor="facultyMentor" className="flex items-center cursor-pointer"><input id="facultyMentor" type="checkbox" name="facultyMentor" checked={formData.facultyMentor} onChange={handleInputChange} className="hidden" />{formData.facultyMentor ? <CheckSquare className="text-accent" /> : <Square />}<span className="ml-2 font-semibold">Faculty Mentor Required</span></label></div>
                                </div>
                            </>
                        )}
                    </div>
                    <div className="p-4 bg-black/20 border-t border-white/10 flex justify-end"><button type="submit" className="px-6 py-2 rounded-md bg-accent text-black font-bold hover:bg-[#FF805A] transition">Save Event</button></div>
                </form>
            </motion.div>
        </motion.div>
    );
};

// --- Standalone RoleSection Component ---
const RoleSection = ({ title, roleType, roles, newEmail, onEmailChange, onAddRole, onRemoveRole }) => (
    <div className="space-y-2">
        <h4 className="font-bold text-lg text-white">{title}</h4>
        <div className="space-y-2 max-h-32 overflow-y-auto pr-2">
            {roles?.map(person => (
                <div key={person.email} className="flex items-center justify-between bg-black/30 p-2 rounded-md">
                    <div>
                        <p className="text-sm font-semibold text-gray-200">{person.name}</p>
                        <p className="text-xs text-gray-400">{person.email}</p>
                    </div>
                    <button onClick={() => onRemoveRole(roleType, person.email)} className="p-1 text-red-500 hover:bg-red-500/20 rounded-full ml-2">
                        <X size={14} />
                    </button>
                </div>
            ))}
        </div>
        <div className="flex gap-2 pt-2">
            <input
                type="email"
                placeholder={`Add ${roleType.slice(0, -1)} email...`}
                value={newEmail}
                onChange={(e) => onEmailChange(e, roleType)}
                className="w-full p-2 rounded bg-black/40 border border-white/10 text-sm"
            />
            <button onClick={() => onAddRole(roleType)} className="px-4 py-2 rounded-md bg-accent/80 text-black font-bold hover:bg-accent transition text-sm">Add</button>
        </div>
    </div>
);


// --- #################### Manage Roles Modal Component #################### ---
const ManageRolesModal = ({ isOpen, onClose, onSave, event, eventLevel, permissions }) => {
    const [roles, setRoles] = useState({ admins: [], managers: [] });
    const [newEmails, setNewEmails] = useState({ admins: '', managers: '' });
    const [emailError, setEmailError] = useState('');

    useEffect(() => { 
        if (event) { 
            setRoles(event.roles || { admins: [], managers: [] }); 
            setEmailError('');
        } 
    }, [event]);

    if (!isOpen || !event) return null;

    const handleAddRole = (roleType) => {
        const email = newEmails[roleType].trim().toLowerCase();
        if (!email.endsWith('amrita.edu')) {
            setEmailError('Email must end with amrita.edu');
            return;
        }
        if (email && !roles[roleType].some(p => p.email === email)) {
            const name = email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
            const newPerson = { name, email };

            setRoles(prev => ({ ...prev, [roleType]: [...prev[roleType], newPerson] }));
            setNewEmails(prev => ({ ...prev, [roleType]: '' }));
            setEmailError('');
        }
    };

    const handleRemoveRole = (roleType, email) => { 
        setRoles(prev => ({ ...prev, [roleType]: prev[roleType].filter(p => p.email !== email) })); 
    };
    
    const handleSave = () => { 
        onSave(event.id, eventLevel, roles); 
        onClose(); 
    };

    const handleEmailInputChange = (e, roleType) => { 
        setNewEmails(prev => ({ ...prev, [roleType]: e.target.value })); 
        if (emailError) setEmailError('');
    };

    return (
        <motion.div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
            <motion.div initial={{ scale: 0.9, y: 50 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: -50 }} className="bg-gray-900 border border-white/20 rounded-xl w-full max-w-2xl mx-auto" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between p-4 border-b border-white/10">
                    <h2 className="text-2xl font-bold text-white">Manage Roles for <span className="text-accent">{event.name}</span></h2>
                    <button type="button" onClick={onClose} className="p-2 rounded-full hover:bg-white/10"><X size={24} className="text-gray-400" /></button>
                </div>
                <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
                    {emailError && <div className="flex items-center gap-2 p-2 text-sm text-red-400 bg-red-500/10 rounded-md"><AlertTriangle size={16} /><span>{emailError}</span></div>}
                    
                    {permissions.can_manage_admins && <RoleSection title="Administrators" roleType="admins" roles={roles.admins} newEmail={newEmails.admins} onEmailChange={handleEmailInputChange} onAddRole={handleAddRole} onRemoveRole={handleRemoveRole} />}
                    {permissions.can_manage_managers && <RoleSection title="Managers" roleType="managers" roles={roles.managers} newEmail={newEmails.managers} onEmailChange={handleEmailInputChange} onAddRole={handleAddRole} onRemoveRole={handleRemoveRole} />}
                </div>
                <div className="p-4 bg-black/20 border-t border-white/10 flex justify-end">
                    <button onClick={handleSave} className="px-6 py-2 rounded-md bg-accent text-black font-bold hover:bg-[#FF805A] transition">Save Changes</button>
                </div>
            </motion.div>
        </motion.div>
    );
};


// --- #################### Main Admin Component #################### ---
const Adminactions = () => {
  const [events, setEvents] = useState([]);
  const [user, setUser] = useState(null);
  const [permissions, setPermissions] = useState({});
  const [loading, setLoading] = useState(true);
  const [expandedEvents, setExpandedEvents] = useState({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [creationContext, setCreationContext] = useState({});
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [eventToDelete, setEventToDelete] = useState(null);
  const [isRolesModalOpen, setIsRolesModalOpen] = useState(false);
  const [eventToManageRoles, setEventToManageRoles] = useState(null);
  
  // --- Effect to fetch initial data from Django backend ---
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const response = await fetch('http://127.0.0.1:8000/api/get_admin_page_data/');
        if (!response.ok) throw new Error('Failed to fetch admin data');
        
        const data = await response.json();
        setUser(data.user);
        setEvents(data.events);
        setPermissions(data.permissions);
        
        if (data.events.length > 0) {
            const firstEvent = data.events[0];
            const newExpandedState = { [firstEvent.id]: true };
            if (firstEvent.subEvents && firstEvent.subEvents.length > 0) {
                newExpandedState[firstEvent.subEvents[0].id] = true;
            }
            setExpandedEvents(newExpandedState);
        }
      } catch (error) {
        console.error("Error fetching initial data:", error);
        setUser({ name: 'Guest', email: 'guest@visitor.com', is_superadmin: false });
        setEvents([]);
        setPermissions({});
      } finally {
        setLoading(false);
      }
    };
    fetchInitialData();
  }, []);

  const getPermissionsForEvent = (eventId) => {
    // Default to no permissions if not found
    return permissions[eventId] || {
        can_manage_admins: false,
        can_manage_managers: false,
        can_create_sub_event: false,
        can_create_sub_sub_event: false,
        can_delete: false,
        can_toggle_registration: false,
    };
  };

  const handleCreateEvent = async (type, data) => {
    // This function would call the backend to create an event
    // On success, it should re-fetch all data to stay in sync.
    console.log("Creating event:", type, data);
    // Example: await fetch('/api/create_event', { method: 'POST', body: JSON.stringify({ ...data, eventType: type }) });
    // fetchInitialData(); // Re-fetch after creation
  };

  const handleDeleteEvent = () => {
    if (!eventToDelete) return;
    console.log("Deleting event:", eventToDelete);
    // Example: await fetch(`/api/delete_event/${eventToDelete.id}`, { method: 'DELETE' });
    // fetchInitialData(); // Re-fetch after deletion
    setIsDeleteModalOpen(false);
    setEventToDelete(null);
  };

  const handleSaveRoles = async (eventId, level, newRoles) => {
    try {
        const response = await fetch('http://127.0.0.1:8000/api/update_event_roles/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ eventId, level, roles: newRoles }),
        });
        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.error || 'Failed to update roles');
        }
        // Re-fetch data to ensure UI is consistent with the backend state
        // This is simpler and more reliable than trying to update the state manually
        const fetchResponse = await fetch('http://127.0.0.1:8000/api/get_admin_page_data/');
        const data = await fetchResponse.json();
        setEvents(data.events);
        setPermissions(data.permissions);

    } catch (error) {
        console.error("Error saving roles:", error);
        // Optionally show an error message to the user
    }
  };

  const openDeleteModal = (id, level, name) => { setEventToDelete({ id, level, name }); setIsDeleteModalOpen(true); };
  const toggleRegistrationStatus = (id, level) => { console.log("Toggling registration for:", id, level); /* API call here */ };
  const handleOpenModal = (context = {}) => { setCreationContext(context); setIsModalOpen(true); };
  const handleOpenRolesModal = (event, level) => { setEventToManageRoles({ ...event, level }); setIsRolesModalOpen(true); };
  const toggleExpand = (id) => setExpandedEvents(prev => ({...prev, [id]: !prev[id]}));
  
  if (loading) {
    return <div className="flex justify-center items-center min-h-screen bg-black text-white"><p className="text-2xl font-bold">Loading Dashboard...</p></div>;
  }

  return (
    <>
    <AddEventModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleCreateEvent} allEvents={events} user={user} creationContext={creationContext} />
    <ConfirmationModal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} onConfirm={handleDeleteEvent} title="Confirm Deletion" message={`Are you sure you want to permanently delete "${eventToDelete?.name}"? This action cannot be undone.`} />
    {eventToManageRoles && <ManageRolesModal isOpen={isRolesModalOpen} onClose={() => setIsRolesModalOpen(false)} onSave={handleSaveRoles} event={eventToManageRoles} eventLevel={eventToManageRoles.level} permissions={getPermissionsForEvent(eventToManageRoles.id)} />}

    <div className="relative w-full min-h-screen px-4 sm:px-6 lg:px-8 py-20 pt-32 text-white font-body bg-black">
      <div className="max-w-5xl mx-auto">
        <motion.div initial={{ opacity: 0, y: -50 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }} className="text-center mb-8"><h1 className="text-4xl sm:text-5xl md:text-6xl font-bold bg-gradient-to-r from-accent to-vibrant bg-clip-text text-transparent">Admin Dashboard</h1><p className="text-lg text-gray-400 mt-4">Manage all university events, roles, and settings.</p></motion.div>
        
        <div className="flex flex-wrap justify-between items-center gap-4 mb-8 p-4 bg-white/5 border border-white/10 rounded-xl">
             <div className='flex items-center gap-2'><p className="text-sm text-gray-300">Logged in as: <span className="font-bold text-accent">{user?.name || '...'}</span></p></div>
            {user?.is_superadmin && (<button onClick={() => handleOpenModal()} className="flex items-center justify-center gap-2 px-6 py-2 rounded-md bg-accent text-black font-bold hover:bg-[#FF805A] transition"><Plus size={18} /> Create Main Event</button>)}
        </div>

        <div className="space-y-6">
          {events.map((event) => {
            const mainPerms = getPermissionsForEvent(event.id);
            return (
            <motion.div key={event.id} layout className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
              <div className="flex items-center justify-between p-4 sm:p-5 cursor-pointer hover:bg-white/10" onClick={() => toggleExpand(event.id)}>
                <div className="flex items-center gap-4"><span className={`w-3 h-3 rounded-full ${event.isOpen ? 'bg-green-500' : 'bg-red-500'}`}></span><h2 className="text-xl sm:text-2xl font-bold">{event.name}</h2></div>
                <div className="flex items-center gap-2">
                  {(mainPerms.can_manage_admins || mainPerms.can_manage_managers) && (<button onClick={(e) => { e.stopPropagation(); handleOpenRolesModal(event, 'main'); }} className="p-2 rounded-md text-accent hover:bg-accent/20"><Users size={16}/></button>)}
                  {mainPerms.can_delete && (<button onClick={(e) => { e.stopPropagation(); openDeleteModal(event.id, 'main', event.name); }} className="p-2 rounded-md text-red-500 hover:bg-red-500/20"><Trash2 size={16}/></button>)}
                  {mainPerms.can_toggle_registration && (<button onClick={(e) => { e.stopPropagation(); toggleRegistrationStatus(event.id, 'main'); }} className="p-2 rounded-md hover:bg-white/20"><Edit size={16}/></button>)}
                  <ChevronDown size={24} className={`transition-transform duration-300 ${expandedEvents[event.id] ? 'rotate-180' : ''}`} />
                </div>
              </div>
              <AnimatePresence>
              {expandedEvents[event.id] && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="border-t border-white/10">
                  <div className="p-4 sm:p-6 space-y-4">
                    {mainPerms.can_create_sub_event && (<div className="mb-4"><button onClick={() => handleOpenModal({ parentId: event.id })} className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-md bg-accent/20 text-accent font-semibold hover:bg-accent/30 transition"><Plus size={16}/> Add Sub-Event to {event.name}</button></div>)}
                    {event.subEvents.map((subEvent) => {
                      const subPerms = getPermissionsForEvent(subEvent.id);
                      return (
                      <div key={subEvent.id} className="bg-black/20 p-4 rounded-lg">
                        <div className="flex items-center justify-between cursor-pointer" onClick={() => toggleExpand(subEvent.id)}>
                            <div className="flex items-center gap-3"><span className={`w-2.5 h-2.5 rounded-full ${subEvent.isOpen ? 'bg-green-400' : 'bg-red-400'}`}></span><h3 className="font-semibold text-lg text-accent">{subEvent.name}</h3></div>
                            <div className="flex items-center gap-2">
                                {(subPerms.can_manage_admins || subPerms.can_manage_managers) && (<button onClick={(e) => { e.stopPropagation(); handleOpenRolesModal(subEvent, 'sub'); }} className="p-2 rounded-md text-accent hover:bg-accent/20"><Users size={14}/></button>)}
                                {subPerms.can_delete && (<button onClick={(e) => { e.stopPropagation(); openDeleteModal(subEvent.id, 'sub', subEvent.name); }} className="p-2 rounded-md text-red-500 hover:bg-red-500/20"><Trash2 size={14}/></button>)}
                                {subPerms.can_toggle_registration && (<button onClick={(e) => { e.stopPropagation(); toggleRegistrationStatus(subEvent.id, 'sub'); }} className="p-2 rounded-md hover:bg-white/20 disabled:opacity-50" disabled={!event.isOpen}><Edit size={14}/></button>)}
                                <ChevronDown size={20} className={`transition-transform duration-300 ${expandedEvents[subEvent.id] ? 'rotate-180' : ''}`} />
                            </div>
                        </div>
                        <AnimatePresence>
                        {expandedEvents[subEvent.id] && (
                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="border-t border-white/10 mt-3 pt-3">
                               {subPerms.can_create_sub_sub_event && (<div className="mb-3"><button onClick={() => handleOpenModal({ parentId: event.id, subParentId: subEvent.id })} className="w-full flex items-center justify-center gap-2 px-3 py-1.5 rounded-md bg-accent/20 text-accent font-semibold hover:bg-accent/30 transition text-sm"><Plus size={14}/> Add Sub-Sub-Event</button></div>)}
                               <div className="pl-4 space-y-3">
                                {subEvent.subSubEvents.map(ssEvent => {
                                    const ssPerms = getPermissionsForEvent(ssEvent.id);
                                    return (
                                        <div key={ssEvent.id} className="flex items-center justify-between">
                                            <div className="flex items-center gap-3"><span className={`w-2 h-2 rounded-full ${ssEvent.isOpen ? 'bg-green-400' : 'bg-red-400'}`}></span><p>{ssEvent.name}</p></div>
                                            <div className="flex items-center gap-1">
                                                {ssPerms.can_manage_managers && (<button onClick={(e) => { e.stopPropagation(); handleOpenRolesModal(ssEvent, 'sub_sub'); }} className="p-1 rounded-md text-accent hover:bg-accent/20"><Users size={12}/></button>)}
                                                {ssPerms.can_delete && (<button onClick={(e) => { e.stopPropagation(); openDeleteModal(ssEvent.id, 'subsub', ssEvent.name); }} className="p-1 rounded-md text-red-500 hover:bg-red-500/20"><Trash2 size={12}/></button>)}
                                                {ssPerms.can_toggle_registration && (<button onClick={(e) => { e.stopPropagation(); toggleRegistrationStatus(ssEvent.id, 'subsub'); }} className="p-1 rounded-md hover:bg-white/20 disabled:opacity-50" disabled={!subEvent.isOpen}><Edit size={12}/></button>)}
                                            </div>
                                        </div>
                                    )
                                })}
                                </div>
                            </motion.div>
                        )}
                        </AnimatePresence>
                      </div>
                    )})}
                  </div>
                </motion.div>
              )}
              </AnimatePresence>
            </motion.div>
          )})}
        </div>
      </div>
    </div>
    </>
  );
};

export default Adminactions;
