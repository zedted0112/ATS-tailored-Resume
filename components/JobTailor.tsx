
import React, { useState, useEffect } from 'react';
import type { ResumeData, TailorResult, AppliedTailorSuggestions, TailorSuggestion } from '../types';
import { SparklesIcon, PlusIcon, CheckIcon } from './icons';

interface JobTailorProps {
  resumeData: ResumeData | null;
  setResumeData: React.Dispatch<React.SetStateAction<ResumeData | null>>;
  onTailor: () => Promise<void>;
  isTailoring: boolean;
  tailorResult: TailorResult | null;
  appliedSuggestions: AppliedTailorSuggestions;
  setAppliedSuggestions: React.Dispatch<React.SetStateAction<AppliedTailorSuggestions>>;
  jobContext: { jobDescription: string; companyName: string };
  setJobContext: React.Dispatch<React.SetStateAction<{ jobDescription: string; companyName: string }>>;
}

const JobTailor: React.FC<JobTailorProps> = ({ 
    resumeData, setResumeData, onTailor, isTailoring, tailorResult, appliedSuggestions, setAppliedSuggestions, jobContext, setJobContext
}) => {
  const [editableSummary, setEditableSummary] = useState('');
  const [editableSuggestions, setEditableSuggestions] = useState<Record<string, string>>({});

  useEffect(() => {
    if (tailorResult) {
      setEditableSummary(tailorResult.summarySuggestion);
      const allSuggestions = [...tailorResult.experienceSuggestions, ...(tailorResult.projectSuggestions || [])];
      const initialEditableState = allSuggestions.reduce((acc, s) => {
        acc[s.original] = s.suggestion;
        return acc;
      }, {} as Record<string, string>);
      setEditableSuggestions(initialEditableState);
    }
  }, [tailorResult]);

  const handleTailorClick = () => {
    if (jobContext.jobDescription.trim()) {
      onTailor();
    }
  };

  const handleApplySummary = () => {
    setResumeData(prev => prev ? { ...prev, summary: editableSummary } : null);
    setAppliedSuggestions(prev => ({ ...prev, summary: true }));
  };
  
  const handleAddKeyword = (keyword: string) => {
    setResumeData(prev => {
        if (!prev) return null;
        const newSkills = [...(prev.skills || [])];
        if (!newSkills.includes(keyword)) {
            newSkills.push(keyword);
        }
        return { ...prev, skills: newSkills };
    });
    setAppliedSuggestions(prev => ({ ...prev, keywords: [...prev.keywords, keyword] }));
  };

  const handleApplySuggestion = (suggestion: TailorSuggestion, type: 'experience' | 'project') => {
    const newText = editableSuggestions[suggestion.original] || suggestion.suggestion;
    setResumeData(prev => {
        if (!prev) return null;
        const newData = JSON.parse(JSON.stringify(prev));
        const { experienceIndex, projectIndex, descriptionIndex } = suggestion;

        if (type === 'experience' && typeof experienceIndex === 'number' && typeof descriptionIndex === 'number') {
            if (newData.experience[experienceIndex]?.description[descriptionIndex]) {
                newData.experience[experienceIndex].description[descriptionIndex] = newText;
            }
        } else if (type === 'project' && typeof projectIndex === 'number' && typeof descriptionIndex === 'number') {
             if (newData.projects[projectIndex]?.description[descriptionIndex]) {
                newData.projects[projectIndex].description[descriptionIndex] = newText;
            }
        }
        return newData;
    });

    if (type === 'experience') {
         setAppliedSuggestions(prev => ({ ...prev, experience: [...prev.experience, suggestion.original] }));
    } else {
         setAppliedSuggestions(prev => ({ ...prev, projects: [...prev.projects, suggestion.original] }));
    }
  };
  
  const handleSuggestionChange = (original: string, newSuggestion: string) => {
    setEditableSuggestions(prev => ({ ...prev, [original]: newSuggestion }));
  };

  const buttonClass = "inline-flex items-center px-5 py-2.5 border border-transparent text-sm font-bold rounded-lg text-white bg-gray-800 hover:bg-gray-700 disabled:bg-gray-400 disabled:text-gray-200 transition-colors";
  const lightInputClass = "w-full p-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition duration-150 ease-in-out text-sm text-gray-800 placeholder-gray-400";

  return (
    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-lg">
        <h3 className="text-2xl font-bold text-gray-900">Mission Tailoring</h3>
        <p className="text-sm text-gray-500 mt-1 mb-4">
            Paste a job description to align your resume with the role.
        </p>
        <textarea
            value={jobContext.jobDescription}
            onChange={(e) => setJobContext(prev => ({...prev, jobDescription: e.target.value}))}
            placeholder="Paste job description here..."
            className={`${lightInputClass} h-32`}
            disabled={isTailoring}
        />
        <div className="mt-3 text-right">
            <button
            onClick={handleTailorClick}
            disabled={!jobContext.jobDescription.trim() || isTailoring}
            className={buttonClass}
            >
            <SparklesIcon className="h-5 w-5 mr-2 text-gray-400" />
            {isTailoring ? 'Analyzing...' : 'Get Suggestions'}
            </button>
        </div>

        {isTailoring && (
            <div className="text-center p-6">
                <div className="loader mx-auto" style={{width: '24px', height: '24px', borderWidth: '3px', borderTopColor: '#2DD4BF'}}></div>
                <p className="mt-3 text-sm text-gray-500">Generating tailored suggestions...</p>
            </div>
        )}

        {tailorResult && !isTailoring && (
            <div className="mt-6 space-y-6 animate-fade-in">
                {/* Summary Suggestion */}
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <h4 className="font-semibold text-gray-800">New Summary Suggestion</h4>
                    <textarea 
                        value={editableSummary} 
                        onChange={(e) => setEditableSummary(e.target.value)}
                        className="w-full bg-gray-100/60 p-2 rounded-md mt-2 text-sm text-gray-700 focus:ring-1 focus:ring-indigo-500 border-gray-300"
                        rows={4}
                        disabled={appliedSuggestions.summary}
                    />
                    <div className="text-right mt-3">
                        <button 
                            onClick={handleApplySummary} 
                            disabled={appliedSuggestions.summary}
                            className="text-xs font-bold text-indigo-600 hover:underline disabled:text-gray-500 disabled:no-underline"
                        >
                            {appliedSuggestions.summary ? '✓ Applied' : 'Use this summary'}
                        </button>
                    </div>
                </div>

                {/* Missing Keywords */}
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <h4 className="font-semibold text-gray-800">Missing Keywords</h4>
                    <div className="flex flex-wrap gap-2 mt-2">
                        {tailorResult.missingKeywords.map(keyword => {
                            const isApplied = appliedSuggestions.keywords.includes(keyword);
                            return (
                                <button 
                                    key={keyword}
                                    onClick={() => handleAddKeyword(keyword)}
                                    disabled={isApplied}
                                    className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 hover:bg-indigo-200 disabled:bg-gray-200 disabled:text-gray-500"
                                >
                                    {isApplied ? <CheckIcon className="h-3 w-3 mr-1.5" /> : <PlusIcon className="h-3 w-3 mr-1.5" />}
                                    {keyword}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Experience Suggestions */}
                {tailorResult.experienceSuggestions.length > 0 && (
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <h4 className="font-semibold text-gray-800">Experience Suggestions</h4>
                    <div className="mt-2 space-y-4">
                        {tailorResult.experienceSuggestions.map((s, i) => {
                            const isApplied = appliedSuggestions.experience.includes(s.original);
                            return (
                                <div key={i} className="text-sm border-t border-gray-200 pt-3">
                                    <p className="text-gray-500"><span className="font-medium text-gray-600">Original:</span> {s.original}</p>
                                    <textarea 
                                        value={editableSuggestions[s.original] || ''}
                                        onChange={(e) => handleSuggestionChange(s.original, e.target.value)}
                                        className="w-full bg-gray-100/60 p-2 rounded-md mt-1.5 text-indigo-700 focus:ring-1 focus:ring-indigo-500 border-gray-300"
                                        rows={2}
                                        disabled={isApplied}
                                    />
                                    <div className="text-right mt-2">
                                         <button onClick={() => handleApplySuggestion(s, 'experience')} disabled={isApplied} className="text-xs font-bold text-indigo-600 hover:underline disabled:text-gray-500 disabled:no-underline">
                                            {isApplied ? '✓ Applied' : 'Apply Suggestion'}
                                         </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
                )}
                
                {/* Project Suggestions */}
                {tailorResult.projectSuggestions && tailorResult.projectSuggestions.length > 0 && (
                 <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <h4 className="font-semibold text-gray-800">Project Suggestions</h4>
                    <div className="mt-2 space-y-4">
                        {tailorResult.projectSuggestions.map((s, i) => {
                            const isApplied = appliedSuggestions.projects.includes(s.original);
                            return (
                                <div key={i} className="text-sm border-t border-gray-200 pt-3">
                                    <p className="text-gray-500"><span className="font-medium text-gray-600">Original:</span> {s.original}</p>
                                    <textarea
                                        value={editableSuggestions[s.original] || ''}
                                        onChange={(e) => handleSuggestionChange(s.original, e.target.value)}
                                        className="w-full bg-gray-100/60 p-2 rounded-md mt-1.5 text-indigo-700 focus:ring-1 focus:ring-indigo-500 border-gray-300"
                                        rows={2}
                                        disabled={isApplied}
                                    />
                                    <div className="text-right mt-2">
                                         <button onClick={() => handleApplySuggestion(s, 'project')} disabled={isApplied} className="text-xs font-bold text-indigo-600 hover:underline disabled:text-gray-500 disabled:no-underline">
                                            {isApplied ? '✓ Applied' : 'Apply Suggestion'}
                                         </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
                )}
            </div>
        )}
    </div>
  );
};

export default JobTailor;