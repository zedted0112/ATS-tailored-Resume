import React, { useState } from 'react';
import type { ResumeData, TailorResult, AppliedTailorSuggestions, TailorSuggestion } from '../types';
import { SparklesIcon, PlusIcon, CheckIcon } from './icons';

interface JobTailorProps {
  resumeData: ResumeData | null;
  setResumeData: React.Dispatch<React.SetStateAction<ResumeData | null>>;
  onTailor: (jobDescription: string) => Promise<void>;
  isTailoring: boolean;
  tailorResult: TailorResult | null;
  appliedSuggestions: AppliedTailorSuggestions;
  setAppliedSuggestions: React.Dispatch<React.SetStateAction<AppliedTailorSuggestions>>;
}

const JobTailor: React.FC<JobTailorProps> = ({ 
    resumeData, setResumeData, onTailor, isTailoring, tailorResult, appliedSuggestions, setAppliedSuggestions
}) => {
  const [jobDescription, setJobDescription] = useState('');

  const handleTailorClick = () => {
    if (jobDescription.trim()) {
      onTailor(jobDescription);
    }
  };

  const handleApplySummary = () => {
    if (!tailorResult) return;
    setResumeData(prev => prev ? { ...prev, summary: tailorResult.summarySuggestion } : null);
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
    setResumeData(prev => {
        if (!prev) return null;
        const newData = JSON.parse(JSON.stringify(prev));
        const { experienceIndex, projectIndex, descriptionIndex, suggestion: newText } = suggestion;

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

  return (
    <div>
        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
            <h3 className="text-base font-semibold text-slate-800 mb-2">Tailor for a Job</h3>
            <p className="text-sm text-slate-600 mb-3">
                Paste a job description below, and our AI will suggest improvements to align your resume with the role.
            </p>
            <textarea
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Paste job description here..."
                className="w-full h-32 p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition duration-150 ease-in-out text-sm"
                disabled={isTailoring}
            />
            <div className="mt-3 text-right">
                <button
                onClick={handleTailorClick}
                disabled={!jobDescription.trim() || isTailoring}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400"
                >
                <SparklesIcon className="h-5 w-5 mr-2" />
                {isTailoring ? 'Analyzing...' : 'Get Suggestions'}
                </button>
            </div>
        </div>

        {isTailoring && (
            <div className="text-center p-6">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-3 text-sm text-slate-600">Generating tailored suggestions...</p>
            </div>
        )}

        {tailorResult && !isTailoring && (
            <div className="mt-6 space-y-6">
                {/* Summary Suggestion */}
                <div className="bg-white p-4 rounded-lg border border-slate-200">
                    <h4 className="font-semibold text-slate-800">New Summary Suggestion</h4>
                    <p className="mt-2 text-sm text-slate-600 bg-slate-50 p-3 rounded-md">{tailorResult.summarySuggestion}</p>
                    <div className="text-right mt-3">
                        <button 
                            onClick={handleApplySummary} 
                            disabled={appliedSuggestions.summary}
                            className="text-xs font-bold text-blue-600 hover:underline disabled:text-slate-400 disabled:no-underline"
                        >
                            {appliedSuggestions.summary ? 'Applied' : 'Use this summary'}
                        </button>
                    </div>
                </div>

                {/* Missing Keywords */}
                <div className="bg-white p-4 rounded-lg border border-slate-200">
                    <h4 className="font-semibold text-slate-800">Missing Keywords</h4>
                    <div className="flex flex-wrap gap-2 mt-2">
                        {tailorResult.missingKeywords.map(keyword => {
                            const isApplied = appliedSuggestions.keywords.includes(keyword);
                            return (
                                <button 
                                    key={keyword}
                                    onClick={() => handleAddKeyword(keyword)}
                                    disabled={isApplied}
                                    className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 hover:bg-blue-200 disabled:bg-slate-200 disabled:text-slate-500"
                                >
                                    {isApplied ? <CheckIcon className="h-3 w-3 mr-1.5" /> : <PlusIcon className="h-3 w-3 mr-1.5" />}
                                    {keyword}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Experience Suggestions */}
                <div className="bg-white p-4 rounded-lg border border-slate-200">
                    <h4 className="font-semibold text-slate-800">Experience Suggestions</h4>
                    <div className="mt-2 space-y-4">
                        {tailorResult.experienceSuggestions.map((s, i) => {
                            const isApplied = appliedSuggestions.experience.includes(s.original);
                            return (
                                <div key={i} className="text-sm border-t border-slate-100 pt-3">
                                    <p className="text-slate-500"><span className="font-medium text-slate-600">Original:</span> {s.original}</p>
                                    <p className="text-green-700 bg-green-50 p-2 rounded-md mt-1.5"><span className="font-medium text-green-800">Suggestion:</span> {s.suggestion}</p>
                                    <div className="text-right mt-2">
                                         <button onClick={() => handleApplySuggestion(s, 'experience')} disabled={isApplied} className="text-xs font-bold text-blue-600 hover:underline disabled:text-slate-400 disabled:no-underline">
                                            {isApplied ? 'Applied' : 'Apply Suggestion'}
                                         </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
                
                {/* Project Suggestions */}
                {tailorResult.projectSuggestions && tailorResult.projectSuggestions.length > 0 && (
                 <div className="bg-white p-4 rounded-lg border border-slate-200">
                    <h4 className="font-semibold text-slate-800">Project Suggestions</h4>
                    <div className="mt-2 space-y-4">
                        {tailorResult.projectSuggestions.map((s, i) => {
                            const isApplied = appliedSuggestions.projects.includes(s.original);
                            return (
                                <div key={i} className="text-sm border-t border-slate-100 pt-3">
                                    <p className="text-slate-500"><span className="font-medium text-slate-600">Original:</span> {s.original}</p>
                                    <p className="text-green-700 bg-green-50 p-2 rounded-md mt-1.5"><span className="font-medium text-green-800">Suggestion:</span> {s.suggestion}</p>
                                    <div className="text-right mt-2">
                                         <button onClick={() => handleApplySuggestion(s, 'project')} disabled={isApplied} className="text-xs font-bold text-blue-600 hover:underline disabled:text-slate-400 disabled:no-underline">
                                            {isApplied ? 'Applied' : 'Apply Suggestion'}
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