import React from 'react';
import { DetailLevel } from '../types';

interface DetailSelectorProps {
  value: DetailLevel;
  onChange: (level: DetailLevel) => void;
  disabled: boolean;
}

const DetailSelector: React.FC<DetailSelectorProps> = ({ value, onChange, disabled }) => {
  const levels = [
    { id: DetailLevel.CONCISE, label: 'Concise', desc: 'Short, brief caption' },
    { id: DetailLevel.STANDARD, label: 'Standard', desc: 'Balanced description' },
    { id: DetailLevel.DETAILED, label: 'Detailed', desc: 'In-depth analysis' },
    { id: DetailLevel.EXTREME, label: 'Extreme', desc: 'Every minute detail' },
  ];

  return (
    <div className="w-full space-y-3">
      <label className="text-sm font-medium text-slate-400">Detail Level</label>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {levels.map((level) => {
          const isSelected = value === level.id;
          return (
            <button
              key={level.id}
              onClick={() => onChange(level.id)}
              disabled={disabled}
              className={`
                relative p-3 rounded-xl border text-left transition-all duration-200
                focus:outline-none focus:ring-2 focus:ring-primary/50
                ${isSelected 
                  ? 'bg-primary/20 border-primary text-white shadow-[0_0_15px_rgba(99,102,241,0.3)]' 
                  : 'bg-surface border-slate-700 text-slate-400 hover:border-slate-500 hover:bg-slate-700/50'
                }
                ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              `}
            >
              <div className="text-sm font-semibold mb-1">{level.label}</div>
              <div className={`text-xs ${isSelected ? 'text-slate-200' : 'text-slate-500'}`}>
                {level.desc}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default DetailSelector;
