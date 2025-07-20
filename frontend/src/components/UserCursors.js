import React from 'react';
import './UserCursors.css';

function UserCursors({ cursors }) {
  return (
    <>
      {Object.entries(cursors).map(([id, pos]) => (
        <div
          key={id}
          className="cursor-dot"
          style={{ left: pos.x + 'px', top: pos.y + 'px' }}
        ></div>
      ))}
    </>
  );
}

export default UserCursors;
