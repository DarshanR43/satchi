import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, ChevronDown, Trash2, X, Users, Power, CheckSquare, Square, AlertTriangle, ClipboardList, Edit3, Download, Menu, BarChart } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Navigate, useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

/* --- Components --- */

const ActionButton = ({ onClick, icon: Icon, colorClass, title, disabled = false }) => (
  <button
    onClick={(e) => { e.stopPropagation(); onClick(); }}
    disabled={disabled}
    title={title}
    className={`p-2 rounded-full transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${colorClass === 'red' ? 'text-red-500 hover:bg-red-100' :
      colorClass === 'orange' ? 'text-orange-500 hover:bg-orange-100' :
        colorClass === 'green' ? 'text-green-500 hover:bg-green-100' :
          colorClass === 'blue' ? 'text-blue-500 hover:bg-blue-100' : ''
      }`}
  >
    <Icon className="w-5 h-5" />
  </button>
);

const StatusPill = ({ isOpen }) => (
  <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full whitespace-nowrap ${isOpen ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
    {isOpen ? 'Open' : 'Closed'}
  </span>
);

/* --- Modals --- */

const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, message, errorMessage, confirmLabel = 'Confirm Delete', downloadAction = null }) => {
  if (!isOpen) return null;
  return (
    <motion.div
      className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
    >
      <motion.div
        initial={{ scale: 0.9, y: 50 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: -50 }}
        className="bg-white rounded-2xl w-full max-w-md mx-auto shadow-xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 text-center">
          <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="text-red-600" size={28} />
          </div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">{title}</h3>
          <p className="text-gray-500 text-sm sm:text-base">{message}</p>
          {errorMessage && (
            <div className="mt-4 p-3 rounded-lg bg-red-100 border border-red-300 text-red-700 text-sm text-left space-y-1 overflow-x-auto">
              {errorMessage.split('\n').map((line, index) => (
                <p key={`delete-error-${index}`} className="whitespace-pre-wrap">{line}</p>
              ))}
            </div>
          )}
        </div>
        <div className="p-4 bg-gray-50 flex flex-col-reverse sm:flex-row justify-center gap-3 border-t border-gray-200">
          <button onClick={onClose} className="w-full sm:w-auto px-6 py-2 rounded-lg bg-gray-200 text-gray-700 font-semibold hover:bg-gray-300 transition">Cancel</button>
          {downloadAction && (
            <button
              type="button"
              onClick={(e) => { e.preventDefault(); downloadAction.onClick?.(); }}
              disabled={downloadAction.disabled}
              className="w-full sm:w-auto px-6 py-2 rounded-lg bg-blue-100 text-blue-700 font-semibold hover:bg-blue-200 transition disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {downloadAction.label || 'Download'}
            </button>
          )}
          <button onClick={onConfirm} className="w-full sm:w-auto px-6 py-2 rounded-lg bg-red-600 text-white font-bold hover:bg-red-700 transition">{confirmLabel}</button>
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

  const handleSaveClick = (e) => { e.preventDefault(); onSave(eventType, formData); };

  return (
    <motion.div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 text-black" onClick={onClose}>
      <motion.div initial={{ scale: 0.9, y: 50 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: -50 }} className="bg-white rounded-2xl w-full max-w-2xl mx-auto shadow-xl flex flex-col max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-gray-200 shrink-0">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Create New Event</h2>
          <button type="button" onClick={onClose} className="p-2 rounded-full hover:bg-gray-100"><X size={24} className="text-gray-500" /></button>
        </div>
        <form onSubmit={handleSaveClick} className="flex flex-col flex-1 min-h-0">
          <div className="p-6 space-y-4 overflow-y-auto custom-scrollbar">
            <div className="form-group">
              <label>Event Type</label>
              <select className="text-black" value={eventType} onChange={(e) => setEventType(e.target.value)} disabled>
                <option value="main">Main Event</option>
                <option value="sub">Sub-Event</option>
                <option value="subsub">Competition/Workshop</option>
              </select>
            </div>
            {eventType !== 'main' && (<div className="form-group">
              <label>Parent Main Event</label>
              <select name="parentId" value={formData.parentId || ''} onChange={handleInputChange} required disabled>
                {allEvents.map((event) => (<option className="text-black" key={event.id} value={event.id}>{event.name}</option>))}
              </select>
            </div>)}
            {eventType === 'subsub' && (<div className="form-group">
              <label>Parent Sub-Event</label>
              <select name="subParentId" value={formData.subParentId || ''} onChange={handleInputChange} required disabled>
                {subEventOptions.map((sub) => (<option className="text-black" key={sub.id} value={sub.id}>{sub.name}</option>))}
              </select>
            </div>)}
            <div className="form-group">
              <label>Title</label>
              <input className="text-black" type="text" name="name" value={formData.name || ''} onChange={handleInputChange} required />
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea className="text-black" name="description" value={formData.description || ''} onChange={handleInputChange} rows="3" />
            </div>
            {eventType === 'subsub' && (
              <>
                <hr className="border-gray-200 my-2" />
                <div className="form-group">
                  <label>Rules</label>
                  <textarea className="text-black" name="rules" value={formData.rules || ''} onChange={handleInputChange} rows="4" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="form-group"><label>Min Team Members</label><input className="text-black" type="number" name="minMembers" value={formData.minMembers || 1} onChange={handleInputChange} min="1" /></div>
                  <div className="form-group"><label>Max Team Members</label><input className="text-black" type="number" name="maxMembers" value={formData.maxMembers || 1} onChange={handleInputChange} min={formData.minMembers || 1} /></div>
                  <div className="form-group"><label>Min Female Members</label><input className="text-black" type="number" name="minFemaleMembers" value={formData.minFemaleMembers || 0} onChange={handleInputChange} min="0" /></div>
                  <div className="flex items-center pt-6"><label htmlFor="facultyMentor" className="flex items-center cursor-pointer"><input id="facultyMentor" type="checkbox" name="facultyMentor" checked={!!formData.facultyMentor} onChange={handleInputChange} className="hidden" />{formData.facultyMentor ? <CheckSquare className="text-[#ff6a3c]" /> : <Square className="text-gray-400" />}<span className="ml-2 font-semibold text-gray-700">Faculty Mentor Required</span></label></div>
                </div>
              </>
            )}
          </div>
          <div className="p-4 bg-gray-50 border-t border-gray-200 flex justify-end shrink-0">
            <button type="submit" className="w-full sm:w-auto px-6 py-2 rounded-lg bg-[#ff6a3c] text-white font-bold hover:shadow-lg hover:shadow-orange-500/50 transition">Save Event</button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

const EditEventModal = ({ isOpen, onClose, onSave, initialName, entityLabel = 'Event', parentName }) => {
  const [name, setName] = useState(initialName || '');

  useEffect(() => { if (isOpen) setName(initialName || ''); }, [isOpen, initialName]);
  if (!isOpen) return null;

  const trimmedName = name.trim();
  const isDisabled = trimmedName.length === 0 || trimmedName === (initialName || '').trim();

  const handleSubmit = (e) => { e.preventDefault(); if (!isDisabled) onSave(trimmedName); };

  return (
    <motion.div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <motion.div initial={{ scale: 0.9, y: 50 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: -50 }} className="bg-white rounded-2xl w-full max-w-md mx-auto shadow-xl" onClick={(e) => e.stopPropagation()}>
        <form onSubmit={handleSubmit}>
          <div className="flex items-center justify-between p-5 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-800">Edit {entityLabel}</h2>
            <button type="button" onClick={onClose} className="p-2 rounded-full hover:bg-gray-100"><X size={24} className="text-gray-500" /></button>
          </div>
          <div className="p-6 space-y-4">
            {parentName && (<p className="text-sm text-gray-500">Parent: <span className="font-semibold text-gray-700">{parentName}</span></p>)}
            <div className="form-group">
              <label>Event Name</label>
              <input className="text-black" type="text" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
            </div>
          </div>
          <div className="p-4 bg-gray-50 border-t border-gray-200 flex flex-col-reverse sm:flex-row justify-end gap-3">
            <button type="button" onClick={onClose} className="w-full sm:w-auto px-5 py-2 rounded-lg bg-gray-200 text-gray-700 font-semibold hover:bg-gray-300 transition">Cancel</button>
            <button type="submit" disabled={isDisabled} className="w-full sm:w-auto px-5 py-2 rounded-lg bg-[#ff6a3c] text-white font-bold hover:shadow-lg hover:shadow-orange-500/50 transition disabled:opacity-50 disabled:cursor-not-allowed">Save Changes</button>
          </div>
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
        } catch (error) { console.error("Failed to fetch event roles:", error); setRoles({ admins: [], managers: [] }); }
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
  const roleTypesToShow = eventLevel === 'subsub' ? ['managers'] : ['admins', 'managers'];

  return (
    <motion.div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <motion.div initial={{ scale: 0.9, y: 50 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: -50 }} className="bg-white rounded-2xl w-full max-w-2xl mx-auto shadow-xl flex flex-col max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-gray-200 shrink-0">
          <h2 className="text-xl font-bold text-gray-800 truncate pr-4">Roles: <span className="text-[#ff6a3c]">{event.name}</span></h2>
          <button type="button" onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 shrink-0"><X size={24} className="text-gray-500" /></button>
        </div>
        <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar flex-1">
          {roleTypesToShow.map(roleType => (
            <div className="space-y-2" key={roleType}>
              <h4 className="font-bold text-lg text-gray-800 capitalize">{roleType}</h4>
              <div className="space-y-2 max-h-32 overflow-y-auto pr-2 border border-gray-100 rounded-md p-2">
                {roles[roleType]?.length > 0 ? roles[roleType].map((person) => (
                  <div key={person.email} className="flex items-center justify-between bg-gray-50 p-2 rounded-md border border-gray-200">
                    <div className="truncate pr-2">
                      <p className="text-sm font-semibold text-gray-700 truncate">{person.name}</p>
                      <p className="text-xs text-gray-500 truncate">{person.email}</p>
                    </div>
                    <button onClick={() => handleRemoveRole(roleType, person.email)} className="p-1 text-red-500 hover:bg-red-100 rounded-full shrink-0"><X size={16} /></button>
                  </div>
                )) : <p className="text-xs text-gray-400 italic">No {roleType} assigned.</p>}
              </div>
              <div className="flex flex-col sm:flex-row gap-2 pt-2">
                <input type="email" placeholder={`Add ${roleType.slice(0, -1)} email...`} value={newEmails[roleType]} onChange={(e) => setNewEmails((prev) => ({ ...prev, [roleType]: e.target.value }))} className="w-full p-2 rounded-lg bg-gray-100 text-gray-700 border-gray-300 text-sm focus:ring-[#ff6a3c] focus:border-[#ff6a3c]" />
                <button onClick={() => handleAddRole(roleType)} className="w-full sm:w-auto px-4 py-2 rounded-md bg-[#df9400]/90 text-white font-bold text-sm hover:bg-[#df9400]">Add</button>
              </div>
            </div>
          ))}
        </div>
        <div className="p-4 bg-gray-50 border-t border-gray-200 flex justify-end shrink-0">
          <button onClick={() => onSave(event.id, eventLevel, roles)} className="w-full sm:w-auto px-6 py-2 rounded-lg bg-[#ff6a3c] text-white font-bold hover:shadow-lg hover:shadow-orange-500/50 transition">Save Changes</button>
        </div>
      </motion.div>
    </motion.div>
  );
};

const ManageJudgesModal = ({ isOpen, onClose, onSave, event, api }) => {
  const [judges, setJudges] = useState([]);
  const [newJudgeName, setNewJudgeName] = useState('');
  const [hasExistingJudges, setHasExistingJudges] = useState(false);

  useEffect(() => {
    if (isOpen && event && api) {
      const fetchJudges = async () => {
        try {
          const response = await api.get(`/eval/subsubevents/${event.id}/judges/`);
          const data = response.data.judges || response.data || [];
          const list = Array.isArray(data) ? data : [];
          setJudges(list); setHasExistingJudges(list.length > 0);
        } catch (error) { console.error(error); setJudges([]); }
      };
      fetchJudges();
    }
  }, [event, isOpen, api]);

  if (!isOpen || !event) return null;

  const handleAddJudge = () => { if (newJudgeName.trim()) { setJudges([...judges, { name: newJudgeName.trim(), id: Date.now() }]); setNewJudgeName(''); } };
  const handleRemoveJudge = (id) => setJudges(judges.filter(j => j.id !== id && j.name !== id));

  return (
    <motion.div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <motion.div initial={{ scale: 0.9, y: 50 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: -50 }} className="bg-white rounded-2xl w-full max-w-md mx-auto shadow-xl flex flex-col max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-gray-200 shrink-0">
          <h2 className="text-xl font-bold text-gray-800 truncate pr-4">Judges: <span className="text-[#ff6a3c]">{event.name}</span></h2>
          <button type="button" onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 shrink-0"><X size={24} className="text-gray-500" /></button>
        </div>
        <div className="p-6 space-y-4 overflow-y-auto custom-scrollbar flex-1">
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {judges.map((judge, idx) => (
              <div key={judge.id || idx} className="flex items-center justify-between bg-gray-100 p-3 rounded-lg border border-gray-200">
                <span className="font-semibold text-gray-700 truncate">{judge.name}</span>
                <button onClick={() => handleRemoveJudge(judge.id || judge.name)} className="text-red-500 hover:bg-red-100 p-1 rounded-full shrink-0"><X size={16} /></button>
              </div>
            ))}
            {judges.length === 0 && <p className="text-gray-500 text-center italic text-sm">No judges added yet.</p>}
          </div>
          <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-gray-100">
            <input type="text" value={newJudgeName} onChange={(e) => setNewJudgeName(e.target.value)} placeholder="Judge name..." className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ff6a3c] outline-none bg-gray-50 text-gray-800" onKeyDown={(e) => e.key === 'Enter' && handleAddJudge()} />
            <button onClick={handleAddJudge} className="w-full sm:w-auto bg-gray-800 text-white px-4 py-2 rounded-lg hover:bg-gray-900 font-semibold transition">Add</button>
          </div>
        </div>
        <div className="p-4 bg-gray-50 border-t border-gray-200 flex justify-end shrink-0">
          <button onClick={() => { if (judges.length < 1) return alert("Add at least one judge."); onSave(event.id, judges.map(j => j.name), hasExistingJudges); }} className="w-full sm:w-auto px-6 py-2 rounded-lg bg-[#ff6a3c] text-white font-bold hover:shadow-lg hover:shadow-orange-500/50 transition">Save Judges</button>
        </div>
      </motion.div>
    </motion.div>
  );
};

/* --- Accordion Component --- */

const EventAccordionCard = ({ event, user, onToggleStatus, onOpenRolesModal, onOpenEditModal, onOpenDeleteModal, onOpenCreateModal, onOpenJudgesModal, onDownloadRegistrations, downloadingId, isExpanded, onExpand }) => {
  const navigate = useNavigate();
  const normalizeRole = (role) => (role || '').toUpperCase();
  const mainRole = normalizeRole(event.role);
  const canToggleMain = ['SUPERADMIN', 'EVENTADMIN'].includes(mainRole);

  const canToggleSubEvent = (subEvent) => {
    const subRole = normalizeRole(subEvent.role || event.role);
    return ['SUPERADMIN', 'EVENTADMIN', 'SUBEVENTADMIN'].includes(subRole);
  };

  const canToggleSubSubEvent = (subEvent, subSubEvent) => {
    const ssRole = normalizeRole(subSubEvent.role || subEvent.role || event.role);
    return ['SUPERADMIN', 'EVENTADMIN', 'SUBEVENTADMIN', 'SUBEVENTMANAGER', 'SUBSUBEVENTMANAGER'].includes(ssRole);
  };

  return (
    <motion.div layout className="bg-white/80 backdrop-blur-lg border border-gray-200/90 rounded-2xl shadow-xl overflow-hidden w-full">
      <motion.div layout className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 cursor-pointer hover:bg-gray-50/50 transition-colors gap-3" onClick={onExpand}>
        <div className="flex items-center gap-3 w-full sm:w-auto overflow-hidden">
          <StatusPill isOpen={event.isOpen} />
          <h2 className="text-lg sm:text-xl font-bold text-gray-800 truncate">{event.name}</h2>
        </div>
        <div className="flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto">
          <div className="flex gap-1">
            <ActionButton onClick={() => onToggleStatus(event.id, 'main', canToggleMain)} icon={Power} colorClass={event.isOpen ? 'green' : 'red'} title={event.isOpen ? 'Close' : 'Open'} disabled={!canToggleMain} />
            <ActionButton onClick={() => onOpenRolesModal(event, 'main')} icon={Users} colorClass="orange" title="Roles" disabled={!canToggleMain} />
            {user?.role === 'SUPERADMIN' && (
              <>
                <ActionButton onClick={() => onOpenEditModal({ id: event.id, name: event.name }, 'main')} icon={Edit3} colorClass="blue" title="Edit" />
                <ActionButton onClick={() => onOpenDeleteModal(event.id, 'main', event.name)} icon={Trash2} colorClass="red" title="Delete" />
              </>
            )}
          </div>
          <div className="w-px h-6 bg-gray-200 mx-1 hidden sm:block"></div>
          <ChevronDown className={`transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''} text-gray-500 shrink-0`} />
        </div>
      </motion.div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.4 }} className="overflow-hidden">
            <div className="px-3 sm:px-4 pb-4 pt-2 border-t border-gray-200 space-y-3">
              {user?.role === 'SUPERADMIN' && (
                <button onClick={() => onOpenCreateModal({ parentId: event.id })} className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-orange-100/70 text-[#df9400] font-semibold hover:bg-orange-200/80 transition text-sm">
                  <Plus size={16} /> Add Sub-Event
                </button>
              )}
              {event.subEvents.length === 0 && user?.role === 'SUPERADMIN' && <p className="text-center text-sm text-gray-500 py-4">No sub-events yet.</p>}

              {event.subEvents.map(subEvent => (
                <div key={subEvent.id} className="bg-white/60 p-3 rounded-lg border border-gray-200/80">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                    <div className="flex items-center gap-3 w-full sm:w-auto overflow-hidden">
                      <StatusPill isOpen={subEvent.isOpen} />
                      <h3 className="font-semibold text-base text-gray-800 truncate">{subEvent.name}</h3>
                    </div>
                    <div className="flex items-center gap-1 self-end sm:self-auto">
                      {(() => {
                        const canToggleSub = canToggleSubEvent(subEvent);
                        return <ActionButton onClick={() => onToggleStatus(subEvent.id, 'sub', canToggleSub)} icon={Power} colorClass={subEvent.isOpen ? 'green' : 'red'} title="Status" disabled={!event.isOpen || !canToggleSub} />;
                      })()}
                      <ActionButton onClick={() => onOpenRolesModal(subEvent, 'sub')} icon={Users} colorClass="orange" title="Roles" disabled={!canToggleSubEvent(subEvent)} />
                      {user?.role === 'SUPERADMIN' && (
                        <>
                          <ActionButton onClick={() => onOpenEditModal({ id: subEvent.id, name: subEvent.name, parentName: event.name }, 'sub')} icon={Edit3} colorClass="blue" title="Edit" />
                          <ActionButton onClick={() => onOpenDeleteModal(subEvent.id, 'sub', subEvent.name)} icon={Trash2} colorClass="red" title="Delete" />
                        </>
                      )}
                    </div>
                  </div>
                  <div className="pl-0 sm:pl-4 mt-2 space-y-2">
                    {user?.role === 'SUPERADMIN' && (
                      <button onClick={() => onOpenCreateModal({ parentId: event.id, subParentId: subEvent.id })} className="w-full flex items-center justify-center text-xs gap-1.5 py-2 rounded-md bg-orange-100/60 text-[#df9400] font-semibold hover:bg-orange-200/60 transition">
                        <Plus size={12} /> Add Competition
                      </button>
                    )}
                    {subEvent.subSubEvents.map((ssEvent) => {
                      const canToggleSubSub = canToggleSubSubEvent(subEvent, ssEvent);
                      const isDownloading = downloadingId === ssEvent.id;
                      return (
                        <div key={ssEvent.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center pt-2 border-t border-dashed border-gray-200 gap-2">
                          <p className="text-sm text-gray-600 flex items-center gap-2 truncate w-full sm:w-auto"><StatusPill isOpen={ssEvent.isOpen} /> <span className="truncate">{ssEvent.name}</span></p>
                          <div className="flex items-center gap-1 self-end sm:self-auto overflow-x-auto max-w-full">
                            {onDownloadRegistrations && <ActionButton onClick={() => onDownloadRegistrations(ssEvent)} icon={Download} colorClass="blue" title={isDownloading ? 'Downloading...' : 'Download'} disabled={isDownloading} />}
                            <ActionButton onClick={() => navigate(`/statistics/${ssEvent.eventId}`)} icon={BarChart} colorClass="blue" title="Statistics" />
                            <ActionButton onClick={() => onOpenJudgesModal(ssEvent)} icon={ClipboardList} colorClass="blue" title="Judges" />
                            <ActionButton onClick={() => onToggleStatus(ssEvent.id, 'subsub', canToggleSubSub)} icon={Power} colorClass={ssEvent.isOpen ? 'green' : 'red'} title="Status" disabled={!subEvent.isOpen || !canToggleSubSub} />
                            <ActionButton onClick={() => onOpenRolesModal(ssEvent, 'subsub')} icon={Users} colorClass="orange" title="Roles" disabled={!canToggleSubSub} />
                            {user?.role === 'SUPERADMIN' && (
                              <>
                                <ActionButton onClick={() => onOpenEditModal({ id: ssEvent.id, name: ssEvent.name, parentName: subEvent.name }, 'subsub')} icon={Edit3} colorClass="blue" title="Edit" />
                                <ActionButton onClick={() => onOpenDeleteModal(ssEvent.id, 'subsub', ssEvent.name, { entity: ssEvent })} icon={Trash2} colorClass="red" title="Delete" />
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* --- Main Page --- */

const AdminPage = () => {
  const { user, isAuthenticated, token } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedEventId, setExpandedEventId] = useState(null);
  const [isAddEventModalOpen, setIsAddEventModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isRolesModalOpen, setIsRolesModalOpen] = useState(false);
  const [isJudgesModalOpen, setIsJudgesModalOpen] = useState(false);
  const [modalContext, setModalContext] = useState(null);
  const [deleteError, setDeleteError] = useState(null);
  const [downloadingId, setDownloadingId] = useState(null);

  const api = useMemo(() => {
    const instance = axios.create({ baseURL: API_URL });
    instance.interceptors.request.use((config) => { if (token) config.headers.Authorization = `Token ${token}`; return config; });
    return instance;
  }, [token]);

  const structureEvents = (flatList) => {
    const mainEvents = {}; const subEvents = {};
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

  const fetchAdminData = async () => {
    if (!isAuthenticated || !token) { setLoading(false); return; }
    setLoading(true);
    try {
      const response = await api.get('/events/admin-data/');
      const structuredEvents = structureEvents(response.data.events || response.data);
      setEvents(structuredEvents);
      if (structuredEvents.length > 0) setExpandedEventId(structuredEvents[0].id);
      setError(null);
    } catch (err) { setError(err.response?.status === 401 ? 'Invalid token.' : 'Failed to load data.'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchAdminData(); }, [isAuthenticated, token]);

  const handleCreateEvent = async (eventType, data) => {
    try { await api.post('/events/create_event/', { eventType, ...data }); setIsAddEventModalOpen(false); fetchAdminData(); }
    catch (error) { console.error(error); alert('Error: Could not create event.'); }
  };

  const handleDeleteEvent = async () => {
    if (!modalContext) return;
    try {
      await api.delete(`/events/delete_event/${modalContext.level}/${modalContext.id}/`);
      setIsDeleteModalOpen(false); setModalContext(null); fetchAdminData();
    } catch (error) {
      console.error(error);
      const data = error.response?.data;
      const msg = data?.message || 'Error: Could not delete event.';
      setDeleteError(msg + (data?.subEvents ? `\n(${data.subEvents} children remaining)` : ''));
    }
  };

  const handleDownloadRegistrations = async (target) => {
    if (!target?.id) return;
    try {
      setDownloadingId(target.id);
      const response = await api.get(`/eval/subsubevents/${target.id}/summary.csv`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'text/csv' }));
      const link = document.createElement('a');
      link.href = url; link.setAttribute('download', `${(target.name || 'event').replace(/[^a-z0-9]/gi, '_')}.csv`);
      document.body.appendChild(link); link.click(); link.remove();
    } catch (error) { console.error(error); alert('Download failed.'); }
    finally { setDownloadingId(null); }
  };

  const handleUpdateEventName = async (newName) => {
    try { await api.patch(`/events/update_event/${modalContext.level}/${modalContext.id}/`, { name: newName }); setIsEditModalOpen(false); fetchAdminData(); }
    catch (error) { console.error(error); alert('Update failed.'); }
  };

  const handleSaveRoles = async (eventId, level, newRoles) => {
    try { await api.post(`/events/update_event_users/`, { eventId: modalContext.id, level: modalContext.level, roles: newRoles }); setIsRolesModalOpen(false); fetchAdminData(); }
    catch (error) { console.error(error); alert('Save roles failed.'); }
  };

  const handleSaveJudges = async (eventId, judgeNames, replace) => {
    try { await api.post(`/eval/subsubevents/judges/link/`, { subsubevent_id: eventId, names: judgeNames, replace }); setIsJudgesModalOpen(false); }
    catch (error) { console.error(error); alert('Save judges failed.'); }
  };

  const handleToggleStatus = async (eventId, level, allowed = true) => {
    if (!allowed) return;
    try { await api.post(`/events/toggle_status/${level}/${eventId}/`); fetchAdminData(); }
    catch (error) { console.error(error); alert('Status update failed.'); }
  };

  const openRolesModal = (event, level) => { setModalContext({ ...event, level }); setIsRolesModalOpen(true); };
  const openCreateModal = (context = {}) => { setModalContext(context); setIsAddEventModalOpen(true); };
  const openJudgesModal = (event) => { setModalContext(event); setIsJudgesModalOpen(true); };
  const openDeleteModal = (id, level, name, extra = {}) => { setModalContext({ id, level, name, message: `Delete "${name}"?`, ...extra }); setDeleteError(null); setIsDeleteModalOpen(true); };
  const openEditModal = (context, level) => { setModalContext({ ...context, level }); setIsEditModalOpen(true); };
  const toggleExpand = (eventId) => setExpandedEventId(prevId => (prevId === eventId ? null : eventId));

  if (loading) return <div className="flex justify-center items-center min-h-screen text-gray-500"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#ff6a3c]"></div></div>;
  if (error) return <div className="flex justify-center items-center min-h-screen text-red-500">{error}</div>;
  if (!isAuthenticated) return <Navigate to="/login" />;

  return (
    <>
      <AddEventModal isOpen={isAddEventModalOpen} onClose={() => setIsAddEventModalOpen(false)} onSave={handleCreateEvent} allEvents={events} creationContext={modalContext} />
      <EditEventModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} onSave={handleUpdateEventName} initialName={modalContext?.name || ''} entityLabel={modalContext ? modalContext.level : 'Event'} parentName={modalContext?.parentName} />
      <ConfirmationModal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} onConfirm={handleDeleteEvent} title="Confirm Delete" message={modalContext?.message} errorMessage={deleteError} confirmLabel="Delete" downloadAction={modalContext?.level === 'subsub' ? { label: downloadingId === modalContext?.id ? '...' : 'Backup', onClick: () => handleDownloadRegistrations(modalContext?.entity), disabled: downloadingId === modalContext?.id } : null} />
      <ManageRolesModal isOpen={isRolesModalOpen} onClose={() => setIsRolesModalOpen(false)} onSave={handleSaveRoles} event={modalContext} eventLevel={modalContext?.level} api={api} />
      <ManageJudgesModal isOpen={isJudgesModalOpen} onClose={() => setIsJudgesModalOpen(false)} onSave={handleSaveJudges} event={modalContext} api={api} />

      <div className="relative w-full min-h-screen px-3 sm:px-6 lg:px-8 py-20 font-body text-gray-800 bg-gray-50/50">
        <div className="absolute inset-0 bg-gradient-to-br from-white via-amber-50 to-orange-100 z-0 pointer-events-none"></div>
        <div className="absolute top-0 left-0 w-full h-full bg-grid-gray-200/[0.4] z-0 pointer-events-none"></div>

        <div className="relative z-10 max-w-6xl mx-auto pt-10 sm:pt-16">
          <motion.div initial={{ opacity: 0, y: -40 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8 sm:mb-12">
            <h1 className="text-3xl sm:text-5xl md:text-6xl font-bold bg-gradient-to-r from-[#ff6a3c] via-[#df9400] to-[#ff6a3c] bg-clip-text text-transparent pb-2">Admin Dashboard</h1>
            <p className="text-sm sm:text-lg text-gray-600 mt-2 sm:mt-3">Manage all events and roles from one place.</p>
          </motion.div>

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 p-4 sm:p-5 bg-white/70 border border-gray-200 rounded-2xl backdrop-blur-md shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-orange-100 rounded-full text-[#ff6a3c]"><Users size={18} /></div>
                <div className="flex flex-col">
                  <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">Logged in as</span>
                  <span className="text-sm font-bold text-gray-800">{user?.full_name}</span>
                </div>
              </div>
              <span className="hidden sm:inline text-gray-300">|</span>
              <span className="text-xs sm:text-sm font-semibold text-gray-500 bg-gray-100 px-2 py-1 rounded-md self-start sm:self-auto">{user?.role}</span>
            </div>
            {user?.role === 'SUPERADMIN' && (
              <button onClick={() => openCreateModal()} className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#ff6a3c] text-white font-bold text-sm shadow-md shadow-orange-500/20 hover:shadow-lg hover:shadow-orange-500/40 transition-all active:scale-95">
                <Plus size={18} /> Create Event
              </button>
            )}
          </div>

          <div className="space-y-4 sm:space-y-6 pb-20">
            {events.map((event) => (
              <EventAccordionCard key={event.id} event={event} user={user} onToggleStatus={handleToggleStatus} onOpenRolesModal={openRolesModal} onOpenEditModal={openEditModal} onOpenDeleteModal={openDeleteModal} onOpenCreateModal={openCreateModal} onOpenJudgesModal={openJudgesModal} onDownloadRegistrations={handleDownloadRegistrations} downloadingId={downloadingId} isExpanded={expandedEventId === event.id} onExpand={() => toggleExpand(event.id)} />
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default AdminPage;

const css = `
.form-group { display: flex; flex-direction: column; }
.form-group label { font-weight: 600; color: #4a5568; margin-bottom: 0.5rem; font-size: 0.875rem; }
.form-group input, .form-group select, .form-group textarea { width: 100%; padding: 0.75rem; border-radius: 0.75rem; background-color: #f8fafc; border: 1px solid #e2e8f0; transition: all 0.2s; font-size: 0.95rem; color: #1f2937; }
.form-group input:focus, .form-group select:focus, .form-group textarea:focus { outline: none; border-color: #ff6a3c; background-color: #fff; box-shadow: 0 0 0 3px rgba(255, 106, 60, 0.1); }
.custom-scrollbar::-webkit-scrollbar { width: 6px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.custom-scrollbar::-webkit-scrollbar-thumb { background-color: #cbd5e1; border-radius: 20px; }
`;
const style = document.createElement('style');
style.textContent = css;
document.head.append(style);