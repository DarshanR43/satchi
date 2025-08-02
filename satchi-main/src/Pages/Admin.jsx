import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Plus, ChevronDown, Edit, Trash2, X, CheckSquare, Square, AlertTriangle, Users } from 'lucide-react';

// --- Mock User Database & Current User Simulation (with new sample roles) ---
const mockUsers = {
  'super@admin.com': { name: 'Super Admin' },
  'anokha.admin@event.com': { name: 'Anokha Admin' },
  'event.admin@example.com': { name: 'Event Admin' },
  'sub.admin@example.com': { name: 'Sub-Event Admin' },
  'amrito.manager@event.com': { name: 'Amrito Manager' },
  'general.manager@example.com': { name: 'General Manager' },
  'anokha.coord@event.com': { name: 'Anokha Coordinator' },
  'tech.coord@example.com': { name: 'Tech Coordinator' },
  'guest@visitor.com': { name: 'Guest' },
};

// --- Updated Mock Initial Data with 3 Levels & New Sample Role Assignments ---
const initialEvents = [
  {
    id: 1,
    name: 'Anokha',
    isOpen: true,
    description: 'Annual national-level tech fest.',
    rules: 'General rules for all Anokha events.',
    minMembers: 1,
    maxMembers: 5,
    facultyMentor: false,
    minFemaleMembers: 0,
    roles: { admins: ['anokha.admin@event.com'], managers: [], coordinators: [] },
    subEvents: [
      {
        id: 101,
        name: 'Anokha 2025',
        isOpen: true,
        description: 'Our annual national-level tech fest, showcasing innovation and talent from across the country.',
        rules: 'Follow all university guidelines.',
        minMembers: 1,
        maxMembers: 4,
        facultyMentor: true,
        minFemaleMembers: 1,
        // New Sub-Event admin assigned here
        roles: { admins: ['sub.admin@example.com'], managers: ['general.manager@example.com'], coordinators: ['anokha.coord@event.com'] },
        subSubEvents: [
          { id: 1011, name: 'Tech Fair 2025', isOpen: true, description: 'Showcasing cutting-edge projects.', rules: 'Project must be original.', minMembers: 2, maxMembers: 4, facultyMentor: true, minFemaleMembers: 0, roles: { admins: [], managers: [], coordinators: [] } },
          { id: 1012, name: 'RoboWars', isOpen: true, description: 'A thrilling competition where robots battle for supremacy.', rules: 'Robot must not exceed weight limit.', minMembers: 3, maxMembers: 5, facultyMentor: true, minFemaleMembers: 0, roles: { admins: [], managers: [], coordinators: ['tech.coord@example.com'] } },
        ],
      },
      { id: 102, name: 'Anokha 2024', isOpen: false, description: 'A look back at the groundbreaking projects.', rules: '', minMembers: 1, maxMembers: 1, facultyMentor: false, minFemaleMembers: 0, roles: { admins: [], managers: [], coordinators: [] }, subSubEvents: [] },
    ],
  },
  {
    id: 2,
    name: 'Amritotsavam',
    isOpen: true,
    description: 'Grand celebration of arts and culture.',
    rules: 'All performances must be approved.',
    minMembers: 1,
    maxMembers: 20,
    facultyMentor: false,
    minFemaleMembers: 0,
    roles: { admins: ['event.admin@example.com'], managers: ['amrito.manager@event.com'], coordinators: [] },
    subEvents: [
        { id: 201, name: 'Amritotsavam 2025', isOpen: true, description: 'The upcoming grand celebration.', rules: '', minMembers: 1, maxMembers: 10, facultyMentor: false, minFemaleMembers: 0, roles: { admins: [], managers: [], coordinators: [] }, subSubEvents: [] },
    ],
  },
];


// --- #################### Confirmation Modal Component #################### ---
const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, message }) => {
    if (!isOpen) return null;

    return (
        <motion.div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
            <motion.div
                initial={{ scale: 0.9, y: 50 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: -50 }}
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
                    <button onClick={onClose} className="px-6 py-2 rounded-md bg-white/10 text-white font-semibold hover:bg-white/20 transition">Cancel</button>
                    <button onClick={onConfirm} className="px-6 py-2 rounded-md bg-red-600 text-white font-bold hover:bg-red-700 transition">Confirm Delete</button>
                </div>
            </motion.div>
        </motion.div>
    );
};


// --- #################### Add/Edit Event Modal Component #################### ---
const AddEventModal = ({ isOpen, onClose, onSave, allEvents, userPermissions, creationContext = {} }) => {
    const [eventType, setEventType] = useState('sub');
    const [formData, setFormData] = useState({
        parentId: creationContext.parentId || '',
        subParentId: creationContext.subParentId || '',
        name: '',
        description: '',
        rules: '',
        minMembers: 1,
        maxMembers: 1,
        facultyMentor: false,
        minFemaleMembers: 0,
    });

    const creatableMainEvents = useMemo(() => {
        if (userPermissions.isSuperAdmin) return allEvents;
        return allEvents.filter(event => userPermissions.managedMainEventIds.includes(event.id));
    }, [allEvents, userPermissions]);

    const subEventOptions = useMemo(() => {
        if (!formData.parentId) return [];
        const parentEvent = allEvents.find(e => e.id === parseInt(formData.parentId));
        return parentEvent ? parentEvent.subEvents : [];
    }, [formData.parentId, allEvents]);

    useEffect(() => {
        if (isOpen) {
             const defaultType = userPermissions.creatableEventTypes[0] || 'sub';
             setEventType(defaultType);
             setFormData({
                parentId: creationContext.parentId || '',
                subParentId: creationContext.subParentId || '',
                name: '',
                description: '',
                rules: '',
                minMembers: 1,
                maxMembers: 1,
                facultyMentor: false,
                minFemaleMembers: 0,
            });
        }
    }, [isOpen, creationContext, userPermissions]);

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
    
    const isParentIdDisabled = (!!creationContext.parentId && !userPermissions.isSuperAdmin) || creatableMainEvents.length === 1;
    const isSubParentIdDisabled = !!creationContext.subParentId && !userPermissions.isSuperAdmin;

    return (
        <motion.div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
            <motion.div
                initial={{ scale: 0.9, y: 50 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: -50 }}
                className="bg-gray-900 border border-white/20 rounded-xl w-full max-w-2xl mx-auto"
                onClick={(e) => e.stopPropagation()}
            >
                <form onSubmit={handleSaveClick}>
                    <div className="flex items-center justify-between p-4 border-b border-white/10"><h2 className="text-2xl font-bold text-white">Create New Event</h2><button type="button" onClick={onClose} className="p-2 rounded-full hover:bg-white/10"><X size={24} className="text-gray-400" /></button></div>
                    <div className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
                        <div><label className="font-semibold block mb-2">What do you want to create?</label><select value={eventType} onChange={e => setEventType(e.target.value)} className="w-full p-2 rounded bg-black/40 border border-white/10 focus:ring-accent focus:ring-1">{userPermissions.creatableEventTypes?.map(type => <option key={type} value={type}>{type.replace('subsub', 'Sub-Sub Event').replace('sub', 'Sub Event').replace('main', 'Main Event')}</option>)}</select></div>
                        {eventType !== 'main' && (<div><label className="font-semibold block mb-2">Parent Main Event</label><select name="parentId" value={formData.parentId} onChange={handleInputChange} className="w-full p-2 rounded bg-black/40 border border-white/10" required disabled={isParentIdDisabled}><option value="">Select a Main Event...</option>{creatableMainEvents.map(event => <option key={event.id} value={event.id}>{event.name}</option>)}</select></div>)}
                        {eventType === 'subsub' && formData.parentId && (<div><label className="font-semibold block mb-2">Parent Sub Event</label><select name="subParentId" value={formData.subParentId} onChange={handleInputChange} className="w-full p-2 rounded bg-black/40 border border-white/10" required disabled={isSubParentIdDisabled}><option value="">Select a Sub Event...</option>{subEventOptions.map(sub => <option key={sub.id} value={sub.id}>{sub.name}</option>)}</select></div>)}
                        <div><label className="font-semibold block mb-2">Event Title</label><input type="text" name="name" value={formData.name} onChange={handleInputChange} placeholder="e.g., CodeBlitz 2026" className="w-full p-2 rounded bg-black/40 border border-white/10" required /></div>
                        <div><label className="font-semibold block mb-2">Event Description</label><textarea name="description" value={formData.description} onChange={handleInputChange} placeholder="A brief summary of the event." rows="3" className="w-full p-2 rounded bg-black/40 border border-white/10"></textarea></div>
                        <div><label className="font-semibold block mb-2">Rules</label><textarea name="rules" value={formData.rules} onChange={handleInputChange} placeholder="List the rules for participants." rows="4" className="w-full p-2 rounded bg-black/40 border border-white/10"></textarea></div>
                        <div className="grid grid-cols-2 gap-4">
                            <div><label className="font-semibold block mb-2">Min Team Members</label><input type="number" name="minMembers" value={formData.minMembers} onChange={handleInputChange} className="w-full p-2 rounded bg-black/40 border border-white/10" min="1" /></div>
                            <div><label className="font-semibold block mb-2">Max Team Members</label><input type="number" name="maxMembers" value={formData.maxMembers} onChange={handleInputChange} className="w-full p-2 rounded bg-black/40 border border-white/10" min={formData.minMembers} /></div>
                            <div><label className="font-semibold block mb-2">Min Female Members</label><input type="number" name="minFemaleMembers" value={formData.minFemaleMembers} onChange={handleInputChange} className="w-full p-2 rounded bg-black/40 border border-white/10" min="0" /></div>
                            <div className="flex items-center pt-6"><label htmlFor="facultyMentor" className="flex items-center cursor-pointer"><input id="facultyMentor" type="checkbox" name="facultyMentor" checked={formData.facultyMentor} onChange={handleInputChange} className="hidden" />{formData.facultyMentor ? <CheckSquare className="text-accent" /> : <Square />}<span className="ml-2 font-semibold">Faculty Mentor Required</span></label></div>
                        </div>
                    </div>
                    <div className="p-4 bg-black/20 border-t border-white/10 flex justify-end"><button type="submit" className="px-6 py-2 rounded-md bg-accent text-black font-bold hover:bg-[#FF805A] transition">Save Event</button></div>
                </form>
            </motion.div>
        </motion.div>
    );
};

// --- #################### Manage Roles Modal Component (NEW) #################### ---
const ManageRolesModal = ({ isOpen, onClose, onSave, event, canManageAdmins = false }) => {
    const [roles, setRoles] = useState(event?.roles || { admins: [], managers: [], coordinators: [] });
    const [newEmails, setNewEmails] = useState({ admins: '', managers: '', coordinators: '' });

    useEffect(() => {
        if (event) {
          setRoles(event.roles || { admins: [], managers: [], coordinators: [] });
        }
    }, [event]);

    if (!isOpen || !event) return null;

    const handleEmailInputChange = (e, roleType) => {
        setNewEmails(prev => ({ ...prev, [roleType]: e.target.value }));
    };

    const handleAddRole = (roleType) => {
        const email = newEmails[roleType].trim().toLowerCase();
        if (email && !roles[roleType].includes(email)) {
            setRoles(prev => ({ ...prev, [roleType]: [...prev[roleType], email] }));
            setNewEmails(prev => ({ ...prev, [roleType]: '' }));
        }
    };

    const handleRemoveRole = (roleType, email) => {
        setRoles(prev => ({ ...prev, [roleType]: prev[roleType].filter(r => r !== email) }));
    };

    const handleSave = () => {
        onSave(event.id, roles);
        onClose();
    };

    const RoleSection = ({ title, roleType }) => (
        <div className="space-y-2">
            <h4 className="font-bold text-lg text-white">{title}</h4>
            <div className="space-y-2">
                {roles[roleType]?.map(email => (
                    <div key={email} className="flex items-center justify-between bg-black/30 p-2 rounded-md">
                        <span className="text-sm text-gray-300">{email}</span>
                        <button onClick={() => handleRemoveRole(roleType, email)} className="p-1 text-red-500 hover:bg-red-500/20 rounded-full"><X size={14} /></button>
                    </div>
                ))}
            </div>
            <div className="flex gap-2 pt-2">
                <input
                    type="email"
                    placeholder={`Add ${roleType.slice(0, -1)} email...`}
                    value={newEmails[roleType]}
                    onChange={(e) => handleEmailInputChange(e, roleType)}
                    className="w-full p-2 rounded bg-black/40 border border-white/10 text-sm"
                />
                <button onClick={() => handleAddRole(roleType)} className="px-4 py-2 rounded-md bg-accent/80 text-black font-bold hover:bg-accent transition text-sm">Add</button>
            </div>
        </div>
    );

    return (
        <motion.div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
            <motion.div
                initial={{ scale: 0.9, y: 50 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: -50 }}
                className="bg-gray-900 border border-white/20 rounded-xl w-full max-w-2xl mx-auto"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between p-4 border-b border-white/10">
                    <h2 className="text-2xl font-bold text-white">Manage Roles for <span className="text-accent">{event.name}</span></h2>
                    <button type="button" onClick={onClose} className="p-2 rounded-full hover:bg-white/10"><X size={24} className="text-gray-400" /></button>
                </div>
                <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
                    {canManageAdmins && <RoleSection title="Administrators" roleType="admins" />}
                    <RoleSection title="Managers" roleType="managers" />
                    <RoleSection title="Coordinators" roleType="coordinators" />
                </div>
                <div className="p-4 bg-black/20 border-t border-white/10 flex justify-end">
                    <button onClick={handleSave} className="px-6 py-2 rounded-md bg-accent text-black font-bold hover:bg-[#FF805A] transition">Save Changes</button>
                </div>
            </motion.div>
        </motion.div>
    );
};


// --- #################### Main Admin Component #################### ---
const Events = () => {
  const [events, setEvents] = useState(initialEvents);
  const [currentUserEmail, setCurrentUserEmail] = useState('guest@visitor.com');
  const [expandedEvents, setExpandedEvents] = useState({1: true, 101: true});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [creationContext, setCreationContext] = useState({});
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [eventToDelete, setEventToDelete] = useState(null);
  const [isRolesModalOpen, setIsRolesModalOpen] = useState(false);
  const [eventToManageRoles, setEventToManageRoles] = useState(null);
  const [rolesModalPermissions, setRolesModalPermissions] = useState({ canManageAdmins: false });

  const navigate = useNavigate();

  // --- Heavily updated permission logic ---
  const userPermissions = useMemo(() => {
    const user = currentUserEmail;
    const isSuperAdmin = user === 'super@admin.com';

    if (isSuperAdmin) {
        return {
            isSuperAdmin: true,
            creatableEventTypes: ['main', 'sub', 'subsub'],
            managedMainEventIds: [],
            managedSubEventDetails: [],
            getPermissions: () => ({ canEdit: true, canCreate: true, canDelete: true, canManageRoles: true, canManageAdminRole: true }),
        };
    }

    const managedMainEventIds = events.filter(e => e.roles.admins.includes(user)).map(e => e.id);
    const managedSubEventDetails = [];
     events.forEach(mainEvent => {
        mainEvent.subEvents.forEach(subEvent => {
            if (subEvent.roles.admins.includes(user)) {
                managedSubEventDetails.push({ id: subEvent.id, parentId: mainEvent.id });
            }
        });
    });

    let creatableEventTypes = [];
    if (managedMainEventIds.length > 0) creatableEventTypes.push('sub', 'subsub');
    if (managedSubEventDetails.length > 0 && !creatableEventTypes.includes('subsub')) creatableEventTypes.push('subsub');

    return {
        isSuperAdmin: false,
        creatableEventTypes,
        managedMainEventIds,
        managedSubEventDetails,
        getPermissions: (event, subEvent = null, subSubEvent = null) => {
            const isMainAdmin = managedMainEventIds.includes(event.id);
            const isSubAdmin = subEvent ? managedSubEventDetails.some(d => d.id === subEvent.id) : false;

            // Determine if the user has any role in the specific event context
            let isEventManager = event.roles.managers.includes(user);
            let isEventCoordinator = event.roles.coordinators.includes(user);
            if (subEvent) {
                isEventManager = isEventManager || subEvent.roles.managers.includes(user);
                isEventCoordinator = isEventCoordinator || subEvent.roles.coordinators.includes(user);
            }
             if (subSubEvent) {
                isEventManager = isEventManager || subSubEvent.roles.managers.includes(user);
                isEventCoordinator = isEventCoordinator || subSubEvent.roles.coordinators.includes(user);
            }

            const canManageRoles = isMainAdmin || isSubAdmin;
            
            // Default to false, grant true only on specific conditions
            let canEdit = isEventManager || isEventCoordinator;
            let canDelete = false;
            let canManageAdminRole = false;

            if (isMainAdmin) {
                canEdit = true;
                canManageAdminRole = true; // Main admin can manage roles fully for main event and all children
                if(subEvent) canDelete = true;
            }

            if (isSubAdmin) {
                // If we are looking at the sub-event this user administers, or its children
                if(subEvent && subEvent.id === managedSubEventDetails.find(d => d.id === subEvent.id)?.id) {
                    canEdit = true;
                    // Can only manage admins for children, not for the sub-event itself.
                    canManageAdminRole = subSubEvent !== null; 
                    if(subSubEvent) canDelete = true;
                }
            }

            return {
                canEdit,
                canCreate: isMainAdmin || isSubAdmin,
                canDelete,
                canManageRoles,
                canManageAdminRole
            };
        }
    };
  }, [currentUserEmail, events]);

  const handleCreateEvent = (type, data) => {
    const { parentId: parentIdStr, subParentId: subParentIdStr, ...eventDetails } = data;
    const newEventData = { id: Date.now(), isOpen: true, roles: { admins: [], managers: [], coordinators: [] }, ...eventDetails };
    if (type === 'main') setEvents([{ ...newEventData, subEvents: [] }, ...events]);
    else if (type === 'sub' && parentIdStr) {
        const parentId = parseInt(parentIdStr, 10);
        setEvents(events.map(e => e.id === parentId ? { ...e, subEvents: [{ ...newEventData, subSubEvents: [] }, ...e.subEvents] } : e));
    } 
    else if (type === 'subsub' && parentIdStr && subParentIdStr) {
        const parentId = parseInt(parentIdStr, 10);
        const subParentId = parseInt(subParentIdStr, 10);
        setEvents(events.map(e => e.id !== parentId ? e : { ...e, subEvents: e.subEvents.map(sub => sub.id === subParentId ? { ...sub, subSubEvents: [newEventData, ...sub.subSubEvents] } : sub)}));
    }
  };

  const handleDeleteEvent = () => {
    if (!eventToDelete) return;
    const { id, level } = eventToDelete;

    let newEvents = [...events];
    if (level === 'main') {
        newEvents = newEvents.filter(e => e.id !== id);
    } else if (level === 'sub') {
        newEvents = newEvents.map(e => ({
            ...e,
            subEvents: e.subEvents.filter(sub => sub.id !== id),
        }));
    } else if (level === 'subsub') {
        newEvents = newEvents.map(e => ({
            ...e,
            subEvents: e.subEvents.map(sub => ({
                ...sub,
                subSubEvents: sub.subSubEvents.filter(ss => ss.id !== id),
            })),
        }));
    }
    setEvents(newEvents);
    setIsDeleteModalOpen(false);
    setEventToDelete(null);
  };

  const handleSaveRoles = (eventId, newRoles) => {
    const findAndReplaceRoles = (currentEvents) => {
        return currentEvents.map(event => {
            if (event.id === eventId) {
                return { ...event, roles: newRoles };
            }
            if (event.subEvents) {
                const newSubEvents = event.subEvents.map(subEvent => {
                    if (subEvent.id === eventId) {
                        return { ...subEvent, roles: newRoles };
                    }
                    if (subEvent.subSubEvents) {
                         const newSubSubEvents = subEvent.subSubEvents.map(ssEvent => {
                            if (ssEvent.id === eventId) {
                                return { ...ssEvent, roles: newRoles };
                            }
                            return ssEvent;
                        });
                        return { ...subEvent, subSubEvents: newSubSubEvents };
                    }
                    return subEvent;
                });
                return { ...event, subEvents: newSubEvents };
            }
            return event;
        });
    };
    setEvents(findAndReplaceRoles(events));
  };


  const openDeleteModal = (id, level, name) => {
    setEventToDelete({ id, level, name });
    setIsDeleteModalOpen(true);
  };

  const toggleStatus = (id, level) => {
      const closeChildren = (subEvents) => subEvents.map(sub => ({ ...sub, isOpen: false, subSubEvents: sub.subSubEvents ? sub.subSubEvents.map(ss => ({...ss, isOpen: false})) : [] }));
      const closeSubChildren = (subSubEvents) => subSubEvents.map(ss => ({ ...ss, isOpen: false }));
      let newEvents = JSON.parse(JSON.stringify(events));
      if (level === 'main') {
          const event = newEvents.find(e => e.id === id);
          if (event) { event.isOpen = !event.isOpen; if (!event.isOpen) event.subEvents = closeChildren(event.subEvents); }
      } else if (level === 'sub') {
          for (const event of newEvents) {
              const subEvent = event.subEvents.find(sub => sub.id === id);
              if (subEvent) { subEvent.isOpen = !subEvent.isOpen; if (!subEvent.isOpen) subEvent.subSubEvents = closeSubChildren(subEvent.subSubEvents); break; }
          }
      } else if (level === 'subsub') {
          for (const event of newEvents) for (const subEvent of event.subEvents) {
              const subSubEvent = subEvent.subSubEvents.find(ss => ss.id === id);
              if (subSubEvent) { subSubEvent.isOpen = !subSubEvent.isOpen; break; }
          }
      }
      setEvents(newEvents);
  };
  
  const handleOpenModal = (context = {}) => {
      setCreationContext(context);
      setIsModalOpen(true);
  };
  
  const handleOpenRolesModal = (event, perms) => {
      setEventToManageRoles(event);
      setRolesModalPermissions({ canManageAdmins: perms.canManageAdminRole });
      setIsRolesModalOpen(true);
  };

  const toggleExpand = (id) => setExpandedEvents(prev => ({...prev, [id]: !prev[id]}));

  return (
    <>
    <AddEventModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleCreateEvent} allEvents={events} userPermissions={userPermissions} creationContext={creationContext} />
    <ConfirmationModal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} onConfirm={handleDeleteEvent} title="Confirm Deletion" message={`Are you sure you want to permanently delete "${eventToDelete?.name}"? This action cannot be undone.`} />
    <ManageRolesModal isOpen={isRolesModalOpen} onClose={() => setIsRolesModalOpen(false)} onSave={handleSaveRoles} event={eventToManageRoles} canManageAdmins={rolesModalPermissions.canManageAdmins} />

    <div className="relative w-full min-h-screen px-4 sm:px-6 lg:px-8 py-20 pt-32 text-white font-body bg-black">
      <div className="max-w-5xl mx-auto">
        <motion.div initial={{ opacity: 0, y: -50 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }} className="text-center mb-8"><h1 className="text-4xl sm:text-5xl md:text-6xl font-bold bg-gradient-to-r from-accent to-vibrant bg-clip-text text-transparent">Admin Dashboard</h1><p className="text-lg text-gray-400 mt-4">Manage all university events, roles, and settings.</p></motion.div>
        <div className="flex flex-wrap justify-between items-center gap-4 mb-8 p-4 bg-white/5 border border-white/10 rounded-xl">
             <div className='flex items-center gap-2'><label className="text-sm font-semibold">Simulate Login:</label><select value={currentUserEmail} onChange={e => setCurrentUserEmail(e.target.value)} className="px-3 py-1.5 rounded bg-black/40 text-white border border-white/10 text-sm focus:outline-none focus:ring-1 focus:ring-accent">{Object.entries(mockUsers).map(([email, {name}]) => <option key={email} value={email}>{name}</option>)}</select></div>
            {userPermissions.isSuperAdmin && (<button onClick={() => handleOpenModal()} className="flex items-center justify-center gap-2 px-6 py-2 rounded-md bg-accent text-black font-bold hover:bg-[#FF805A] transition"><Plus size={18} /> Create Event</button>)}
        </div>
        <div className="space-y-6">
          {events.map((event) => {
            const mainPerms = userPermissions.getPermissions(event);
            return (
            <motion.div key={event.id} layout className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
              <div className="flex items-center justify-between p-4 sm:p-5 cursor-pointer hover:bg-white/10" onClick={() => toggleExpand(event.id)}>
                <div className="flex items-center gap-4"><span className={`w-3 h-3 rounded-full ${event.isOpen ? 'bg-green-500' : 'bg-red-500'}`}></span><h2 className="text-xl sm:text-2xl font-bold">{event.name}</h2></div>
                <div className="flex items-center gap-2">
                  {mainPerms.canManageRoles && (<button onClick={(e) => { e.stopPropagation(); handleOpenRolesModal(event, mainPerms); }} className="p-2 rounded-md text-cyan-400 hover:bg-cyan-500/20"><Users size={16}/></button>)}
                  {userPermissions.isSuperAdmin && (<button onClick={(e) => { e.stopPropagation(); openDeleteModal(event.id, 'main', event.name); }} className="p-2 rounded-md text-red-500 hover:bg-red-500/20"><Trash2 size={16}/></button>)}
                  {mainPerms.canEdit && (<button onClick={(e) => { e.stopPropagation(); toggleStatus(event.id, 'main'); }} className="p-2 rounded-md hover:bg-white/20"><Edit size={16}/></button>)}
                  <ChevronDown size={24} className={`transition-transform duration-300 ${expandedEvents[event.id] ? 'rotate-180' : ''}`} />
                </div>
              </div>
              <AnimatePresence>
              {expandedEvents[event.id] && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="border-t border-white/10">
                  <div className="p-4 sm:p-6 space-y-4">
                    {userPermissions.managedMainEventIds.includes(event.id) && !userPermissions.isSuperAdmin && (<div className="mb-4"><button onClick={() => handleOpenModal({ parentId: event.id })} className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-md bg-accent/20 text-accent font-semibold hover:bg-accent/30 transition"><Plus size={16}/> Add Sub-Event to {event.name}</button></div>)}
                    {event.subEvents.map((subEvent) => {
                      const subPerms = userPermissions.getPermissions(event, subEvent);
                      const isSubAdminForThis = userPermissions.managedSubEventDetails.some(d => d.id === subEvent.id);
                      return (
                      <div key={subEvent.id} className="bg-black/20 p-4 rounded-lg">
                        <div className="flex items-center justify-between cursor-pointer" onClick={() => toggleExpand(subEvent.id)}>
                            <div className="flex items-center gap-3"><span className={`w-2.5 h-2.5 rounded-full ${subEvent.isOpen ? 'bg-green-400' : 'bg-red-400'}`}></span><h3 className="font-semibold text-lg text-cyan-300">{subEvent.name}</h3></div>
                            <div className="flex items-center gap-2">
                                {subPerms.canManageRoles && (<button onClick={(e) => { e.stopPropagation(); handleOpenRolesModal(subEvent, subPerms); }} className="p-2 rounded-md text-cyan-400 hover:bg-cyan-500/20"><Users size={14}/></button>)}
                                {subPerms.canDelete && (<button onClick={(e) => { e.stopPropagation(); openDeleteModal(subEvent.id, 'sub', subEvent.name); }} className="p-2 rounded-md text-red-500 hover:bg-red-500/20"><Trash2 size={14}/></button>)}
                                {subPerms.canEdit && (<button onClick={(e) => { e.stopPropagation(); toggleStatus(subEvent.id, 'sub'); }} className="p-2 rounded-md hover:bg-white/20 disabled:opacity-50" disabled={!event.isOpen}><Edit size={14}/></button>)}
                                <ChevronDown size={20} className={`transition-transform duration-300 ${expandedEvents[subEvent.id] ? 'rotate-180' : ''}`} />
                            </div>
                        </div>
                        <AnimatePresence>
                        {expandedEvents[subEvent.id] && (
                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="border-t border-white/10 mt-3 pt-3">
                               {isSubAdminForThis && (<div className="mb-3"><button onClick={() => handleOpenModal({ parentId: event.id, subParentId: subEvent.id })} className="w-full flex items-center justify-center gap-2 px-3 py-1.5 rounded-md bg-cyan-500/20 text-cyan-400 font-semibold hover:bg-cyan-500/30 transition text-sm"><Plus size={14}/> Add Sub-Sub-Event</button></div>)}
                               <div className="pl-4 space-y-3">
                                {subEvent.subSubEvents.map(ssEvent => {
                                    const ssPerms = userPermissions.getPermissions(event, subEvent, ssEvent);
                                    return (
                                        <div key={ssEvent.id} className="flex items-center justify-between">
                                            <div className="flex items-center gap-3"><span className={`w-2 h-2 rounded-full ${ssEvent.isOpen ? 'bg-green-400' : 'bg-red-400'}`}></span><p>{ssEvent.name}</p></div>
                                            <div className="flex items-center gap-1">
                                                {ssPerms.canManageRoles && (<button onClick={(e) => { e.stopPropagation(); handleOpenRolesModal(ssEvent, ssPerms); }} className="p-1 rounded-md text-cyan-400 hover:bg-cyan-500/20"><Users size={12}/></button>)}
                                                {ssPerms.canDelete && (<button onClick={(e) => { e.stopPropagation(); openDeleteModal(ssEvent.id, 'subsub', ssEvent.name); }} className="p-1 rounded-md text-red-500 hover:bg-red-500/20"><Trash2 size={12}/></button>)}
                                                {ssPerms.canEdit && (<button onClick={(e) => { e.stopPropagation(); toggleStatus(ssEvent.id, 'subsub'); }} className="p-1 rounded-md hover:bg-white/20 disabled:opacity-50" disabled={!subEvent.isOpen}><Edit size={12}/></button>)}
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

export default Events;