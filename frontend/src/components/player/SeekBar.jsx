import React, { useState, useEffect } from "react";
import { usePlayer } from "../../context/PlayerContext";

const formatTime = (seconds) => {
  if (isNaN(seconds) || seconds < 0) return "00:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m < 10 ? "0" : ""}${m}:${s < 10 ? "0" : ""}${s}`;
};

export const SeekBar = () => {
  const { currentTime, duration, bufferedEnd, seek } = usePlayer();
  const [isDragging, setIsDragging] = useState(false);
  const [dragValue, setDragValue] = useState(0);

  useEffect(() => {
    if (!isDragging) {
      setDragValue(currentTime);
    }
  }, [currentTime, isDragging]);

  const maxDuration = duration > 0 ? duration : 100;
  const displayTime = isDragging ? dragValue : currentTime;

  const playedPercent = Math.min(
    100,
    Math.max(0, (displayTime / maxDuration) * 100),
  );
  const bufferedPercent = Math.min(
    100,
    Math.max(0, (bufferedEnd / maxDuration) * 100),
  );

  const handleSliderChange = (e) => {
    setDragValue(Number(e.target.value));
  };

  const handleMouseDown = () => {
    setIsDragging(true);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    seek(dragValue);
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    seek(dragValue);
  };

  const handlePointerDown = () => {
    setIsDragging(true);
  };

  const handlePointerUp = (event) => {
    if (!isDragging) return;
    setIsDragging(false);
    seek(Number(event.currentTarget.value));
  };

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "10px",
        width: "100%",
        maxWidth: "520px",
      }}
    >
      <span
        style={{
          fontSize: "11px",
          color: "var(--music-muted, #a4a6b7)",
          minWidth: "36px",
          textAlign: "right",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {formatTime(displayTime)}
      </span>

      <div
        style={{
          position: "relative",
          flex: 1,
          display: "flex",
          alignItems: "center",
          height: "20px",
        }}
      >
        {/* Nền thanh tua (Figma #30323f) */}
        <div
          style={{
            position: "absolute",
            width: "100%",
            height: "4px",
            borderRadius: "2px",
            backgroundColor: "var(--music-line, #30323f)",
          }}
        />

        {/* Thanh buffer mạng */}
        <div
          style={{
            position: "absolute",
            width: `${bufferedPercent}%`,
            height: "4px",
            borderRadius: "2px",
            backgroundColor: "rgba(164, 166, 183, 0.25)",
            transition: "width 0.2s ease",
          }}
        />

        {/* Thanh tiến độ (Figma #ac91ff) */}
        <div
          style={{
            position: "absolute",
            width: `${playedPercent}%`,
            height: "4px",
            borderRadius: "2px",
            backgroundColor: "var(--music-primary, #ac91ff)",
          }}
        />

        {/* Input slider kéo thả */}
        <input
          type="range"
          min={0}
          max={maxDuration}
          step={0.1}
          value={displayTime}
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
          onChange={handleSliderChange}
          onTouchStart={handleMouseDown}
          onTouchEnd={handleTouchEnd}
          style={{
            position: "relative",
            width: "100%",
            height: "100%",
            opacity: 0,
            cursor: "pointer",
            margin: 0,
            zIndex: 10,
          }}
        />
      </div>

      <span
        style={{
          fontSize: "11px",
          color: "var(--music-muted, #a4a6b7)",
          minWidth: "36px",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {formatTime(duration)}
      </span>
    </div>
  );
};
