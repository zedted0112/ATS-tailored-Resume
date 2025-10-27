
import React, { useState, useEffect } from 'react';
import { Template } from './types';
import type { ResumeData, AtsFeedbackItem, AtsAction, TailorResult, AppliedTailorSuggestions, InterviewQuestion, CompanyBriefing } from './types';
import { initialResumeData } from './constants';
import ResumeUploader from './components/ResumeUploader';
import ResumeEditor from './components/ResumeEditor';
import ResumePreview from './components/ResumePreview';
import LoadingOverlay from './components/LoadingOverlay';
import { DownloadIcon, EditIcon, SparklesIcon, AcademicCapIcon, RocketLaunchIcon, SunIcon, MoonIcon, BriefcaseIcon } from './components/icons';
import { parseResume, getAtsFeedback, tailorResume, getInterviewQuestions, generateElevatorPitch, generateSmartQuestions, generateCompanyBriefing } from './services/geminiService';
import { generatePdf } from './services/pdfGenerator';
import AtsScore from './components/AtsScore';
import JobTailor from './components/JobTailor';
import InterviewCoach from './components/InterviewCoach';
import AdvancedCoach from './components/AdvancedCoach';


const App: React.FC = () => {
  const [resumeData, setResumeData] = useState<ResumeData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // App UI State
  const [mainView, setMainView] = useState<'resume' | 'tools'>('resume');
  const [template, setTemplate] = useState<Template>(Template.PROFESSIONAL);
  const [isEditing, setIsEditing] = useState(true);
  const [activeToolTab, setActiveToolTab] = useState<'analysis' | 'interview' | 'advanced'>('analysis');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  // Shared context for tools
  const [sharedJobContext, setSharedJobContext] = useState({
    jobDescription: '',
    companyName: '',
  });

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove(theme === 'light' ? 'dark' : 'light');
    root.classList.add(theme);
  }, [theme]);


  // ATS State
  const [isCheckingAts, setIsCheckingAts] = useState(false);
  const [atsFeedback, setAtsFeedback] = useState<AtsFeedbackItem[] | null>(null);
  const [appliedAtsSuggestions, setAppliedAtsSuggestions] = useState<string[]>([]);

  // Tailoring State
  const [isTailoring, setIsTailoring] = useState(false);
  const [tailorResult, setTailorResult] = useState<TailorResult | null>(null);
  const [appliedSuggestions, setAppliedSuggestions] = useState<AppliedTailorSuggestions>({
    summary: false,
    keywords: [],
    experience: [],
    projects: [],
  });

  // Interview Coach State
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(false);
  const [isGeneratingMoreQuestions, setIsGeneratingMoreQuestions] = useState(false);
  const [interviewQuestions, setInterviewQuestions] = useState<InterviewQuestion[] | null>(null);
  
  // Advanced Coach State
  const [elevatorPitch, setElevatorPitch] = useState<string | null>(null);
  const [isGeneratingPitch, setIsGeneratingPitch] = useState(false);
  const [smartQuestions, setSmartQuestions] = useState<string[] | null>(null);
  const [isGeneratingSmartQuestions, setIsGeneratingSmartQuestions] = useState(false);
  const [companyBriefing, setCompanyBriefing] = useState<CompanyBriefing | null>(null);
  const [isGeneratingBriefing, setIsGeneratingBriefing] = useState(false);


  const handleUpload = async (text: string) => {
    setIsLoading(true);
    setError(null);
    setAtsFeedback(null);
    setTailorResult(null);
    setInterviewQuestions(null);
    setElevatorPitch(null);
    setSmartQuestions(null);
    setCompanyBriefing(null);
    try {
      const data = await parseResume(text);
      setResumeData(data);
      setMainView('resume'); // Default to resume view after upload
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred during parsing.");
      setResumeData(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAtsCheck = async () => {
    if (!resumeData) return;
    setIsCheckingAts(true);
    setAtsFeedback(null);
    try {
        const feedback = await getAtsFeedback(resumeData);
        setAtsFeedback(feedback);
        setAppliedAtsSuggestions([]);
    } catch(err) {
        alert("Failed to get ATS feedback. Please try again.");
    } finally {
        setIsCheckingAts(false);
    }
  };

  const handleApplyAtsSuggestion = (action: AtsAction) => {
    const { type, payload } = action;
    const { section, field, index, descriptionIndex, original, suggestion } = payload;

    setResumeData(prev => {
        if (!prev) return null;
        const newData = JSON.parse(JSON.stringify(prev));

        if (type === 'REPLACE_FIELD') {
            if (section === 'personalInfo' && field && field in newData.personalInfo) {
                (newData.personalInfo as any)[field] = suggestion;
            } else if (section === 'summary') {
                newData.summary = suggestion;
            }
        } else if (type === 'REPLACE_IN_ARRAY') {
            if (typeof index === 'number' && field && Array.isArray(newData[section as keyof ResumeData])) {
                const sectionArray = newData[section as 'experience' | 'education' | 'projects'];
                if (sectionArray[index]) {
                    if (field === 'description' && typeof descriptionIndex === 'number') {
                         (sectionArray[index] as any).description[descriptionIndex] = suggestion;
                    } else {
                        (sectionArray[index] as any)[field] = suggestion;
                    }
                }
            }
        }
        return newData;
    });

    if(original) {
        setAppliedAtsSuggestions(prev => [...prev, original]);
    }
  };
  
  const handleTailor = async () => {
    if (!resumeData || !sharedJobContext.jobDescription) return;
    setIsTailoring(true);
    setTailorResult(null);
    try {
        const result = await tailorResume(resumeData, sharedJobContext.jobDescription);
        setTailorResult(result);
        setAppliedSuggestions({ summary: false, keywords: [], experience: [], projects: [] });
    } catch(err) {
        alert("Failed to get tailoring suggestions. Please try again.");
    } finally {
        setIsTailoring(false);
    }
  };

  const handleGenerateInterviewQuestions = async () => {
    if (!resumeData || !sharedJobContext.jobDescription) return;
    setIsGeneratingQuestions(true);
    setInterviewQuestions(null);
    try {
        const questions = await getInterviewQuestions(resumeData, sharedJobContext.jobDescription);
        setInterviewQuestions(questions);
    } catch(err) {
        alert("Failed to get interview questions. Please try again.");
    } finally {
        setIsGeneratingQuestions(false);
    }
  };

  const handleGenerateMoreInterviewQuestions = async () => {
    if (!resumeData || !sharedJobContext.jobDescription || !interviewQuestions) return;
    setIsGeneratingMoreQuestions(true);
    try {
        const moreQuestions = await getInterviewQuestions(resumeData, sharedJobContext.jobDescription, interviewQuestions);
        setInterviewQuestions(prev => prev ? [...prev, ...moreQuestions] : moreQuestions);
    } catch(err) {
        alert("Failed to get more interview questions. Please try again.");
    } finally {
        setIsGeneratingMoreQuestions(false);
    }
  };

  const handleGenerateElevatorPitch = async () => {
    if (!resumeData || !sharedJobContext.jobDescription) return;
    setIsGeneratingPitch(true);
    setElevatorPitch(null);
    try {
        const pitch = await generateElevatorPitch(resumeData, sharedJobContext.jobDescription);
        setElevatorPitch(pitch);
    } catch(err) {
        alert("Failed to generate elevator pitch. Please try again.");
    } finally {
        setIsGeneratingPitch(false);
    }
  };

  const handleGenerateSmartQuestions = async () => {
     if (!resumeData || !sharedJobContext.jobDescription || !sharedJobContext.companyName) return;
     setIsGeneratingSmartQuestions(true);
     setSmartQuestions(null);
     try {
        const questions = await generateSmartQuestions(sharedJobContext.jobDescription, sharedJobContext.companyName);
        setSmartQuestions(questions);
     } catch(err) {
        alert("Failed to generate smart questions. Please try again.");
     } finally {
        setIsGeneratingSmartQuestions(false);
     }
  };

  const handleGenerateCompanyBriefing = async () => {
    if (!sharedJobContext.companyName) return;
    setIsGeneratingBriefing(true);
    setCompanyBriefing(null);
    try {
      const briefing = await generateCompanyBriefing(sharedJobContext.companyName);
      setCompanyBriefing(briefing);
    } catch (err) {
      alert("Failed to generate company briefing. Please try again.");
    } finally {
      setIsGeneratingBriefing(false);
    }
  };
  
  const handleDownloadPdf = async () => {
    if (!resumeData) return;
    const doc = await generatePdf(resumeData, template);
    doc.save(`${resumeData.personalInfo.name.replace(' ', '_')}_Resume.pdf`);
  };

  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  if (!resumeData && !isLoading) {
    return <ResumeUploader onUpload={handleUpload} />;
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-200">
      {isLoading && <LoadingOverlay />}
      {error && <div className="bg-red-500 text-white p-4 text-center">{error}</div>}
      
      {/* Header */}
      <header className="sticky top-0 z-40 bg-gray-900/70 backdrop-blur-lg border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="flex-shrink-0 text-teal-400">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 pilot-logo-animated" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                </svg>
              </div>
              <h1 className="text-xl font-bold tracking-tight">AI Career Pilot</h1>
            </div>
            
            <div className="hidden md:flex items-center space-x-2 bg-gray-800 p-1 rounded-xl border border-gray-700 shadow-inner">
                <button
                    onClick={() => setMainView('resume')}
                    className={`px-4 py-1.5 text-sm font-semibold rounded-lg transition-colors ${mainView === 'resume' ? 'bg-gray-700 text-teal-300' : 'text-gray-400 hover:bg-gray-700/50 hover:text-gray-200'}`}
                >
                    <div className="flex items-center">
                        <AcademicCapIcon className="h-5 w-5 mr-2" />
                        <span>Resume Studio</span>
                    </div>
                </button>
                <button
                    onClick={() => setMainView('tools')}
                    className={`px-4 py-1.5 text-sm font-semibold rounded-lg transition-colors ${mainView === 'tools' ? 'bg-gray-700 text-teal-300' : 'text-gray-400 hover:bg-gray-700/50 hover:text-gray-200'}`}
                >
                    <div className="flex items-center">
                        <RocketLaunchIcon className="h-5 w-5 mr-2" />
                        <span>Career Co-Pilot</span>
                    </div>
                </button>
            </div>
            
            <div className="flex items-center space-x-3">
              <button onClick={toggleTheme} className="p-2 rounded-full text-gray-400 hover:bg-gray-700 hover:text-gray-200 transition-colors">
                {theme === 'light' ? <MoonIcon className="h-5 w-5" /> : <SunIcon className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </div>
        <div className="md:hidden bg-gray-800/50 border-t border-gray-700">
            <div className="flex justify-around p-1">
                <button
                    onClick={() => setMainView('resume')}
                    className={`w-full py-2 text-sm font-semibold rounded-lg transition-colors flex justify-center items-center ${mainView === 'resume' ? 'bg-gray-700 text-teal-300' : 'text-gray-400'}`}
                >
                     <AcademicCapIcon className="h-5 w-5 mr-2" />
                    <span>Resume Studio</span>
                </button>
                <button
                    onClick={() => setMainView('tools')}
                    className={`w-full py-2 text-sm font-semibold rounded-lg transition-colors flex justify-center items-center ${mainView === 'tools' ? 'bg-gray-700 text-teal-300' : 'text-gray-400'}`}
                >
                    <RocketLaunchIcon className="h-5 w-5 mr-2" />
                    <span>Career Co-Pilot</span>
                </button>
            </div>
        </div>
      </header>

      <main>
        {mainView === 'resume' && resumeData && (
            <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                <div className="lg:sticky top-24">
                  <ResumePreview 
                    data={resumeData}
                    setData={setResumeData}
                    template={template}
                    setTemplate={setTemplate}
                    isEditing={isEditing}
                    showTemplateSelector={true}
                  />
                  <div className="mt-4 flex items-center justify-end space-x-3">
                    <button onClick={() => setIsEditing(!isEditing)} className="flex items-center space-x-2 px-3 py-1.5 text-sm font-medium rounded-lg border bg-gray-700 text-gray-300 border-gray-600 hover:bg-gray-600">
                      <EditIcon className="h-4 w-4" />
                      <span>{isEditing ? 'Lock Edits' : 'Enable Editing'}</span>
                    </button>
                    <button onClick={handleDownloadPdf} className="flex items-center space-x-2 px-3 py-1.5 text-sm font-medium rounded-lg border bg-teal-500 text-gray-900 border-teal-400 hover:bg-teal-400">
                        <DownloadIcon className="h-4 w-4" />
                        <span>Download PDF</span>
                    </button>
                  </div>
                </div>
                <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-lg shadow-black/20">
                    <ResumeEditor resumeData={resumeData} setResumeData={setResumeData} />
                </div>
              </div>
            </div>
        )}

        {mainView === 'tools' && (
            <div className="flex-grow max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
              <div className="lg:max-w-3xl lg:mx-auto w-full">
                <div className="space-y-8">
                  {/* Tool Tabs */}
                  {resumeData && (
                    <div className="bg-gray-800 p-1.5 rounded-xl border border-gray-700 shadow-inner">
                      <div className="grid grid-cols-3 gap-1.5">
                        <button onClick={() => setActiveToolTab('analysis')} className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${activeToolTab === 'analysis' ? 'bg-gray-700 text-teal-300' : 'text-gray-400 hover:bg-gray-700/50 hover:text-gray-200'}`}>
                          ATS & Tailoring
                        </button>
                        <button onClick={() => setActiveToolTab('interview')} className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${activeToolTab === 'interview' ? 'bg-gray-700 text-teal-300' : 'text-gray-400 hover:bg-gray-700/50 hover:text-gray-200'}`}>
                          Interview Coach
                        </button>
                        <button onClick={() => setActiveToolTab('advanced')} className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${activeToolTab === 'advanced' ? 'bg-gray-700 text-teal-300' : 'text-gray-400 hover:bg-gray-700/50 hover:text-gray-200'}`}>
                          Advanced Prep
                        </button>
                      </div>
                    </div>
                  )}
                  
                  {/* Tool Content */}
                  {resumeData ? (
                    <div>
                      {activeToolTab === 'analysis' && (
                        <div className="space-y-6">
                          <AtsScore 
                            onCheck={handleAtsCheck}
                            isChecking={isCheckingAts}
                            feedback={atsFeedback}
                            onApplySuggestion={handleApplyAtsSuggestion}
                            appliedSuggestions={appliedAtsSuggestions}
                          />
                          <JobTailor 
                            resumeData={resumeData} 
                            setResumeData={setResumeData}
                            onTailor={handleTailor}
                            isTailoring={isTailoring}
                            tailorResult={tailorResult}
                            appliedSuggestions={appliedSuggestions}
                            setAppliedSuggestions={setAppliedSuggestions}
                            jobContext={sharedJobContext}
                            setJobContext={setSharedJobContext}
                          />
                        </div>
                      )}
                      {activeToolTab === 'interview' && (
                        <div>
                          <InterviewCoach 
                            onGenerate={handleGenerateInterviewQuestions}
                            isGenerating={isGeneratingQuestions}
                            questions={interviewQuestions}
                            onGenerateMore={handleGenerateMoreInterviewQuestions}
                            isGeneratingMore={isGeneratingMoreQuestions}
                            jobContext={sharedJobContext}
                            setJobContext={setSharedJobContext}
                          />
                        </div>
                      )}
                      {activeToolTab === 'advanced' && (
                        <div>
                            <AdvancedCoach 
                              onGenerateElevatorPitch={handleGenerateElevatorPitch}
                              isGeneratingElevatorPitch={isGeneratingPitch}
                              elevatorPitch={elevatorPitch}
                              onGenerateSmartQuestions={handleGenerateSmartQuestions}
                              isGeneratingSmartQuestions={isGeneratingSmartQuestions}
                              smartQuestions={smartQuestions}
                              onGenerateCompanyBriefing={handleGenerateCompanyBriefing}
                              isGeneratingCompanyBriefing={isGeneratingBriefing}
                              companyBriefing={companyBriefing}
                              jobContext={sharedJobContext}
                              setJobContext={setSharedJobContext}
                            />
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-12 bg-gray-800/50 rounded-xl border border-gray-700">
                      <BriefcaseIcon className="h-12 w-12 mx-auto text-gray-500" />
                      <p className="mt-4 text-gray-400">Please upload a resume to use the Co-Pilot tools.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
        )}
      </main>
    </div>
  );
};

export default App;
