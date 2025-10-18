import React, { useState } from 'react';
import type { ResumeData, TailorResult } from '../types';
import { tailorResumeForJob } from '../services/geminiService';
import { SparklesIcon } from './icons';

interface JobTailorProps {
    resumeData: ResumeData;
    setResumeData: React.Dispatch<React.SetStateAction<ResumeData | null>>;
}

const JobTailor: React.FC<JobTailorProps> = ({ resumeData, setResumeData }) => {
    const [jobDescription, setJobDescription] = useState('');
    const [tailorResult, setTailorResult] = useState<TailorResult | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleAnalyze = async () => {
        if (!jobDescription.trim()) return;
        
        setIsLoading(true);
        setError(null);
        setTailorResult(null);

        try {
            const resumeText = resumeDataToText(resumeData);
            const result = await tailorResumeForJob(resumeText, jobDescription);
            setTailorResult(result);
        } catch (e) {
            console.error("Failed to get tailoring suggestions:", e);
            setError("Sorry, the AI couldn't generate suggestions. This might be a temporary network issue. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const resumeDataToText = (data: ResumeData) => {
        let text = `Name: ${data.personalInfo.name}\n\nSummary: ${data.summary}\n\nSkills: ${data.skills.join(', ')}\n\n`;
        text += "Experience:\n";
        data.experience.forEach(exp => {
            text += `- ${exp.role} at ${exp.company}\n${exp.description.map(d => `  - ${d}`).join('\n')}\n`;
        });
        return text;
    };

    const handleApplySummary = () => {
        if (tailorResult) {
            setResumeData(prev => prev ? { ...prev, summary: tailorResult.suggestedSummary } : null);
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <label htmlFor="job-description" className="block text-sm font-medium text-slate-700">
                    Paste Job Description
                </label>
                <textarea
                    id="job-description"
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    rows={8}
                    className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="Paste the full job description here..."
                />
            </div>
            <div className="text-center">
                <button
                    onClick={handleAnalyze}
                    disabled={isLoading || !jobDescription.trim()}
                    className="inline-flex items-center px-6 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-400"
                >
                    <SparklesIcon className="h-5 w-5 mr-2" />
                    {isLoading ? 'Analyzing...' : 'Get Suggestions'}
                </button>
            </div>

            {error && (
                <div className="text-red-700 bg-red-50 p-3 rounded-lg border border-red-200 text-sm">
                    {error}
                </div>
            )}
            
            {isLoading && (
                 <div className="space-y-4 animate-pulse">
                    <div className="h-6 bg-slate-200 rounded w-1/3"></div>
                    <div className="space-y-2">
                        <div className="h-4 bg-slate-200 rounded"></div>
                        <div className="h-4 bg-slate-200 rounded w-5/6"></div>
                    </div>
                     <div className="h-6 bg-slate-200 rounded w-1/4 mt-4"></div>
                    <div className="flex flex-wrap gap-2">
                        <div className="h-6 bg-slate-200 rounded-full w-24"></div>
                        <div className="h-6 bg-slate-200 rounded-full w-32"></div>
                        <div className="h-6 bg-slate-200 rounded-full w-28"></div>
                    </div>
                </div>
            )}

            {tailorResult && (
                <div className="space-y-6">
                    {/* Suggested Summary */}
                    <div className="bg-blue-50/50 border border-blue-200 p-4 rounded-lg">
                        <h4 className="font-semibold text-slate-800">Suggested Summary</h4>
                        <p className="mt-2 text-sm text-slate-700 italic">"{tailorResult.suggestedSummary}"</p>
                        <button 
                            onClick={handleApplySummary}
                            className="mt-3 text-xs font-semibold text-white bg-blue-500 hover:bg-blue-600 px-3 py-1 rounded-md"
                        >
                            Use this summary
                        </button>
                    </div>

                    {/* Missing Keywords */}
                    <div>
                        <h4 className="font-semibold text-slate-800">Missing Keywords</h4>
                         <p className="text-xs text-slate-500 mb-2">Consider adding these skills from the job description to your resume.</p>
                        <div className="flex flex-wrap gap-2">
                            {tailorResult.missingKeywords.map(keyword => (
                                <span key={keyword} className="text-xs bg-slate-200 text-slate-700 rounded-full px-3 py-1">
                                    {keyword}
                                </span>
                            ))}
                        </div>
                    </div>
                    
                    {/* Experience Suggestions */}
                    <div>
                        <h4 className="font-semibold text-slate-800">Experience Suggestions</h4>
                        <div className="space-y-4 mt-2">
                            {tailorResult.experienceSuggestions.map((suggestion, index) => (
                                <div key={index} className="text-sm border-l-4 border-slate-200 pl-4">
                                    <p className="text-slate-500">
                                        <span className="font-semibold">Original:</span> {suggestion.original}
                                    </p>
                                    <p className="text-blue-700 mt-1">
                                        <span className="font-semibold">Suggestion:</span> {suggestion.suggestion}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default JobTailor;
