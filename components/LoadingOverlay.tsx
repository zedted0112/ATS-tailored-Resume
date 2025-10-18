import React from 'react';

const LoadingOverlay: React.FC = () => {
  return (
    <div className="fixed inset-0 bg-white/80 flex flex-col justify-center items-center z-50 backdrop-blur-sm">
      <div className="loader"></div>
      <p className="text-lg font-semibold text-blue-600 mt-4">AI is parsing and analyzing your resume...</p>
      <p className="text-sm text-slate-500 mt-2">This might take a moment.</p>
    </div>
  );
};

export default LoadingOverlay;