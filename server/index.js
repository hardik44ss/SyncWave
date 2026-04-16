const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { nanoid } = require('nanoid');

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
  pingTimeout: 60000,
  pingInterval: 25000
});

const rooms = new Map();

function generateRoomId() {
  return nanoid(6).toUpperCase();
}

app.get('/health', (_, res) => res.json({ status: 'ok' }));

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('create-room', ({ username }, callback) => {
    const roomId = generateRoomId();
    const user = { id: socket.id, username, isHost: true };
    const room = {
      id: roomId,
      host: socket.id,
      users: [user],
      state: { videoId: null, playing: false, currentTime: 0, lastUpdated: Date.now() }
    };
    rooms.set(roomId, room);
    socket.join(roomId);
    socket.data.roomId = roomId;
    socket.data.username = username;
    callback({ success: true, roomId, isHost: true, users: room.users, state: room.state });
    console.log(`Room ${roomId} created by ${username}`);
  });

  socket.on('join-room', ({ roomId, username }, callback) => {
    const room = rooms.get(roomId);
    if (!room) {
      callback({ success: false, error: 'Room not found' });
      return;
    }
    const existing = room.users.find(u => u.id === socket.id);
    if (!existing) {
      const user = { id: socket.id, username, isHost: false };
      room.users.push(user);
    }
    socket.join(roomId);
    socket.data.roomId = roomId;
    socket.data.username = username;
    const syncState = { ...room.state, serverTime: Date.now() };
    callback({ success: true, isHost: false, users: room.users, state: room.state, syncState });
    socket.to(roomId).emit('user-joined', { user: { id: socket.id, username, isHost: false }, users: room.users });
    console.log(`${username} joined room ${roomId}`);
  });

  socket.on('play', ({ roomId, currentTime }) => {
    const room = rooms.get(roomId);
    if (!room || room.host !== socket.id) return;
    const serverTime = Date.now();
    room.state = { ...room.state, playing: true, currentTime, lastUpdated: serverTime };
    io.to(roomId).emit('play', { currentTime, serverTime });
  });

  socket.on('pause', ({ roomId, currentTime }) => {
    const room = rooms.get(roomId);
    if (!room || room.host !== socket.id) return;
    const serverTime = Date.now();
    room.state = { ...room.state, playing: false, currentTime, lastUpdated: serverTime };
    io.to(roomId).emit('pause', { currentTime, serverTime });
  });

  socket.on('seek', ({ roomId, currentTime }) => {
    const room = rooms.get(roomId);
    if (!room || room.host !== socket.id) return;
    const serverTime = Date.now();
    room.state = { ...room.state, currentTime, lastUpdated: serverTime };
    io.to(roomId).emit('seek', { currentTime, serverTime });
  });

  socket.on('change-video', ({ roomId, videoId }) => {
    const room = rooms.get(roomId);
    if (!room || room.host !== socket.id) return;
    room.state = { videoId, playing: false, currentTime: 0, lastUpdated: Date.now() };
    io.to(roomId).emit('video-changed', { videoId });
  });

  socket.on('sync-request', ({ roomId }) => {
    const room = rooms.get(roomId);
    if (!room) return;
    socket.emit('sync-response', { ...room.state, serverTime: Date.now() });
  });

  socket.on('ping-server', ({ clientTime }, callback) => {
    callback({ clientTime, serverTime: Date.now() });
  });

  socket.on('disconnect', () => {
    const { roomId, username } = socket.data;
    if (!roomId) return;
    const room = rooms.get(roomId);
    if (!room) return;

    const idx = room.users.findIndex(u => u.id === socket.id);
    if (idx !== -1) room.users.splice(idx, 1);

    if (room.users.length === 0) {
      rooms.delete(roomId);
      console.log(`Room ${roomId} closed (empty)`);
      return;
    }

    if (room.host === socket.id) {
      room.host = room.users[0].id;
      room.users[0].isHost = true;
      io.to(roomId).emit('host-changed', { newHostId: room.users[0].id, users: room.users });
      console.log(`Host transferred to ${room.users[0].username} in room ${roomId}`);
    } else {
      io.to(roomId).emit('user-left', { userId: socket.id, users: room.users });
    }
    console.log(`${username} left room ${roomId}`);
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => console.log(`SyncWave server running on port ${PORT}`));
