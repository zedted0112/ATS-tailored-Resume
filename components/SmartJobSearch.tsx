
import React, { useState, useEffect } from 'react';
import type { Job } from '../types';
import { BriefcaseIcon, SparklesIcon, ArrowTopRightOnSquareIcon } from './icons';

interface SmartJobSearchProps {
  onSearch: () => Promise<void>;
  isSearching: boolean;
  jobs: Job[] | null;
}

const loadingMessages = [
  "Scanning job boards...",
  "Matching your skills and experience...",
  "Analyzing market trends...",
  "Identifying top opportunities...",
  "Curating your personalized job list...",
  "Finalizing recommendations..."
];

const SmartJobSearch: React.FC<SmartJobSearchProps> = ({ onSearch, isSearching, jobs }) => {
    const [currentMessageIndex, setCurrentMessageIndex] = useState(0);

    useEffect(() => {
      if (isSearching) {
        setCurrentMessageIndex(0); // Reset on start
        const interval = setInterval(() => {
          setCurrentMessageIndex(prevIndex => {
            const nextIndex = prevIndex + 1;
            if (nextIndex >= loadingMessages.length) {
              clearInterval(interval);
              return prevIndex;
            }
            return nextIndex;
          });
        }, 2000);

        return () => clearInterval(interval);
      }
    }, [isSearching]);

    const buttonClass = "inline-flex items-center justify-center w-full px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-gray-900 bg-teal-400 hover:bg-teal-300 disabled:bg-gray-600 disabled:text-gray-400 transition-colors";

    return (
    <div className="bg-gray-800 p-4 rounded-xl border border-gray-700 shadow-lg shadow-black/20">
      <div className="flex items-center space-x-2">
        <BriefcaseIcon className="h-6 w-6 text-gray-300" />
        <h3 className="text-base font-semibold text-gray-200">Smart Job Search</h3>
      </div>
        {!jobs && !isSearching && (
            <div className="text-center py-6">
                <p className="text-sm text-gray-400 mb-4">
                    Let your AI co-pilot scan for roles that match your unique skills and experience.
                </p>
                <button onClick={onSearch} disabled={isSearching} className={buttonClass}>
                    <SparklesIcon className="h-5 w-5 mr-2" />
                    Find Matching Jobs
                </button>
            </div>
        )}
        
        {isSearching && (
             <div className="text-center p-6 transition-all duration-300">
                <div className="loader mx-auto mb-4" style={{width: '32px', height: '32px', borderWidth: '4px'}}></div>
                <p className="text-sm text-gray-400 font-medium animate-pulse">{loadingMessages[currentMessageIndex]}</p>
            </div>
        )}

        {jobs && !isSearching && (
            <div className="mt-4">
                {jobs.length === 0 ? (
                    <p className="text-sm text-center text-gray-400 py-6">
                        No matching jobs found at this time. Try updating your resume and searching again.
                    </p>
                ) : (
                    <div className="space-y-4">
                        {jobs.map((job, index) => {
                             const searchQuery = encodeURIComponent(`"${job.title}" at "${job.company}"`);
                             return (
                                <div key={index} className="bg-gray-700/50 p-4 rounded-lg border border-gray-600">
                                    <h4 className="font-bold text-teal-300">{job.title}</h4>
                                    <p className="text-sm font-medium text-gray-300">{job.company}</p>
                                    <p className="text-xs text-gray-400 mb-2">{job.location}</p>
                                    
                                    <div className="text-xs border-l-2 border-gray-500 pl-3 my-3">
                                        <p className="font-semibold text-gray-300">Why it's a match:</p>
                                        <p className="text-gray-400 italic">{job.matchReason}</p>
                                    </div>
                                    
                                    <div className="flex items-center space-x-3 mt-4">
                                        <a 
                                            href={job.url} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center text-sm font-bold text-gray-900 bg-teal-400 hover:bg-teal-300 rounded-md px-3 py-1.5 transition-colors"
                                        >
                                            View & Apply
                                        </a>
                                        <a 
                                            href={`https://www.google.com/search?q=${searchQuery}`}
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            title="Search for this job on Google"
                                            className="inline-flex items-center text-xs font-medium text-gray-400 hover:text-teal-300 rounded-md px-3 py-1.5 border border-gray-600 hover:border-gray-500 bg-gray-700 transition-colors"
                                        >
                                            Search
                                            <ArrowTopRightOnSquareIcon className="h-3 w-3 ml-1.5" />
                                        </a>
                                    </div>
                                </div>
                             );
                        })}
                    </div>
                )}
                 <div className="text-center mt-4 border-t border-gray-700 pt-4">
                    <button onClick={onSearch} disabled={isSearching} className={`${buttonClass} w-auto`}>
                        <SparklesIcon className="h-5 w-5 mr-2" />
                        Search Again
                    </button>
                </div>
            </div>
        )}
    </div>
    );
};

export default SmartJobSearch;
