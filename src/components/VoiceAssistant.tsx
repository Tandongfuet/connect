import React from 'react';

const VoiceAssistant: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  // This is a placeholder for the Voice Assistant modal
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center" onClick={onClose}>
      <div className="bg-white p-8 rounded-lg" onClick={e => e.stopPropagation()}>
        <h2 className="text-xl font-bold mb-4">Voice Assistant</h2>
        <p>Voice assistant functionality is not yet implemented.</p>
        <button onClick={onClose} className="btn btn-primary mt-4">Close</button>
      </div>
    </div>
  );
};

export default VoiceAssistant;