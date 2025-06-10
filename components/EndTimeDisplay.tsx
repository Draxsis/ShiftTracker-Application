
import React from 'react';

interface EndTimeDisplayProps {
  endTimeString: string; 
}

const EndTimeDisplay: React.FC<EndTimeDisplayProps> = ({ endTimeString }) => {
  return <p className="text-2xl sm:text-3xl text-slate-300">Shift ends at: <span className="font-semibold text-sky-400">{endTimeString}</span></p>;
};

export default EndTimeDisplay;
