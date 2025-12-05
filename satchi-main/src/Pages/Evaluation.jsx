import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, BarChart2, Loader, Users, X, CheckCircle, ChevronDown, Search } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

// --- Custom Searchable Dropdown Component ---
const SearchableDropdown = ({ label, value, onChange, options, loading, disabled, valueKey = 'id', nameKey = 'name' }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const wrapperRef = useRef(null);

    // Update search term when value changes externally
    useEffect(() => {
        const selectedOption = options.find(opt => String(opt[valueKey]) === String(value));
        if (selectedOption) {
            setSearchTerm(selectedOption[nameKey]);
        } else {
            setSearchTerm('');
        }
    }, [value, options, valueKey, nameKey]);

    // Handle clicking outside to close
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
        <div className="relative" ref={wrapperRef}>
            <label className="block mb-1.5 text-sm font-semibold text-gray-600">{label}</label>
            <div className="relative">
                <input
                    type="text"
                    placeholder={loading ? "Loading..." : "Select or search..."}
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
                
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center pointer-events-none text-gray-400">
                    {loading ? (
                        <Loader className="animate-spin" size={18} />
                    ) : (
                        <ChevronDown size={18} className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
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
                                    className={`px-4 py-2.5 cursor-pointer text-sm transition-colors ${
                                        String(value) === String(opt[valueKey]) 
                                            ? 'bg-orange-50 text-[#ff6a3c] font-semibold' 
                                            : 'text-gray-700 hover:bg-gray-50'
                                    }`}
                                >
                                    {opt[nameKey]}
                                </div>
                            ))
                        ) : (
                            <div className="px-4 py-3 text-sm text-gray-500 text-center">
                                No results found
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

const EvaluationPage = () => {
    const { user, isAuthenticated } = useAuth();

    // State for cascading dropdowns
    const [mainEvents, setMainEvents] = useState([]);
    const [subEvents, setSubEvents] = useState([]);
    const [subSubEvents, setSubSubEvents] = useState([]);
    const [projects, setProjects] = useState([]);
    
    // Data state
    const [judges, setJudges] = useState([]); 

    // State for selections
    const [selectedMainEvent, setSelectedMainEvent] = useState('');
    const [selectedSubEvent, setSelectedSubEvent] = useState('');
    const [selectedSubSubEvent, setSelectedSubSubEvent] = useState('');
    
    // Evaluation State
    const [selectedProject, setSelectedProject] = useState(''); 
    const [selectedProjectName, setSelectedProjectName] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Form State
    const [scores, setScores] = useState({});
    const [remarks, setRemarks] = useState('');
    const [isDisqualified, setIsDisqualified] = useState(false);
    
    const [status, setStatus] = useState({ message: '', type: '' });
    const [loading, setLoading] = useState({ main: true, sub: false, subsub: false, projects: false, judges: false });

    useEffect(() => {
        const fetchMainEvents = async () => {
            try {
                const response = await axios.post(`${API_URL}/eval/get_main_events/`);
                setMainEvents(response.data);
            } catch (error) {
                console.error("Failed to fetch main events", error);
                setStatus({ message: 'Could not load main events.', type: 'error' });
            } finally {
                setLoading(prev => ({ ...prev, main: false }));
            }
        };
        if (isAuthenticated) fetchMainEvents();
    }, [isAuthenticated]);

    useEffect(() => {
        if (selectedMainEvent) {
            const fetchSubEvents = async () => {
                setLoading(prev => ({ ...prev, sub: true }));
                setSubEvents([]); setSubSubEvents([]); setProjects([]); setJudges([]);
                setSelectedSubEvent(''); setSelectedSubSubEvent(''); setSelectedProject('');
                try {
                    const response = await axios.post(`${API_URL}/eval/get_subevents/${selectedMainEvent}/`);
                    setSubEvents(response.data);
                } catch (error) {
                    console.error("Failed to fetch sub events", error);
                    setStatus({ message: 'Could not load sub-events.', type: 'error' });
                } finally {
                    setLoading(prev => ({ ...prev, sub: false }));
                }
            };
            fetchSubEvents();
        }
    }, [selectedMainEvent]);
    
    useEffect(() => {
        if (selectedSubEvent) {
            const fetchSubSubEvents = async () => {
                setLoading(prev => ({ ...prev, subsub: true }));
                setSubSubEvents([]); setProjects([]); setJudges([]);
                setSelectedSubSubEvent(''); setSelectedProject('');
                try {
                    const response = await axios.post(`${API_URL}/eval/get_subsubevents/${selectedSubEvent}/`);
                    setSubSubEvents(response.data); 
                } catch (error) {
                    console.error("Failed to fetch competitions", error);
                    setStatus({ message: 'Could not load competitions.', type: 'error' });
                } finally {
                    setLoading(prev => ({ ...prev, subsub: false }));
                }
            };
            fetchSubSubEvents();
        }
    }, [selectedSubEvent]);

    useEffect(() => {
        if (selectedSubSubEvent) {
            const fetchData = async () => {
                setLoading(prev => ({ ...prev, projects: true, judges: true }));
                setProjects([]); setJudges([]);
                
                try {
                    const projectsReq = axios.get(`${API_URL}/eval/get_projects/${selectedSubSubEvent}/`);
                    const judgesReq = axios.get(`${API_URL}/eval/subsubevents/${selectedSubSubEvent}/judges/`);
                    const [projectsRes, judgesRes] = await Promise.all([projectsReq, judgesReq]);

                    setProjects(projectsRes.data);
                    const judgesList = judgesRes.data.judges || judgesRes.data || [];
                    setJudges(Array.isArray(judgesList) ? judgesList : []);

                } catch (error) {
                    console.error("Failed to fetch data", error);
                    setStatus({ message: 'Could not load projects or judges.', type: 'error' });
                } finally {
                    setLoading(prev => ({ ...prev, projects: false, judges: false }));
                }
            };
            fetchData();
        }
    }, [selectedSubSubEvent]);

    const handleScoreChange = (judgeName, value) => {
        const val = parseFloat(value);
        if (val < 0) return;
        setScores(prev => ({ ...prev, [judgeName]: value }));
    };

    const handleDisqualificationChange = (e) => {
        const isChecked = e.target.checked;
        setIsDisqualified(isChecked);
        if (isChecked) {
            const zeroScores = {};
            judges.forEach(judge => { zeroScores[judge.name] = "0"; });
            setScores(zeroScores);
        }
    };

    const handleOpenEvaluation = (project) => {
        setSelectedProject(project.id);
        setSelectedProjectName(project.team_name);
        setScores({});
        setRemarks('');
        setIsDisqualified(false);
        setStatus({ message: '', type: '' });
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedProject('');
        setSelectedProjectName('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedProject) {
            setStatus({ message: 'Error: No project selected.', type: 'error' });
            return;
        }
        
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

        const submissionData = {
            project_id: parseInt(selectedProject),
            subsubevent_id: parseInt(selectedSubSubEvent),
            is_disqualified: isDisqualified,
            remarks: remarks,
            marks: marksPayload
        };

        try {
            await axios.post(`${API_URL}/eval/evaluations/submit/`, submissionData);
            setStatus({ message: 'Evaluation submitted successfully!', type: 'success' });
            setTimeout(() => {
                handleCloseModal();
                setStatus({ message: '', type: '' });
            }, 1500);

        } catch (error) {
            console.error("Submission error", error);
            const errorMessage = error.response?.data?.error || "An unknown error occurred.";
            setStatus({ message: `Submission failed: ${errorMessage}`, type: 'error' });
        }
    };

    if (!isAuthenticated) return <Navigate to="/login" />;
    
    return (
        <div className="relative w-full min-h-screen px-4 sm:px-6 lg:px-8 py-20 font-body text-gray-800">
             <div className="absolute inset-0 bg-gradient-to-br from-white via-amber-50 to-orange-100 z-0"></div>
            <div className="relative z-10 pt-16 max-w-6xl mx-auto">
                <motion.div initial={{ opacity: 0, y: -50 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }} className="text-center mb-12">
                    <h1 className="text-4xl sm:text-5xl md:text-6xl font-heading font-bold bg-gradient-to-r from-[#ff6a3c] via-[#df9400] to-[#ff6a3c] bg-clip-text text-transparent">
                        Project Evaluation
                    </h1>
                    <p className="text-lg text-gray-600 mt-4">Select event details to view and evaluate teams.</p>
                </motion.div>

                {/* Filter Section */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white/80 border border-gray-200/90 rounded-2xl p-8 backdrop-blur-lg shadow-xl space-y-6 mb-8">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <SearchableDropdown label="Main Event" value={selectedMainEvent} onChange={(e) => setSelectedMainEvent(e.target.value)} options={mainEvents} loading={loading.main} />
                        <SearchableDropdown label="Sub-Event" value={selectedSubEvent} onChange={(e) => setSelectedSubEvent(e.target.value)} options={subEvents} loading={loading.sub} disabled={!selectedMainEvent} />
                        <SearchableDropdown label="Competition" value={selectedSubSubEvent} onChange={(e) => setSelectedSubSubEvent(e.target.value)} options={subSubEvents} loading={loading.subsub} disabled={!selectedSubEvent} />
                    </div>
                </motion.div>

                {/* Teams List Section - Updated to Table */}
                {selectedSubSubEvent && (
                    <div className="space-y-6">
                         <div className="flex items-center gap-2 mb-4">
                            <Users className="text-[#ff6a3c]" />
                            <h2 className="text-2xl font-bold text-gray-800">Teams / Projects</h2>
                        </div>

                        {loading.projects ? (
                            <div className="flex justify-center py-12">
                                <Loader className="animate-spin text-[#ff6a3c]" size={40} />
                            </div>
                        ) : projects.length === 0 ? (
                            <div className="bg-white/60 rounded-xl p-8 text-center border border-dashed border-gray-300">
                                <p className="text-gray-500 font-medium">No projects found for this competition.</p>
                            </div>
                        ) : (
                            <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-gray-50 border-b border-gray-200 text-xs uppercase tracking-wider text-gray-500 font-semibold">
                                                <th className="p-4 w-24">ID</th>
                                                <th className="p-4 w-full">Team Name</th>
                                                <th className="p-4 text-right">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {projects.map((project) => (
                                                <tr key={project.id} className="hover:bg-orange-50/50 transition-colors group">
                                                    <td className="p-4 text-gray-500 font-mono text-sm">#{project.id}</td>
                                                    <td className="p-4 font-semibold text-gray-800 group-hover:text-[#ff6a3c] transition-colors">
                                                        {project.team_name}
                                                    </td>
                                                    <td className="p-4 text-right">
                                                        <button 
                                                            onClick={() => handleOpenEvaluation(project)}
                                                            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-900 text-white text-sm font-semibold hover:bg-[#ff6a3c] transition-colors shadow-sm hover:shadow-md whitespace-nowrap"
                                                        >
                                                            <BarChart2 size={16} /> Evaluate
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Evaluation Modal */}
                <AnimatePresence>
                    {isModalOpen && (
                        <motion.div 
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
                            onClick={handleCloseModal}
                        >
                            <motion.div 
                                initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }}
                                className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[75vh] overflow-y-auto"
                                onClick={e => e.stopPropagation()}
                            >
                                <div className="sticky top-0 z-10 bg-white border-b border-gray-100 p-6 flex items-center justify-between">
                                    <div>
                                        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                                            <BarChart2 className="text-[#df9400]" size={24} />
                                            Evaluate Team
                                        </h2>
                                        <p className="text-[#ff6a3c] font-semibold mt-1 text-lg">
                                            {selectedProjectName}
                                        </p>
                                    </div>
                                    <button onClick={handleCloseModal} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500">
                                        <X size={24} />
                                    </button>
                                </div>

                                <div className="p-6 space-y-6">
                                    <form onSubmit={handleSubmit}>
                                        {loading.judges ? (
                                            <div className="text-center py-8 text-gray-500"><Loader className="animate-spin inline mr-2"/> Loading judges...</div>
                                        ) : judges.length === 0 ? (
                                            <div className="text-center py-8 text-red-500 font-semibold bg-red-50 rounded-lg">No judges found. Please add judges in Admin.</div>
                                        ) : (
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                                {judges.map(judge => (
                                                    <div key={judge.id || judge.name}>
                                                        <label htmlFor={`judge-${judge.id}`} className="block mb-2 text-sm font-semibold text-gray-600">{judge.name}</label>
                                                        <input 
                                                            type="number" step="0.01" id={`judge-${judge.id}`} 
                                                            value={scores[judge.name] || ''} 
                                                            onChange={(e) => handleScoreChange(judge.name, e.target.value)}
                                                            placeholder="Mark"
                                                            className="w-full py-2.5 px-4 rounded-lg bg-gray-50 border border-gray-300 text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#ff6a3c] focus:border-transparent transition"
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        <div className="mt-6">
                                            <label htmlFor="remarks" className="block mb-2 text-sm font-semibold text-gray-600">Remarks</label>
                                            <textarea 
                                                id="remarks" value={remarks} onChange={(e) => setRemarks(e.target.value)} 
                                                rows="3" placeholder="Feedback..."
                                                className="w-full p-3 rounded-lg bg-gray-50 border border-gray-300 text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#ff6a3c] focus:border-transparent transition"
                                            ></textarea>
                                        </div>

                                        <div className="flex items-center mt-4 p-3 bg-red-50 rounded-lg border border-red-100">
                                            <input 
                                                type="checkbox" id="isDisqualified" 
                                                checked={isDisqualified} onChange={handleDisqualificationChange} 
                                                className="h-5 w-5 rounded border-gray-300 text-red-600 focus:ring-red-500 cursor-pointer" 
                                            />
                                            <label htmlFor="isDisqualified" className="ml-3 block text-sm font-bold text-red-700 cursor-pointer">
                                                Disqualify this team
                                            </label>
                                        </div>

                                        {status.message && (
                                            <div className={`mt-4 p-3 rounded-lg text-sm font-semibold flex items-center gap-2 ${status.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                                {status.type === 'success' && <CheckCircle size={16}/>}
                                                {status.message}
                                            </div>
                                        )}

                                        <div className="mt-8 pt-4 border-t border-gray-100 flex justify-end gap-3">
                                            <button 
                                                type="button" onClick={handleCloseModal}
                                                className="px-6 py-2.5 rounded-lg border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
                                            >
                                                Cancel
                                            </button>
                                            <button 
                                                type="submit" 
                                                className="px-6 py-2.5 rounded-lg bg-[#ff6a3c] text-white font-bold hover:shadow-lg hover:shadow-orange-500/30 transition-shadow disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
                                                disabled={status.message === 'Submitting...' || judges.length === 0}
                                            >
                                                <Send size={18}/> Submit Score
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default EvaluationPage;