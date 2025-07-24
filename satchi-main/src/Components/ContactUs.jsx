import React, { useRef, useState } from "react";
import { motion } from "framer-motion";

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



const ContactUs = () => {

  const [captainName, setCaptainName] = useState('');
    const [teamMembers, setTeamMembers] = useState(['', '']); // Initially two empty fields
    const [captainPhone, setCaptainPhone] = useState('');
    const [captainEmail, setCaptainEmail] = useState('');
    const [projectTopic, setProjectTopic] = useState('');
    const [submissionStatus, setSubmissionStatus] = useState(''); // To show success/error messages
  
    // Function to handle changes in team member input fields
    const handleTeamMemberChange = (index, value) => {
      const newTeamMembers = [...teamMembers];
      newTeamMembers[index] = value;
      setTeamMembers(newTeamMembers);
    };
  
    // Function to add a new team member input field
    const addTeamMember = () => {
      setTeamMembers([...teamMembers, '']); // Add an empty string for a new input
    };
  
    // Function to remove a team member input field
    const removeTeamMember = (index) => {
      const newTeamMembers = teamMembers.filter((_, i) => i !== index);
      setTeamMembers(newTeamMembers);
    };
  
    // Function to handle form submission
    const handleSubmit = async (e) => {
      e.preventDefault(); // Prevent default form submission behavior
  
      // Basic validation
      if (!captainName || !captainPhone || !captainEmail || !projectTopic) {
        setSubmissionStatus('Please fill in all required fields.');
        return;
      }
  
      // Filter out empty team member names before submission
      const filteredTeamMembers = teamMembers.filter(member => member.trim() !== '');
  
      // Create an object with all form data
      const formData = {
        captain_name: captainName, // Match Django model field names (snake_case)
        team_members: filteredTeamMembers,
        captain_phone: captainPhone,
        captain_email: captainEmail,
        project_topic: projectTopic,
      };
  
      setSubmissionStatus('Submitting...'); // Provide feedback during submission
  
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
    <section className="relative max-w-[60%] mx-auto py-24 px-6 text-white overflow-hidden">
      {/* Title */}
      <motion.h2
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 1 }}
        viewport={{ once: true }}
        className="text-4xl sm:text-5xl font-heading font-bold mb-16 text-center bg-gradient-to-r from-accent via-vibrant to-accent bg-clip-text text-transparent animate-gradient-x"
      >
        Registration
      </motion.h2>

      <div className="w-auto">
        {/* Contact Form */}
        <motion.form
          // ref={formRef}
          onSubmit={handleSubmit}

          initial={{ opacity: 0, x: 30 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="bg-white/5 border border-white/10 rounded-xl p-8 backdrop-blur-md shadow-md"
        >
            <input
              type="text"
              id="LeaderName"
              value={captainName}
              onChange={(e) => setCaptainName(e.target.value)}
              placeholder="Enter Leader full name"
              required
              className="w-96 px-4 py-2 rounded-md bg-black/20 text-white border border-white/10 focus:outline-none mb-4 mr-0"
            />
          <div className="mb-4">
            <label className="block mb-2 font-semibold text-gray-700 text-lg
                              md:text-base">
              Team Members' Names
            </label>
            <div className="flex flex-col gap-1 mb-1">
              {teamMembers.map((member, index) => (
                <div key={index} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={member}
                    onChange={(e) => handleTeamMemberChange(index, e.target.value)}
                    placeholder={`Team Member ${index + 1}`}
                    className="w-[48%] px-4 py-2 rounded-md bg-black/20 text-white border border-white/10 focus:outline-none mb-4 mr-0"
                  />
                  {teamMembers.length > 2 && (
                    <button
                      type="button"
                      onClick={() => removeTeamMember(index)}
                      className="bg-red-600 text-white px-3 py-2 rounded-md cursor-pointer text-sm font-medium transition-all duration-200 ease-in-out flex-shrink-0
                                 hover:bg-red-700 hover:translate-y-px active:translate-y-0"
                      aria-label={`Remove team member ${index + 1}`}
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={addTeamMember}
              className="px-6 py-3 rounded-md bg-accent text-deepBlue font-semibold hover:shadow-[0_0_20px_#FFAB00] transition"
            >
              Add More Team Members
            </button>
          </div>
          <div className="flex justify-between items-center mb-4">

          <input
              type="tel"
              id="LeaderPhone"
              value={captainPhone}
              onChange={(e) => setCaptainPhone(e.target.value)}
              placeholder="Phone no :"
              required
              className="w-[48%] px-4 py-2 rounded-md bg-black/20 text-white border border-white/10 focus:outline-none mb-4 mr-0"
          />
          
          <input
              type="email"
              id="captainEmail"
              value={captainEmail}
              onChange={(e) => setCaptainEmail(e.target.value)}
              placeholder="Email"
              required
              className="w-[48%] px-4 py-2 rounded-md bg-black/20 text-white border border-white/10 focus:outline-none mb-4"
            />
          </div>
          <textarea
            id="projectTopic"
            value={projectTopic}
            onChange={(e) => setProjectTopic(e.target.value)}
            rows="4"
            placeholder="Briefly describe your project topic"
            required
            className="w-full px-4 py-2 rounded-md bg-black/20 text-white border border-white/10 focus:outline-none mb-4"
          ></textarea>
          {/* Submission Status Message */}
          {submissionStatus && (
            <div
              className={`submission-status ${
                submissionStatus.includes('successfully') ? 'success' : 'error'
              }`}
            >
              {submissionStatus}
            </div>
          )}

          <button
            type="submit"
            className="px-6 py-3 rounded-md bg-accent text-deepBlue font-semibold hover:shadow-[0_0_20px_#FFAB00] transition"
          >
            Submit
          </button>
        </motion.form>
      </div>
    </section>
  );
};

export default ContactUs;
