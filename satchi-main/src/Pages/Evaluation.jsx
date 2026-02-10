"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, BarChart2, Loader, Users, X, CheckCircle, 
  ChevronDown, Search, Download, Award, AlertCircle, 
  Layout, Trophy, Gavel, ArrowRight, CheckCircle2, ArrowLeft 
} from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Navigate, useNavigate } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

// --- Reused Searchable Dropdown (Glassmorphism Style) ---
const SearchableDropdown = ({ label, value, onChange, options, loading, disabled, valueKey = 'id', nameKey = 'name' }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const wrapperRef = useRef(null);

    useEffect(() => {
        const selectedOption = options.find(opt => String(opt[valueKey]) === String(value));
        setSearchTerm(selectedOption ? selectedOption[nameKey] : '');
    }, [value, options, valueKey, nameKey]);

    useEffect(() => {
        function handleClickOutside(event) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setIsOpen(false);
                const selectedOption = options.find(opt => String(opt[valueKey]) === String(value));
                setSearchTerm(selectedOption ? selectedOption[nameKey] : '');
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [wrapperRef, value, options, valueKey, nameKey]);

    const filteredOptions = options.filter(opt => 
        opt[nameKey].toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleSelect = (option) => {
        onChange({ target: { value: option[valueKey] } });
        setSearchTerm(option[nameKey]);
        setIsOpen(false);
    };

    return (
        <div className="relative group" ref={wrapperRef}>
            <label className="block mb-1.5 text-xs font-bold text-gray-500 uppercase tracking-wider">{label}</label>
            <div className="relative">
                <input
                    type="text"
                    placeholder={loading ? "Loading..." : "Select..."}
                    value={searchTerm}
                    onChange={(e) => { setSearchTerm(e.target.value); setIsOpen(true); if (e.target.value === '') onChange({ target: { value: '' } }); }}
                    onFocus={() => !disabled && setIsOpen(true)}
                    disabled={disabled || loading}
                    className="w-full pl-4 pr-10 py-3 rounded-xl bg-white/50 border border-gray-200 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#ff6a3c]/50 focus:border-[#ff6a3c] transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                    {loading ? <Loader className="animate-spin" size={16} /> : <ChevronDown size={16} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />}
                </div>
            </div>
            <AnimatePresence>
                {isOpen && !disabled && (
                    <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 5 }} className="absolute z-50 w-full mt-2 bg-white border border-gray-100 rounded-xl shadow-xl max-h-60 overflow-y-auto custom-scrollbar">
                        {filteredOptions.length > 0 ? (
                            filteredOptions.map((opt) => (
                                <div key={opt[valueKey]} onClick={() => handleSelect(opt)} className={`px-4 py-3 cursor-pointer text-sm font-medium transition-colors border-b border-gray-50 last:border-0 ${String(value) === String(opt[valueKey]) ? 'bg-orange-50 text-[#ff6a3c]' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}>
                                    {opt[nameKey]}
                                </div>
                            ))
                        ) : (
                            <div className="px-4 py-3 text-sm text-gray-400 text-center italic">No matches found</div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

const EvaluationPage = () => {
    const { isAuthenticated } = useAuth();
    const navigate = useNavigate();
    
    // Core Data State
    const [mainEvents, setMainEvents] = useState([]);
    const [subEvents, setSubEvents] = useState([]);
    const [subSubEvents, setSubSubEvents] = useState([]);
    const [projects, setProjects] = useState([]);
    const [judges, setJudges] = useState([]); 

    // Selection State
    const [selectedMainEvent, setSelectedMainEvent] = useState('');
    const [selectedSubEvent, setSelectedSubEvent] = useState('');
    const [selectedSubSubEvent, setSelectedSubSubEvent] = useState('');
    
    // UI State
    const [selectedProject, setSelectedProject] = useState(''); 
    const [selectedProjectName, setSelectedProjectName] = useState('');
    const [projectSearchTerm, setProjectSearchTerm] = useState('');
    
    // Evaluation Form State
    const [scores, setScores] = useState({});
    const [remarks, setRemarks] = useState('');
    const [isDisqualified, setIsDisqualified] = useState(false);
    const [status, setStatus] = useState({ message: '', type: '' });
    const [loading, setLoading] = useState({ main: true, sub: false, subsub: false, projects: false, judges: false, evaluation: false });

    // Fetch Main Events
    useEffect(() => {
        const fetchMainEvents = async () => {
            try {
                const response = await axios.post(`${API_URL}/eval/get_main_events/`);
                setMainEvents(response.data);
            } catch (error) { console.error(error); setStatus({ message: 'Error loading events.', type: 'error' }); } 
            finally { setLoading(prev => ({ ...prev, main: false })); }
        };
        if (isAuthenticated) fetchMainEvents();
    }, [isAuthenticated]);

    // Fetch Sub Events
    useEffect(() => {
        if (selectedMainEvent) {
            const fetchSubEvents = async () => {
                setLoading(prev => ({ ...prev, sub: true }));
                setSubEvents([]); setSubSubEvents([]); setProjects([]); setSelectedSubEvent(''); setSelectedSubSubEvent('');
                try {
                    const response = await axios.post(`${API_URL}/eval/get_subevents/${selectedMainEvent}/`);
                    setSubEvents(response.data);
                } catch (error) { console.error(error); } finally { setLoading(prev => ({ ...prev, sub: false })); }
            };
            fetchSubEvents();
        }
    }, [selectedMainEvent]);
    
    // Fetch Competitions
    useEffect(() => {
        if (selectedSubEvent) {
            const fetchSubSubEvents = async () => {
                setLoading(prev => ({ ...prev, subsub: true }));
                setSubSubEvents([]); setProjects([]); setSelectedSubSubEvent('');
                try {
                    const response = await axios.post(`${API_URL}/eval/get_subsubevents/${selectedSubEvent}/`);
                    setSubSubEvents(response.data); 
                } catch (error) { console.error(error); } finally { setLoading(prev => ({ ...prev, subsub: false })); }
            };
            fetchSubSubEvents();
        }
    }, [selectedSubEvent]);

    // Fetch Projects & Judges
    useEffect(() => {
        if (selectedSubSubEvent) {
            const fetchData = async () => {
                setLoading(prev => ({ ...prev, projects: true, judges: true }));
                setProjects([]); setJudges([]); setSelectedProject('');
                try {
                    const [projectsRes, judgesRes] = await Promise.all([
                        axios.get(`${API_URL}/eval/get_projects/${selectedSubSubEvent}/`),
                        axios.get(`${API_URL}/eval/subsubevents/${selectedSubSubEvent}/judges/`)
                    ]);
                    setProjects(Array.isArray(projectsRes.data) ? projectsRes.data : []);
                    const judgesList = judgesRes.data.judges || judgesRes.data || [];
                    setJudges(Array.isArray(judgesList) ? judgesList : []);
                } catch (error) { console.error(error); setStatus({ message: 'Error loading data.', type: 'error' }); } 
                finally { setLoading(prev => ({ ...prev, projects: false, judges: false })); }
            };
            fetchData();
        }
    }, [selectedSubSubEvent]);

    // Handle Project Selection (Opens Right Panel)
    const handleSelectProject = async (project) => {
        const projectId = project.project_id ?? project.projectId ?? project.id;
        if (!projectId) return;

        setSelectedProject(String(projectId));
        setSelectedProjectName(project.team_name);
        setScores({});
        setRemarks('');
        setIsDisqualified(false);
        setStatus({ message: '', type: '' });
        setLoading(prev => ({ ...prev, evaluation: true }));

        try {
            const response = await axios.get(`${API_URL}/eval/evaluations/detail/`, {
                params: { project_id: projectId, subsubevent_id: selectedSubSubEvent },
            });
            const payload = response.data;
            if (payload?.exists && payload.evaluation) {
                const evaluation = payload.evaluation;
                setIsDisqualified(Boolean(evaluation.is_disqualified));
                setRemarks(evaluation.remarks || '');
                const loadedScores = {};
                (evaluation.marks || []).forEach((mark) => { loadedScores[mark.judge_name] = mark.mark; });
                setScores(loadedScores);
            }
        } catch (error) { console.error(error); } 
        finally { setLoading(prev => ({ ...prev, evaluation: false })); }
    };

    const handleClearSelection = () => {
        setSelectedProject('');
        setSelectedProjectName('');
        setScores({});
        setRemarks('');
        setStatus({ message: '', type: '' });
    };

    const updateProjectList = (projectId, flag) => {
        setProjects(prev => prev.map(p => {
            const id = p.project_id ?? p.projectId ?? p.id;
            return String(id) === String(projectId) ? { ...p, has_evaluation: flag } : p;
        }));
    };

    const handleScoreChange = (judgeName, value) => {
        const val = parseFloat(value);
        if (val < 0) return;
        setScores(prev => ({ ...prev, [judgeName]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const projectId = parseInt(selectedProject, 10);
        const subSubEventId = parseInt(selectedSubSubEvent, 10);
        
        const marksPayload = judges.map(judge => ({
            judge_name: judge.name,
            mark: scores[judge.name] || "0",
            comments: ""
        })).filter(m => m.mark !== "" && m.mark !== null);

        if (marksPayload.length === 0) {
            setStatus({ message: 'Please enter at least one score.', type: 'error' });
            return;
        }

        setStatus({ message: 'Submitting...', type: 'info' });

        try {
            await axios.post(`${API_URL}/eval/evaluations/submit/`, {
                project_id: projectId,
                subsubevent_id: subSubEventId,
                is_disqualified: isDisqualified,
                remarks: remarks,
                marks: marksPayload
            });
            setStatus({ message: 'Saved successfully!', type: 'success' });
            updateProjectList(projectId, true);
            setTimeout(() => { handleClearSelection(); }, 1000);
        } catch (error) {
            const msg = error.response?.data?.error || "Submission failed.";
            setStatus({ message: msg, type: 'error' });
        }
    };

    const filteredProjects = projects.filter(p => 
        p.team_name.toLowerCase().includes(projectSearchTerm.toLowerCase()) ||
        String(p.project_id ?? p.id).includes(projectSearchTerm)
    );

    const handleDownloadSummary = async () => {
        if (!selectedSubSubEvent) return;
        try {
            const response = await axios.get(`${API_URL}/eval/subsubevents/${selectedSubSubEvent}/summary.csv`, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([response.data], { type: 'text/csv' }));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `summary_${selectedSubSubEvent}.csv`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) { console.error(error); }
    };

    if (!isAuthenticated) return <Navigate to="/login" />;

    return (
        <div className="relative w-full min-h-screen font-body text-gray-800 bg-gray-50 flex flex-col overflow-hidden">
            {/* Background elements matched from Admin.jsx */}
            <div className="absolute inset-0 bg-gradient-to-br from-white via-amber-50 to-orange-100 z-0 pointer-events-none"></div>
            <div className="absolute top-0 left-0 w-full h-full bg-grid-gray-200/[0.4] z-0 pointer-events-none"></div>
            
            {/* Main Container - Matches Admin.jsx positioning */}
            <div className="relative z-10 w-full flex-1 flex flex-col px-4 sm:px-6 lg:px-8 py-20 max-w-8xl mx-auto">
                 {/* Header - Matches Admin.jsx padding-top (pt-16) and centered style */}
                 <div className="pt-16 max-w-5xl mx-auto w-full">
                    <motion.div 
                        initial={{ opacity: 0, y: -20 }} 
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-12 text-center"
                    >
                        {/* <div className="inline-block px-4 py-1.5 rounded-full bg-orange-100 text-[#ff6a3c] font-bold text-sm mb-4 border border-orange-200">
                            JUDGE CONSOLE
                        </div> */}
                        <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-[#ff6a3c] via-[#df9400] to-[#ff6a3c] bg-clip-text text-transparent pb-2">
                            Project Evaluation
                        </h1>
                        <p className="text-gray-600 mt-3">Select an event and evaluate team projects.</p>
                    </motion.div>
                 </div>

                {/* Main Workspace (Split View) */}
                <div className="flex-1 flex overflow-hidden w-full gap-6 pb-6 min-h-[600px] max-w-7xl mx-auto">
                    
                    {/* LEFT PANEL: Filters & Project List */}
                    <motion.div 
                        className={`flex flex-col w-full md:w-1/3 lg:w-1/4 bg-white/80 backdrop-blur-lg rounded-3xl border border-white shadow-xl overflow-hidden ${selectedProject ? 'hidden md:flex' : 'flex'}`}
                        initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                    >
                        {/* Filters Header */}
                        <div className="p-5 border-b border-gray-100 space-y-4 bg-white/50">
                            <div className="space-y-3">
                                <SearchableDropdown label="Event Category" value={selectedMainEvent} onChange={(e) => setSelectedMainEvent(e.target.value)} options={mainEvents} loading={loading.main} />
                                <SearchableDropdown label="Sub-Category" value={selectedSubEvent} onChange={(e) => setSelectedSubEvent(e.target.value)} options={subEvents} loading={loading.sub} disabled={!selectedMainEvent} />
                                <SearchableDropdown label="Competition Track" value={selectedSubSubEvent} onChange={(e) => setSelectedSubSubEvent(e.target.value)} options={subSubEvents} loading={loading.subsub} disabled={!selectedSubEvent} />
                            </div>
                        </div>

                        {/* Project Search & List */}
                        <div className="flex-1 flex flex-col overflow-hidden">
                            {selectedSubSubEvent ? (
                                <>
                                    <div className="p-4 border-b border-gray-100 bg-white/30">
                                        <div className="relative">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                            <input 
                                                type="text" 
                                                placeholder="Search teams..." 
                                                value={projectSearchTerm}
                                                onChange={(e) => setProjectSearchTerm(e.target.value)}
                                                className="w-full pl-9 pr-4 py-2 rounded-xl bg-gray-50 border border-transparent focus:bg-white focus:border-orange-200 focus:ring-2 focus:ring-orange-100 transition-all text-sm outline-none"
                                            />
                                        </div>
                                        <div className="flex items-center justify-between mt-3 px-1">
                                            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{filteredProjects.length} Teams</span>
                                            {loading.projects ? <Loader size={14} className="animate-spin text-[#ff6a3c]" /> : (
                                                <button onClick={handleDownloadSummary} className="text-xs font-bold text-[#ff6a3c] hover:underline flex items-center gap-1">
                                                    <Download size={12} /> CSV
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                    
                                    <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2">
                                        {filteredProjects.length > 0 ? (
                                            filteredProjects.map((project) => {
                                                const pid = String(project.project_id ?? project.id);
                                                const isSelected = selectedProject === pid;
                                                const isEvaluated = Boolean(project.has_evaluation);
                                                return (
                                                    <button
                                                        key={pid}
                                                        onClick={() => handleSelectProject(project)}
                                                        className={`w-full text-left p-3 rounded-2xl border transition-all duration-200 group flex items-center justify-between ${
                                                            isSelected 
                                                                ? 'bg-[#ff6a3c] border-[#ff6a3c] shadow-md shadow-orange-500/20 text-white' 
                                                                : 'bg-white border-gray-100 hover:border-orange-200 hover:shadow-sm text-gray-700'
                                                        }`}
                                                    >
                                                        <div className="overflow-hidden">
                                                            <div className={`text-xs font-bold mb-0.5 ${isSelected ? 'text-orange-100' : 'text-gray-400'}`}>#{pid}</div>
                                                            <div className={`font-bold text-sm truncate ${isSelected ? 'text-white' : 'text-gray-800'}`}>{project.team_name}</div>
                                                        </div>
                                                        {isEvaluated ? (
                                                            <CheckCircle size={18} className={`shrink-0 ${isSelected ? 'text-white' : 'text-green-500'}`} />
                                                        ) : (
                                                            <div className={`shrink-0 w-2 h-2 rounded-full ${isSelected ? 'bg-orange-200' : 'bg-gray-300 group-hover:bg-orange-300'}`} />
                                                        )}
                                                    </button>
                                                );
                                            })
                                        ) : (
                                            <div className="text-center py-10 text-gray-400 text-sm">No teams found.</div>
                                        )}
                                    </div>
                                </>
                            ) : (
                                <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-6 text-center">
                                    <Layout size={40} className="mb-4 opacity-20" />
                                    <p className="text-sm">Select a competition to load the team roster.</p>
                                </div>
                            )}
                        </div>
                    </motion.div>

                    {/* RIGHT PANEL: Evaluation Workspace */}
                    <div className={`flex-1 flex flex-col bg-white/90 backdrop-blur-xl rounded-3xl border border-white shadow-2xl overflow-hidden relative ${!selectedProject ? 'hidden md:flex' : 'flex'}`}>
                        {selectedProject ? (
                            <>
                                {/* Workspace Header */}
                                <div className="h-16 border-b border-gray-100 flex items-center justify-between px-6 bg-white/50">
                                    <div className="flex items-center gap-3">
                                        <button onClick={handleClearSelection} className="md:hidden p-2 -ml-2 text-gray-500"><ArrowRight className="rotate-180" size={20}/></button>
                                        <div>
                                            <h2 className="text-lg font-bold text-gray-900">{selectedProjectName}</h2>
                                            <p className="text-xs text-gray-500 font-mono">Project ID: #{selectedProject}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase ${projects.find(p => String(p.project_id ?? p.id) === selectedProject)?.has_evaluation ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                                            {projects.find(p => String(p.project_id ?? p.id) === selectedProject)?.has_evaluation ? 'Graded' : 'Pending'}
                                        </span>
                                    </div>
                                </div>

                                {/* Scoring Area */}
                                <div className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-8">
                                    {loading.evaluation ? (
                                        <div className="h-full flex items-center justify-center text-gray-400 gap-2">
                                            <Loader className="animate-spin text-[#ff6a3c]" /> Loading scores...
                                        </div>
                                    ) : (
                                        <form id="eval-form" onSubmit={handleSubmit} className="max-w-3xl mx-auto space-y-8">
                                            
                                            {/* Judges Grid */}
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                                {judges.length > 0 ? (
                                                    judges.map((judge) => (
                                                        <div key={judge.id || judge.name} className="bg-gray-50/50 p-4 rounded-2xl border border-gray-100 hover:border-orange-200 transition-colors">
                                                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">{judge.name}</label>
                                                            <div className="relative">
                                                                <input 
                                                                    type="number" step="0.01" min="0"
                                                                    value={scores[judge.name] || ''}
                                                                    onChange={(e) => handleScoreChange(judge.name, e.target.value)}
                                                                    placeholder="0.00"
                                                                    className="w-full text-2xl font-bold bg-transparent border-b-2 border-gray-200 focus:border-[#ff6a3c] outline-none py-1 text-gray-800 placeholder-gray-300 transition-colors"
                                                                />
                                                                <span className="absolute right-0 bottom-2 text-xs text-gray-400 font-medium">/ 10</span>
                                                            </div>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div className="col-span-full p-4 bg-red-50 text-red-600 rounded-xl text-sm font-semibold text-center border border-red-100">
                                                        Configuration Error: No judges assigned to this competition.
                                                    </div>
                                                )}
                                            </div>

                                            {/* Remarks Section */}
                                            <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
                                                <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-3">
                                                    <AlertCircle size={16} className="text-[#df9400]" /> Judge Remarks
                                                </label>
                                                <textarea 
                                                    value={remarks} 
                                                    onChange={(e) => setRemarks(e.target.value)} 
                                                    rows="3" 
                                                    placeholder="Enter constructive feedback or notes about the project..."
                                                    className="w-full p-3 rounded-xl bg-gray-50 border-0 focus:ring-2 focus:ring-orange-100 text-sm text-gray-700 resize-none"
                                                />
                                            </div>

                                            {/* Disqualification Toggle */}
                                            <div className="flex items-center gap-4 p-4 rounded-2xl border border-red-100 bg-red-50/30">
                                                <input 
                                                    type="checkbox" 
                                                    id="disqualify" 
                                                    checked={isDisqualified} 
                                                    onChange={(e) => {
                                                        setIsDisqualified(e.target.checked);
                                                        if(e.target.checked) setScores(judges.reduce((acc, j) => ({...acc, [j.name]: "0"}), {}));
                                                    }}
                                                    className="w-5 h-5 text-red-600 rounded border-gray-300 focus:ring-red-500 cursor-pointer"
                                                />
                                                <label htmlFor="disqualify" className="text-sm font-bold text-red-800 cursor-pointer select-none">
                                                    Mark as Disqualified <span className="font-normal text-red-600 block text-xs mt-0.5">This sets all scores to 0.</span>
                                                </label>
                                            </div>
                                        </form>
                                    )}
                                </div>

                                {/* Workspace Footer */}
                                <div className="h-20 border-t border-gray-100 bg-white/80 px-8 flex items-center justify-between">
                                    <div className={`text-sm font-medium flex items-center gap-2 ${status.type === 'error' ? 'text-red-600' : 'text-green-600'}`}>
                                        {status.message && (
                                            <>
                                                {status.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                                                {status.message}
                                            </>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <button 
                                            type="button" 
                                            onClick={handleClearSelection} 
                                            className="text-sm font-bold text-gray-500 hover:text-gray-800 transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button 
                                            form="eval-form"
                                            type="submit" 
                                            disabled={loading.evaluation || status.message === 'Submitting...' || judges.length === 0}
                                            className="px-8 py-3 bg-[#ff6a3c] hover:bg-[#df9400] text-white rounded-xl font-bold shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50 transition-all transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                        >
                                            {status.message === 'Submitting...' ? <Loader className="animate-spin" size={18} /> : <Send size={18} />}
                                            Submit Evaluation
                                        </button>
                                    </div>
                                </div>
                            </>
                        ) : (
                            // Empty State for Right Panel
                            <div className="flex-1 flex flex-col items-center justify-center text-gray-300 select-none">
                                <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-6">
                                    <Award size={48} className="text-gray-200" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-400">Ready to Evaluate</h3>
                                <p className="text-sm text-gray-400 mt-2">Select a team from the list to begin grading.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EvaluationPage;