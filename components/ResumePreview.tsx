

import React from 'react';
import type { ResumeData } from '../types';
import { Template } from '../types';
import TemplateModern from './templates/TemplateModern';
import TemplateClassic from './templates/TemplateClassic';
import TemplateSerif from './templates/TemplateSerif';
import TemplateProfessional from './templates/TemplateProfessional';

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
}

const templates: { [key in Template]: React.FC<TemplateProps> } = {
  [Template.PROFESSIONAL]: TemplateProfessional,
  [Template.MODERN]: TemplateModern,
  [Template.CLASSIC]: TemplateClassic,
  [Template.SERIF]: TemplateSerif,
};

const ResumePreview: React.FC<ResumePreviewProps> = ({ data, setData, template, setTemplate, isEditing }) => {
  const SelectedTemplateComponent = templates[template];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200">
      <div className="p-4 border-b border-slate-200 flex items-center justify-between">
        <h3 className="font-semibold text-slate-800">Template Preview</h3>
        <div className="flex space-x-1 bg-slate-200/80 p-1 rounded-lg">
          {Object.values(Template).map(t => (
            <button
              key={t}
              // Fix: Add type assertion `as Template` to resolve type inference issues with string enums.
              onClick={() => setTemplate(t as Template)}
              className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${template === t ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>
      
      <div id="print-area" className="p-4 md:p-8 bg-white rounded-b-xl">
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
