import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ArrowLeft, X, Users, Star, Plus, Minus, Check, Save, Search, Home } from 'lucide-react';

// --- Mock Data (Restructured with 3 Levels) ---
const mockMainEvents = [
    {
        id: 1000,
        name: 'Anokha 2025',
        subEvents: [
            {
                id: 1010,
                name: 'Tech Fest Events',
                parent: 'Anokha 2025',
                competitions: [
                    { id: 1011, name: 'Tech Fair', teams: [
                        { id: 1, teamNo: 'TF001', name: 'Circuit Breakers', members: ['Alice', 'Bob', 'Charlie'] },
                        { id: 2, teamNo: 'TF002', name: 'Code Wizards', members: ['David', 'Eve', 'Frank'] },
                    ]},
                    { id: 1012, name: 'RoboWars', teams: [
                        { id: 4, teamNo: 'RW001', name: 'Metal Crushers', members: ['Judy', 'Mallory', 'Oscar'] },
                        { id: 5, teamNo: 'RW002', name: 'The Terminators', members: ['Peggy', 'Sybil', 'Trent'] },
                    ]},
                ]
            },
            { id: 1020, name: 'Cultural Fest', parent: 'Anokha 2025', competitions: [] }
        ]
    },
    {
        id: 2000,
        name: 'Amritotsavam 2025',
        subEvents: [
            {
                id: 2010,
                name: 'Performing Arts',
                parent: 'Amritotsavam 2025',
                competitions: [
                    { id: 2011, name: 'Dance Competition', teams: [
                        { id: 6, teamNo: 'DC001', name: 'Rhythmic Rebels', members: ['Walter', 'Victor', 'Wendy'] },
                    ]}
                ]
            }
        ]
    }
];

const evaluationCriteria = [
    { id: 'creativity', label: 'Creativity & Originality', max: 20 },
    { id: 'technical', label: 'Technical Skill & Complexity', max: 30 },
    { id: 'presentation', label: 'Presentation & Demo', max: 25 },
    { id: 'completion', label: 'Project Completion & Functionality', max: 25 },
];

// --- Modal Component (Unchanged) ---
const EvaluationModal = ({ team, criteria, isOpen, onClose, onSubmit }) => {
    // ... (Modal code is identical to the previous version and omitted for brevity)
};


// --- UI Helper Components ---
const Breadcrumbs = ({ mainEvent, subEvent, competition, setMain, setSub, setComp }) => (
    <div className="mb-8 flex items-center gap-2 text-sm text-gray-500 font-semibold">
        <button onClick={() => { setMain(null); setSub(null); setComp(null); }} className="flex items-center gap-2 hover:text-[#ff6a3c]"><Home size={16}/> All Events</button>
        {mainEvent && <ChevronRight size={16} />}
        {mainEvent && <button onClick={() => { setSub(null); setComp(null); }} className="hover:text-[#ff6a3c]">{mainEvent.name}</button>}
        {subEvent && <ChevronRight size={16} />}
        {subEvent && <button onClick={() => setComp(null)} className="hover:text-[#ff6a3c]">{subEvent.name}</button>}
        {competition && <ChevronRight size={16} />}
        {competition && <span className="text-gray-800">{competition.name}</span>}
    </div>
);

const SelectionCard = ({ item, childName, onSelect }) => {
    const childCount = item.subEvents?.length ?? item.competitions?.length ?? item.teams?.length;
    return (
        <motion.div
            variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
            whileHover={{ y: -5, boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)' }}
            className="cursor-pointer p-6 bg-white/80 border border-gray-200/90 rounded-2xl shadow-xl group backdrop-blur-lg transition-all duration-300"
            onClick={() => onSelect(item)}
        >
            <h3 className="text-xl font-bold text-gray-800 mb-4">{item.name}</h3>
            <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <span className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <Users size={16}/>{childCount} {childName}
                </span>
                <ChevronRight className="text-gray-400 group-hover:text-[#ff6a3c] transition-colors" size={20} />
            </div>
        </motion.div>
    );
};


// --- Main Evaluation Page Component ---
const EvaluationPage = () => {
    const [selectedMainEvent, setSelectedMainEvent] = useState(null);
    const [selectedSubEvent, setSelectedSubEvent] = useState(null);
    const [selectedCompetition, setSelectedCompetition] = useState(null);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [teamToEvaluate, setTeamToEvaluate] = useState(null);
    const [submittedMarks, setSubmittedMarks] = useState({});
    const [searchQuery, setSearchQuery] = useState('');

    const handleOpenModal = (team) => { setTeamToEvaluate(team); setIsModalOpen(true); };
    const handleCloseModal = () => { setIsModalOpen(false); setTeamToEvaluate(null); };
    const handleMarksSubmit = (teamId, marks) => { setSubmittedMarks(prev => ({...prev, [teamId]: marks})); };

    const filteredTeams = useMemo(() => {
        if (!selectedCompetition) return [];
        if (!searchQuery) return selectedCompetition.teams;
        return selectedCompetition.teams.filter(team => team.name.toLowerCase().includes(searchQuery.toLowerCase()));
    }, [selectedCompetition, searchQuery]);

    const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.07 } } };
    const itemVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };

    const getCurrentView = () => {
        if (selectedCompetition) return 'teams';
        if (selectedSubEvent) return 'competitions';
        if (selectedMainEvent) return 'subEvents';
        return 'mainEvents';
    };

    const renderContent = () => {
        switch (getCurrentView()) {
            case 'mainEvents':
                return (
                    <motion.div key="mainEvents" variants={containerVariants} initial="hidden" animate="visible" exit={{ opacity: 0 }}>
                        <div className="text-center mb-12"><h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-[#ff6a3c] to-[#df9400] bg-clip-text text-transparent">Event Evaluation</h1><p className="text-gray-600 mt-3 text-lg">Select a main event to begin.</p></div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {mockMainEvents.map(event => <SelectionCard key={event.id} item={event} childName="Sub-Events" onSelect={setSelectedMainEvent} />)}
                        </div>
                    </motion.div>
                );
            case 'subEvents':
                return (
                    <motion.div key="subEvents" variants={containerVariants} initial="hidden" animate="visible" exit={{ opacity: 0 }}>
                         <div className="text-center mb-12"><h1 className="text-4xl font-bold text-gray-800">{selectedMainEvent.name}</h1><p className="text-gray-600 mt-3 text-lg">Select a sub-event.</p></div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {selectedMainEvent.subEvents.map(event => <SelectionCard key={event.id} item={event} childName="Competitions" onSelect={setSelectedSubEvent} />)}
                        </div>
                    </motion.div>
                );
            case 'competitions':
                return (
                     <motion.div key="competitions" variants={containerVariants} initial="hidden" animate="visible" exit={{ opacity: 0 }}>
                         <div className="text-center mb-12"><h1 className="text-4xl font-bold text-gray-800">{selectedSubEvent.name}</h1><p className="text-gray-600 mt-3 text-lg">Select a competition to evaluate.</p></div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {selectedSubEvent.competitions.map(comp => <SelectionCard key={comp.id} item={comp} childName="Teams" onSelect={setSelectedCompetition} />)}
                        </div>
                    </motion.div>
                );
            case 'teams':
                return (
                    <motion.div key="teams" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <div className="text-center mb-8"><h1 className="text-4xl font-bold bg-gradient-to-r from-[#ff6a3c] to-[#df9400] bg-clip-text text-transparent">{selectedCompetition.name}</h1><p className="text-lg text-gray-600 mt-2">Teams Registered</p></div>
                        <div className="relative mb-6 max-w-lg mx-auto">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20}/>
                            <input type="text" placeholder="Search for a team..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-12 pr-4 py-3 rounded-lg bg-gray-50 border border-gray-300 focus:ring-2 focus:ring-[#ff6a3c] focus:outline-none transition-all" />
                        </div>
                        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-3">
                            {filteredTeams.map(team => (
                                 <motion.div key={team.id} variants={itemVariants} className="flex items-center justify-between p-4 bg-white/80 border border-gray-200/90 rounded-xl shadow-lg backdrop-blur-lg">
                                    <div className="flex-1">
                                        <p className="font-bold text-lg text-gray-800">{team.teamNo} - {team.name}</p>
                                        <p className="text-sm text-gray-500 flex items-center gap-2"><Users size={14}/> {team.members.join(', ')}</p>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        {submittedMarks[team.id] && <div className="text-right"><p className="font-bold text-lg text-green-600">{submittedMarks[team.id].total}/100</p><p className="text-xs text-green-500 flex items-center justify-end gap-1"><Check size={12}/>Evaluated</p></div>}
                                        <button onClick={() => handleOpenModal(team)} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#ff6a3c] text-white font-bold hover:shadow-lg hover:shadow-orange-500/50 transition-all text-sm">
                                            <Star size={16} /> {submittedMarks[team.id] ? 'Re-evaluate' : 'Evaluate'}
                                        </button>
                                    </div>
                                </motion.div>
                            ))}
                            {filteredTeams.length === 0 && <motion.div variants={itemVariants} className="text-center py-10"><p className="text-gray-500">No teams found.</p></motion.div>}
                        </motion.div>
                    </motion.div>
                );
            default:
                return null;
        }
    }

    return (
        <>
            <EvaluationModal team={teamToEvaluate} criteria={evaluationCriteria} isOpen={isModalOpen} onClose={handleCloseModal} onSubmit={handleMarksSubmit}/>
            <div className="relative w-full min-h-screen px-4 sm:px-6 lg:px-8 py-24 text-gray-800 font-body">
                <div className="absolute inset-0 bg-gradient-to-br from-white via-amber-50 to-orange-100 z-0"></div>
                <div className="absolute top-0 left-0 w-full h-full bg-grid-gray-200/[0.4] z-0"></div>
                
                <div className="relative z-10 w-full max-w-5xl mx-auto">
                    <Breadcrumbs 
                        mainEvent={selectedMainEvent} 
                        subEvent={selectedSubEvent} 
                        competition={selectedCompetition}
                        setMain={setSelectedMainEvent}
                        setSub={setSelectedSubEvent}
                        setComp={setSelectedCompetition}
                    />
                    <AnimatePresence mode="wait">
                        {renderContent()}
                    </AnimatePresence>
                </div>
            </div>
        </>
    );
};

export default EvaluationPage;