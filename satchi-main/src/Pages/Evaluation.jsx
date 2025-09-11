import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronDown, Send, CheckCircle, AlertTriangle, Loader, BarChart2 } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

// --- IMPORTANT NOTE ---
// The following rubric data is hardcoded because the provided backend does not
// have an endpoint to fetch it. To make this fully dynamic, create a simple
// 'get_rubrics' view in your `eval/views.py` and fetch the data in the
// `useEffect` hook below.
const MOCKED_RUBRICS = [
    { code: 'creativity', name: 'Creativity & Originality', max_mark: 10 },
    { code: 'technical', name: 'Technical Skill & Complexity', max_mark: 15 },
    { code: 'presentation', name: 'Presentation & Clarity', max_mark: 10 },
    { code: 'impact', name: 'Potential Impact & Viability', max_mark: 15 },
];


const EvaluationPage = () => {
    const { user, isAuthenticated } = useAuth();

    // State for cascading dropdowns
    const [mainEvents, setMainEvents] = useState([]);
    const [subEvents, setSubEvents] = useState([]);
    const [subSubEvents, setSubSubEvents] = useState([]);
    const [projects, setProjects] = useState([]);
    const [rubrics, setRubrics] = useState(MOCKED_RUBRICS); // Using mocked data for now

    // State for selections
    const [selectedMainEvent, setSelectedMainEvent] = useState('');
    const [selectedSubEvent, setSelectedSubEvent] = useState('');
    const [selectedSubSubEvent, setSelectedSubSubEvent] = useState('');
    const [selectedProject, setSelectedProject] = useState('');

    // State for the evaluation form
    const [scores, setScores] = useState({});
    const [remarks, setRemarks] = useState('');
    const [isDisqualified, setIsDisqualified] = useState(false);
    
    const [status, setStatus] = useState({ message: '', type: '' });
    const [loading, setLoading] = useState({ main: true, sub: false, subsub: false, projects: false });

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
            // TODO: In a real app, you would fetch rubrics here too.
            // const rubricResponse = await axios.get(`${API_URL}/eval/get-rubrics/`);
            // setRubrics(rubricResponse.data);
        }
    }, [isAuthenticated]);

    // Fetch sub-events when a main event is selected
    useEffect(() => {
        if (selectedMainEvent) {
            const fetchSubEvents = async () => {
                setLoading(prev => ({ ...prev, sub: true }));
                setSubEvents([]); setSubSubEvents([]); setProjects([]);
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
                setSubSubEvents([]); setProjects([]);
                setSelectedSubSubEvent(''); setSelectedProject('');
                try {
                    const response = await axios.post(`${API_URL}/eval/get_subsubevents/${selectedSubEvent}/`);
                    // NOTE: Your backend returns projects within the subsubevent list, which is unusual.
                    // This code assumes a separate call might be better, but follows your current structure.
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

    // Fetch projects when a sub-sub-event is selected
    useEffect(() => {
        if (selectedSubSubEvent) {
            const fetchProjects = async () => {
                setLoading(prev => ({ ...prev, projects: true }));
                setProjects([]);
                setSelectedProject('');
                try {
                    // Note: Your URLconf expects an integer, but the view function is named `getProjectsByEvent`
                    // which implies it might expect the string event_id. Passing the integer ID to match the URL.
                    const response = await axios.get(`${API_URL}/eval/get_projects/${selectedSubSubEvent}/`);
                    setProjects(response.data);
                } catch (error) {
                    console.error("Failed to fetch projects", error);
                    setStatus({ message: 'Could not load projects for this event.', type: 'error' });
                } finally {
                    setLoading(prev => ({ ...prev, projects: false }));
                }
            };
            fetchProjects();
        }
    }, [selectedSubSubEvent]);


    const handleScoreChange = (rubricCode, value) => {
        const score = Math.max(0, parseInt(value, 10) || 0);
        const rubric = rubrics.find(r => r.code === rubricCode);
        if (rubric && score > rubric.max_mark) {
            return; // Do not allow scores greater than max
        }
        setScores(prev => ({ ...prev, [rubricCode]: score }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedProject) {
            setStatus({ message: 'Please select a project to evaluate.', type: 'error' });
            return;
        }
        setStatus({ message: 'Submitting...', type: 'info' });

        // Corrected submission data to match backend view
        const submissionData = {
            project_id: selectedProject,
            evaluator_id: user.id,
            rubric_marks: scores,
            remarks: remarks,
            isDisqualified: isDisqualified,
        };

        try {
            // Corrected endpoint to pass project_id in the URL
            await axios.post(`${API_URL}/eval/submit-evaluation/`, submissionData);
            setStatus({ message: 'Evaluation submitted successfully!', type: 'success' });
            // Reset form
            setScores({});
            setRemarks('');
            setIsDisqualified(false);
            setSelectedProject('');

        } catch (error) {
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
                            <h2 className="text-2xl font-bold text-gray-800">Scoring Rubrics</h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                            {rubrics.map(rubric => (
                                <div key={rubric.code}>
                                    <label htmlFor={rubric.code} className="block mb-1.5 text-sm font-semibold text-gray-600">{rubric.name}</label>
                                    <div className="relative">
                                        <input type="number" id={rubric.code} name={rubric.code} value={scores[rubric.code] || ''} onChange={(e) => handleScoreChange(rubric.code, e.target.value)}
                                            max={rubric.max_mark} min="0" placeholder="0"
                                            className="w-full py-2.5 rounded-lg bg-gray-50 border border-gray-300 text-gray-800 text-center focus:outline-none focus:ring-2 focus:ring-[#ff6a3c] focus:border-transparent transition"
                                        />
                                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">/ {rubric.max_mark}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
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
                            <button type="submit" className="w-full max-w-xs mx-auto px-6 py-3 rounded-lg bg-[#ff6a3c] text-white font-bold hover:shadow-lg hover:shadow-orange-500/50 transition-shadow disabled:bg-gray-400" disabled={status.message === 'Submitting...'}>
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

