import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, ChevronDown, Edit, Trash2, X, CheckSquare, Square, AlertTriangle, Users } from 'lucide-react';

// --- Mock User Database ---
const mockUsers = {
  'super@admin.com': { name: 'Super Admin' },
  'anokha.admin@event.com': { name: 'Anokha Admin' },
  'sub.admin@example.com': { name: 'Sub-Event Admin' },
  'general.manager@example.com': { name: 'General Manager' },
  'tech.coord@example.com': { name: 'Tech Coordinator' },
  'guest@visitor.com': { name: 'Guest' },
};

// --- Updated Initial Data Structure ---
// Fields for members, rules, etc., are now ONLY in sub-sub-events.
const initialEvents = [
  {
    id: 1,
    name: 'Anokha',
    isOpen: true,
    description: 'Annual national-level tech fest.',
    roles: { admins: ['anokha.admin@event.com'], managers: [], coordinators: [] },
    subEvents: [
      {
        id: 101,
        name: 'Anokha 2025',
        isOpen: true,
        description: 'Our annual national-level tech fest, showcasing innovation and talent.',
        roles: { admins: ['sub.admin@example.com'], managers: ['general.manager@example.com'], coordinators: [] },
        subSubEvents: [
          { id: 1011, name: 'Tech Fair 2025', isOpen: true, description: 'Showcasing cutting-edge projects.', rules: 'Project must be original.', minMembers: 2, maxMembers: 4, facultyMentor: true, minFemaleMembers: 0, roles: { admins: [], managers: [], coordinators: [] } },
          { id: 1012, name: 'RoboWars', isOpen: true, description: 'A thrilling competition where robots battle for supremacy.', rules: 'Robot must not exceed weight limit.', minMembers: 3, maxMembers: 5, facultyMentor: true, minFemaleMembers: 0, roles: { admins: [], managers: [], coordinators: ['tech.coord@example.com'] } },
        ],
      },
      { id: 102, name: 'Anokha 2024', isOpen: false, description: 'A look back at the groundbreaking projects.', roles: { admins: [], managers: [], coordinators: [] }, subSubEvents: [] },
    ],
  },
  {
    id: 2,
    name: 'Amritotsavam',
    isOpen: true,
    description: 'Grand celebration of arts and culture.',
    roles: { admins: [], managers: [], coordinators: [] },
    subEvents: [],
  },
];


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


// --- #################### Add Event Modal Component (Refactored) #################### ---
const AddEventModal = ({ isOpen, onClose, onSave, allEvents, userPermissions, creationContext = {} }) => {
    const [eventType, setEventType] = useState('sub');
    
    // FIX: Initialize all possible form fields to prevent the "uncontrolled to controlled" error.
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
            
            // FIX: When resetting the form, ensure all keys are preserved.
            const baseData = {
                // Reset all fields to default
                parentId: '',
                subParentId: '',
                name: '',
                description: '',
                rules: '',
                minMembers: 1,
                maxMembers: 1,
                facultyMentor: false,
                minFemaleMembers: 0,
                // Apply context-specific values from creationContext
                ...creationContext,
            };
            setFormData(baseData);
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
    
    const isParentIdDisabled = (!!creationContext.parentId && !userPermissions.isSuperAdmin);
    const isSubParentIdDisabled = (!!creationContext.subParentId && !userPermissions.isSuperAdmin);

    return (
        <motion.div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
            <motion.div initial={{ scale: 0.9, y: 50 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: -50 }} className="bg-gray-900 border border-white/20 rounded-xl w-full max-w-2xl mx-auto" onClick={(e) => e.stopPropagation()}>
                <form onSubmit={handleSaveClick}>
                    <div className="flex items-center justify-between p-4 border-b border-white/10"><h2 className="text-2xl font-bold text-white">Create New Event</h2><button type="button" onClick={onClose} className="p-2 rounded-full hover:bg-white/10"><X size={24} className="text-gray-400" /></button></div>
                    <div className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
                        <div><label className="font-semibold block mb-2">What do you want to create?</label><select value={eventType} onChange={e => setEventType(e.target.value)} className="w-full p-2 rounded bg-black/40 border border-white/10 focus:ring-accent focus:ring-1">{userPermissions.creatableEventTypes?.map(type => <option key={type} value={type}>{type.replace('subsub', 'Sub-Sub Event').replace('sub', 'Sub Event').replace('main', 'Main Event')}</option>)}</select></div>
                        {eventType !== 'main' && (<div><label className="font-semibold block mb-2">Parent Main Event</label><select name="parentId" value={formData.parentId} onChange={handleInputChange} className="w-full p-2 rounded bg-black/40 border border-white/10" required disabled={isParentIdDisabled}><option value="">Select a Main Event...</option>{creatableMainEvents.map(event => <option key={event.id} value={event.id}>{event.name}</option>)}</select></div>)}
                        {eventType === 'subsub' && formData.parentId && (<div><label className="font-semibold block mb-2">Parent Sub Event</label><select name="subParentId" value={formData.subParentId} onChange={handleInputChange} className="w-full p-2 rounded bg-black/40 border border-white/10" required disabled={isSubParentIdDisabled}><option value="">Select a Sub Event...</option>{subEventOptions.map(sub => <option key={sub.id} value={sub.id}>{sub.name}</option>)}</select></div>)}
                        <div><label className="font-semibold block mb-2">Event Title</label><input type="text" name="name" value={formData.name} onChange={handleInputChange} placeholder="e.g., CodeBlitz 2026" className="w-full p-2 rounded bg-black/40 border border-white/10" required /></div>
                        <div><label className="font-semibold block mb-2">Event Description</label><textarea name="description" value={formData.description} onChange={handleInputChange} placeholder="A brief summary of the event." rows="3" className="w-full p-2 rounded bg-black/40 border border-white/10"></textarea></div>
                        
                        {/* --- Conditional Fields for Sub-Sub-Events Only --- */}
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
// Moved outside the ManageRolesModal to prevent re-rendering issues that cause input focus loss.
const RoleSection = ({ title, roleType, roles, newEmail, onEmailChange, onAddRole, onRemoveRole }) => (
    <div className="space-y-2">
        <h4 className="font-bold text-lg text-white">{title}</h4>
        <div className="space-y-2 max-h-32 overflow-y-auto pr-2">
            {roles?.map(email => (
                // FIX: Changed flex properties to center the email text.
                <div key={email} className="flex items-center bg-black/30 p-2 rounded-md">
                    <span className="flex-grow text-center text-sm text-gray-300">{email}</span>
                    <button onClick={() => onRemoveRole(roleType, email)} className="p-1 text-red-500 hover:bg-red-500/20 rounded-full ml-2">
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


// --- #################### Manage Roles Modal Component (Refactored) #################### ---
const ManageRolesModal = ({ isOpen, onClose, onSave, event, permissions }) => {
    const [roles, setRoles] = useState(event?.roles || { admins: [], managers: [], coordinators: [] });
    const [newEmails, setNewEmails] = useState({ admins: '', managers: '', coordinators: '' });
    const [emailError, setEmailError] = useState('');

    useEffect(() => { 
        if (event) { 
            setRoles(event.roles || { admins: [], managers: [], coordinators: [] }); 
            setEmailError(''); // Reset error when modal opens or event changes
        } 
    }, [event]);

    if (!isOpen || !event) return null;

    const handleAddRole = (roleType) => {
        const email = newEmails[roleType].trim().toLowerCase();
        if (!email.endsWith('amrita.edu')) {
            setEmailError('Email must end with amrita.edu');
            return;
        }
        if (email && !roles[roleType].includes(email)) {
            setRoles(prev => ({ ...prev, [roleType]: [...prev[roleType], email] }));
            setNewEmails(prev => ({ ...prev, [roleType]: '' }));
            setEmailError(''); // Clear error on successful add
        }
    };

    const handleRemoveRole = (roleType, email) => { 
        setRoles(prev => ({ ...prev, [roleType]: prev[roleType].filter(r => r !== email) })); 
    };
    
    const handleSave = () => { 
        onSave(event.id, roles); 
        onClose(); 
    };

    const handleEmailInputChange = (e, roleType) => { 
        setNewEmails(prev => ({ ...prev, [roleType]: e.target.value })); 
        if (emailError) {
            setEmailError('');
        }
    };

    return (
        <motion.div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
            <motion.div initial={{ scale: 0.9, y: 50 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: -50 }} className="bg-gray-900 border border-white/20 rounded-xl w-full max-w-2xl mx-auto" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between p-4 border-b border-white/10">
                    <h2 className="text-2xl font-bold text-white">Manage Roles for <span className="text-accent">{event.name}</span></h2>
                    <button type="button" onClick={onClose} className="p-2 rounded-full hover:bg-white/10"><X size={24} className="text-gray-400" /></button>
                </div>
                <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
                    {emailError && (
                        <div className="flex items-center gap-2 p-2 text-sm text-red-400 bg-red-500/10 rounded-md">
                            <AlertTriangle size={16} />
                            <span>{emailError}</span>
                        </div>
                    )}
                    {permissions.canManageAdminRole && <RoleSection title="Administrators" roleType="admins" roles={roles.admins} newEmail={newEmails.admins} onEmailChange={handleEmailInputChange} onAddRole={handleAddRole} onRemoveRole={handleRemoveRole} />}
                    {permissions.canManageManagerRole && <RoleSection title="Managers" roleType="managers" roles={roles.managers} newEmail={newEmails.managers} onEmailChange={handleEmailInputChange} onAddRole={handleAddRole} onRemoveRole={handleRemoveRole} />}
                    {permissions.canManageCoordinatorRole && <RoleSection title="Coordinators" roleType="coordinators" roles={roles.coordinators} newEmail={newEmails.coordinators} onEmailChange={handleEmailInputChange} onAddRole={handleAddRole} onRemoveRole={handleRemoveRole} />}
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
  const [events, setEvents] = useState(initialEvents);
  const [currentUserEmail, setCurrentUserEmail] = useState('guest@visitor.com');
  const [expandedEvents, setExpandedEvents] = useState({1: true, 101: true});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [creationContext, setCreationContext] = useState({});
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [eventToDelete, setEventToDelete] = useState(null);
  const [isRolesModalOpen, setIsRolesModalOpen] = useState(false);
  const [eventToManageRoles, setEventToManageRoles] = useState(null);
  const [rolesModalPermissions, setRolesModalPermissions] = useState({});

  // --- Heavily updated permission logic ---
  const userPermissions = useMemo(() => {
    const user = currentUserEmail;
    const isSuperAdmin = user === 'super@admin.com';

    if (isSuperAdmin) {
        return {
            isSuperAdmin: true,
            creatableEventTypes: ['main', 'sub', 'subsub'],
            managedMainEventIds: [],
            getPermissions: () => ({ canToggleRegistration: true, canCreateSubEvent: true, canCreateSubSubEvent: true, canDelete: true, canManageRoles: true, canManageAdminRole: true, canManageManagerRole: true, canManageCoordinatorRole: true }),
        };
    }

    const managedMainEventIds = events.filter(e => e.roles.admins.includes(user)).map(e => e.id);
    const isAnySubAdmin = events.some(e => e.subEvents.some(s => s.roles.admins.includes(user)));
    
    let creatableEventTypes = [];
    if (managedMainEventIds.length > 0) {
        creatableEventTypes.push('sub', 'subsub');
    } else if (isAnySubAdmin) {
        creatableEventTypes.push('subsub');
    }

    return {
        isSuperAdmin: false,
        creatableEventTypes,
        managedMainEventIds,
        getPermissions: (event, subEvent = null, subSubEvent = null) => {
            let isMainAdmin = managedMainEventIds.includes(event.id);
            let isSubAdmin = false, isSubSubAdmin = false;
            let isMainManager = false, isSubManager = false, isSubSubManager = false;
            let isMainCoordinator = false, isSubCoordinator = false, isSubSubCoordinator = false;

            // Determine admin role for context
            if (isMainAdmin) {
                isSubAdmin = true;
                isSubSubAdmin = true;
            } else {
                isSubAdmin = subEvent ? event.subEvents.find(s => s.id === subEvent.id)?.roles.admins.includes(user) : false;
                if (isSubAdmin) isSubSubAdmin = true;
            }

            // Determine manager role for context (cascading)
            isMainManager = event.roles.managers.includes(user);
            isSubManager = isMainManager || (subEvent ? subEvent.roles.managers.includes(user) : false);
            isSubSubManager = isSubManager || (subSubEvent ? subSubEvent.roles.managers.includes(user) : false);

            // Determine coordinator role for context (cascading)
            isMainCoordinator = event.roles.coordinators.includes(user);
            isSubCoordinator = isMainCoordinator || (subEvent ? subEvent.roles.coordinators.includes(user) : false);
            isSubSubCoordinator = isSubCoordinator || (subSubEvent ? subSubEvent.roles.coordinators.includes(user) : false);

            // Consolidate roles for the specific event level being checked
            let hasAdminRole = false, hasManagerRole = false, hasCoordinatorRole = false;
            if(subSubEvent) {
                hasAdminRole = isSubSubAdmin;
                hasManagerRole = isSubSubManager;
                hasCoordinatorRole = isSubSubCoordinator;
            } else if (subEvent) {
                hasAdminRole = isSubAdmin;
                hasManagerRole = isSubManager;
                hasCoordinatorRole = isSubCoordinator;
            } else {
                hasAdminRole = isMainAdmin;
                hasManagerRole = isMainManager;
                hasCoordinatorRole = isMainCoordinator;
            }

            // Determine permissions based on consolidated roles
            const canToggleRegistration = hasAdminRole || hasManagerRole || hasCoordinatorRole;
            const canManageCoordinatorRole = hasAdminRole || hasManagerRole;
            const canManageManagerRole = hasAdminRole;
            const canManageAdminRole = hasAdminRole;
            
            const canCreateSubEvent = isMainAdmin;
            const canCreateSubSubEvent = isMainAdmin || isSubAdmin;


            return {
                canToggleRegistration,
                canCreateSubEvent,
                canCreateSubSubEvent,
                canDelete: isMainAdmin && (subEvent !== null), // Only main admins can delete children
                canManageRoles: canManageAdminRole || canManageManagerRole || canManageCoordinatorRole,
                canManageAdminRole,
                canManageManagerRole,
                canManageCoordinatorRole,
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
    if (level === 'main') { newEvents = newEvents.filter(e => e.id !== id); } 
    else if (level === 'sub') { newEvents = newEvents.map(e => ({ ...e, subEvents: e.subEvents.filter(sub => sub.id !== id) }));} 
    else if (level === 'subsub') { newEvents = newEvents.map(e => ({ ...e, subEvents: e.subEvents.map(sub => ({ ...sub, subSubEvents: sub.subSubEvents.filter(ss => ss.id !== id) })) }));}
    setEvents(newEvents);
    setIsDeleteModalOpen(false);
    setEventToDelete(null);
  };

  const handleSaveRoles = (eventId, newRoles) => {
    const findAndReplaceRoles = (currentEvents) => {
        return currentEvents.map(event => {
            if (event.id === eventId) return { ...event, roles: newRoles };
            if (event.subEvents) {
                const newSubEvents = event.subEvents.map(subEvent => {
                    if (subEvent.id === eventId) return { ...subEvent, roles: newRoles };
                    if (subEvent.subSubEvents) {
                         const newSubSubEvents = subEvent.subSubEvents.map(ssEvent => (ssEvent.id === eventId) ? { ...ssEvent, roles: newRoles } : ssEvent);
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


  const openDeleteModal = (id, level, name) => { setEventToDelete({ id, level, name }); setIsDeleteModalOpen(true); };

  const toggleRegistrationStatus = (id, level) => {
      const closeChildren = (subEvents) => subEvents.map(sub => ({ ...sub, isOpen: false, subSubEvents: sub.subSubEvents ? sub.subSubEvents.map(ss => ({...ss, isOpen: false})) : [] }));
      const closeSubChildren = (subSubEvents) => subSubEvents.map(ss => ({ ...ss, isOpen: false }));
      
      const newEvents = events.map(event => {
          if (level === 'main' && event.id === id) {
              const newIsOpen = !event.isOpen;
              return { ...event, isOpen: newIsOpen, ...(!newIsOpen && { subEvents: closeChildren(event.subEvents) }) };
          }
          if (event.subEvents) {
              return { ...event, subEvents: event.subEvents.map(subEvent => {
                  if(level === 'sub' && subEvent.id === id) {
                      const newIsOpen = !subEvent.isOpen;
                      return { ...subEvent, isOpen: newIsOpen, ...(!newIsOpen && { subSubEvents: closeSubChildren(subEvent.subSubEvents) }) };
                  }
                  if (subEvent.subSubEvents) {
                      return { ...subEvent, subSubEvents: subEvent.subSubEvents.map(ssEvent => {
                          if (level === 'subsub' && ssEvent.id === id) return { ...ssEvent, isOpen: !ssEvent.isOpen };
                          return ssEvent;
                      })}
                  }
                  return subEvent;
              })}
          }
          return event;
      });
      setEvents(newEvents);
  };
  
  const handleOpenModal = (context = {}) => { setCreationContext(context); setIsModalOpen(true); };
  
  const handleOpenRolesModal = (event, perms) => {
      setEventToManageRoles(event);
      setRolesModalPermissions(perms);
      setIsRolesModalOpen(true);
  };

  const toggleExpand = (id) => setExpandedEvents(prev => ({...prev, [id]: !prev[id]}));

  return (
    <>
    <AddEventModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleCreateEvent} allEvents={events} userPermissions={userPermissions} creationContext={creationContext} />
    <ConfirmationModal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} onConfirm={handleDeleteEvent} title="Confirm Deletion" message={`Are you sure you want to permanently delete "${eventToDelete?.name}"? This action cannot be undone.`} />
    <ManageRolesModal isOpen={isRolesModalOpen} onClose={() => setIsRolesModalOpen(false)} onSave={handleSaveRoles} event={eventToManageRoles} permissions={rolesModalPermissions} />

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
                  {mainPerms.canManageRoles && (<button onClick={(e) => { e.stopPropagation(); handleOpenRolesModal(event, mainPerms); }} className="p-2 rounded-md text-accent hover:bg-accent/20"><Users size={16}/></button>)}
                  {mainPerms.canDelete && (<button onClick={(e) => { e.stopPropagation(); openDeleteModal(event.id, 'main', event.name); }} className="p-2 rounded-md text-red-500 hover:bg-red-500/20"><Trash2 size={16}/></button>)}
                  {mainPerms.canToggleRegistration && (<button onClick={(e) => { e.stopPropagation(); toggleRegistrationStatus(event.id, 'main'); }} className="p-2 rounded-md hover:bg-white/20"><Edit size={16}/></button>)}
                  <ChevronDown size={24} className={`transition-transform duration-300 ${expandedEvents[event.id] ? 'rotate-180' : ''}`} />
                </div>
              </div>
              <AnimatePresence>
              {expandedEvents[event.id] && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="border-t border-white/10">
                  <div className="p-4 sm:p-6 space-y-4">
                    {mainPerms.canCreateSubEvent && (<div className="mb-4"><button onClick={() => handleOpenModal({ parentId: event.id })} className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-md bg-accent/20 text-accent font-semibold hover:bg-accent/30 transition"><Plus size={16}/> Add Sub-Event to {event.name}</button></div>)}
                    {event.subEvents.map((subEvent) => {
                      const subPerms = userPermissions.getPermissions(event, subEvent);
                      return (
                      <div key={subEvent.id} className="bg-black/20 p-4 rounded-lg">
                        <div className="flex items-center justify-between cursor-pointer" onClick={() => toggleExpand(subEvent.id)}>
                            <div className="flex items-center gap-3"><span className={`w-2.5 h-2.5 rounded-full ${subEvent.isOpen ? 'bg-green-400' : 'bg-red-400'}`}></span><h3 className="font-semibold text-lg text-accent">{subEvent.name}</h3></div>
                            <div className="flex items-center gap-2">
                                {subPerms.canManageRoles && (<button onClick={(e) => { e.stopPropagation(); handleOpenRolesModal(subEvent, subPerms); }} className="p-2 rounded-md text-accent hover:bg-accent/20"><Users size={14}/></button>)}
                                {subPerms.canDelete && (<button onClick={(e) => { e.stopPropagation(); openDeleteModal(subEvent.id, 'sub', subEvent.name); }} className="p-2 rounded-md text-red-500 hover:bg-red-500/20"><Trash2 size={14}/></button>)}
                                {subPerms.canToggleRegistration && (<button onClick={(e) => { e.stopPropagation(); toggleRegistrationStatus(subEvent.id, 'sub'); }} className="p-2 rounded-md hover:bg-white/20 disabled:opacity-50" disabled={!event.isOpen}><Edit size={14}/></button>)}
                                <ChevronDown size={20} className={`transition-transform duration-300 ${expandedEvents[subEvent.id] ? 'rotate-180' : ''}`} />
                            </div>
                        </div>
                        <AnimatePresence>
                        {expandedEvents[subEvent.id] && (
                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="border-t border-white/10 mt-3 pt-3">
                               {subPerms.canCreateSubSubEvent && (<div className="mb-3"><button onClick={() => handleOpenModal({ parentId: event.id, subParentId: subEvent.id })} className="w-full flex items-center justify-center gap-2 px-3 py-1.5 rounded-md bg-accent/20 text-accent font-semibold hover:bg-accent/30 transition text-sm"><Plus size={14}/> Add Sub-Sub-Event</button></div>)}
                               <div className="pl-4 space-y-3">
                                {subEvent.subSubEvents.map(ssEvent => {
                                    const ssPerms = userPermissions.getPermissions(event, subEvent, ssEvent);
                                    return (
                                        <div key={ssEvent.id} className="flex items-center justify-between">
                                            <div className="flex items-center gap-3"><span className={`w-2 h-2 rounded-full ${ssEvent.isOpen ? 'bg-green-400' : 'bg-red-400'}`}></span><p>{ssEvent.name}</p></div>
                                            <div className="flex items-center gap-1">
                                                {ssPerms.canManageRoles && (<button onClick={(e) => { e.stopPropagation(); handleOpenRolesModal(ssEvent, ssPerms); }} className="p-1 rounded-md text-accent hover:bg-accent/20"><Users size={12}/></button>)}
                                                {ssPerms.canDelete && (<button onClick={(e) => { e.stopPropagation(); openDeleteModal(ssEvent.id, 'subsub', ssEvent.name); }} className="p-1 rounded-md text-red-500 hover:bg-red-500/20"><Trash2 size={12}/></button>)}
                                                {ssPerms.canToggleRegistration && (<button onClick={(e) => { e.stopPropagation(); toggleRegistrationStatus(ssEvent.id, 'subsub'); }} className="p-1 rounded-md hover:bg-white/20 disabled:opacity-50" disabled={!subEvent.isOpen}><Edit size={12}/></button>)}
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
