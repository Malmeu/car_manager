import React, { useState, useRef, useEffect } from 'react';
import { Box, Button, IconButton } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';

interface Point {
  x: number;
  y: number;
  color: string;
}

interface CarDamageSelectorProps {
  view: string;
  points: Point[];
  onChange: (points: Point[]) => void;
}

const colors = ['#FF0000', '#FFA500', '#FFFF00']; // Rouge, Orange, Jaune

const CarDamageSelector: React.FC<CarDamageSelectorProps> = ({
  view,
  points,
  onChange,
}) => {
  const [selectedColor, setSelectedColor] = useState(colors[0]);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [selectedPoint, setSelectedPoint] = useState<number | null>(null);

  const getImagePath = () => {
    return `/car-views/${view}.png`;
  };

  useEffect(() => {
    const image = new Image();
    image.src = getImagePath();
    image.onload = () => {
      setImageLoaded(true);
      drawCanvas();
    };
  }, [view]);

  useEffect(() => {
    drawCanvas();
  }, [points, selectedPoint]);

  const drawCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw car image
    const image = new Image();
    image.src = getImagePath();
    image.onload = () => {
      ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

      // Draw points
      points.forEach((point, index) => {
        ctx.beginPath();
        ctx.arc(point.x * canvas.width, point.y * canvas.height, 8, 0, 2 * Math.PI);
        ctx.fillStyle = point.color;
        ctx.fill();
        
        if (index === selectedPoint) {
          ctx.strokeStyle = '#000000';
          ctx.lineWidth = 2;
          ctx.stroke();
        }
      });
    };
  };

  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = (event.clientX - rect.left) / canvas.width;
    const y = (event.clientY - rect.top) / canvas.height;

    // Check if clicking near an existing point
    const clickedPointIndex = points.findIndex(point => {
      const distance = Math.sqrt(
        Math.pow((point.x - x) * canvas.width, 2) +
        Math.pow((point.y - y) * canvas.height, 2)
      );
      return distance < 10;
    });

    if (clickedPointIndex !== -1) {
      setSelectedPoint(clickedPointIndex);
    } else {
      const newPoint: Point = { x, y, color: selectedColor };
      onChange([...points, newPoint]);
      setSelectedPoint(points.length);
    }
  };

  const handleDeletePoint = () => {
    if (selectedPoint !== null) {
      const newPoints = points.filter((_, index) => index !== selectedPoint);
      onChange(newPoints);
      setSelectedPoint(null);
    }
  };

  const handleColorChange = (color: string) => {
    setSelectedColor(color);
    if (selectedPoint !== null) {
      const newPoints = [...points];
      newPoints[selectedPoint].color = color;
      onChange(newPoints);
    }
  };

  return (
    <Box ref={containerRef} sx={{ position: 'relative', width: '100%', aspectRatio: '16/9' }}>
      <canvas
        ref={canvasRef}
        width={800}
        height={450}
        onClick={handleCanvasClick}
        style={{
          width: '100%',
          height: '100%',
          border: '1px solid #ccc',
          cursor: 'crosshair',
        }}
      />
      
      <Box sx={{ mt: 2, display: 'flex', gap: 1, alignItems: 'center' }}>
        {colors.map((color) => (
          <Button
            key={color}
            variant={selectedColor === color ? 'contained' : 'outlined'}
            sx={{
              minWidth: 'unset',
              width: 32,
              height: 32,
              p: 0,
              backgroundColor: color,
              '&:hover': {
                backgroundColor: color,
                filter: 'brightness(0.9)',
              },
            }}
            onClick={() => handleColorChange(color)}
          />
        ))}
        
        {selectedPoint !== null && (
          <IconButton
            onClick={handleDeletePoint}
            color="error"
            size="small"
          >
            <DeleteIcon />
          </IconButton>
        )}
      </Box>
    </Box>
  );
};

export default CarDamageSelector;
