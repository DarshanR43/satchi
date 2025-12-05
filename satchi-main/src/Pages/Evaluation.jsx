import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Send, BarChart2, Loader } from 'lucide-react'; // Removed unused imports
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';

// Fixed: Removed import.meta to prevent build errors

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';


const EvaluationPage = () => {
    const { user, isAuthenticated } = useAuth();

    // State for cascading dropdowns
    const [mainEvents, setMainEvents] = useState([]);
    const [subEvents, setSubEvents] = useState([]);
    const [subSubEvents, setSubSubEvents] = useState([]);
    const [projects, setProjects] = useState([]);
    
    // Changed: State for judges instead of rubrics
    const [judges, setJudges] = useState([]); 

    // State for selections
    const [selectedMainEvent, setSelectedMainEvent] = useState('');
    const [selectedSubEvent, setSelectedSubEvent] = useState('');
    const [selectedSubSubEvent, setSelectedSubSubEvent] = useState('');
    const [selectedProject, setSelectedProject] = useState('');

    // State for the evaluation form
    const [scores, setScores] = useState({}); // Now keys will be judge names/ids
    const [remarks, setRemarks] = useState('');
    const [isDisqualified, setIsDisqualified] = useState(false);
    
    const [status, setStatus] = useState({ message: '', type: '' });
    const [loading, setLoading] = useState({ main: true, sub: false, subsub: false, projects: false, judges: false });

    // Fetch initial main events
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
        if (isAuthenticated) {
            fetchMainEvents();
        }
    }, [isAuthenticated]);

    // Fetch sub-events when a main event is selected
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
    
    // Fetch sub-sub-events when a sub-event is selected
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

    // Fetch projects AND JUDGES when a sub-sub-event is selected
    useEffect(() => {
        if (selectedSubSubEvent) {
            const fetchData = async () => {
                setLoading(prev => ({ ...prev, projects: true, judges: true }));
                setProjects([]);
                setJudges([]);
                setSelectedProject('');
                setScores({}); // Reset scores

                try {
                    // Fetch Projects
                    const projectsReq = axios.get(`${API_URL}/eval/get_projects/${selectedSubSubEvent}/`);
                    
                    // Fetch Judges
                    // Using URL structure from previous context: /subsubevents/<id>/judges/
                    // Assuming mounted under /eval/ based on other calls
                    const judgesReq = axios.get(`${API_URL}/eval/subsubevents/${selectedSubSubEvent}/judges/`);

                    const [projectsRes, judgesRes] = await Promise.all([projectsReq, judgesReq]);

                    setProjects(projectsRes.data);
                    // Handle response structure { subsubevent_id: ..., judges: [...] } or just list
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
        // Allow decimals, ensure positive
        const val = parseFloat(value);
        if (val < 0) return;
        
        setScores(prev => ({ ...prev, [judgeName]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedProject) {
            setStatus({ message: 'Please select a project to evaluate.', type: 'error' });
            return;
        }
        
        // Validate that we have marks
        const marksPayload = judges.map(judge => ({
            judge_name: judge.name,
            mark: scores[judge.name] || "0",
            comments: "" // Optional
        })).filter(m => m.mark !== "" && m.mark !== null);

        if (marksPayload.length === 0) {
            setStatus({ message: 'Please enter at least one score.', type: 'error' });
            return;
        }

        setStatus({ message: 'Submitting...', type: 'info' });

        // Structure matches CreateEvaluationSerializer in backend
        const submissionData = {
            project_id: parseInt(selectedProject),
            subsubevent_id: parseInt(selectedSubSubEvent),
            is_disqualified: isDisqualified,
            remarks: remarks,
            marks: marksPayload
        };

        try {
            // Using endpoint from urls.py: evaluations/submit/
            await axios.post(`${API_URL}/eval/evaluations/submit/`, submissionData);
            setStatus({ message: 'Evaluation submitted successfully!', type: 'success' });
            // Reset form
            setScores({});
            setRemarks('');
            setIsDisqualified(false);
            setSelectedProject('');

        } catch (error) {
            console.error("Submission error", error);
            const errorMessage = error.response?.data?.error || "An unknown error occurred.";
            setStatus({ message: `Submission failed: ${errorMessage}`, type: 'error' });
        }
    };

    if (!isAuthenticated) {
        return <Navigate to="/login" />;
    }

    const SelectGroup = ({ label, value, onChange, options, loading, disabled, valueKey='id', nameKey='name' }) => (
        <div className="relative">
            <label className="block mb-1.5 text-sm font-semibold text-gray-600">{label}</label>
            <select value={value} onChange={onChange} disabled={disabled || loading}
                className="w-full pl-4 pr-10 py-2.5 rounded-lg bg-gray-50 border border-gray-300 text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#ff6a3c] focus:border-transparent transition disabled:opacity-50 disabled:cursor-not-allowed">
                <option value="">Select...</option>
                {options.map(opt => <option key={opt[valueKey]} value={opt[valueKey]}>{opt[nameKey]}</option>)}
            </select>
            {loading && <Loader className="absolute right-3 top-10 animate-spin text-gray-400" size={20} />}
        </div>
    );
    
    return (
        <div className="relative w-full min-h-screen px-4 sm:px-6 lg:px-8 py-20 font-body text-gray-800">
             <div className="absolute inset-0 bg-gradient-to-br from-white via-amber-50 to-orange-100 z-0"></div>
            <div className="relative z-10 pt-16 max-w-4xl mx-auto">
                <motion.div initial={{ opacity: 0, y: -50 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }} className="text-center mb-12">
                    <h1 className="text-4xl sm:text-5xl md:text-6xl font-heading font-bold bg-gradient-to-r from-[#ff6a3c] via-[#df9400] to-[#ff6a3c] bg-clip-text text-transparent">
                        Project Evaluation
                    </h1>
                    <p className="text-lg text-gray-600 mt-4">Select an event and project to submit your evaluation.</p>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white/80 border border-gray-200/90 rounded-2xl p-8 backdrop-blur-lg shadow-xl space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <SelectGroup label="Main Event" value={selectedMainEvent} onChange={(e) => setSelectedMainEvent(e.target.value)} options={mainEvents} loading={loading.main} />
                        <SelectGroup label="Sub-Event" value={selectedSubEvent} onChange={(e) => setSelectedSubEvent(e.target.value)} options={subEvents} loading={loading.sub} disabled={!selectedMainEvent} />
                        <SelectGroup label="Competition" value={selectedSubSubEvent} onChange={(e) => setSelectedSubSubEvent(e.target.value)} options={subSubEvents} loading={loading.subsub} disabled={!selectedSubEvent} />
                        <SelectGroup label="Project/Team" value={selectedProject} onChange={(e) => setSelectedProject(e.target.value)} options={projects} loading={loading.projects} disabled={!selectedSubSubEvent} valueKey="id" nameKey="team_name"/>
                    </div>
                </motion.div>

                {selectedProject && (
                    <motion.form onSubmit={handleSubmit} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-10 bg-white/80 border border-gray-200/90 rounded-2xl p-8 backdrop-blur-lg shadow-xl space-y-6">
                        <div className="flex items-center gap-3 mb-4">
                            <BarChart2 className="text-[#df9400]" size={24} />
                            <h2 className="text-2xl font-bold text-gray-800">Judge Scores</h2>
                        </div>
                        
                        {loading.judges ? (
                             <div className="text-center py-8 text-gray-500"><Loader className="animate-spin inline mr-2"/> Loading judges...</div>
                        ) : judges.length === 0 ? (
                             <div className="text-center py-8 text-red-500 font-semibold bg-red-50 rounded-lg">No judges found for this competition. Please add judges in the Admin Dashboard first.</div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                                {judges.map(judge => (
                                    <div key={judge.id || judge.name}>
                                        <label htmlFor={`judge-${judge.id}`} className="block mb-1.5 text-sm font-semibold text-gray-600">{judge.name}</label>
                                        <div className="relative">
                                            <input 
                                                type="number" 
                                                step="0.01"
                                                id={`judge-${judge.id}`} 
                                                value={scores[judge.name] || ''} 
                                                onChange={(e) => handleScoreChange(judge.name, e.target.value)}
                                                placeholder="Enter Total Mark"
                                                className="w-full py-2.5 rounded-lg bg-gray-50 border border-gray-300 text-gray-800 text-center focus:outline-none focus:ring-2 focus:ring-[#ff6a3c] focus:border-transparent transition"
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        <hr className="border-gray-200/80 my-6"/>
                        <div>
                            <label htmlFor="remarks" className="block mb-1.5 text-sm font-semibold text-gray-600">Remarks</label>
                            <textarea id="remarks" value={remarks} onChange={(e) => setRemarks(e.target.value)} rows="4" placeholder="Provide your feedback and comments here..."
                                className="w-full p-3 rounded-lg bg-gray-50 border border-gray-300 text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#ff6a3c] focus:border-transparent transition"
                            ></textarea>
                        </div>
                        <div className="flex items-center">
                            <input type="checkbox" id="isDisqualified" checked={isDisqualified} onChange={(e) => setIsDisqualified(e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-[#ff6a3c] focus:ring-[#ff6a3c]" />
                            <label htmlFor="isDisqualified" className="ml-2 block text-sm font-semibold text-red-600">Disqualify this team</label>
                        </div>
                         <div className="text-center pt-4">
                            {status.message && (
                                <p className={`mb-4 text-sm font-semibold rounded-lg p-2 ${status.type === 'success' ? 'text-green-800 bg-green-100' : status.type === 'error' ? 'text-red-800 bg-red-100' : 'text-yellow-800 bg-yellow-100'}`}>{status.message}</p>
                            )}
                            <button type="submit" className="w-full max-w-xs mx-auto px-6 py-3 rounded-lg bg-[#ff6a3c] text-white font-bold hover:shadow-lg hover:shadow-orange-500/50 transition-shadow disabled:bg-gray-400 disabled:cursor-not-allowed" disabled={status.message === 'Submitting...' || judges.length === 0}>
                                <Send className="inline-block mr-2" size={18}/> Submit Evaluation
                            </button>
                        </div>
                    </motion.form>
                )}
            </div>
        </div>
    );
};

export default EvaluationPage;