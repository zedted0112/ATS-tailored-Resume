import React, { useState, useEffect } from 'react';
import type { ResumeData, AtsResult } from './types';
import { Template } from './types';
import { parseResumeWithGemini, getAtsScoreWithGemini } from './services/geminiService';
import ResumeUploader from './components/ResumeUploader';
import ResumeEditor from './components/ResumeEditor';
import ResumePreview from './components/ResumePreview';
import AtsScore from './components/AtsScore';
import LoadingOverlay from './components/LoadingOverlay';
import JobTailor from './components/JobTailor';
import { DownloadIcon, EditIcon, UploadIcon, EyeIcon, SparklesIcon } from './components/icons';
import { initialResumeData } from './constants';

type AppState = 'upload' | 'loading' | 'edit' | 'error';
type EditorTab = 'editor' | 'tailor';

const App: React.FC = () => {
  const [savedState] = useState(() => {
    try {
      const item = localStorage.getItem('atsResumeBuilderState');
      if (item) {
        return JSON.parse(item);
      }
      return null;
    } catch (error) {
      console.error("Error reading state from localStorage", error);
      return null;
    }
  });

  const [resumeData, setResumeData] = useState<ResumeData | null>(savedState?.resumeData || null);
  const [atsResult, setAtsResult] = useState<AtsResult | null>(savedState?.atsResult || null);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<Template>(savedState?.selectedTemplate || Template.PROFESSIONAL);
  const [appState, setAppState] = useState<AppState>(savedState?.resumeData ? 'edit' : 'upload');
  const [isEditingTemplate, setIsEditingTemplate] = useState(false);
  const [activeTab, setActiveTab] = useState<EditorTab>('editor');

  useEffect(() => {
    if (resumeData && appState === 'edit') {
      const stateToSave = { resumeData, selectedTemplate, atsResult };
      localStorage.setItem('atsResumeBuilderState', JSON.stringify(stateToSave));
    } else if (appState === 'upload') {
      localStorage.removeItem('atsResumeBuilderState');
    }
  }, [resumeData, selectedTemplate, atsResult, appState]);


  const handleResumeUpload = async (resumeText: string) => {
    setAppState('loading');
    setErrorMessage(null);
    setResumeData(null);
    setAtsResult(null);
    setIsEditingTemplate(false);
    setActiveTab('editor');
    try {
      // Step 1: Parse the resume first to show the user the editor ASAP.
      const parsedData = await parseResumeWithGemini(resumeText);
      setResumeData(parsedData);
      setAppState('edit');

      // Step 2: Get the ATS score in the background without blocking the UI.
      getAtsScoreWithGemini(resumeText)
        .then(atsData => {
            setAtsResult(atsData);
        })
        .catch(e => {
            console.error("Failed to get ATS score:", e);
            // Still show something to the user even if ATS score fails
            setAtsResult({ score: 0, feedback: ["Could not retrieve an ATS score for this resume."] });
        });

    } catch (e) {
      console.error(e);
      setErrorMessage('Could not connect to the AI service. This might be a temporary network issue. Please check your connection and try again in a moment.');
      setResumeData(initialResumeData); // Load sample data on error
      setAppState('error');
    }
  };
  
  const handleDownloadPdf = async () => {
    const printArea = document.getElementById('print-area');
    if (!printArea || isDownloading || !resumeData) return;

    const jspdf = (window as any).jspdf;
    const html2canvas = (window as any).html2canvas;

    if (!jspdf || !html2canvas) {
        alert("PDF generation library is not loaded. Please refresh the page.");
        return;
    }

    setIsDownloading(true);

    try {
        const { jsPDF } = jspdf;
        const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
        
        const MARGIN = 40;
        const A4_WIDTH = pdf.internal.pageSize.getWidth();
        const A4_HEIGHT = pdf.internal.pageSize.getHeight();
        const contentWidth = A4_WIDTH - MARGIN * 2;
        const contentHeight = A4_HEIGHT - MARGIN * 2;

        const canvas = await html2canvas(printArea, {
            scale: 2,
            useCORS: true,
            logging: false,
            windowWidth: printArea.scrollWidth,
            windowHeight: printArea.scrollHeight
        });

        const canvasWidth = canvas.width;
        const canvasHeight = canvas.height;
        
        const pageHeightInCanvasPixels = contentHeight * (canvasWidth / contentWidth);
        
        let currentPosition = 0;
        let pageCount = 0;

        while (currentPosition < canvasHeight) {
            let sliceEndPoint = currentPosition + pageHeightInCanvasPixels;
            
            if (sliceEndPoint < canvasHeight) {
                const breakAvoidElements = printArea.querySelectorAll('.pdf-break-avoid');
                let bestBreakPoint = sliceEndPoint;
                
                for (const elem of Array.from(breakAvoidElements)) {
                    const rect = elem.getBoundingClientRect();
                    const printAreaRect = printArea.getBoundingClientRect();
                    
                    const elemTopInCanvas = (rect.top - printAreaRect.top) * (canvas.width / printArea.offsetWidth);
                    const elemBottomInCanvas = (rect.bottom - printAreaRect.top) * (canvas.width / printArea.offsetWidth);

                    if (elemTopInCanvas < sliceEndPoint && elemBottomInCanvas > sliceEndPoint) {
                        if (elemTopInCanvas > currentPosition) {
                           bestBreakPoint = elemTopInCanvas;
                           break; // Break before this element, so take its top position
                        }
                    }
                }
                sliceEndPoint = bestBreakPoint;
            }

            const sliceHeight = Math.min(sliceEndPoint - currentPosition, canvasHeight - currentPosition);

            if (sliceHeight <= 0) break; // Avoid infinite loop

            const sliceCanvas = document.createElement('canvas');
            sliceCanvas.width = canvasWidth;
            sliceCanvas.height = sliceHeight;
            const sliceCtx = sliceCanvas.getContext('2d');
            sliceCtx.drawImage(canvas, 0, currentPosition, canvasWidth, sliceHeight, 0, 0, canvasWidth, sliceHeight);

            if (pageCount > 0) {
                pdf.addPage();
            }
            
            const imgData = sliceCanvas.toDataURL('image/jpeg', 0.95);
            pdf.addImage(imgData, 'JPEG', MARGIN, MARGIN, contentWidth, sliceHeight * (contentWidth / canvasWidth));
            
            currentPosition += sliceHeight;
            pageCount++;
        }
        
        pdf.save('resume.pdf');

    } catch (err) {
        console.error("Error generating PDF:", err);
        alert("An error occurred while generating the PDF. Please try again.");
    } finally {
        setIsDownloading(false);
    }
  };
  
  const handleNewResume = () => {
    setResumeData(null);
    setAtsResult(null);
    setAppState('upload');
    setErrorMessage(null);
    setIsEditingTemplate(false);
  }

  const renderContent = () => {
    switch (appState) {
        case 'upload':
            return <ResumeUploader onUpload={handleResumeUpload} />;
        case 'edit':
        case 'error':
             return (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                <div className="bg-white/80 backdrop-blur-sm p-6 rounded-xl border border-slate-200 shadow-sm">
                  <div className="flex border-b border-slate-200 mb-4">
                      <button onClick={() => setActiveTab('editor')} className={`flex items-center space-x-2 px-4 py-2 text-sm font-semibold rounded-t-lg border-b-2 transition-colors ${activeTab === 'editor' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>
                        <EditIcon className="h-5 w-5" />
                        <span>Resume Editor</span>
                      </button>
                      <button onClick={() => setActiveTab('tailor')} className={`flex items-center space-x-2 px-4 py-2 text-sm font-semibold rounded-t-lg border-b-2 transition-colors ${activeTab === 'tailor' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>
                        <SparklesIcon className="h-5 w-5" />
                        <span>Tailor to Job</span>
                      </button>
                  </div>

                   {appState === 'error' && (
                     <div className="text-red-700 bg-red-50 p-4 rounded-lg mb-4 border border-red-200">
                         <p className="font-bold">Analysis Error</p>
                         <p className="text-sm">{errorMessage}</p>
                         <p className="mt-2 text-xs text-slate-600">We've loaded sample data for you to try out the editor. Please start a new resume to try again.</p>
                     </div>
                   )}
                   {resumeData && (
                     <>
                      {activeTab === 'editor' && (
                        <div>
                          {atsResult ? (
                              <AtsScore score={atsResult.score} feedback={atsResult.feedback} />
                          ) : (
                              <div className="bg-gradient-to-br from-blue-50 to-purple-50 p-4 rounded-lg mb-6 border border-slate-200">
                                  <h3 className="text-base font-semibold text-slate-800 mb-3">ATS Friendliness Score</h3>
                                  <div className="flex items-center space-x-6 animate-pulse">
                                      <div className="relative w-28 h-28 flex-shrink-0 bg-slate-200 rounded-full"></div>
                                      <div className="flex-1 space-y-3 py-1">
                                          <div className="h-4 bg-slate-200 rounded w-3/5"></div>
                                          <div className="space-y-2">
                                              <div className="h-3 bg-slate-200 rounded"></div>
                                              <div className="h-3 bg-slate-200 rounded w-5/6"></div>
                                              <div className="h-3 bg-slate-200 rounded w-4/6"></div>
                                          </div>
                                      </div>
                                  </div>
                              </div>
                          )}
                          <ResumeEditor resumeData={resumeData} setResumeData={setResumeData} />
                        </div>
                      )}
                      {activeTab === 'tailor' && (
                        <JobTailor resumeData={resumeData} setResumeData={setResumeData} />
                      )}
                     </>
                   )}
                </div>
                <div className="relative">
                    <div className="sticky top-28">
                      <ResumePreview 
                          data={resumeData} 
                          setData={setResumeData}
                          template={selectedTemplate} 
                          setTemplate={setSelectedTemplate}
                          isEditing={isEditingTemplate}
                      />
                    </div>
                </div>
              </div>
          );
        default:
            return null;
    }
  }

  return (
    <div className="min-h-screen">
      {appState === 'loading' && <LoadingOverlay />}
      <header className="bg-white/80 backdrop-blur-sm border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto py-3 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">ATS Resume Builder</h1>
          <div>
            {(appState === 'edit' || appState === 'error') && (
              <div className="flex items-center space-x-2">
                 <button
                    onClick={handleNewResume}
                    className="inline-flex items-center px-4 py-2 border border-slate-300 rounded-lg shadow-sm text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                   <UploadIcon className="h-5 w-5 mr-2"/> New Resume
                  </button>
                  <button
                    onClick={() => setIsEditingTemplate(!isEditingTemplate)}
                    className={`inline-flex items-center px-4 py-2 border rounded-lg shadow-sm text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${isEditingTemplate ? 'bg-blue-100 text-blue-700 border-blue-300' : 'text-slate-700 bg-white hover:bg-slate-50 border-slate-300'}`}
                  >
                    <EyeIcon className="h-5 w-5 mr-2" />
                    {isEditingTemplate ? 'Exit Edit Mode' : 'Edit Template'}
                  </button>
                <button
                  onClick={handleDownloadPdf}
                  disabled={!resumeData || isDownloading}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-400"
                >
                  <DownloadIcon className="h-5 w-5 mr-2" />
                  {isDownloading ? 'Downloading...' : 'Download PDF'}
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="py-10">
        <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default App;