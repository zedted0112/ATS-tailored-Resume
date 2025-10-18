import React, { useState, useEffect } from 'react';
import type { AtsFeedbackItem, AtsAction } from '../types';
import { SparklesIcon, RefreshIcon, CheckIcon } from './icons';

interface AtsScoreProps {
  onCheck: () => void;
  isChecking: boolean;
  feedback: AtsFeedbackItem[] | null;
  onApplySuggestion: (action: AtsAction) => void;
  appliedSuggestions: string[]; // Array of original suggestion strings that have been applied
}

const AtsScore: React.FC<AtsScoreProps> = ({ onCheck, isChecking, feedback, onApplySuggestion, appliedSuggestions }) => {
  const [visibleCount, setVisibleCount] = useState(4);

  useEffect(() => {
    // Reset visible count when new feedback comes in
    setVisibleCount(4);
  }, [feedback]);
  
  return (
    <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
      <div className="flex justify-between items-center">
        <h3 className="text-base font-semibold text-slate-800">ATS & Improvement Score</h3>
        <button
          onClick={onCheck}
          disabled={isChecking}
          className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400"
        >
          {feedback ? <RefreshIcon className="h-4 w-4 mr-1.5" /> : <SparklesIcon className="h-4 w-4 mr-1.5" />}
          {isChecking ? 'Checking...' : (feedback ? 'Re-check' : 'Check Score')}
        </button>
      </div>

      {isChecking && (
        <div className="text-center p-6">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-3 text-sm text-slate-600">Analyzing your resume for ATS-friendliness...</p>
        </div>
      )}

      {!isChecking && feedback && feedback.length === 0 && (
        <div className="mt-4 text-center p-4 bg-green-50 border border-green-200 rounded-lg">
            <CheckIcon className="h-6 w-6 mx-auto text-green-600" />
            <p className="text-sm font-semibold text-green-800 mt-2">Looks Great!</p>
            <p className="text-xs text-green-700">No immediate ATS issues found. Your resume structure is solid.</p>
        </div>
      )}
      
      {!isChecking && feedback && feedback.length > 0 && (
        <div className="mt-4 space-y-3">
          <p className="text-sm text-slate-600">Here are some suggestions to improve your resume's impact and ATS compatibility:</p>
          {feedback.slice(0, visibleCount).map((item, index) => {
             const originalText = item.action.payload.original || '';
             const isApplied = appliedSuggestions.includes(originalText);
             const hasContext = item.action.type.startsWith('REPLACE') && originalText;

            return (
                <div key={index} className="bg-white p-3 rounded-lg border border-slate-200 text-sm">
                  <p className="text-slate-700 font-medium mb-2">{item.description}</p>
                  
                  {hasContext && (
                    <div className="space-y-1.5 border-l-2 border-slate-200 pl-3 ml-1 text-xs">
                        <p className="text-slate-500"><span className="font-semibold text-slate-600">Original:</span> {originalText}</p>
                        <p className="text-green-700"><span className="font-semibold text-green-800">Suggestion:</span> {item.action.payload.suggestion}</p>
                    </div>
                  )}

                  <div className="text-right mt-2">
                      <button 
                          onClick={() => onApplySuggestion(item.action)}
                          disabled={isApplied}
                          className="text-xs font-bold text-indigo-600 hover:underline disabled:text-slate-400 disabled:no-underline"
                      >
                         {isApplied ? '✓ Applied' : 'Apply Suggestion'}
                      </button>
                  </div>
                </div>
            );
          })}
          {feedback && feedback.length > visibleCount && (
            <div className="text-center mt-4">
                <button
                    onClick={() => setVisibleCount(feedback.length)}
                    className="text-sm font-semibold text-blue-600 hover:text-blue-800"
                >
                    Show More Suggestions
                </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AtsScore;