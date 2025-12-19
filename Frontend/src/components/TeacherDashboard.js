import React, { useState, useEffect } from 'react';
import './TeacherDashboard.css';

const TeacherDashboard = ({ socket }) => {
  const [currentPoll, setCurrentPoll] = useState(null);
  const [pollResults, setPollResults] = useState({});
  const [connectedStudents, setConnectedStudents] = useState([]);
  const [newQuestion, setNewQuestion] = useState('');
  const [newOptions, setNewOptions] = useState(['', '', '', '']);
  const [timeLimit, setTimeLimit] = useState(60);
  const [canCreatePoll, setCanCreatePoll] = useState(true);

  useEffect(() => {
    socket.on('poll-results', (results) => {
      setPollResults(results);
    });

    socket.on('students-list', (students) => {
      setConnectedStudents(students);
    });

    socket.on('poll-ended', () => {
      setCanCreatePoll(true);
    });

    socket.on('all-students-answered', () => {
      setCanCreatePoll(true);
    });

    return () => {
      socket.off('poll-results');
      socket.off('students-list');
      socket.off('poll-ended');
      socket.off('all-students-answered');
    };
  }, [socket]);

  const createPoll = () => {
    if (!newQuestion.trim()) return;
    
    const options = newOptions.filter(opt => opt.trim() !== '');
    if (options.length < 2) {
      alert('Please provide at least 2 options');
      return;
    }

    const poll = {
      question: newQuestion,
      options: options,
      timeLimit: timeLimit
    };

    socket.emit('create-poll', poll);
    setCurrentPoll(poll);
    setCanCreatePoll(false);
    setPollResults({});
    
    // Reset form
    setNewQuestion('');
    setNewOptions(['', '', '', '']);
  };

  const handleOptionChange = (index, value) => {
    const updatedOptions = [...newOptions];
    updatedOptions[index] = value;
    setNewOptions(updatedOptions);
  };

  const removeStudent = (studentName) => {
    socket.emit('remove-student', studentName);
  };

  return (
    <div className="teacher-dashboard">
      <div className="dashboard-header">
        <h1>Teacher Dashboard</h1>
        <div className="students-count">
          Connected Students: {connectedStudents.length}
        </div>
      </div>

      <div className="dashboard-content">
        <div className="poll-creation-section">
          <h2>Create New Poll</h2>
          {canCreatePoll ? (
            <div className="poll-form">
              <div className="form-group">
                <label>Question:</label>
                <textarea
                  value={newQuestion}
                  onChange={(e) => setNewQuestion(e.target.value)}
                  placeholder="Enter your question here..."
                  rows="3"
                />
              </div>

              <div className="form-group">
                <label>Options:</label>
                {newOptions.map((option, index) => (
                  <input
                    key={index}
                    type="text"
                    value={option}
                    onChange={(e) => handleOptionChange(index, e.target.value)}
                    placeholder={`Option ${index + 1}`}
                    className="option-input"
                  />
                ))}
              </div>

              <div className="form-group">
                <label>Time Limit (seconds):</label>
                <input
                  type="number"
                  value={timeLimit}
                  onChange={(e) => setTimeLimit(Number(e.target.value))}
                  min="10"
                  max="300"
                />
              </div>

              <button onClick={createPoll} className="create-poll-btn">
                Create Poll
              </button>
            </div>
          ) : (
            <div className="poll-active">
              <p>Poll is currently active. Wait for all students to answer or for time to expire.</p>
            </div>
          )}
        </div>

        {currentPoll && (
          <div className="current-poll-section">
            <h2>Current Poll</h2>
            <div className="poll-question">
              <h3>{currentPoll.question}</h3>
            </div>
            
            <div className="poll-results">
              <h4>Live Results:</h4>
              {currentPoll.options.map((option, index) => {
                const count = pollResults[option] || 0;
                const percentage = connectedStudents.length > 0 
                  ? Math.round((count / connectedStudents.length) * 100) 
                  : 0;
                
                return (
                  <div key={index} className="result-item">
                    <div className="option-text">{option}</div>
                    <div className="result-bar">
                      <div 
                        className="result-fill" 
                        style={{ width: `${percentage}%` }}
                      ></div>
                      <span className="result-count">{count} votes ({percentage}%)</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="students-section">
          <h2>Connected Students</h2>
          <div className="students-list">
            {connectedStudents.length === 0 ? (
              <p>No students connected</p>
            ) : (
              connectedStudents.map((student, index) => (
                <div key={index} className="student-item">
                  <span>{student}</span>
                  <button 
                    onClick={() => removeStudent(student)}
                    className="remove-btn"
                  >
                    Remove
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherDashboard;