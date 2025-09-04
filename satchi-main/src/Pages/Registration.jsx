import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Loader, AlertTriangle, BookOpen, User, Mail, Phone, Users, UserPlus, UserMinus, FileText, Briefcase } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const API_URL = 'http://127.0.0.1:8000';

function getCookie(name) {
  let cookieValue = null;
  if (document.cookie && document.cookie !== '') {
    const cookies = document.cookie.split(';');
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim();
      if (cookie.substring(0, name.length + 1) === (name + '=')) {
        cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
        break;
      }
    }
  }
  return cookieValue;
}

const RegistrationForm = ({ event }) => {

    const { user } = useAuth();

    const eventId = event?.id;
    const minTeamSize = event?.minTeamSize || 1;
    const maxTeamSize = event?.maxTeamSize || 1;
    const isFacultyMentorRequired = event?.isFacultyMentorRequired || false;

    const [formData, setFormData] = useState({
        team_name: '',
        captain_name: '',
        captain_email: '',
        captain_phone: '',
        team_members: Array(minTeamSize > 1 ? minTeamSize - 1 : 0).fill(''),
        faculty_mentor_name: '',
    });
    const [submissionStatus, setSubmissionStatus] = useState({ message: '', type: '' });

    useEffect(() => {
        if (user) {
            setFormData(prev => ({
                ...prev,
                captain_name: user.full_name || '',
                captain_email: user.email || '',
                captain_phone: user.phone || '',
            }));
        }
    }, [user]);
    
    useEffect(() => {
        setFormData(prev => ({
            ...prev,
            team_members: Array(minTeamSize > 1 ? minTeamSize - 1 : 0).fill('')
        }));
    }, [minTeamSize]);

    const handleTeamMemberChange = (index, value) => {
        const newTeamMembers = [...formData.team_members];
        newTeamMembers[index] = value;
        setFormData(prev => ({ ...prev, team_members: newTeamMembers }));
    };
    
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({...prev, [name]: value}));
    };

    const addTeamMember = () => {
        if (formData.team_members.length < maxTeamSize - 1) {
            setFormData(prev => ({ ...prev, team_members: [...prev.team_members, ''] }));
        }
    };

    const removeTeamMember = (index) => {
        if (formData.team_members.length > (minTeamSize > 1 ? minTeamSize - 1 : 0)) {
            const newTeamMembers = formData.team_members.filter((_, i) => i !== index);
            setFormData(prev => ({ ...prev, team_members: newTeamMembers }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmissionStatus({ message: 'Submitting...', type: 'info' });

        const submissionData = {
            ...formData,
            event: eventId,
            team_members: formData.team_members.filter(email => email.trim() !== '')
        };

        try {
            const csrftoken = getCookie('csrftoken');
            await axios.post(`${API_URL}/api/submit-project/`, submissionData, {
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': csrftoken,
                },
            });
            setSubmissionStatus({ message: 'Registration successful!', type: 'success' });
        } catch (error) {
            const errorMessage = error.response?.data ? JSON.stringify(error.response.data) : error.message;
            setSubmissionStatus({ message: `Submission failed: ${errorMessage}`, type: 'error' });
        }
    };

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl mx-auto">
            <form onSubmit={handleSubmit} className="bg-white/80 border border-gray-200/90 rounded-2xl p-8 backdrop-blur-lg shadow-xl space-y-6">
                
                <div>
                    <label htmlFor="team_name" className="block mb-1.5 text-sm font-semibold text-gray-600">Team Name</label>
                    <div className="relative">
                        <FileText className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input type="text" id="team_name" name="team_name" value={formData.team_name} onChange={handleInputChange} placeholder="Enter your team's creative name" required className="w-full pl-11 pr-4 py-2.5 rounded-lg bg-gray-50 border border-gray-300 text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#ff6a3c] focus:border-transparent transition" />
                    </div>
                </div>

                <fieldset className="border border-gray-200/90 rounded-lg p-4">
                    <legend className="px-2 font-semibold text-gray-700">Team Captain (You)</legend>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         <div>
                            <label htmlFor="captain_name" className="block mb-1.5 text-sm font-semibold text-gray-600">Full Name</label>
                            <div className="relative">
                                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                <input type="text" id="captain_name" name="captain_name" value={formData.captain_name} onChange={handleInputChange} required readOnly className="w-full pl-11 pr-4 py-2.5 rounded-lg bg-gray-200/70 border border-gray-300 text-gray-600 cursor-not-allowed"/>
                            </div>
                         </div>
                         <div>
                            <label htmlFor="captain_email" className="block mb-1.5 text-sm font-semibold text-gray-600">Email</label>
                            <div className="relative">
                                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                <input type="email" id="captain_email" name="captain_email" value={formData.captain_email} onChange={handleInputChange} required readOnly className="w-full pl-11 pr-4 py-2.5 rounded-lg bg-gray-200/70 border border-gray-300 text-gray-600 cursor-not-allowed"/>
                            </div>
                         </div>
                         <div className="md:col-span-2">
                            <label htmlFor="captain_phone" className="block mb-1.5 text-sm font-semibold text-gray-600">Mobile Number</label>
                            <div className="relative">
                                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                <input type="tel" id="captain_phone" name="captain_phone" value={formData.captain_phone} onChange={handleInputChange} required className="w-full pl-11 pr-4 py-2.5 rounded-lg bg-gray-50 border border-gray-300 text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#ff6a3c] focus:border-transparent transition" />
                            </div>
                         </div>
                    </div>
                </fieldset>

                {maxTeamSize > 1 && (
                    <div>
                        <label className="block mb-2 font-semibold text-gray-700">Team Members <span className="text-sm text-gray-500 font-normal">(Min: {minTeamSize}, Max: {maxTeamSize})</span></label>
                        <div className="space-y-3">
                            {formData.team_members.map((member, index) => (
                                <div key={index} className="relative">
                                    <Users className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                    <input type="email" value={member} onChange={(e) => handleTeamMemberChange(index, e.target.value)} placeholder={`Team Member ${index + 2} Email`} required={index < minTeamSize - 1} className="w-full pl-11 pr-4 py-2.5 rounded-lg bg-gray-50 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#ff6a3c] focus:border-transparent transition"/>
                                </div>
                            ))}
                        </div>
                        <div className="flex gap-4 mt-4">
                            <button type="button" onClick={addTeamMember} disabled={formData.team_members.length >= maxTeamSize - 1} className="flex items-center gap-2 px-4 py-2 text-sm rounded-md bg-orange-100/80 text-[#df9400] font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed hover:bg-orange-200/80"><UserPlus size={16}/> Add Member</button>
                            <button type="button" onClick={() => removeTeamMember(formData.team_members.length - 1)} disabled={formData.team_members.length <= (minTeamSize > 1 ? minTeamSize - 1 : 0)} className="flex items-center gap-2 px-4 py-2 text-sm rounded-md bg-red-100/80 text-red-600 font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed hover:bg-red-200/80"><UserMinus size={16}/> Remove Last</button>
                        </div>
                    </div>
                )}
                
                <div>
                    <label htmlFor="faculty_mentor_name" className="block mb-1.5 text-sm font-semibold text-gray-600">Faculty Mentor Name {isFacultyMentorRequired ? '' : '(Optional)'}</label>
                    <div className="relative">
                        <Briefcase className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input type="text" id="faculty_mentor_name" name="faculty_mentor_name" value={formData.faculty_mentor_name} onChange={handleInputChange} placeholder="Enter mentor's full name" required={isFacultyMentorRequired} className="w-full pl-11 pr-4 py-2.5 rounded-lg bg-gray-50 border border-gray-300 text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#ff6a3c] focus:border-transparent transition" />
                    </div>
                </div>
                
                <div className="text-center pt-4">
                    {submissionStatus.message && (
                        <p className={`mb-4 text-sm font-semibold rounded-lg p-2 ${submissionStatus.type === 'success' ? 'text-green-800 bg-green-100' : submissionStatus.type === 'error' ? 'text-red-800 bg-red-100' : 'text-yellow-800 bg-yellow-100'}`}>{submissionStatus.message}</p>
                    )}
                    <button type="submit" className="w-full max-w-xs mx-auto px-6 py-3 rounded-lg bg-[#ff6a3c] text-white font-bold hover:shadow-lg hover:shadow-orange-500/50 transition-shadow disabled:bg-gray-400" disabled={submissionStatus.message === 'Submitting...'}>
                        Submit Registration
                    </button>
                </div>
            </form>
        </motion.div>
    );
};

const EventRules = ({ event }) => (
    <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-10 bg-white/70 border border-gray-200/80 rounded-2xl p-6 backdrop-blur-lg shadow-xl max-w-3xl mx-auto"
    >
        <div className="flex items-center gap-3 mb-4">
            <BookOpen className="text-[#df9400]" size={24} />
            <h2 className="text-2xl font-bold text-gray-800">Rules for: <span className="text-[#ff6a3c]">{event.name}</span></h2>
        </div>
        <div className="prose prose-sm text-gray-600 whitespace-pre-wrap">
            {event.rules || "No specific rules provided for this event."}
        </div>
    </motion.div>
);

const Registration = () => {
    const { eventId } = useParams();
    const [event, setEvent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!eventId) {
            setLoading(false);
            return;
        }

        const fetchEventDetails = async () => {
            try {
                setLoading(true);
                const response = await axios.get(`${API_URL}/events/details/${eventId}/`);
                setEvent(response.data);
            } catch (err) {
                console.error("Failed to fetch event details:", err);
                setError("Could not load event details. Please try again.");
            } finally {
                setLoading(false);
            }
        };

        fetchEventDetails();
    }, [eventId]);

    return (
        <div className="relative w-full min-h-screen px-4 sm:px-6 lg:px-8 py-20 font-body text-gray-800">
            <div className="absolute inset-0 bg-gradient-to-br from-white via-amber-50 to-orange-100 z-0"></div>
            <div className="absolute top-0 left-0 w-full h-full bg-grid-gray-200/[0.4] z-0"></div>

            <div className="relative z-10 pt-16">
                 <motion.div
                    initial={{ opacity: 0, y: -50 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7 }}
                    className="text-center mb-12"
                >
                    <h1 className="text-4xl sm:text-5xl md:text-6xl font-heading font-bold bg-gradient-to-r from-[#ff6a3c] via-[#df9400] to-[#ff6a3c] bg-clip-text text-transparent">
                        Event Registration
                    </h1>
                     <p className="text-lg text-gray-600 mt-4">
                        Register your team for a chance to innovate and win.
                    </p>
                </motion.div>

                {loading && (
                    <div className="flex justify-center items-center py-10">
                        <Loader className="animate-spin text-[#ff6a3c]" size={40} />
                    </div>
                )}

                {error && (
                    <div className="max-w-3xl mx-auto bg-red-100 border border-red-400 text-red-700 text-center p-4 rounded-lg mb-8">
                        <AlertTriangle className="inline-block mr-2" />
                        {error}
                    </div>
                )}
                
                {event && <EventRules event={event} />}

                {event && <RegistrationForm event={event} />}
            </div>
        </div>
    );
};

export default Registration;

