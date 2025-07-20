import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function RoomJoin() {
  const [room, setRoom] = useState('');
  const navigate = useNavigate();

  const handleJoin = () => {
    if (room.trim()) {
      navigate(`/whiteboard/${room}`);
    }
  };

  return (
    <div style={{ textAlign: 'center', marginTop: '20%' }}>
      <h2>Enter Room Code</h2>
      <input
        type="text"
        value={room}
        onChange={(e) => setRoom(e.target.value)}
        placeholder="Room123"
        style={{ padding: '5px', marginRight: '10px' }}
      />
      <button onClick={handleJoin}>Join Room</button>
    </div>
  );
}

export default RoomJoin;
