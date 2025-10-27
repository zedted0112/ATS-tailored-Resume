
import React from 'react';
import type { CompanyBriefing } from '../types';
import { RocketLaunchIcon, QuestionMarkCircleIcon, BuildingOffice2Icon, SparklesIcon } from './icons';

interface AdvancedCoachProps {
  onGenerateElevatorPitch: () => Promise<void>;
  isGeneratingElevatorPitch: boolean;
  elevatorPitch: string | null;
  onGenerateSmartQuestions: () => Promise<void>;
  isGeneratingSmartQuestions: boolean;
  smartQuestions: string[] | null;
  onGenerateCompanyBriefing: () => Promise<void>;
  isGeneratingCompanyBriefing: boolean;
  companyBriefing: CompanyBriefing | null;
  jobContext: { jobDescription: string; companyName: string };
  setJobContext: React.Dispatch<React.SetStateAction<{ jobDescription: string; companyName: string }>>;
}

const LoadingSpinner: React.FC = () => (
    <div className="loader mx-auto" style={{width: '24px', height: '24px', borderWidth: '3px', borderTopColor: '#2DD4BF'}}></div>
);

const Section: React.FC<{ icon: React.ReactNode; title: string; description: string; children: React.ReactNode }> = ({ icon, title, description, children }) => (
    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-lg">
        <div className="flex items-center space-x-3">
            <div className="text-gray-500">{icon}</div>
            <h3 className="text-2xl font-bold text-gray-900">{title}</h3>
        </div>
        <p className="text-sm text-gray-500 mt-1 mb-4">{description}</p>
        {children}
    </div>
);

const AdvancedCoach: React.FC<AdvancedCoachProps> = ({
  onGenerateElevatorPitch, isGeneratingElevatorPitch, elevatorPitch,
  onGenerateSmartQuestions, isGeneratingSmartQuestions, smartQuestions,
  onGenerateCompanyBriefing, isGeneratingCompanyBriefing, companyBriefing,
  jobContext, setJobContext
}) => {
  
  const isLoading = isGeneratingElevatorPitch || isGeneratingSmartQuestions || isGeneratingCompanyBriefing;
  const buttonClass = "inline-flex items-center px-5 py-2.5 border border-transparent text-sm font-bold rounded-lg text-gray-900 bg-teal-400 hover:bg-teal-500 disabled:bg-gray-300 disabled:text-gray-500 transition-colors";
  const lightInputClass = "w-full p-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition duration-150 ease-in-out text-sm text-gray-800 placeholder-gray-400";


  return (
    <div className="space-y-6">
      {/* Unified Context Input */}
      <Section 
        icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>}
        title="Advanced Prep"
        description="Provide the job description and company name once. The tools below will use this information to generate tailored content."
      >
        <div className="space-y-3">
            <textarea
              value={jobContext.jobDescription}
              onChange={(e) => setJobContext(prev => ({ ...prev, jobDescription: e.target.value }))}
              placeholder="Paste job description here..."
              className={`${lightInputClass} h-32`}
              disabled={isLoading}
            />
            <input 
                type="text" 
                value={jobContext.companyName}
                onChange={(e) => setJobContext(prev => ({ ...prev, companyName: e.target.value }))}
                placeholder="Company Name (for questions and research)"
                className={lightInputClass}
                disabled={isLoading}
            />
        </div>
      </Section>

      {/* Elevator Pitch */}
      <Section
        icon={<RocketLaunchIcon className="h-6 w-6" />}
        title="Elevator Pitch Crafter"
        description='Generate a "Tell me about yourself" answer based on the context above.'
      >
        <div className="text-right">
            <button
                onClick={() => onGenerateElevatorPitch()}
                disabled={!jobContext.jobDescription.trim() || isGeneratingElevatorPitch}
                className={buttonClass}
            >
                <SparklesIcon className="h-5 w-5 mr-2" />
                {isGeneratingElevatorPitch ? 'Crafting...' : 'Craft My Pitch'}
            </button>
        </div>
        {isGeneratingElevatorPitch && <div className="text-center p-4"><LoadingSpinner /></div>}
        {elevatorPitch && !isGeneratingElevatorPitch && (
            <div className="mt-4 animate-fade-in">
                 <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed bg-gray-50 p-4 rounded-md border border-gray-200">{elevatorPitch}</p>
            </div>
        )}
      </Section>

      {/* Smart Questions */}
       <Section
        icon={<QuestionMarkCircleIcon className="h-6 w-6" />}
        title="Smart Questions to Ask"
        description="Generate insightful questions to ask your interviewer."
      >
        <div className="text-right">
            <button
                onClick={() => onGenerateSmartQuestions()}
                disabled={!jobContext.jobDescription.trim() || !jobContext.companyName.trim() || isGeneratingSmartQuestions}
                className={buttonClass}
            >
                <SparklesIcon className="h-5 w-5 mr-2" />
                {isGeneratingSmartQuestions ? 'Generating...' : 'Generate Questions'}
            </button>
        </div>
        {isGeneratingSmartQuestions && <div className="text-center p-4"><LoadingSpinner /></div>}
        {smartQuestions && !isGeneratingSmartQuestions && (
            <div className="mt-4 animate-fade-in">
                 <ul className="text-sm text-gray-700 list-disc list-inside space-y-2 bg-gray-50 p-4 rounded-md border border-gray-200">
                    {smartQuestions.map((q, i) => <li key={i}>{q}</li>)}
                 </ul>
            </div>
        )}
      </Section>

      {/* Company Briefing */}
      <Section
        icon={<BuildingOffice2Icon className="h-6 w-6" />}
        title="AI Company Briefing"
        description="Get a research briefing on the company, powered by Google Search."
      >
        <div className="text-right">
            <button
                onClick={() => onGenerateCompanyBriefing()}
                disabled={!jobContext.companyName.trim() || isGeneratingCompanyBriefing}
                className={buttonClass}
            >
                 <SparklesIcon className="h-5 w-5 mr-2" />
                {isGeneratingCompanyBriefing ? 'Researching...' : 'Get Briefing'}
            </button>
        </div>
        {isGeneratingCompanyBriefing && <div className="text-center p-4"><LoadingSpinner /></div>}
        {companyBriefing && !isGeneratingCompanyBriefing && (
            <div className="mt-4 animate-fade-in text-sm text-gray-700 space-y-4 bg-gray-50 p-4 rounded-md border border-gray-200">
                <div className="prose prose-sm max-w-none whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: companyBriefing.content.replace(/<br>/g, '\n') }}>
                </div>
                 {companyBriefing.sources.length > 0 && (
                    <div>
                        <h4 className="font-semibold text-xs uppercase tracking-wider text-gray-500 border-t border-gray-200 pt-3">Sources</h4>
                        <ul className="text-xs list-disc list-inside mt-2 space-y-1">
                            {companyBriefing.sources.map(source => (
                                <li key={source.uri}>
                                    <a href={source.uri} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline break-all">
                                        {source.title}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>
                 )}
            </div>
        )}
      </Section>
    </div>
  );
};

export default AdvancedCoach;