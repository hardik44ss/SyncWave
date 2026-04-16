import { motion } from 'framer-motion';
import { User } from '../types';
import { Monitor, Crown } from 'lucide-react';

interface ConnectedDevicesProps {
  users: User[];
  currentUserId: string;
}

export function ConnectedDevices({ users, currentUserId }: ConnectedDevicesProps) {
  return (
    <div className="space-y-3">
      <h3 className="text-xs font-mono tracking-[0.3em] text-[#004400] uppercase">
        Connected Nodes [{users.length}]
      </h3>
      <div className="flex flex-wrap gap-3">
        {users.map((user, i) => {
          const isMe = user.id === currentUserId;
          return (
            <motion.div
              key={user.id}
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
              transition={{ delay: i * 0.05 }}
              className="relative flex flex-col items-center gap-1"
            >
              <motion.div
                className="relative w-12 h-12 rounded-full flex items-center justify-center border"
                style={{
                  borderColor: user.isHost ? '#00ff41' : '#003300',
                  background: 'black',
                  boxShadow: user.isHost
                    ? '0 0 15px #00ff41, 0 0 30px #00ff4140'
                    : isMe
                    ? '0 0 10px #00aa44'
                    : '0 0 5px #001a00',
                }}
                animate={
                  user.isHost
                    ? { boxShadow: ['0 0 15px #00ff41, 0 0 30px #00ff4140', '0 0 25px #00ff41, 0 0 50px #00ff4160', '0 0 15px #00ff41, 0 0 30px #00ff4140'] }
                    : {}
                }
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              >
                <Monitor size={20} className={user.isHost ? 'text-[#00ff41]' : 'text-[#005500]'} />
                {user.isHost && (
                  <motion.div
                    className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-black flex items-center justify-center border border-[#00ff41]"
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <Crown size={10} className="text-[#00ff41]" />
                  </motion.div>
                )}
                {isMe && (
                  <motion.div
                    className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-[#00ff41]"
                    animate={{ opacity: [1, 0, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  />
                )}
              </motion.div>
              <span className="text-[10px] font-mono text-[#00aa44] max-w-[60px] truncate text-center">
                {isMe ? `${user.username}*` : user.username}
              </span>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
