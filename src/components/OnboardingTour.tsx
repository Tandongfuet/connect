
import React, { useState, useEffect, useCallback } from 'react';

export interface TourStep {
  target: string; // CSS selector
  title: string;
  content: string;
}

interface OnboardingTourProps {
  steps: TourStep[];
  isOpen: boolean;
  onClose: () => void;
}

const OnboardingTour: React.FC<OnboardingTourProps> = ({ steps, isOpen, onClose }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

  const handleNext = useCallback(() => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      onClose();
    }
  }, [currentStep, steps.length, onClose]);

  const updateTargetRect = useCallback(() => {
    if (!isOpen || !steps[currentStep]) return;
    
    const step = steps[currentStep];
    try {
      const element = document.querySelector(step.target);
      if (element) {
        setTargetRect(element.getBoundingClientRect());
      } else {
        console.warn(`Onboarding tour target not found: ${step.target}. Skipping step.`);
        handleNext(); // Skip if element not found
      }
    } catch (e) {
        console.error(`Invalid selector for tour: ${step.target}`, e);
        handleNext();
    }
  }, [currentStep, isOpen, steps, handleNext]);

  useEffect(() => {
    if (isOpen) {
      const timeoutId = setTimeout(updateTargetRect, 100);
      window.addEventListener('resize', updateTargetRect);
      window.addEventListener('scroll', updateTargetRect, true);
      
      return () => {
        clearTimeout(timeoutId);
        window.removeEventListener('resize', updateTargetRect);
        window.removeEventListener('scroll', updateTargetRect, true);
      };
    }
  }, [isOpen, updateTargetRect]);

  const getTooltipStyle = (): React.CSSProperties => {
    if (!targetRect) return { display: 'none' };

    const style: React.CSSProperties = {
        position: 'absolute',
        top: targetRect.bottom + 15,
        left: targetRect.left + targetRect.width / 2,
        transform: 'translateX(-50%)',
        maxWidth: '320px',
        zIndex: 101,
    };

    // Check vertical position
    if (targetRect.bottom + 15 + 200 > window.innerHeight) { // Assuming tooltip height is around 200px
        style.top = targetRect.top - 15;
        style.transform = 'translate(-50%, -100%)';
    }

    // Check horizontal position
    const halfWidth = 160; // Half of maxWidth 320px
    if (targetRect.left + targetRect.width / 2 - halfWidth < 20) {
        style.left = 20;
        style.transform = 'translateX(0)';
    } else if (targetRect.left + targetRect.width / 2 + halfWidth > window.innerWidth - 20) {
        style.left = 'auto';
        style.right = 20;
        style.transform = 'translateX(0)';
    }

    return style;
  };
  
  if (!isOpen || !targetRect) return null;

  const step = steps[currentStep];
  const tooltipStyle = getTooltipStyle();

  return (
    <div className="fixed inset-0 z-[100]">
      {/* Overlay */}
      <div className="fixed inset-0 bg-black bg-opacity-0 animate-fade-in" style={{ animationDuration: '0.3s', backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={onClose}/>
      
      {/* Spotlight */}
      <div 
        className="fixed rounded-md transition-all duration-300 ease-in-out"
        style={{
            top: targetRect.top - 5,
            left: targetRect.left - 5,
            width: targetRect.width + 10,
            height: targetRect.height + 10,
            boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5)',
            zIndex: 100
        }}
      />
      
      {/* Tooltip */}
      <div 
        style={tooltipStyle}
        className="bg-white dark:bg-dark-surface p-5 rounded-lg shadow-2xl animate-fade-in"
      >
        <h3 className="font-bold text-lg text-slate-dark dark:text-white mb-2">{step.title}</h3>
        <p className="text-sm text-gray-muted dark:text-gray-400">{step.content}</p>
        <div className="flex justify-between items-center mt-4">
          <span className="text-xs text-gray-400 dark:text-gray-500">{currentStep + 1} / {steps.length}</span>
          <div>
            <button onClick={onClose} className="btn btn-ghost btn-sm mr-2">Skip Tour</button>
            <button onClick={handleNext} className="btn btn-primary btn-sm">
              {currentStep === steps.length - 1 ? 'Finish' : 'Next'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingTour;
