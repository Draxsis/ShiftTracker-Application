
import React from 'react';

interface TimerDisplayProps {
  time: string;
}

const TimerDisplay: React.FC<TimerDisplayProps> = ({ time }) => {
  return <div className="text-6xl sm:text-7xl font-mono font-bold text-sky-300 my-4 tracking-tight tabular-nums">{time}</div>;
};

export default TimerDisplay;
