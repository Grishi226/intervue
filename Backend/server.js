const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const path = require('path');

const app = express();
const server = http.createServer(app);

// Allowed origins (local + Render frontend if needed)
const allowedOrigins = [
  'http://localhost:3000',
  process.env.CLIENT_URL
];

// Express middleware
app.use(cors({
  origin: allowedOrigins,
  methods: ['GET', 'POST']
}));
app.use(express.json());

// Socket.IO setup
const io = socketIo(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST']
  }
});

// --------------------
// Poll App Logic
// --------------------
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

    poll.options.forEach(option => {
      pollResults[option] = 0;
    });

    io.emit('new-poll', poll);
    io.emit('poll-results', pollResults);

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

      const totalAnswers = Object.values(pollResults)
        .reduce((sum, count) => sum + count, 0);

      if (totalAnswers >= connectedStudents.length) {
        clearInterval(pollTimer);
        io.emit('all-students-answered');
        io.emit('poll-ended');
        currentPoll = null;
      }
    }
  });

  socket.on('remove-student', (studentName) => {
    connectedStudents = connectedStudents.filter(
      name => name !== studentName
    );
    io.emit('students-list', connectedStudents);
    console.log(`Student removed: ${studentName}`);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// --------------------
// Serve Frontend (Vite / React build)
// --------------------
app.use(
  express.static(
    path.join(__dirname, '../frontEnd/dist')
  )
);

app.get('*', (req, res) => {
  res.sendFile(
    path.join(__dirname, '../frontEnd/dist/index.html')
  );
});

// --------------------
// Start Server
// --------------------
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
