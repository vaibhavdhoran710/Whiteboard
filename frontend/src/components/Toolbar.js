import React from 'react';
import './Toolbar.css';

function Toolbar({ color, setColor, width, setWidth, onClear }) {
  return (
    <div className="toolbar">
      <label>Color:</label>
      <select value={color} onChange={(e) => setColor(e.target.value)}>
        <option value="black">Black</option>
        <option value="red">Red</option>
        <option value="blue">Blue</option>
        <option value="green">Green</option>
      </select>

      <label>Stroke:</label>
      <input
        type="range"
        min="1"
        max="10"
        value={width}
        onChange={(e) => setWidth(parseInt(e.target.value))}
      />

      <button onClick={onClear}>Clear Canvas</button>
    </div>
  );
}

export default Toolbar;
