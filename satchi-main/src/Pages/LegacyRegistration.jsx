import React, { useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  ClipboardList,
  Loader,
  Plus,
  Minus,
  ShieldCheck,
  Users,
  CalendarDays,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL;

const SearchableDropdown = ({
  label,
  value,
  onChange,
  options,
  loading,
  disabled,
  valueKey = 'id',
  nameKey = 'name',
  placeholder = 'Select or search...'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const wrapperRef = useRef(null);

  useEffect(() => {
    const selectedOption = options.find(opt => String(opt[valueKey]) === String(value));
    if (selectedOption) {
      setSearchTerm(selectedOption[nameKey]);
    } else {
      setSearchTerm('');
    }
  }, [value, options, valueKey, nameKey]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
        const selectedOption = options.find(opt => String(opt[valueKey]) === String(value));
        setSearchTerm(selectedOption ? selectedOption[nameKey] : '');
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [options, value, valueKey, nameKey]);

  const filteredOptions = useMemo(() => {
    return options.filter(opt => opt[nameKey].toLowerCase().includes(searchTerm.toLowerCase()))
  }, [options, searchTerm, nameKey]);

  const handleSelect = (option) => {
    onChange({ target: { value: option[valueKey] } });
    setSearchTerm(option[nameKey]);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={wrapperRef}>
      <label className="block mb-1.5 text-sm font-semibold text-gray-600">{label}</label>
      <div className="relative">
        <input
          type="text"
          placeholder={loading ? 'Loading...' : placeholder}
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setIsOpen(true);
            if (e.target.value === '') onChange({ target: { value: '' } });
          }}
          onFocus={() => !disabled && setIsOpen(true)}
          disabled={disabled || loading}
          className="w-full pl-4 pr-10 py-2.5 rounded-lg bg-gray-50 border border-gray-300 text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#ff6a3c] focus:border-transparent transition disabled:opacity-50 disabled:cursor-not-allowed"
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center text-gray-400 pointer-events-none">
          {loading ? <Loader className="animate-spin" size={18} /> : (
            <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          )}
        </div>
      </div>
      <AnimatePresence>
        {isOpen && !disabled && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-xl max-h-60 overflow-y-auto custom-scrollbar"
          >
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt) => (
                <div
                  key={opt[valueKey]}
                  onClick={() => handleSelect(opt)}
                  className={`px-4 py-2.5 cursor-pointer text-sm transition-colors ${String(value) === String(opt[valueKey]) ? 'bg-orange-50 text-[#ff6a3c] font-semibold' : 'text-gray-700 hover:bg-gray-50'}`}
                >
                  {opt[nameKey]}
                </div>
              ))
            ) : (
              <div className="px-4 py-3 text-sm text-gray-500 text-center">No results found</div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const normalizeRole = (role) => (role || '').toString().toUpperCase().replace(/[^A-Z]/g, '');

const LegacyRegistrationPage = () => {
  const { user, isAuthenticated } = useAuth();

  const privilegedRoleKeys = useMemo(() => new Set([
    'SUPERADMIN',
    'EVENTADMIN',
    'SUBEVENTADMIN',
    'SUBEVENTMANAGER',
    'SUBSUBEVENTMANAGER',
    'EVENTMANAGER',
    'COORDINATOR',
  ]), []);

  const isPrivileged = useMemo(() => privilegedRoleKeys.has(normalizeRole(user?.role)), [user, privilegedRoleKeys]);

  const [mainEvents, setMainEvents] = useState([]);
  const [subEvents, setSubEvents] = useState([]);
  const [subSubEvents, setSubSubEvents] = useState([]);
  const [judges, setJudges] = useState([]);

  const [selectedMainEvent, setSelectedMainEvent] = useState('');
  const [selectedSubEvent, setSelectedSubEvent] = useState('');
  const [selectedSubSubEvent, setSelectedSubSubEvent] = useState('');

  const [projectDetails, setProjectDetails] = useState({
    team_name: '',
    project_topic: '',
    captain_name: '',
    captain_email: '',
    captain_phone: '',
    faculty_mentor_name: '',
    submitted_at: '',
  });

  const [teamMembers, setTeamMembers] = useState([{ name: '', email: '', phone: '' }]);
  const [evaluationEnabled, setEvaluationEnabled] = useState(true);
  const [evaluationMarks, setEvaluationMarks] = useState([]);

  const [status, setStatus] = useState({ type: '', message: '' });
  const [loading, setLoading] = useState({ main: false, sub: false, subsub: false, judges: false, submit: false });

  useEffect(() => {
    if (!isAuthenticated || !isPrivileged) return;
    const fetchMainEvents = async () => {
      setLoading(prev => ({ ...prev, main: true }));
      try {
        const response = await axios.post(`${API_URL}/eval/get_main_events/`);
        setMainEvents(response.data || []);
      } catch (error) {
        console.error('Failed to load main events', error);
        setStatus({ type: 'error', message: 'Unable to load main events.' });
      } finally {
        setLoading(prev => ({ ...prev, main: false }));
      }
    };
    fetchMainEvents();
  }, [isAuthenticated, isPrivileged]);

  useEffect(() => {
    if (!selectedMainEvent) {
      setSubEvents([]);
      setSelectedSubEvent('');
      return;
    }
    const fetchSubEvents = async () => {
      setLoading(prev => ({ ...prev, sub: true }));
      try {
        const response = await axios.post(`${API_URL}/eval/get_subevents/${selectedMainEvent}/`);
        setSubEvents(response.data || []);
      } catch (error) {
        console.error('Failed to load sub events', error);
        setStatus({ type: 'error', message: 'Unable to load sub-events.' });
      } finally {
        setLoading(prev => ({ ...prev, sub: false }));
      }
    };
    setSelectedSubEvent('');
    setSelectedSubSubEvent('');
    setSubSubEvents([]);
    setJudges([]);
    fetchSubEvents();
  }, [selectedMainEvent]);

  useEffect(() => {
    if (!selectedSubEvent) {
      setSelectedSubSubEvent('');
      setSubSubEvents([]);
      return;
    }
    const fetchSubSubEvents = async () => {
      setLoading(prev => ({ ...prev, subsub: true }));
      try {
        const response = await axios.post(`${API_URL}/eval/get_subsubevents/${selectedSubEvent}/`);
        setSubSubEvents(response.data || []);
      } catch (error) {
        console.error('Failed to load competitions', error);
        setStatus({ type: 'error', message: 'Unable to load competitions.' });
      } finally {
        setLoading(prev => ({ ...prev, subsub: false }));
      }
    };
    setSelectedSubSubEvent('');
    setJudges([]);
    setEvaluationMarks([]);
    fetchSubSubEvents();
  }, [selectedSubEvent]);

  useEffect(() => {
    if (!selectedSubSubEvent) {
      setJudges([]);
      setEvaluationMarks([]);
      return;
    }
    const fetchJudges = async () => {
      setLoading(prev => ({ ...prev, judges: true }));
      try {
        const response = await axios.get(`${API_URL}/eval/subsubevents/${selectedSubSubEvent}/judges/`);
        const judgesList = response.data?.judges || [];
        setJudges(judgesList);
        if (evaluationEnabled) {
          if (judgesList.length) {
            setEvaluationMarks(judgesList.map(judge => ({
              judge_name: judge.name,
              mark: '',
              comments: '',
              subsubevent_judge_id: judge.id,
            })));
          } else {
            setEvaluationMarks(prev => prev.length ? prev : [{ judge_name: '', mark: '', comments: '', subsubevent_judge_id: null }]);
          }
        }
      } catch (error) {
        console.error('Failed to load judges', error);
        setJudges([]);
        if (evaluationEnabled) {
          setEvaluationMarks([]);
        }
      } finally {
        setLoading(prev => ({ ...prev, judges: false }));
      }
    };
    fetchJudges();
  }, [selectedSubSubEvent, evaluationEnabled]);

  useEffect(() => {
    if (evaluationEnabled) {
      if (evaluationMarks.length === 0 && judges.length === 0) {
        setEvaluationMarks([{ judge_name: '', mark: '', comments: '', subsubevent_judge_id: null }]);
      }
    } else if (evaluationMarks.length) {
      setEvaluationMarks([]);
    }
  }, [evaluationEnabled, evaluationMarks.length, judges.length]);

  const handleProjectChange = (field) => (event) => {
    const value = event.target.value;
    setProjectDetails(prev => ({ ...prev, [field]: value }));
  };

  const handleMemberChange = (index, field, value) => {
    setTeamMembers(prev => prev.map((member, idx) => idx === index ? { ...member, [field]: value } : member));
  };

  const addTeamMember = () => {
    setTeamMembers(prev => [...prev, { name: '', email: '', phone: '' }]);
  };

  const removeTeamMember = (index) => {
    setTeamMembers(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleMarkChange = (index, field, value) => {
    setEvaluationMarks(prev => prev.map((mark, idx) => idx === index ? { ...mark, [field]: value } : mark));
  };

  const addEmptyJudgeRow = () => {
    setEvaluationMarks(prev => [...prev, { judge_name: '', mark: '', comments: '', subsubevent_judge_id: null }]);
  };

  const removeJudgeRow = (index) => {
    setEvaluationMarks(prev => prev.filter((_, idx) => idx !== index));
  };

  const clearStatus = () => setStatus({ type: '', message: '' });

  const getSubmittedAtIso = () => {
    if (!projectDetails.submitted_at) return undefined;
    const date = new Date(projectDetails.submitted_at);
    if (Number.isNaN(date.getTime())) return undefined;
    return date.toISOString();
  };

  const sanitizeMembers = () => {
    return teamMembers
      .map(member => ({
        name: member.name.trim(),
        email: member.email.trim(),
        phone: member.phone.trim(),
      }))
      .filter(member => member.name || member.email || member.phone);
  };

  const sanitizeMarks = () => {
    return evaluationMarks
      .map(mark => ({
        judge_name: mark.judge_name.trim(),
        mark: mark.mark === '' ? '' : mark.mark,
        comments: mark.comments.trim(),
        subsubevent_judge_id: mark.subsubevent_judge_id,
      }))
      .filter(mark => mark.judge_name || mark.mark !== '' || mark.comments);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    clearStatus();

    if (!selectedSubSubEvent) {
      setStatus({ type: 'error', message: 'Select a competition before submitting.' });
      return;
    }

    const members = sanitizeMembers();
    const submittedAtIso = getSubmittedAtIso();

    const payload = {
      subsubevent_id: Number(selectedSubSubEvent),
      project: {
        team_name: projectDetails.team_name.trim(),
        project_topic: projectDetails.project_topic.trim(),
        captain_name: projectDetails.captain_name.trim(),
        captain_email: projectDetails.captain_email.trim(),
        captain_phone: projectDetails.captain_phone.trim(),
        faculty_mentor_name: projectDetails.faculty_mentor_name.trim(),
        team_members: members,
      },
    };

    if (submittedAtIso) {
      payload.project.submitted_at = submittedAtIso;
    }

    if (evaluationEnabled) {
      const marks = sanitizeMarks().filter(mark => mark.mark !== '');
      if (marks.length === 0) {
        setStatus({ type: 'error', message: 'Enter at least one judge mark or disable evaluation entry.' });
        return;
      }
      payload.evaluation = {
        is_disqualified: false,
        remarks: '',
        marks: marks.map(mark => ({
          judge_name: mark.judge_name,
          mark: mark.mark,
          comments: mark.comments,
          ...(mark.subsubevent_judge_id ? { subsubevent_judge_id: mark.subsubevent_judge_id } : {}),
        })),
      };
    }

    setLoading(prev => ({ ...prev, submit: true }));
    setStatus({ type: 'info', message: 'Submitting legacy registration...' });
    try {
      const response = await axios.post(`${API_URL}/eval/legacy/registrations/`, payload);
      const projectId = response.data?.project?.id;
      setStatus({
        type: 'success',
        message: projectId ? `Legacy registration recorded (Project #${projectId}).` : 'Legacy registration recorded successfully.',
      });
    } catch (error) {
      console.error('Legacy registration submission failed', error);
      const fallback = error.response?.data?.detail || error.response?.data?.error;
      setStatus({ type: 'error', message: fallback || 'Submission failed. Please review inputs and retry.' });
    } finally {
      setLoading(prev => ({ ...prev, submit: false }));
    }
  };

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!isPrivileged) return <Navigate to="/" replace />;

  return (
    <div className="relative w-full min-h-screen px-4 sm:px-6 lg:px-8 py-20 font-body text-gray-800">
      <div className="absolute inset-0 bg-gradient-to-br from-white via-amber-50 to-orange-100 z-0"></div>
      <div className="relative z-10 pt-16 max-w-6xl mx-auto">
        <motion.div initial={{ opacity: 0, y: -40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="text-center mb-12">
          <h1 className="text-4xl sm:text-5xl font-heading font-bold bg-gradient-to-r from-[#ff6a3c] via-[#df9400] to-[#ff6a3c] bg-clip-text text-transparent">
            Legacy Registration Console
          </h1>
          <p className="text-lg text-gray-600 mt-4 flex justify-center items-center gap-2">
            <ShieldCheck className="text-[#ff6a3c]" size={22} />
            Record historical event registrations and evaluation marks.
          </p>
        </motion.div>

        {status.message && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className={`mb-6 rounded-xl border px-4 py-3 flex items-start gap-3 ${status.type === 'success' ? 'bg-green-50 border-green-200 text-green-700' : status.type === 'error' ? 'bg-red-50 border-red-200 text-red-700' : 'bg-orange-50 border-orange-200 text-orange-700'}`}>
            {status.type === 'success' ? <CheckCircle size={20} className="mt-0.5" /> : status.type === 'error' ? <AlertCircle size={20} className="mt-0.5" /> : <Loader size={20} className="mt-0.5 animate-spin" />}
            <span className="text-sm font-medium">{status.message}</span>
          </motion.div>
        )}

        <motion.form onSubmit={handleSubmit} className="space-y-8">
          <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white/85 border border-gray-200/80 rounded-2xl shadow-xl backdrop-blur p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-6">
              <ClipboardList className="text-[#df9400]" />
              <h2 className="text-xl font-semibold text-gray-700">Event Selection</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <SearchableDropdown label="Main Event" value={selectedMainEvent} onChange={(e) => setSelectedMainEvent(e.target.value)} options={mainEvents} loading={loading.main} disabled={loading.main} />
              <SearchableDropdown label="Sub-Event" value={selectedSubEvent} onChange={(e) => setSelectedSubEvent(e.target.value)} options={subEvents} loading={loading.sub} disabled={!selectedMainEvent || loading.sub} />
              <SearchableDropdown label="Competition" value={selectedSubSubEvent} onChange={(e) => setSelectedSubSubEvent(e.target.value)} options={subSubEvents} loading={loading.subsub} disabled={!selectedSubEvent || loading.subsub} />
            </div>
          </motion.section>

          <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white/85 border border-gray-200/80 rounded-2xl shadow-xl backdrop-blur p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-6">
              <Users className="text-[#df9400]" />
              <h2 className="text-xl font-semibold text-gray-700">Project & Team Details</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-1.5">Team Name</label>
                <input type="text" value={projectDetails.team_name} onChange={handleProjectChange('team_name')} className="w-full px-4 py-2.5 rounded-lg border border-gray-300 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#ff6a3c] focus:border-transparent" required />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-1.5">Project Topic</label>
                <input type="text" value={projectDetails.project_topic} onChange={handleProjectChange('project_topic')} className="w-full px-4 py-2.5 rounded-lg border border-gray-300 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#ff6a3c] focus:border-transparent" required />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-1.5">Captain Name</label>
                <input type="text" value={projectDetails.captain_name} onChange={handleProjectChange('captain_name')} className="w-full px-4 py-2.5 rounded-lg border border-gray-300 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#ff6a3c] focus:border-transparent" required />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-1.5">Captain Email</label>
                <input type="email" value={projectDetails.captain_email} onChange={handleProjectChange('captain_email')} className="w-full px-4 py-2.5 rounded-lg border border-gray-300 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#ff6a3c] focus:border-transparent" required />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-1.5">Captain Phone</label>
                <input type="text" value={projectDetails.captain_phone} onChange={handleProjectChange('captain_phone')} className="w-full px-4 py-2.5 rounded-lg border border-gray-300 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#ff6a3c] focus:border-transparent" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-1.5">Faculty Mentor</label>
                <input type="text" value={projectDetails.faculty_mentor_name} onChange={handleProjectChange('faculty_mentor_name')} className="w-full px-4 py-2.5 rounded-lg border border-gray-300 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#ff6a3c] focus:border-transparent" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-1.5">Submission Timestamp</label>
                <div className="flex items-center gap-3">
                  <CalendarDays className="text-[#df9400]" size={18} />
                  <input type="datetime-local" value={projectDetails.submitted_at} onChange={handleProjectChange('submitted_at')} className="flex-1 px-4 py-2.5 rounded-lg border border-gray-300 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#ff6a3c] focus:border-transparent" />
                </div>
              </div>
            </div>

            <div className="mt-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-700">Additional Team Members</h3>
                <button type="button" onClick={addTeamMember} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-orange-100/90 text-[#df9400] font-semibold hover:bg-orange-200/90 transition">
                  <Plus size={16} /> Add Member
                </button>
              </div>
              <div className="space-y-4">
                {teamMembers.map((member, index) => (
                  <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    <div className="md:col-span-1">
                      <label className="block text-sm font-semibold text-gray-600 mb-1.5">Name</label>
                      <input type="text" value={member.name} onChange={(e) => handleMemberChange(index, 'name', e.target.value)} className="w-full px-4 py-2.5 rounded-lg border border-gray-300 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#ff6a3c] focus:border-transparent" />
                    </div>
                    <div className="md:col-span-1">
                      <label className="block text-sm font-semibold text-gray-600 mb-1.5">Email</label>
                      <input type="email" value={member.email} onChange={(e) => handleMemberChange(index, 'email', e.target.value)} className="w-full px-4 py-2.5 rounded-lg border border-gray-300 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#ff6a3c] focus:border-transparent" />
                    </div>
                    <div className="md:col-span-1">
                      <label className="block text-sm font-semibold text-gray-600 mb-1.5">Phone</label>
                      <input type="text" value={member.phone} onChange={(e) => handleMemberChange(index, 'phone', e.target.value)} className="w-full px-4 py-2.5 rounded-lg border border-gray-300 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#ff6a3c] focus:border-transparent" />
                    </div>
                    <div className="md:col-span-1 flex justify-end">
                      <button type="button" onClick={() => removeTeamMember(index)} className="px-4 py-2 rounded-lg bg-red-100/90 text-red-600 font-semibold hover:bg-red-200/90 transition" disabled={teamMembers.length === 1}>
                        <Minus size={16} /> Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.section>

          <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white/85 border border-gray-200/80 rounded-2xl shadow-xl backdrop-blur p-6 sm:p-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <ClipboardList className="text-[#df9400]" />
                <h2 className="text-xl font-semibold text-gray-700">Evaluation Marks</h2>
              </div>
              <label className="inline-flex items-center gap-2 text-sm font-semibold text-gray-600">
                <input type="checkbox" checked={evaluationEnabled} onChange={(event) => setEvaluationEnabled(event.target.checked)} className="h-4 w-4 text-[#ff6a3c] rounded border-gray-300 focus:ring-[#ff6a3c]" />
                Enable marks entry
              </label>
            </div>

            {evaluationEnabled ? (
              <div className="space-y-4">
                {evaluationMarks.map((mark, index) => (
                  <div key={`${mark.subsubevent_judge_id ?? 'custom'}-${index}`} className="grid grid-cols-1 md:grid-cols-6 gap-4 items-end">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-semibold text-gray-600 mb-1.5">Judge Name</label>
                      <input type="text" value={mark.judge_name} onChange={(e) => handleMarkChange(index, 'judge_name', e.target.value)} className="w-full px-4 py-2.5 rounded-lg border border-gray-300 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#ff6a3c] focus:border-transparent" placeholder="Judge" />
                    </div>
                    <div className="md:col-span-1">
                      <label className="block text-sm font-semibold text-gray-600 mb-1.5">Mark</label>
                      <input type="number" step="0.01" min="0" value={mark.mark} onChange={(e) => handleMarkChange(index, 'mark', e.target.value)} className="w-full px-4 py-2.5 rounded-lg border border-gray-300 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#ff6a3c] focus:border-transparent" placeholder="0" />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-semibold text-gray-600 mb-1.5">Comments</label>
                      <input type="text" value={mark.comments} onChange={(e) => handleMarkChange(index, 'comments', e.target.value)} className="w-full px-4 py-2.5 rounded-lg border border-gray-300 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#ff6a3c] focus:border-transparent" placeholder="Optional" />
                    </div>
                    <div className="md:col-span-1 flex justify-end">
                      <button type="button" onClick={() => removeJudgeRow(index)} className="px-4 py-2 rounded-lg bg-red-100/90 text-red-600 font-semibold hover:bg-red-200/90 transition" disabled={evaluationMarks.length === 1}>
                        <Minus size={16} /> Remove
                      </button>
                    </div>
                  </div>
                ))}

                <button type="button" onClick={addEmptyJudgeRow} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-orange-100/90 text-[#df9400] font-semibold hover:bg-orange-200/90 transition">
                  <Plus size={16} /> Add Judge Row
                </button>
              </div>
            ) : (
              <p className="text-sm text-gray-600">Evaluation marks recording is disabled for this submission.</p>
            )}
          </motion.section>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex justify-end">
            <button type="submit" disabled={loading.submit} className="flex items-center gap-2 px-6 py-3 rounded-xl bg-[#ff6a3c] text-white font-semibold shadow-lg hover:bg-[#e55a2f] transition disabled:opacity-60 disabled:cursor-not-allowed">
              {loading.submit ? <Loader className="animate-spin" size={18} /> : <ShieldCheck size={18} />}
              {loading.submit ? 'Submitting...' : 'Save Legacy Record'}
            </button>
          </motion.div>
        </motion.form>
      </div>
    </div>
  );
};

export default LegacyRegistrationPage;
