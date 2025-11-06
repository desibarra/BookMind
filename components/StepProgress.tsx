
import React from 'react';

interface StepProgressProps {
  currentStep: number;
  totalSteps: number;
}

export const StepProgress: React.FC<StepProgressProps> = ({ currentStep, totalSteps }) => {
  const progressPercentage = ((currentStep + 1) / totalSteps) * 100;

  return (
    <div className="w-full max-w-md mx-auto my-8">
      <div className="relative h-2 bg-gray-blue/10 dark:bg-cream/10 rounded-full">
        <div
          className="absolute top-0 left-0 h-2 bg-gold rounded-full transition-all duration-500 ease-out"
          style={{ width: `${progressPercentage}%` }}
        ></div>
      </div>
    </div>
  );
};
