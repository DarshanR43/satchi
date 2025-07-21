// src/App.jsx
import React, { useState } from 'react';
import './App.css'; // Ensure path is correct

// Helper function to get CSRF token from cookies
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

// Main App component for the project submission form
const App = () => {
  // State variables to hold form data
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
  const handleSubmit = async (e) => { // Made async to use await
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
    <div className="container">
      <h1>Project Submission</h1>

      <form onSubmit={handleSubmit}>
        {/* Team Captain Name */}
        <div className="form-group">
          <label htmlFor="captainName">Team Captain's Name <span>*</span></label>
          <input
            type="text"
            id="captainName"
            value={captainName}
            onChange={(e) => setCaptainName(e.target.value)}
            placeholder="Enter captain's full name"
            required
          />
        </div>

        {/* Team Members */}
        <div className="form-group">
          <label>Team Members' Names</label>
          <div className="team-members-list">
            {teamMembers.map((member, index) => (
              <div key={index} className="team-member-input">
                <input
                  type="text"
                  value={member}
                  onChange={(e) => handleTeamMemberChange(index, e.target.value)}
                  placeholder={`Team Member ${index + 1}`}
                />
                {teamMembers.length > 2 && (
                  <button
                    type="button"
                    onClick={() => removeTeamMember(index)}
                    className="remove-button"
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
            className="add-member-button"
          >
            Add More Team Members
          </button>
        </div>

        {/* Team Captain Phone Number */}
        <div className="form-group">
          <label htmlFor="captainPhone">Team Captain's Phone Number <span>*</span></label>
          <input
            type="tel"
            id="captainPhone"
            value={captainPhone}
            onChange={(e) => setCaptainPhone(e.target.value)}
            placeholder="e.g., +1234567890"
            required
          />
        </div>

        {/* Team Captain Email */}
        <div className="form-group">
          <label htmlFor="captainEmail">Team Captain's Email <span>*</span></label>
          <input
            type="email"
            id="captainEmail"
            value={captainEmail}
            onChange={(e) => setCaptainEmail(e.target.value)}
            placeholder="e.g., captain@example.com"
            required
          />
        </div>

        {/* Project Topic */}
        <div className="form-group">
          <label htmlFor="projectTopic">Project Topic <span>*</span></label>
          <textarea
            id="projectTopic"
            value={projectTopic}
            onChange={(e) => setProjectTopic(e.target.value)}
            rows="4"
            placeholder="Briefly describe your project topic"
            required
          ></textarea>
        </div>

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

        {/* Submit Button */}
        <button type="submit" className="submit-button">
          Submit Project
        </button>
      </form>
    </div>
  );
};

export default App;
