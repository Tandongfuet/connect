import React from 'react';

const VoiceAssistantFab: React.FC<{ onClick: () => void }> = ({ onClick }) => {
  // This is a placeholder for the Voice Assistant FAB
  return (
    <button
      onClick={onClick}
      className="fixed bottom-4 right-4 bg-primary text-white w-14 h-14 rounded-full shadow-lg flex items-center justify-center"
      aria-label="Open Voice Assistant"
    >
      <span role="img" aria-label="microphone" className="text-2xl">🎙️</span>
    </button>
  );
};

export default VoiceAssistantFab;