import React, { useState, useEffect } from 'react';
import type { AtsFeedbackItem, AtsAction } from '../types';
import { SparklesIcon, CheckIcon, QuestionMarkCircleIcon, XIcon, ChevronRightIcon } from './icons';
import { getFollowUpAnswer } from '../services/geminiService';

interface AtsScoreProps {
  onCheck: () => void;
  isChecking: boolean;
  feedback: AtsFeedbackItem[] | null;
  onApplySuggestion: (action: AtsAction) => void;
  appliedSuggestions: string[];
}

const AtsScore: React.FC<AtsScoreProps> = ({ onCheck, isChecking, feedback, onApplySuggestion, appliedSuggestions }) => {
  const [selectedFeedback, setSelectedFeedback] = useState<AtsFeedbackItem | null>(null);
  const [isAskingFollowUp, setIsAskingFollowUp] = useState(false);
  const [followUpQuestion, setFollowUpQuestion] = useState('');
  const [followUpAnswer, setFollowUpAnswer] = useState<string | null>(null);
  const [isFollowUpLoading, setIsFollowUpLoading] = useState(false);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    // When a new check starts, reset the "showAll" state
    if (isChecking) {
      setShowAll(false);
    }
  }, [isChecking]);
  
  const handleSelectFeedback = (item: AtsFeedbackItem) => {
    setSelectedFeedback(item);
    // Reset follow-up state when opening a new modal
    setIsAskingFollowUp(false);
    setFollowUpQuestion('');
    setFollowUpAnswer(null);
    setIsFollowUpLoading(false);
  };

  const handleCloseModal = () => {
    setSelectedFeedback(null);
  };
  
  const handleApply = () => {
    if (selectedFeedback) {
      onApplySuggestion(selectedFeedback.action);
      handleCloseModal();
    }
  };
  
  const handleAskFollowUp = async () => {
    if (!selectedFeedback || !followUpQuestion.trim()) return;

    setIsFollowUpLoading(true);
    setFollowUpAnswer(null);

    const context = `
      The user's resume had this issue: "${selectedFeedback.description}"
      Original text: "${selectedFeedback.action.payload.original}"
      My suggestion was: "${selectedFeedback.action.payload.suggestion}"
    `;
    
    try {
      const answer = await getFollowUpAnswer(context, followUpQuestion);
      setFollowUpAnswer(answer);
    } catch(err) {
      alert("Failed to get a follow-up answer. Please try again.");
    } finally {
      setIsFollowUpLoading(false);
    }
  };

  const isFeedbackApplied = (item: AtsFeedbackItem): boolean => {
    return item.action.payload.original ? appliedSuggestions.includes(item.action.payload.original) : false;
  };

  const suggestionsToShow = feedback ? (showAll ? feedback : feedback.slice(0, 4)) : [];
  const primaryButtonClass = "inline-flex items-center justify-center mx-auto px-5 py-2.5 border border-transparent text-sm font-bold rounded-lg text-gray-900 bg-teal-400 hover:bg-teal-500 disabled:bg-gray-300 disabled:text-gray-500 transition-colors";
  const secondaryButtonClass = "inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 disabled:bg-gray-200 disabled:text-gray-400 transition-colors";

  return (
    <>
    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-lg">
      {!feedback && !isChecking && (
        <div className="text-center py-4">
          <p className="text-sm text-gray-500 mb-4 max-w-md mx-auto">
            Check your resume for common issues and get AI-powered suggestions to improve your score.
          </p>
          <button onClick={onCheck} disabled={isChecking} className={primaryButtonClass}>
            <SparklesIcon className="h-5 w-5 mr-2" />
            Check My Resume
          </button>
        </div>
      )}

      {isChecking && (
        <div className="text-center p-6">
            <div className="loader mx-auto" style={{width: '24px', height: '24px', borderWidth: '3px', borderTopColor: '#2DD4BF'}}></div>
            <p className="mt-3 text-sm text-gray-500">Analyzing your resume...</p>
        </div>
      )}

      {feedback && !isChecking && (
        <div className="animate-fade-in">
          <div className="space-y-3">
            {feedback.length === 0 ? (
              <div className="text-center py-4 text-green-600">
                  <CheckIcon className="h-8 w-8 mx-auto mb-2"/>
                  <p className="font-semibold">Looks great! No critical issues found.</p>
              </div>
            ) : (
              <>
                  <p className="text-sm text-gray-500 pb-2 text-center">Here are some suggestions to improve your resume. Click to see details.</p>
                  {suggestionsToShow.map((item, index) => {
                      const isApplied = isFeedbackApplied(item);
                      return (
                          <button 
                            key={index} 
                            onClick={() => handleSelectFeedback(item)}
                            className={`w-full text-left p-4 rounded-xl border transition-all duration-200 flex items-center justify-between ${isApplied ? 'bg-gray-200 border-gray-300' : 'bg-white border-gray-200 hover:border-indigo-400 hover:shadow-md'}`}
                          >
                              <span className={`text-sm pr-4 ${isApplied ? 'text-gray-500 line-through' : 'text-gray-800 font-medium'}`}>{item.description}</span>
                              {isApplied 
                                ? <CheckIcon className="h-5 w-5 text-green-500 flex-shrink-0 ml-2" />
                                : <ChevronRightIcon className="h-5 w-5 text-gray-400 flex-shrink-0" />
                              }
                          </button>
                      );
                  })}
              </>
            )}
          </div>

          {feedback && feedback.length > 4 && !showAll && (
            <div className="mt-4 text-center">
              <button
                onClick={() => setShowAll(true)}
                className="text-sm font-semibold text-indigo-600 hover:text-indigo-500"
              >
                Show {feedback.length - 4} More Suggestions...
              </button>
            </div>
          )}

          <div className="text-center mt-4 border-t border-gray-200 pt-4">
            <button onClick={onCheck} disabled={isChecking} className={`${secondaryButtonClass} w-auto`}>
                <SparklesIcon className="h-5 w-5 mr-2" />
                Re-check Resume
            </button>
          </div>
        </div>
      )}
    </div>

    {/* Modal for showing suggestion details */}
    {selectedFeedback && (
      <div 
        className="fixed inset-0 bg-gray-900/80 flex justify-center items-center z-50 backdrop-blur-sm p-4 animate-fade-in"
        onClick={handleCloseModal}
      >
        <div 
          className="bg-white border border-gray-200 rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col"
          onClick={e => e.stopPropagation()} // Prevent closing modal when clicking inside
        >
          <header className="p-4 border-b border-gray-200 flex justify-between items-center flex-shrink-0">
            <h4 className="font-semibold text-lg text-gray-900">Suggestion Details</h4>
            <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-600 transition-colors">
              <XIcon className="h-6 w-6" />
            </button>
          </header>
          
          <div className="p-6 space-y-6 overflow-y-auto">
            <p className="text-gray-800 bg-gray-50 p-3 rounded-lg border border-gray-200">{selectedFeedback.description}</p>

            {selectedFeedback.action.payload.original && (
              <div>
                <h5 className="text-sm font-medium text-red-600 mb-1">Original</h5>
                <p className="text-red-900 bg-red-50 p-3 rounded-md text-sm font-mono border border-red-200">{selectedFeedback.action.payload.original}</p>
              </div>
            )}

            <div>
              <h5 className="text-sm font-medium text-teal-600 mb-1">Suggestion</h5>
              <p className="text-teal-900 bg-teal-50 p-3 rounded-md text-sm font-mono border border-teal-200">{selectedFeedback.action.payload.suggestion}</p>
            </div>

            <div className="border-t border-gray-200 pt-4">
                <button onClick={() => setIsAskingFollowUp(!isAskingFollowUp)} className="flex items-center text-sm text-indigo-600 hover:text-indigo-500">
                  <QuestionMarkCircleIcon className="h-5 w-5 mr-2" />
                  Ask a follow-up question
                </button>
                {isAskingFollowUp && (
                  <div className="mt-3 space-y-2 animate-fade-in">
                    <textarea
                      placeholder="e.g., Why is this suggestion better?"
                      value={followUpQuestion}
                      onChange={(e) => setFollowUpQuestion(e.target.value)}
                      className="w-full bg-white p-2 rounded-md text-sm text-gray-800 focus:ring-1 focus:ring-indigo-500 border border-gray-300"
                      rows={2}
                    />
                    <div className="text-right">
                      <button onClick={handleAskFollowUp} disabled={isFollowUpLoading} className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-1 px-3 rounded disabled:bg-gray-300">
                        {isFollowUpLoading ? 'Thinking...' : 'Send'}
                      </button>
                    </div>
                    {isFollowUpLoading && <div className="loader mx-auto my-2" style={{width: '20px', height: '20px', borderWidth: '2px'}}></div>}
                    {followUpAnswer && <p className="text-sm text-gray-800 bg-gray-50 p-3 rounded-md mt-2 border border-gray-200">{followUpAnswer}</p>}
                  </div>
                )}
            </div>
          </div>

          <footer className="p-4 border-t border-gray-200 bg-gray-50 flex justify-end items-center space-x-3 flex-shrink-0">
            <button onClick={handleCloseModal} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 border border-gray-300 rounded-lg transition-colors">
              Close
            </button>
            <button 
              onClick={handleApply} 
              disabled={isFeedbackApplied(selectedFeedback)}
              className="px-4 py-2 text-sm font-medium text-gray-900 bg-teal-400 hover:bg-teal-300 rounded-lg transition-colors disabled:bg-teal-100 disabled:text-teal-400 disabled:cursor-not-allowed flex items-center"
            >
              {isFeedbackApplied(selectedFeedback) ? (
                  <>
                      <CheckIcon className="h-5 w-5 mr-2" />
                      Applied
                  </>
              ) : 'Apply Suggestion'}
            </button>
          </footer>
        </div>
      </div>
    )}
  </>
  );
};

export default AtsScore;