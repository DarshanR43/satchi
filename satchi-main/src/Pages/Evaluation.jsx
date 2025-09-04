import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ArrowLeft, X, Users, Star, Plus, Minus, Check, Save, Search } from 'lucide-react';

// --- Mock Data ---
// In a real app, this would come from an API
const mockSubSubEvents = [
  { 
    id: 1011, 
    name: 'Tech Fair 2025', 
    parent: 'Anokha 2025',
    teams: [
      { id: 1, teamNo: 'TF001', name: 'Circuit Breakers', members: ['Alice', 'Bob', 'Charlie'] },
      { id: 2, teamNo: 'TF002', name: 'Code Wizards', members: ['David', 'Eve', 'Frank'] },
      { id: 3, teamNo: 'TF003', name: 'AI Innovators', members: ['Grace', 'Heidi', 'Ivan'] },
    ]
  },
  { 
    id: 1012, 
    name: 'RoboWars', 
    parent: 'Anokha 2025',
    teams: [
      { id: 4, teamNo: 'RW001', name: 'Metal Crushers', members: ['Judy', 'Mallory', 'Oscar'] },
      { id: 5, teamNo: 'RW002', name: 'The Terminators', members: ['Peggy', 'Sybil', 'Trent'] },
    ]
  },
  {
    id: 2011,
    name: 'Dance Competition',
    parent: 'Amritotsavam 2025',
    teams: [
       { id: 6, teamNo: 'DC001', name: 'Rhythmic Rebels', members: ['Walter', 'Victor', 'Wendy'] },
    ]
  }
];

const evaluationCriteria = [
    { id: 'creativity', label: 'Creativity & Originality', max: 20 },
    { id: 'technical', label: 'Technical Skill & Complexity', max: 30 },
    { id: 'presentation', label: 'Presentation & Demo', max: 25 },
    { id: 'completion', label: 'Project Completion & Functionality', max: 25 },
];


// --- #################### Evaluation Modal Component (UI Updated) #################### ---
const EvaluationModal = ({ team, criteria, isOpen, onClose, onSubmit }) => {
    const [marks, setMarks] = useState({});

    useEffect(() => {
        // Reset marks when a new team is selected
        const initialMarks = criteria.reduce((acc, crit) => {
            acc[crit.id] = 0;
            return acc;
        }, {});
        setMarks(initialMarks);
    }, [team, criteria]);

    const handleMarkChange = (id, value) => {
        const maxMark = criteria.find(c => c.id === id).max;
        const newMark = Math.max(0, Math.min(maxMark, Number(value)));
        setMarks(prev => ({ ...prev, [id]: newMark }));
    };

    const handleFocus = (e) => e.target.select();

    const totalMarks = useMemo(() => {
        return Object.values(marks).reduce((sum, current) => sum + current, 0);
    }, [marks]);
    
    const handleSubmit = () => {
        console.log(`Submitting marks for ${team.name}:`, { ...marks, total: totalMarks });
        onSubmit(team.id, { ...marks, total: totalMarks });
        onClose();
    };

    if (!isOpen) return null;

    return (
        <motion.div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
            <motion.div
                initial={{ scale: 0.9, y: 50 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: -50 }}
                className="bg-gray-900 border border-white/20 rounded-xl w-full max-w-2xl mx-auto"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-start justify-between p-4 border-b border-white/10">
                    <div>
                        <h2 className="text-2xl font-bold text-white">Evaluate Team</h2>
                        <p className="text-accent font-semibold">{team.name} ({team.teamNo})</p>
                    </div>
                    <button type="button" onClick={onClose} className="p-2 rounded-full hover:bg-white/10"><X size={24} className="text-gray-400" /></button>
                </div>
                <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
                    {criteria.map(crit => {
                        const currentMark = marks[crit.id] || 0;
                        return (
                            <div key={crit.id} className="grid grid-cols-2 items-center gap-4 p-2 rounded-lg hover:bg-white/5">
                                <div>
                                    <label className="text-gray-300 font-medium">{crit.label}</label>
                                    <p className="text-xs text-gray-500">Max: {crit.max} points</p>
                                </div>
                                <div className="flex items-center justify-end gap-3">
                                    <button 
                                        onClick={() => handleMarkChange(crit.id, currentMark - 1)}
                                        disabled={currentMark <= 0}
                                        className="p-2 rounded-full bg-black/40 border border-white/10 text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-accent hover:text-black transition-colors"
                                    >
                                        <Minus size={16} />
                                    </button>
                                    <input
                                        type="number"
                                        value={currentMark}
                                        onFocus={handleFocus}
                                        onChange={(e) => handleMarkChange(crit.id, e.target.value)}
                                        className="text-2xl font-bold w-20 h-12 text-center text-white bg-black/30 rounded-md border border-white/10 outline-none focus:ring-1 focus:ring-accent focus:border-accent [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                    />
                                    <button 
                                        onClick={() => handleMarkChange(crit.id, currentMark + 1)}
                                        disabled={currentMark >= crit.max}
                                        className="p-2 rounded-full bg-black/40 border border-white/10 text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-accent hover:text-black transition-colors"
                                    >
                                        <Plus size={16} />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
                <div className="p-4 bg-black/20 border-t border-white/10 flex justify-between items-center">
                    <div className="text-lg font-bold">
                        <span className="text-gray-400">Total: </span>
                        <span className="text-accent text-2xl">{totalMarks}</span>
                        <span className="text-gray-400"> / 100</span>
                    </div>
                    <button 
                        onClick={handleSubmit} 
                        className="flex items-center gap-2 px-6 py-2 rounded-md bg-accent text-black font-bold hover:bg-[#FF805A] transition"
                    >
                        <Save size={18}/>
                        Submit Marks
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
};


// --- #################### Main Evaluation Page Component #################### ---
const EvaluationPage = () => {
    const [view, setView] = useState('events'); // 'events' or 'teams'
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [teamToEvaluate, setTeamToEvaluate] = useState(null);
    const [submittedMarks, setSubmittedMarks] = useState({});
    const [searchQuery, setSearchQuery] = useState('');

    const handleSelectEvent = (event) => {
        setSelectedEvent(event);
        setView('teams');
    };

    const handleBackToEvents = () => {
        setSelectedEvent(null);
        setSearchQuery('');
        setView('events');
    };

    const handleOpenModal = (team) => {
        setTeamToEvaluate(team);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setTeamToEvaluate(null);
    };
    
    const handleMarksSubmit = (teamId, marks) => {
        setSubmittedMarks(prev => ({
            ...prev,
            [teamId]: marks,
        }));
    };

    const filteredTeams = useMemo(() => {
        if (!selectedEvent) return [];
        if (!searchQuery) return selectedEvent.teams;

        return selectedEvent.teams.filter(team => 
            team.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [selectedEvent, searchQuery]);

    const containerVariants = {
        hidden: { opacity: 0, x: 50 },
        visible: { opacity: 1, x: 0, transition: { staggerChildren: 0.1 } },
        exit: { opacity: 0, x: -50 }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
    };

    const EventCard = ({ event, onSelect }) => {
        return (
            <motion.div
                variants={itemVariants}
                whileHover={{ scale: 1.05 }}
                className="relative cursor-pointer p-6 bg-black/30 border border-white/10 rounded-xl overflow-hidden group backdrop-blur-sm"
                onClick={() => onSelect(event)}
            >
                <div className="absolute -top-4 -right-4 w-24 h-24 bg-accent/10 rounded-full blur-2xl group-hover:bg-accent/20 transition-colors duration-300"></div>
                <div className="relative z-10">
                    <h3 className="text-xl font-bold text-white mb-1">{event.name}</h3>
                    <p className="text-sm text-gray-400 mb-4">{event.parent}</p>
                    <div className="flex items-center justify-between pt-4 border-t border-white/10">
                        <span className="text-sm font-semibold text-white">{event.teams.length} Teams</span>
                        <ChevronRight className="text-gray-500 group-hover:text-accent transition-colors" size={20} />
                    </div>
                </div>
            </motion.div>
        );
    };


    return (
        <>
            <EvaluationModal
                team={teamToEvaluate}
                criteria={evaluationCriteria}
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                onSubmit={handleMarksSubmit}
            />
            <div className="relative w-full min-h-screen px-4 sm:px-6 lg:px-8 py-24 text-white font-body overflow-hidden">
                <div className="absolute inset-0 -z-10 h-full w-full bg-black bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:3rem_3rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)]"></div>

                <div className="relative z-10 w-full max-w-5xl mx-auto">
                    <AnimatePresence mode="wait">
                        {view === 'events' && (
                            <motion.div key="events-view" variants={containerVariants} initial="hidden" animate="visible" exit="exit">
                                <div className="text-center mb-12">
                                    <h1 className="text-4xl font-bold bg-gradient-to-r from-accent to-vibrant bg-clip-text text-transparent">Event Evaluation</h1>
                                    <p className="text-gray-400 mt-2">Select an event to begin evaluating teams.</p>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {mockSubSubEvents.map(event => (
                                        <EventCard key={event.id} event={event} onSelect={handleSelectEvent} />
                                    ))}
                                </div>
                            </motion.div>
                        )}

                        {view === 'teams' && selectedEvent && (
                            <motion.div key="teams-view" variants={containerVariants} initial="hidden" animate="visible" exit="exit">
                                <div className="mb-8">
                                    <button onClick={handleBackToEvents} className="flex items-center gap-2 text-gray-400 hover:text-accent mb-4">
                                        <ArrowLeft size={18} /> Back to Events
                                    </button>
                                    <div className="text-center">
                                        <h1 className="text-4xl font-bold bg-gradient-to-r from-accent to-vibrant bg-clip-text text-transparent">{selectedEvent.name}</h1>
                                        <p className="text-lg text-gray-400 mt-2">Teams Registered</p>
                                    </div>
                                </div>
                                
                                <div className="relative mb-6">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={20}/>
                                    <input 
                                        type="text"
                                        placeholder="Search for a team by name..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full pl-12 pr-4 py-3 rounded-lg bg-black/40 border border-white/10 focus:ring-1 focus:ring-accent focus:outline-none transition-all"
                                    />
                                </div>

                                <div className="space-y-3">
                                    {filteredTeams.map(team => (
                                         <motion.div key={team.id} layout variants={itemVariants} className="flex items-center justify-between p-4 bg-black/30 border border-white/10 rounded-lg backdrop-blur-sm">
                                            <div className="flex-1">
                                                <p className="font-bold text-lg">{team.teamNo} - {team.name}</p>
                                                <p className="text-sm text-gray-400 flex items-center gap-2"><Users size={14}/> {team.members.join(', ')}</p>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                {submittedMarks[team.id] ? (
                                                     <div className="text-right">
                                                         <p className="font-bold text-lg text-green-400">{submittedMarks[team.id].total} / 100</p>
                                                         <p className="text-xs text-green-400/70 flex items-center gap-1"><Check size={12}/>Evaluated</p>
                                                     </div>
                                                ) : null}
                                                <button onClick={() => handleOpenModal(team)} className="flex items-center gap-2 px-4 py-2 rounded-md bg-accent/80 text-black font-bold hover:bg-accent transition text-sm">
                                                    <Star size={16} /> Evaluate
                                                </button>
                                            </div>
                                        </motion.div>
                                    ))}
                                     {filteredTeams.length === 0 && (
                                        <motion.div layout variants={itemVariants} className="text-center py-10">
                                            <p className="text-gray-400">No teams found matching your search.</p>
                                        </motion.div>
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </>
    );
};

export default EvaluationPage;

