const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());

let connectedStudents = [];
let currentPoll = null;
let pollResults = {};
let pollTimer = null;

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('student-joined', (studentName) => {
    if (!connectedStudents.includes(studentName)) {
      connectedStudents.push(studentName);
      io.emit('students-list', connectedStudents);
      console.log(`Student joined: ${studentName}`);
    }
  });

  socket.on('create-poll', (poll) => {
    currentPoll = poll;
    pollResults = {};
    
    // Initialize results for each option
    poll.options.forEach(option => {
      pollResults[option] = 0;
    });

    io.emit('new-poll', poll);
    io.emit('poll-results', pollResults);
    
    // Start timer
    let timeLeft = poll.timeLimit;
    pollTimer = setInterval(() => {
      timeLeft--;
      io.emit('time-update', timeLeft);
      
      if (timeLeft <= 0) {
        clearInterval(pollTimer);
        io.emit('poll-ended');
        currentPoll = null;
      }
    }, 1000);

    console.log('New poll created:', poll.question);
  });

  socket.on('submit-answer', (data) => {
    if (currentPoll && pollResults.hasOwnProperty(data.answer)) {
      pollResults[data.answer]++;
      io.emit('poll-results', pollResults);
      
      // Check if all students have answered
      const totalAnswers = Object.values(pollResults).reduce((sum, count) => sum + count, 0);
      if (totalAnswers >= connectedStudents.length) {
        clearInterval(pollTimer);
        io.emit('all-students-answered');
        io.emit('poll-ended');
        currentPoll = null;
      }
    }
  });

  socket.on('remove-student', (studentName) => {
    connectedStudents = connectedStudents.filter(name => name !== studentName);
    io.emit('students-list', connectedStudents);
    console.log(`Student removed: ${studentName}`);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});