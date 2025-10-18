
import React, { useState, useEffect } from 'react';
import { Template } from './types';
import type { ResumeData, AtsFeedbackItem, AtsAction, TailorResult, AppliedTailorSuggestions } from './types';
import { initialResumeData } from './constants';
import ResumeUploader from './components/ResumeUploader';
import ResumeEditor from './components/ResumeEditor';
import ResumePreview from './components/ResumePreview';
import LoadingOverlay from './components/LoadingOverlay';
import { DownloadIcon, EditIcon } from './components/icons';
import { parseResume, getAtsFeedback, tailorResume } from './services/geminiService';
import { generatePdf } from './services/pdfGenerator';
import AtsScore from './components/AtsScore';
import JobTailor from './components/JobTailor';


const App: React.FC = () => {
  const [resumeData, setResumeData] = useState<ResumeData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // App UI State
  const [template, setTemplate] = useState<Template>(Template.PROFESSIONAL);
  const [isEditing, setIsEditing] = useState(true);

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


  const handleUpload = async (text: string) => {
    setIsLoading(true);
    setError(null);
    setAtsFeedback(null);
    setTailorResult(null);
    try {
      const data = await parseResume(text);
      setResumeData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred during parsing.");
      console.error(err);
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
        // Deep copy to avoid mutation issues
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
  
  const handleTailor = async (jobDescription: string) => {
    if (!resumeData) return;
    setIsTailoring(true);
    setTailorResult(null);
    try {
        const result = await tailorResume(resumeData, jobDescription);
        setTailorResult(result);
        setAppliedSuggestions({ summary: false, keywords: [], experience: [], projects: [] });
    } catch(err) {
        alert("Failed to get tailoring suggestions. Please try again.");
    } finally {
        setIsTailoring(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!resumeData) return;
    try {
        const doc = await generatePdf(resumeData, template);
        doc.save(`${resumeData.personalInfo.name.replace(' ', '_')}_Resume.pdf`);
    } catch (e) {
        alert(`Could not generate PDF. ${e instanceof Error ? e.message : ''}`);
    }
  };

  // Uncomment to load initial data for development
  // useEffect(() => {
  //   setResumeData(initialResumeData);
  // }, []);
  
  if (isLoading) {
    return <LoadingOverlay />;
  }

  if (!resumeData) {
    return (
      <main className="bg-slate-50 min-h-screen py-20">
        <ResumeUploader onUpload={handleUpload} />
        {error && <p className="mt-4 text-center text-red-600">{error}</p>}
         <div className="text-center mt-8">
            <button onClick={() => setResumeData(initialResumeData)} className="text-sm text-slate-500 hover:text-slate-700">
                Or, start with sample data
            </button>
        </div>
      </main>
    );
  }

  return (
    <div className="bg-slate-100 min-h-screen font-sans">
      <header className="bg-white/80 backdrop-blur-lg sticky top-0 z-30 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex justify-between items-center">
            <h1 className="text-xl font-bold text-slate-800">AI Resume Builder</h1>
            <div className="flex items-center space-x-4">
                <button 
                    onClick={() => setIsEditing(!isEditing)} 
                    className={`flex items-center space-x-2 px-4 py-2 text-sm font-medium rounded-lg border transition-colors ${isEditing ? 'bg-blue-100 text-blue-700 border-blue-200' : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'}`}
                >
                    <EditIcon className="h-5 w-5" />
                    <span>{isEditing ? 'Live Edit Mode' : 'View Mode'}</span>
                </button>
                <button
                    onClick={handleDownloadPdf}
                    className="flex items-center space-x-2 px-4 py-2 text-sm font-medium rounded-lg border border-transparent text-white bg-blue-600 hover:bg-blue-700"
                >
                    <DownloadIcon className="h-5 w-5" />
                    <span>Download PDF</span>
                </button>
            </div>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-4 bg-white rounded-xl shadow-sm border border-slate-200 p-6 overflow-y-auto" style={{maxHeight: 'calc(100vh - 100px)'}}>
           <ResumeEditor resumeData={resumeData} setResumeData={setResumeData} />
        </div>
        <div className="lg:col-span-5">
            <ResumePreview data={resumeData} setData={setResumeData} template={template} setTemplate={setTemplate} isEditing={isEditing} />
        </div>
        <div className="lg:col-span-3 space-y-6">
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
            />
        </div>
      </main>
    </div>
  );
};

export default App;
