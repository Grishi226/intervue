import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import TeacherDashboard from './components/TeacherDashboard';
import StudentDashboard from './components/StudentDashboard';
import './App.css';

const socket = io('http://localhost:5000');

function App() {
  const [userType, setUserType] = useState('');
  const [studentName, setStudentName] = useState('');
  const [isNameSet, setIsNameSet] = useState(false);

  useEffect(() => {
    // Check if student name is already stored in this tab
    const storedName = sessionStorage.getItem('studentName');
    if (storedName) {
      setStudentName(storedName);
      setIsNameSet(true);
    }
  }, []);

  const handleNameSubmit = (name) => {
    setStudentName(name);
    sessionStorage.setItem('studentName', name);
    setIsNameSet(true);
    socket.emit('student-joined', name);
  };

  if (!userType) {
    return (
      <div className="user-selection">
        <div className="selection-container">
          <h1>Live Polling System</h1>
          <p>Please select your role</p>
          <div className="button-group">
            <button 
              className="role-btn teacher-btn"
              onClick={() => setUserType('teacher')}
            >
              Teacher
            </button>
            <button 
              className="role-btn student-btn"
              onClick={() => setUserType('student')}
            >
              Student
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (userType === 'student' && !isNameSet) {
    return (
      <div className="name-input-screen">
        <div className="name-container">
          <h2>Enter Your Name</h2>
          <form onSubmit={(e) => {
            e.preventDefault();
            const name = e.target.name.value.trim();
            if (name) {
              handleNameSubmit(name);
            }
          }}>
            <input 
              type="text" 
              name="name"
              placeholder="Your name"
              required
              className="name-input"
            />
            <button type="submit" className="submit-name-btn">
              Join Poll
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="App">
      {userType === 'teacher' ? (
        <TeacherDashboard socket={socket} />
      ) : (
        <StudentDashboard socket={socket} studentName={studentName} />
      )}
    </div>
  );
}

export default App;