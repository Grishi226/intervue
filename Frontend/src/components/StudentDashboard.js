import React, { useState, useEffect } from 'react';
import './StudentDashboard.css';

const StudentDashboard = ({ socket, studentName }) => {
  const [currentPoll, setCurrentPoll] = useState(null);
  const [selectedOption, setSelectedOption] = useState('');
  const [hasAnswered, setHasAnswered] = useState(false);
  const [pollResults, setPollResults] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [connectedStudents, setConnectedStudents] = useState([]);

  useEffect(() => {
    socket.on('new-poll', (poll) => {
      setCurrentPoll(poll);
      setSelectedOption('');
      setHasAnswered(false);
      setTimeLeft(poll.timeLimit);
    });

    socket.on('poll-results', (results) => {
      setPollResults(results);
    });

    socket.on('poll-ended', () => {
      setHasAnswered(true);
    });

    socket.on('time-update', (time) => {
      setTimeLeft(time);
    });

    socket.on('students-list', (students) => {
      setConnectedStudents(students);
    });

    return () => {
      socket.off('new-poll');
      socket.off('poll-results');
      socket.off('poll-ended');
      socket.off('time-update');
      socket.off('students-list');
    };
  }, [socket]);

  useEffect(() => {
    if (timeLeft <= 0 && currentPoll && !hasAnswered) {
      setHasAnswered(true);
    }
  }, [timeLeft, currentPoll, hasAnswered]);

  const submitAnswer = () => {
    if (!selectedOption || hasAnswered) return;

    socket.emit('submit-answer', {
      studentName,
      answer: selectedOption
    });
    
    setHasAnswered(true);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="student-dashboard">
      <div className="dashboard-header">
        <h1>Student Dashboard</h1>
        <div className="student-info">
          <span>Welcome, {studentName}!</span>
          <span>Students online: {connectedStudents.length}</span>
        </div>
      </div>

      <div className="dashboard-content">
        {!currentPoll ? (
          <div className="waiting-state">
            <h2>Waiting for teacher to start a poll...</h2>
            <div className="loading-animation">
              <div className="dot"></div>
              <div className="dot"></div>
              <div className="dot"></div>
            </div>
          </div>
        ) : (
          <div className="poll-section">
            {!hasAnswered ? (
              <div className="answer-section">
                <div className="poll-header">
                  <h2>{currentPoll.question}</h2>
                  <div className="timer">
                    Time left: {formatTime(timeLeft)}
                  </div>
                </div>

                <div className="options-list">
                  {currentPoll.options.map((option, index) => (
                    <div key={index} className="option-item">
                      <label className="option-label">
                        <input
                          type="radio"
                          name="pollOption"
                          value={option}
                          checked={selectedOption === option}
                          onChange={(e) => setSelectedOption(e.target.value)}
                          disabled={timeLeft <= 0}
                        />
                        <span className="option-text">{option}</span>
                      </label>
                    </div>
                  ))}
                </div>

                <button 
                  onClick={submitAnswer}
                  disabled={!selectedOption || timeLeft <= 0}
                  className="submit-btn"
                >
                  Submit Answer
                </button>
              </div>
            ) : (
              <div className="results-section">
                <h2>Poll Results</h2>
                <div className="poll-question-result">
                  <h3>{currentPoll.question}</h3>
                </div>
                
                <div className="results-display">
                  {currentPoll.options.map((option, index) => {
                    const count = pollResults[option] || 0;
                    const total = Object.values(pollResults).reduce((sum, val) => sum + val, 0);
                    const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
                    
                    return (
                      <div key={index} className="result-item">
                        <div className="option-header">
                          <span className="option-text">{option}</span>
                          <span className="vote-count">{count} votes</span>
                        </div>
                        <div className="progress-bar">
                          <div 
                            className="progress-fill" 
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                        <div className="percentage">{percentage}%</div>
                      </div>
                    );
                  })}
                </div>

                <div className="waiting-next">
                  <p>Waiting for next poll...</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentDashboard;