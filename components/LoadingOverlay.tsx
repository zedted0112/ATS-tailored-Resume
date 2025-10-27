import React from 'react';

const LoadingOverlay: React.FC = () => {
  return (
    <div className="fixed inset-0 bg-gray-900/80 flex flex-col justify-center items-center z-50 backdrop-blur-sm">
      <div className="loader"></div>
      <p className="text-lg font-semibold text-teal-400 mt-4">Engaging AI Pilot...</p>
      <p className="text-sm text-gray-400 mt-2">Parsing and analyzing your resume data.</p>
    </div>
  );
};

export default LoadingOverlay;