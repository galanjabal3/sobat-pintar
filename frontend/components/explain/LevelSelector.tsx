import React from "react";
import { cn } from "@/lib/utils";

interface LevelSelectorProps {
  selectedLevel: string;
  onSelect: (level: string) => void;
}

const levels = ["TK", "SD", "SMP", "SMA"];

const LevelSelector: React.FC<LevelSelectorProps> = ({ selectedLevel, onSelect }) => {
  return (
    <div className="grid grid-cols-4 gap-2">
      {levels.map((lvl) => (
        <button
          key={lvl}
          type="button"
          onClick={() => onSelect(lvl)}
          className={cn(
            "py-3 rounded-xl border-2 font-bold transition-all",
            selectedLevel === lvl
              ? "border-primary bg-primary/10 text-primary"
              : "border-gray-100 bg-gray-50 text-neutral-400"
          )}
        >
          {lvl}
        </button>
      ))}
    </div>
  );
};

export default LevelSelector;
