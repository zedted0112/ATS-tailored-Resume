
import React, { useState, useEffect } from 'react';
import type { InterviewQuestion } from '../types';
import { SparklesIcon, RefreshIcon, ChevronLeftIcon, ChevronRightIcon, QuestionMarkCircleIcon } from './icons';
import { getFollowUpAnswer } from '../services/geminiService';

interface InterviewCoachProps {
  onGenerate: () => Promise<void>;
  isGenerating: boolean;
  questions: InterviewQuestion[] | null;
  onGenerateMore: () => Promise<void>;
  isGeneratingMore: boolean;
  jobContext: { jobDescription: string; companyName: string };
  setJobContext: React.Dispatch<React.SetStateAction<{ jobDescription: string; companyName: string }>>;
}

const QuestionViewerModal: React.FC<{
  question: InterviewQuestion;
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
  isFirst: boolean;
  isLast: boolean;
}> = ({ question, onClose, onNext, onPrev, isFirst, isLast }) => {
  const [isAskingFollowUp, setIsAskingFollowUp] = useState(false);
  const [followUpQuestion, setFollowUpQuestion] = useState('');
  const [followUpAnswer, setFollowUpAnswer] = useState<string | null>(null);
  const [isFollowUpLoading, setIsFollowUpLoading] = useState(false);

  useEffect(() => {
      // Reset follow-up state when the question changes
      setIsAskingFollowUp(false);
      setFollowUpQuestion('');
      setFollowUpAnswer(null);
      setIsFollowUpLoading(false);
  }, [question]);

  const handleAskFollowUp = async () => {
    if (!followUpQuestion.trim()) return;

    setIsFollowUpLoading(true);
    setFollowUpAnswer(null);

    const context = `
      The user is preparing for an interview.
      The interview question is: "${question.question}"
      My suggested answer was: "${question.sampleAnswer}"
      My tip was: "${question.tip}"
      The interviewer's insight was: "${question.interviewerInsight}"
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


  return (
    <div 
      className="fixed inset-0 bg-gray-900/50 flex items-end z-50 animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-gray-100 text-gray-900 w-full rounded-t-2xl shadow-2xl shadow-black/50 flex flex-col transition-transform duration-300 transform animate-slide-up"
        style={{ maxHeight: '85vh' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex-shrink-0 p-4 text-center">
            <div className="w-12 h-1.5 bg-gray-300 dark:bg-gray-400 rounded-full mx-auto"></div>
        </div>
        <div className="flex-grow overflow-y-auto px-6 pb-6">
          <h2 className="text-2xl md:text-3xl font-bold mb-6">
            <span className="font-light">Q.</span> {question.question}
          </h2>
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-indigo-600">AI answer for you ✨</h3>
            <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{question.sampleAnswer}</p>
          </div>

          <div className="border-t border-gray-200 dark:border-gray-300 pt-4 mt-6">
            <button onClick={() => setIsAskingFollowUp(!isAskingFollowUp)} className="flex items-center text-sm text-indigo-600 hover:text-indigo-500">
                <QuestionMarkCircleIcon className="h-5 w-5 mr-2" />
                Ask a follow-up question
            </button>
            {isAskingFollowUp && (
                <div className="mt-3 space-y-2 animate-fade-in">
                <textarea
                    placeholder="e.g., Can you make the answer more concise?"
                    value={followUpQuestion}
                    onChange={(e) => setFollowUpQuestion(e.target.value)}
                    className="w-full bg-gray-100 dark:bg-gray-200 p-2 rounded-md text-sm text-gray-700 focus:ring-1 focus:ring-indigo-500 border border-gray-300 dark:border-gray-400"
                    rows={2}
                />
                <div className="text-right">
                    <button onClick={handleAskFollowUp} disabled={isFollowUpLoading} className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-1 px-3 rounded disabled:bg-gray-300">
                    {isFollowUpLoading ? 'Thinking...' : 'Send'}
                    </button>
                </div>
                {isFollowUpLoading && <div className="loader mx-auto my-2" style={{width: '20px', height: '20px', borderWidth: '2px'}}></div>}
                {followUpAnswer && <p className="text-sm text-gray-700 bg-gray-100 dark:bg-gray-200 p-3 rounded-md mt-2 border border-gray-200 dark:border-gray-300 whitespace-pre-wrap">{followUpAnswer}</p>}
                </div>
            )}
            </div>

        </div>
        <footer className="flex-shrink-0 bg-gray-100 dark:bg-gray-200 p-4 flex items-center justify-between border-t border-gray-200 dark:border-gray-300">
            <button 
                onClick={onPrev} 
                disabled={isFirst}
                className="w-10 h-10 rounded-full bg-white dark:bg-gray-100 border border-gray-300 dark:border-gray-400 flex items-center justify-center text-indigo-600 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
                aria-label="Previous question"
            >
                <ChevronLeftIcon className="h-6 w-6" />
            </button>
            <span className="text-sm font-medium text-gray-600">Personalised questions</span>
            <button 
                onClick={onNext} 
                disabled={isLast}
                className="w-10 h-10 rounded-full bg-white dark:bg-gray-100 border border-gray-300 dark:border-gray-400 flex items-center justify-center text-indigo-600 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
                aria-label="Next question"
            >
                <ChevronRightIcon className="h-6 w-6" />
            </button>
        </footer>
      </div>
       <style>{`
          @keyframes slide-up {
            from { transform: translateY(100%); }
            to { transform: translateY(0); }
          }
          .animate-slide-up {
            animation: slide-up 0.3s ease-out forwards;
          }
        `}</style>
    </div>
  );
};


const InterviewCoach: React.FC<InterviewCoachProps> = ({ onGenerate, isGenerating, questions, onGenerateMore, isGeneratingMore, jobContext, setJobContext }) => {
  const [role, setRole] = useState('');
  const [selectedQuestionIndex, setSelectedQuestionIndex] = useState<number | null>(null);


  const handleGenerateClick = () => {
    if (jobContext.jobDescription.trim()) {
      // Simple role extraction for display
      const match = jobContext.jobDescription.match(/(?:for|as)\s(a|an|the)?\s*([^,.\n(]+)/i);
      setRole(match ? match[2].trim() : 'this role');

      onGenerate();
      setSelectedQuestionIndex(null);
    }
  };

  const handleCloseModal = () => setSelectedQuestionIndex(null);
  const handleNextQuestion = () => {
    if (questions && selectedQuestionIndex !== null && selectedQuestionIndex < questions.length - 1) {
      setSelectedQuestionIndex(prev => prev! + 1);
    }
  };
  const handlePrevQuestion = () => {
    if (selectedQuestionIndex !== null && selectedQuestionIndex > 0) {
      setSelectedQuestionIndex(prev => prev! - 1);
    }
  };
  
  const isLoading = isGenerating || isGeneratingMore;
  const buttonClass = "inline-flex items-center px-5 py-2.5 border border-transparent text-sm font-bold rounded-lg text-gray-900 bg-teal-400 hover:bg-teal-500 disabled:bg-gray-300 disabled:text-gray-500 transition-colors";

  return (
    <div className="space-y-6">
      {!questions || questions.length === 0 ? (
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-lg text-center">
          <h3 className="text-2xl font-bold text-gray-900">Co-Pilot Q&A</h3>
          <p className="text-sm text-gray-500 mt-2 mb-4 max-w-md mx-auto">
            Paste a job description to get personalized interview questions and sample answers.
          </p>
          <textarea
            value={jobContext.jobDescription}
            onChange={(e) => setJobContext(prev => ({...prev, jobDescription: e.target.value}))}
            placeholder="Paste job description here..."
            className="w-full h-32 p-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition duration-150 ease-in-out text-sm"
            disabled={isLoading}
          />
          <div className="mt-3">
            <button
              onClick={handleGenerateClick}
              disabled={!jobContext.jobDescription.trim() || isLoading}
              className={buttonClass}
            >
              <SparklesIcon className="h-5 w-5 mr-2" />
              {isGenerating ? 'Generating...' : 'Get Questions'}
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-gray-100 p-6 rounded-xl border border-gray-200 shadow-lg animate-fade-in">
            <h3 className="text-2xl font-bold text-gray-900">Question bank by AI</h3>
            <p className="text-gray-500 mt-1">For {role} <span role="img" aria-label="edit icon">✍️</span></p>

            <div className="mt-8">
              <h4 className="font-semibold text-gray-800 mb-2">Personalised questions <span role="img" aria-label="crown icon">👑</span></h4>
              <p className="text-sm text-gray-500 mb-4">Specific questions based on your resume</p>
              <div className="space-y-3">
                  {questions.map((q, index) => (
                      <button
                          key={index}
                          onClick={() => setSelectedQuestionIndex(index)}
                          className="w-full text-left p-4 rounded-xl bg-white border border-gray-200 hover:border-indigo-400 hover:shadow-md transition-all duration-200 flex justify-between items-center"
                      >
                          <p className="font-semibold text-gray-800 pr-4"><span className="font-light text-gray-500">Q.</span> {q.question}</p>
                          <ChevronRightIcon className="h-5 w-5 text-gray-400 flex-shrink-0" />
                      </button>
                  ))}
              </div>
            </div>

            <div className="mt-6 text-center border-t border-gray-200 pt-5">
                <button
                    onClick={onGenerateMore}
                    disabled={isLoading}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 disabled:bg-gray-200 disabled:text-gray-400 transition-colors"
                >
                    {isGeneratingMore ? (
                        <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-500 mr-2"></div>
                            Generating...
                        </>
                    ) : (
                        <>
                            <RefreshIcon className="h-4 w-4 mr-2" />
                            Generate More
                        </>
                    )}
                </button>
            </div>
        </div>
      )}

      {isGenerating && (
        <div className="text-center p-6">
          <div className="loader mx-auto" style={{width: '24px', height: '24px', borderWidth: '3px'}}></div>
          <p className="mt-3 text-sm text-gray-400">Generating personalized interview questions...</p>
        </div>
      )}

      {selectedQuestionIndex !== null && questions && questions[selectedQuestionIndex] && (
        <QuestionViewerModal
          question={questions[selectedQuestionIndex]}
          onClose={handleCloseModal}
          onNext={handleNextQuestion}
          onPrev={handlePrevQuestion}
          isFirst={selectedQuestionIndex === 0}
          isLast={selectedQuestionIndex === questions.length - 1}
        />
      )}
    </div>
  );
};

export default InterviewCoach;