import React, { useRef, useState, useEffect } from 'react';
import { Minus, Circle as CircleIcon, Compass, Edit2, RotateCcw, Trash2, Palette } from 'lucide-react';

export default function CanvasOverlay({ width, height }) {
  const canvasRef = useRef(null);

  const [isOpen, setIsOpen] = useState(false); // Collapsible drawer/toolbar
  const [tool, setTool] = useState('line'); // 'line' | 'circle' | 'angle' | 'free'
  const [color, setColor] = useState('#ef4444');
  const [lineWidth, setLineWidth] = useState(3);
  const [shapes, setShapes] = useState([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentShape, setCurrentShape] = useState(null);
  const [anglePoints, setAnglePoints] = useState([]);

  const colors = ['#ef4444', '#eab308', '#22c55e', '#06b6d4', '#ffffff'];

  const getCanvasCoords = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: (clientX - rect.left) * (canvas.width / rect.width),
      y: (clientY - rect.top) * (canvas.height / rect.height),
    };
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const allShapes = [...shapes];
    if (currentShape) allShapes.push(currentShape);

    allShapes.forEach((shape) => drawShape(ctx, shape));

    if (tool === 'angle' && anglePoints.length > 0) {
      anglePoints.forEach((pt, index) => {
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 5, 0, Math.PI * 2);
        ctx.fill();
      });
    }
  }, [shapes, currentShape, anglePoints, color, width, height, tool]);

  const drawShape = (ctx, shape) => {
    ctx.strokeStyle = shape.color;
    ctx.fillStyle = shape.color;
    ctx.lineWidth = shape.lineWidth;
    ctx.lineCap = 'round';

    if (shape.type === 'line') {
      ctx.beginPath();
      ctx.moveTo(shape.start.x, shape.start.y);
      ctx.lineTo(shape.end.x, shape.end.y);
      ctx.stroke();
    } else if (shape.type === 'circle') {
      const radius = Math.hypot(shape.end.x - shape.start.x, shape.end.y - shape.start.y);
      ctx.beginPath();
      ctx.arc(shape.start.x, shape.start.y, radius, 0, Math.PI * 2);
      ctx.stroke();
    } else if (shape.type === 'free') {
      if (shape.points.length < 2) return;
      ctx.beginPath();
      ctx.moveTo(shape.points[0].x, shape.points[0].y);
      for (let i = 1; i < shape.points.length; i++) {
        ctx.lineTo(shape.points[i].x, shape.points[i].y);
      }
      ctx.stroke();
    } else if (shape.type === 'angle') {
      const { vertex, p1, p2, degrees } = shape;
      ctx.beginPath(); ctx.moveTo(vertex.x, vertex.y); ctx.lineTo(p1.x, p1.y); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(vertex.x, vertex.y); ctx.lineTo(p2.x, p2.y); ctx.stroke();
      const text = `${degrees.toFixed(1)}°`;
      ctx.font = 'bold 12px sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.fillText(text, vertex.x + 10, vertex.y - 10);
    }
  };

  const handlePointerDown = (e) => {
    const pt = getCanvasCoords(e);
    if (tool === 'angle') {
      const newPts = [...anglePoints, pt];
      setAnglePoints(newPts);
      if (newPts.length === 3) {
        const vertex = newPts[0], p1 = newPts[1], p2 = newPts[2];
        const ang1 = Math.atan2(p1.y - vertex.y, p1.x - vertex.x);
        const ang2 = Math.atan2(p2.y - vertex.y, p2.x - vertex.x);
        let degrees = (Math.abs(ang2 - ang1) * 180) / Math.PI;
        if (degrees > 180) degrees = 360 - degrees;
        setShapes((prev) => [...prev, { type: 'angle', vertex, p1, p2, degrees, color, lineWidth }]);
        setAnglePoints([]);
      }
      return;
    }
    setIsDrawing(true);
    if (tool === 'line' || tool === 'circle') setCurrentShape({ type: tool, start: pt, end: pt, color, lineWidth });
    else if (tool === 'free') setCurrentShape({ type: 'free', points: [pt], color, lineWidth });
  };

  const handlePointerMove = (e) => {
    if (!isDrawing || !currentShape) return;
    const pt = getCanvasCoords(e);
    if (tool === 'line' || tool === 'circle') setCurrentShape((prev) => ({ ...prev, end: pt }));
    else if (tool === 'free') setCurrentShape((prev) => ({ ...prev, points: [...prev.points, pt] }));
  };

  const handlePointerUp = () => {
    if (isDrawing && currentShape) {
      setShapes((prev) => [...prev, currentShape]);
      setCurrentShape(null);
    }
    setIsDrawing(false);
  };

  return (
    <div className="absolute inset-0 pointer-events-none z-20">
      <canvas
        ref={canvasRef}
        width={width || 640}
        height={height || 480}
        onMouseDown={handlePointerDown}
        onMouseMove={handlePointerMove}
        onMouseUp={handlePointerUp}
        onTouchStart={handlePointerDown}
        onTouchMove={handlePointerMove}
        onTouchEnd={handlePointerUp}
        className="absolute inset-0 w-full h-full pointer-events-auto cursor-crosshair touch-none"
      />

      {/* Floating Discrete Toggle Button for Drawing Toolbar */}
      <div className="absolute top-2 right-2 pointer-events-auto z-30">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`p-2 rounded-xl border backdrop-blur transition shadow-lg ${
            isOpen ? 'bg-emerald-500 text-zinc-950 border-emerald-400' : 'bg-zinc-900/80 text-zinc-300 border-zinc-700'
          }`}
          title="Apri/Chiudi Lavagna Disegno"
        >
          <Palette className="w-4 h-4" />
        </button>
      </div>

      {/* Collapsible Toolbar */}
      {isOpen && (
        <div className="pointer-events-auto absolute bottom-3 left-1/2 transform -translate-x-1/2 flex items-center gap-1.5 bg-zinc-900/90 backdrop-blur-md px-3 py-1.5 rounded-full border border-zinc-700/80 shadow-2xl z-30 animate-fadeIn">
          <button
            onClick={() => setTool('line')}
            className={`p-1.5 rounded-full ${tool === 'line' ? 'bg-emerald-500 text-zinc-950 font-bold' : 'text-zinc-400'}`}
          >
            <Minus className="w-4 h-4" />
          </button>
          <button
            onClick={() => setTool('circle')}
            className={`p-1.5 rounded-full ${tool === 'circle' ? 'bg-emerald-500 text-zinc-950 font-bold' : 'text-zinc-400'}`}
          >
            <CircleIcon className="w-4 h-4" />
          </button>
          <button
            onClick={() => setTool('angle')}
            className={`p-1.5 rounded-full ${tool === 'angle' ? 'bg-emerald-500 text-zinc-950 font-bold' : 'text-zinc-400'}`}
          >
            <Compass className="w-4 h-4" />
          </button>
          <button
            onClick={() => setTool('free')}
            className={`p-1.5 rounded-full ${tool === 'free' ? 'bg-emerald-500 text-zinc-950 font-bold' : 'text-zinc-400'}`}
          >
            <Edit2 className="w-4 h-4" />
          </button>

          <div className="w-px h-4 bg-zinc-700 mx-0.5" />

          {colors.map((c) => (
            <button
              key={c}
              onClick={() => setColor(c)}
              className={`w-4 h-4 rounded-full border border-white/20 ${color === c ? 'ring-2 ring-emerald-400 scale-110' : ''}`}
              style={{ backgroundColor: c }}
            />
          ))}

          <div className="w-px h-4 bg-zinc-700 mx-0.5" />

          <button onClick={() => setShapes((p) => p.slice(0, -1))} className="p-1 rounded text-zinc-400">
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => setShapes([])} className="p-1 rounded text-rose-400">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
