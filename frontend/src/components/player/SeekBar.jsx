import React, { useState, useEffect } from 'react';
import { usePlayer } from '../../context/PlayerContext';

const formatTime = (seconds) => {
  if (isNaN(seconds) || seconds < 0) return '00:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
};

export const SeekBar = () => {
  const { currentTime, duration, bufferedEnd, seek } = usePlayer();
  const [isDragging, setIsDragging] = useState(false);
  const [dragValue, setDragValue] = useState(0);

  // Cập nhật giá trị hiển thị khi không kéo thả
  useEffect(() => {
    if (!isDragging) {
      setDragValue(currentTime);
    }
  }, [currentTime, isDragging]);

  const maxDuration = duration > 0 ? duration : 100;
  const displayTime = isDragging ? dragValue : currentTime;

  // Tính phần trăm buffer và progress để hiển thị thanh tiến trình 2 lớp
  const playedPercent = Math.min(100, Math.max(0, (displayTime / maxDuration) * 100));
  const bufferedPercent = Math.min(100, Math.max(0, (bufferedEnd / maxDuration) * 100));

  const handleSliderChange = (e) => {
    setDragValue(Number(e.target.value));
  };

  const handleMouseDown = () => {
    setIsDragging(true);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    // Chỉ thực hiện gọi Range seek khi người dùng thả tay ra
    seek(dragValue);
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    seek(dragValue);
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%', maxWidth: '600px' }}>
      <span style={{ fontSize: '12px', color: '#888', minWidth: '40px', textAlign: 'right' }}>
        {formatTime(displayTime)}
      </span>

      <div style={{ position: 'relative', flex: 1, display: 'flex', alignItems: 'center', height: '24px' }}>
        {/* Nền tổng thể */}
        <div
          style={{
            position: 'absolute',
            width: '100%',
            height: '4px',
            borderRadius: '2px',
            backgroundColor: '#333'
          }}
        />

        {/* Thanh đệm dữ liệu mạng (Buffered Range) */}
        <div
          style={{
            position: 'absolute',
            width: `${bufferedPercent}%`,
            height: '4px',
            borderRadius: '2px',
            backgroundColor: '#555',
            transition: 'width 0.2s ease'
          }}
          title={`Đã buffer: ${Math.round(bufferedPercent)}%`}
        />

        {/* Thanh đã phát (Played Range) */}
        <div
          style={{
            position: 'absolute',
            width: `${playedPercent}%`,
            height: '4px',
            borderRadius: '2px',
            backgroundColor: '#3b82f6'
          }}
        />

        {/* Input slider kéo thả */}
        <input
          type="range"
          min={0}
          max={maxDuration}
          step={0.1}
          value={displayTime}
          onChange={handleSliderChange}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onTouchStart={handleMouseDown}
          onTouchEnd={handleTouchEnd}
          style={{
            position: 'relative',
            width: '100%',
            height: '100%',
            opacity: 0,
            cursor: 'pointer',
            margin: 0,
            zIndex: 10
          }}
        />
      </div>

      <span style={{ fontSize: '12px', color: '#888', minWidth: '40px' }}>
        {formatTime(duration)}
      </span>
    </div>
  );
};

