import React, { useState, useCallback, useEffect } from 'react';
import { UploadIcon } from './icons';

interface ResumeUploaderProps {
  onUpload: (text: string) => void;
}

const animatedDescriptions = [
  "Navigate your next career move with intelligent analysis.",
  "Perfect your resume to beat automated screeners.",
  "Get personalized interview questions and expert answers.",
  "Tailor your application for any job in seconds.",
  "Start your mission by uploading your resume."
];

const ResumeUploader: React.FC<ResumeUploaderProps> = ({ onUpload }) => {
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [fileName, setFileName] = useState('');
  const [isDragging, setIsDragging] = useState(false);

  // State for typing animation
  const [descriptionIndex, setDescriptionIndex] = useState(0);
  const [displayedText, setDisplayedText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const fullText = animatedDescriptions[descriptionIndex];
    
    const handleTyping = () => {
      if (isDeleting) {
        if (displayedText.length > 0) {
          setDisplayedText(prev => prev.substring(0, prev.length - 1));
        } else {
          setIsDeleting(false);
          setDescriptionIndex(prev => (prev + 1) % animatedDescriptions.length);
        }
      } else {
        if (displayedText.length < fullText.length) {
          setDisplayedText(prev => fullText.substring(0, prev.length + 1));
        } else {
          // Pause before deleting
          setTimeout(() => setIsDeleting(true), 2500);
        }
      }
    };

    const typingSpeed = isDeleting ? 50 : 100;
    const timeout = setTimeout(handleTyping, typingSpeed);

    return () => clearTimeout(timeout);
  }, [displayedText, isDeleting, descriptionIndex]);


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
      if (text.trim()) {
        onUpload(text);
      }
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

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    setIsDragging(true);
  }, []);
  const onDragLeave = useCallback(() => setIsDragging(false), []);
  const onDrop = useCallback(async (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragging(false);
    const file = event.dataTransfer.files?.[0];
    if (file && (file.type === "text/plain" || file.type === "application/pdf" || file.type === "application/msword" || file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document")) {
      await processFile(file);
    }
  }, [onUpload]);

  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex-grow max-w-4xl mx-auto text-center px-4 py-20 flex flex-col items-center justify-center">
        <div className="mb-4 text-teal-400">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 pilot-logo-animated" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
          </svg>
        </div>
        <h1 className="text-5xl font-bold text-gray-100 tracking-tight">Engage Your AI Career Pilot</h1>
        <p className="mt-4 text-lg text-gray-400 max-w-2xl mx-auto h-14">
          <span>{displayedText}</span>
          <span className="typing-cursor"></span>
        </p>
        
        <div 
          className="mt-12 w-full max-w-lg"
        >
            <label 
              htmlFor="file-upload" 
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
              className={`relative block w-full rounded-xl border-2 border-dashed p-12 text-center cursor-pointer transition-all duration-300 ease-in-out ${isDragging ? 'border-teal-400 bg-gray-800/50 scale-105' : 'border-gray-600 hover:border-gray-500'}`}
            >
              <UploadIcon className="mx-auto h-12 w-12 text-gray-500" />
              <span className="mt-4 block font-medium text-gray-300">
                {isProcessingFile ? `Processing ${fileName}...` : `Drag & drop or click to upload`}
              </span>
              <p className="text-sm text-gray-500">PDF, DOCX, or TXT</p>
              <input id="file-upload" name="file-upload" type="file" className="sr-only" accept=".txt,.pdf,.doc,.docx" onChange={handleFileChange} disabled={isProcessingFile} />
            </label>
        </div>
      </div>
      <footer className="w-full text-center py-4">
          <p className="text-xs text-gray-500">Designed by Himalayan Coder</p>
      </footer>
    </div>
  );
};

export default ResumeUploader;