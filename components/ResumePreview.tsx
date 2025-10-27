
import React, { useState, useRef, useEffect } from 'react';
import type { ResumeData } from '../types';
import { Template } from '../types';
import TemplateModern from './templates/TemplateModern';
import TemplateClassic from './templates/TemplateClassic';
import TemplateSerif from './templates/TemplateSerif';
import TemplateProfessional from './templates/TemplateProfessional';
import { ChevronDownIcon } from './icons';

export interface TemplateProps {
  data: ResumeData;
  setData?: React.Dispatch<React.SetStateAction<ResumeData | null>>;
  isEditing?: boolean;
}

interface ResumePreviewProps {
  data: ResumeData | null;
  setData: React.Dispatch<React.SetStateAction<ResumeData | null>>;
  template: Template;
  setTemplate: (template: Template) => void;
  isEditing: boolean;
  showTemplateSelector?: boolean;
}

const templates: { [key in Template]: React.FC<TemplateProps> } = {
  [Template.PROFESSIONAL]: TemplateProfessional,
  [Template.MODERN]: TemplateModern,
  [Template.CLASSIC]: TemplateClassic,
  [Template.SERIF]: TemplateSerif,
};

const ResumePreview: React.FC<ResumePreviewProps> = ({ data, setData, template, setTemplate, isEditing, showTemplateSelector = true }) => {
  const SelectedTemplateComponent = templates[template];
  const [isTemplateMenuOpen, setIsTemplateMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsTemplateMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);


  return (
    <div className="bg-gray-800 rounded-xl shadow-2xl shadow-black/20 border border-gray-700">
      {showTemplateSelector && (
        <div className="p-4 border-b border-gray-700 flex items-center justify-between">
          <h3 className="font-semibold text-gray-200">Template Preview</h3>
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setIsTemplateMenuOpen(!isTemplateMenuOpen)}
              className="flex items-center space-x-2 px-3 py-1.5 text-sm font-medium rounded-lg border bg-gray-700 text-gray-300 border-gray-600 hover:bg-gray-600"
            >
              <span>{template}</span>
              <ChevronDownIcon className={`h-4 w-4 transition-transform duration-200 ${isTemplateMenuOpen ? 'rotate-180' : ''}`} />
            </button>
            {isTemplateMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-gray-800 border border-gray-600 rounded-lg shadow-lg z-20 animate-fade-in py-1">
                {Object.values(Template).map(t => (
                  <button
                    key={t}
                    onClick={() => {
                      setTemplate(t as Template);
                      setIsTemplateMenuOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2 text-sm transition-colors duration-200 ${template === t ? 'bg-gray-700 text-teal-300' : 'text-gray-300 hover:bg-gray-700/50 hover:text-gray-200'}`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
      
      <div id="print-area" className={`p-4 md:p-8 bg-white ${showTemplateSelector ? 'rounded-b-xl' : 'rounded-xl'}`}>
        {data ? <SelectedTemplateComponent data={data} setData={setData} isEditing={isEditing} /> : (
            <div className="flex items-center justify-center h-[29.7cm] text-slate-400">
                Awaiting resume data...
            </div>
        )}
      </div>
    </div>
  );
};

export default ResumePreview;
