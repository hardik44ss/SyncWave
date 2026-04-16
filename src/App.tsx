import { useState, useCallback, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Home } from './pages/Home';
import { Room } from './pages/Room';
import { getSocket } from './lib/socket';

interface RoomInfo {
  roomId: string;
  isHost: boolean;
  username: string;
  userId: string;
}

function App() {
  const [roomInfo, setRoomInfo] = useState<RoomInfo | null>(null);

  useEffect(() => {
    if (roomInfo) {
      document.title = `SYNCWAVE :: ${roomInfo.roomId}`;
    } else {
      document.title = 'SYNCWAVE';
    }
  }, [roomInfo]);

  const handleRoomJoined = useCallback((roomId: string, isHost: boolean, username: string, userId: string) => {
    setRoomInfo({ roomId, isHost, username, userId });
  }, []);

  const handleLeave = useCallback(() => {
    setRoomInfo(null);
    getSocket();
  }, []);

  return (
    <AnimatePresence mode="wait">
      {!roomInfo ? (
        <motion.div
          key="home"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Home onRoomJoined={handleRoomJoined} />
        </motion.div>
      ) : (
        <motion.div
          key="room"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Room
            roomId={roomInfo.roomId}
            isHost={roomInfo.isHost}
            username={roomInfo.username}
            userId={roomInfo.userId}
            onLeave={handleLeave}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default App;
