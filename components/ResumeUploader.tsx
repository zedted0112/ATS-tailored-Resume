import React, { useState, useCallback } from 'react';
import { UploadIcon } from './icons';

interface ResumeUploaderProps {
  onUpload: (text: string) => void;
}

const ResumeUploader: React.FC<ResumeUploaderProps> = ({ onUpload }) => {
  const [resumeText, setResumeText] = useState('');
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [fileName, setFileName] = useState('');
  const [isDragging, setIsDragging] = useState(false);

  const processFile = async (file: File) => {
    setIsProcessingFile(true);
    setFileName(file.name);
    let text = '';
    try {
      if (file.type === 'application/pdf') {
        const pdfjsLib = (window as any).pdfjsLib;
        if (!pdfjsLib) {
          throw new Error("pdf.js library not loaded. Please try refreshing the page.");
        }
        pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;
        
        const arrayBuffer = await file.arrayBuffer();
        const typedarray = new Uint8Array(arrayBuffer);
        const pdf = await pdfjsLib.getDocument(typedarray).promise;
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          text += textContent.items.map((s: any) => s.str).join(' ') + '\n';
        }
      } else {
        text = await file.text();
      }
      setResumeText(text);
    } catch (error) {
        console.error("Error processing file:", error);
        alert(`Sorry, there was an error reading that file. ${error instanceof Error ? error.message : "An unknown error occurred."}`);
    } finally {
        setIsProcessingFile(false);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleParse = () => {
    if (resumeText.trim()) {
      onUpload(resumeText);
    }
  };

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    setIsDragging(true);
  }, []);
  const onDragLeave = useCallback(() => setIsDragging(false), []);
  const onDrop = useCallback(async (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragging(false);
    const file = event.dataTransfer.files?.[0];
    if (file && (file.type === "text/plain" || file.type === "application/pdf")) {
      await processFile(file);
    }
  }, []);

  return (
    <div className="max-w-4xl mx-auto text-center px-4">
      <h1 className="text-4xl font-bold text-slate-800 tracking-tight">Build Your Best Resume</h1>
      <p className="mt-3 text-lg text-slate-600 max-w-2xl mx-auto">
        Let our AI instantly parse your resume and help you apply professional, ATS-friendly templates.
      </p>
      
      <div 
        className={`mt-10 grid gap-8 transition-all duration-300 ${resumeText ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2 items-start'}`}
      >
        <div className={`transition-all duration-300 ${resumeText ? 'opacity-50 max-h-40' : 'opacity-100'}`}>
          <h2 className="text-lg font-semibold text-slate-700 mb-2">1. Upload a File</h2>
          <label 
            htmlFor="file-upload" 
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            className={`relative block w-full rounded-lg border-2 border-dashed p-8 text-center cursor-pointer transition-colors ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-slate-300 hover:border-slate-400'}`}
          >
            <UploadIcon className="mx-auto h-10 w-10 text-slate-400" />
            <span className="mt-2 block text-sm font-medium text-slate-700">
              {isProcessingFile ? `Processing ${fileName}...` : `Drag & drop or click to upload`}
            </span>
             <p className="text-xs text-slate-500">PDF or TXT</p>
            <input id="file-upload" name="file-upload" type="file" className="sr-only" accept=".txt,.pdf" onChange={handleFileChange} disabled={isProcessingFile} />
          </label>
        </div>
        <div className={`transition-all duration-300 ${resumeText ? 'row-start-1' : ''}`}>
           <h2 className="text-lg font-semibold text-slate-700 mb-2">{resumeText ? '2. Review Your Text' : 'Or Paste Text'}</h2>
           <textarea
              value={resumeText}
              onChange={(e) => setResumeText(e.target.value)}
              placeholder="You can also paste your resume content here..."
              className="w-full h-40 p-4 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition duration-150 ease-in-out"
              readOnly={isProcessingFile}
            />
            {fileName && !isProcessingFile && <p className="text-xs text-slate-500 mt-1 text-left">Extracted content from: {fileName}</p>}
        </div>
      </div>
        
      <div className="mt-10">
        <button
          onClick={handleParse}
          disabled={!resumeText.trim() || isProcessingFile}
          className="px-8 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 shadow-lg shadow-blue-500/30 transform hover:scale-105 transition-transform"
        >
          {isProcessingFile ? 'Analyzing...' : 'Build My Resume'}
        </button>
      </div>
    </div>
  );
};

export default ResumeUploader;