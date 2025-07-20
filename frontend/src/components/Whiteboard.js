import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import io from 'socket.io-client';
import Toolbar from './Toolbar';
import UserCursors from './UserCursors';
import './Whiteboard.css';

const socket = io('http://localhost:5000');

function Whiteboard() {
  const { roomId } = useParams();
  const canvasRef = useRef(null);
  const ctxRef = useRef(null);
  const lastPos = useRef({ x: 0, y: 0 });
  const [isDrawing, setIsDrawing] = useState(false);
  const [strokeColor, setStrokeColor] = useState('black');
  const [strokeWidth, setStrokeWidth] = useState(2);
  const [userCursors, setUserCursors] = useState({});

  const drawLine = useCallback((x0, y0, x1, y1, color, width) => {
    const ctx = ctxRef.current;
    if (!ctx) return;
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.stroke();
    ctx.closePath();
  }, []);

  const clearCanvas = useCallback((emit = true) => {
    const canvas = canvasRef.current;
    if (!canvas || !ctxRef.current) return;
    ctxRef.current.clearRect(0, 0, canvas.width, canvas.height);
    if (emit) socket.emit('clear-canvas', roomId);
  }, [roomId]);

  const resizeCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const image = ctxRef.current.getImageData(0, 0, canvas.width, canvas.height);
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    ctxRef.current.putImageData(image, 0, 0);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const ctx = canvas.getContext('2d');
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctxRef.current = ctx;

    socket.emit('join-room', { roomId, userId: socket.id });
    socket.emit('request-initial-data', roomId);

    socket.on('draw-move', ({ stroke }) => {
      const { x0, y0, x1, y1, color, width } = stroke;
      drawLine(x0, y0, x1, y1, color, width);
    });

    socket.on('clear-canvas', () => {
      clearCanvas(false);
    });

    socket.on('cursor-move', ({ id, x, y }) => {
      setUserCursors((prev) => ({
        ...prev,
        [id]: { x, y, timestamp: Date.now() },
      }));
    });

    socket.on('load-drawing', (drawingData) => {
      clearCanvas(false);
      drawingData.forEach((command) => {
        if (command.type === 'stroke') {
          const { x0, y0, x1, y1, color, width } = command.data;
          drawLine(x0, y0, x1, y1, color, width);
        } else if (command.type === 'clear') {
          clearCanvas(false);
        }
      });
    });

    const interval = setInterval(() => {
      const now = Date.now();
      setUserCursors((prev) =>
        Object.fromEntries(
          Object.entries(prev).filter(([_, v]) => now - v.timestamp < 3000)
        )
      );
    }, 3000);

    window.addEventListener('resize', resizeCanvas);

    return () => {
      clearInterval(interval);
      window.removeEventListener('resize', resizeCanvas);
      socket.off('draw-move');
      socket.off('clear-canvas');
      socket.off('cursor-move');
      socket.off('load-drawing');
      socket.emit('leave-room', { roomId, userId: socket.id });
    };
  }, [roomId, drawLine, clearCanvas]);

  const startDrawing = ({ nativeEvent }) => {
    const { offsetX, offsetY } = nativeEvent;
    setIsDrawing(true);
    lastPos.current = { x: offsetX, y: offsetY };
  };

  const finishDrawing = () => {
    setIsDrawing(false);
  };

  const draw = ({ nativeEvent }) => {
    if (!isDrawing) return;
    const { offsetX, offsetY } = nativeEvent;
    const { x: lastX, y: lastY } = lastPos.current;

    drawLine(lastX, lastY, offsetX, offsetY, strokeColor, strokeWidth);

    socket.emit('draw-move', {
      roomId,
      stroke: {
        x0: lastX,
        y0: lastY,
        x1: offsetX,
        y1: offsetY,
        color: strokeColor,
        width: strokeWidth,
      },
    });

    lastPos.current = { x: offsetX, y: offsetY };
  };

  const handleMouseMove = (e) => {
    socket.emit('cursor-move', {
      roomId,
      id: socket.id,
      x: e.clientX,
      y: e.clientY,
    });
  };

  return (
    <>
      <Toolbar
        color={strokeColor}
        setColor={setStrokeColor}
        width={strokeWidth}
        setWidth={setStrokeWidth}
        onClear={() => clearCanvas(true)}
      />
      <canvas
        ref={canvasRef}
        onMouseDown={startDrawing}
        onMouseUp={finishDrawing}
        onMouseLeave={finishDrawing}
        onMouseMove={(e) => {
          draw(e);
          handleMouseMove(e);
        }}
        className="whiteboard-canvas"
      />
      <UserCursors cursors={userCursors} />
    </>
  );
}

export default Whiteboard;
