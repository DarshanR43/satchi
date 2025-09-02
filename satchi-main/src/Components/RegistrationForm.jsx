import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { User } from 'lucide-react';

// ... (getCookie function remains the same)

const RegistrationForm = ({ eventId, minTeamSize = 1, maxTeamSize = 10, isFacultyMentorRequired }) => {
    // Set initial team members based on minTeamSize
    const initialMembers = Array(minTeamSize).fill('');
    
    const [captainName, setCaptainName] = useState('');
    const [teamMembers, setTeamMembers] = useState(initialMembers);
    const [captainPhone, setCaptainPhone] = useState('');
    const [captainEmail, setCaptainEmail] = useState('');
    const [projectTopic, setProjectTopic] = useState('');
    const [facultyMentorName, setFacultyMentorName] = useState(''); // New state for faculty mentor
    const [submissionStatus, setSubmissionStatus] = useState('');

    // Reset form if the event context changes
    useEffect(() => {
        setTeamMembers(Array(minTeamSize).fill(''));
    }, [minTeamSize]);

    const handleTeamMemberChange = (index, value) => {
        const newTeamMembers = [...teamMembers];
        newTeamMembers[index] = value;
        setTeamMembers(newTeamMembers);
    };

    const addTeamMember = () => {
        // Only add if not exceeding max team size
        if (teamMembers.length < maxTeamSize) {
            setTeamMembers([...teamMembers, '']);
        }
    };

    const removeTeamMember = (index) => {
        // Only remove if not going below min team size
        if (teamMembers.length > minTeamSize) {
            const newTeamMembers = teamMembers.filter((_, i) => i !== index);
            setTeamMembers(newTeamMembers);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        // ... (Basic validation remains the same)
        const formData = {
            event: eventId, // Include the event ID
            captain_name: captainName,
            team_members: teamMembers.filter(member => member.trim() !== ''),
            captain_phone: captainPhone,
            captain_email: captainEmail,
            project_topic: projectTopic,
            faculty_mentor_name: facultyMentorName, // Include faculty mentor
        };

        setSubmissionStatus('Submitting...');
        try {
          const csrftoken = getCookie('csrftoken'); // Get CSRF token from cookies
    
          const response = await fetch('http://127.0.0.1:8000/api/submit-project/', { // FULL URL to Django API
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-CSRFToken': csrftoken, // Include CSRF token in headers
            },
            body: JSON.stringify(formData),
          });
    
          if (!response.ok) {
            const errorData = await response.json(); // Get error details from Django
            throw new Error(`HTTP error! Status: ${response.status}. Details: ${JSON.stringify(errorData)}`);
          }
    
          const data = await response.json(); // Parse the JSON response from Django
          console.log('Submission successful:', data);
          setSubmissionStatus('Project submitted successfully!');
    
          // Optionally clear the form after successful submission
          setCaptainName('');
          setTeamMembers(['', '']);
          setCaptainPhone('');
          setCaptainEmail('');
          setProjectTopic('');
        } catch (error) {
          console.error('Submission error:', error);
          setSubmissionStatus(`Submission failed: ${error.message}`);
      }

    };

    return (
        <section className="relative max-w-3xl mx-auto py-12 px-6 text-white">
            <motion.h2 /* ... */ >
                {eventId ? "Event Registration" : "General Registration"}
            </motion.h2>

            <div className="w-full">
                <motion.form onSubmit={handleSubmit} /* ... */ >
                    {/* ... (captain name input) */}
                    
                    <div className="mb-4">
                        <label className="block mb-2 font-semibold">Team Members ({minTeamSize} to {maxTeamSize} allowed)</label>
                        {/* ... (team member mapping logic) */}
                        <div className="flex gap-4 mt-2">
                            <button
                                type="button"
                                onClick={addTeamMember}
                                disabled={teamMembers.length >= maxTeamSize}
                                className="px-4 py-2 rounded-md bg-accent text-deepBlue font-semibold transition disabled:bg-gray-500 disabled:cursor-not-allowed"
                            >
                                Add Member
                            </button>
                            <button
                                type="button"
                                onClick={() => removeTeamMember(teamMembers.length - 1)}
                                disabled={teamMembers.length <= minTeamSize}
                                className="px-4 py-2 rounded-md bg-red-600 text-white font-semibold transition disabled:bg-gray-500 disabled:cursor-not-allowed"
                            >
                                Remove Last
                            </button>
                        </div>
                    </div>

                    {/* --- NEW FACULTY MENTOR FIELD --- */}
                    <div className="mb-4">
                        <label htmlFor="facultyMentor" className="block mb-2 font-semibold">
                            Faculty Mentor Name (Optional)
                        </label>
                        <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                            <input
                                type="text"
                                id="facultyMentor"
                                value={facultyMentorName}
                                onChange={(e) => setFacultyMentorName(e.target.value)}
                                placeholder="Enter mentor's full name"
                                className="w-full pl-10 pr-4 py-2 rounded-md bg-darkBg/20 text-white border border-white/10 focus:outline-none"
                            />
                        </div>
                        {isFacultyMentorRequired && <p className="text-xs text-yellow-400 mt-1">Note: A faculty mentor is recommended for this event.</p>}
                    </div>

                    {/* ... (rest of the form fields and submit button) */}
                </motion.form>
            </div>
        </section>
    );
};

export default RegistrationForm;
