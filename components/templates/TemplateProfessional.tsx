

import React from 'react';
import type { ResumeData, ResumeSection } from '../../types';
import { TemplateProps } from '../ResumePreview';
import { EyeIcon, EyeOffIcon } from '../icons';

const EditableField: React.FC<{ isEditing?: boolean; value: string; onSave: (newValue: string) => void, className?: string; as?: 'div' | 'p' | 'span' | 'h1' | 'h3' | 'li' }> = ({ isEditing, value, onSave, className, as: Component = 'div' }) => {
    return (
        <Component
            contentEditable={isEditing}
            suppressContentEditableWarning
            onBlur={(e) => onSave(e.currentTarget.innerText)}
            className={`${className} ${isEditing ? 'ring-1 ring-indigo-300 rounded-sm px-1' : ''}`}
        >
            {value}
        </Component>
    );
};

const SectionVisibilityToggle: React.FC<{ isEditing?: boolean; isVisible: boolean; onToggle: () => void }> = ({ isEditing, isVisible, onToggle }) => {
    if (!isEditing) return null;
    return (
        <button onClick={onToggle} className="section-toggle">
            {isVisible ? <EyeIcon className="h-4 w-4" /> : <EyeOffIcon className="h-4 w-4 text-gray-400" />}
        </button>
    );
};


const TemplateProfessional: React.FC<TemplateProps> = ({ data, setData, isEditing }) => {
  const { personalInfo, summary, experience, education, skills, projects, hiddenSections = [] } = data;

  const handleUpdate = <T,>(updateFn: (prev: ResumeData) => T) => {
    if (setData) {
        setData(prev => prev ? { ...prev, ...updateFn(prev) } : null);
    }
  };

  const handleToggleSection = (section: ResumeSection) => {
    const newHiddenSections = hiddenSections.includes(section)
      ? hiddenSections.filter(s => s !== section)
      : [...hiddenSections, section];
    handleUpdate(() => ({ hiddenSections: newHiddenSections }));
  };

  const isSectionVisible = (section: ResumeSection) => !hiddenSections.includes(section);

  return (
    <div className="font-sans text-gray-800 bg-white p-2 text-sm">
      <header className="mb-6">
        <EditableField as="h1" isEditing={isEditing} value={personalInfo.name} onSave={val => handleUpdate(p => ({ personalInfo: { ...p.personalInfo, name: val } }))} className="text-4xl font-bold text-gray-900" />
        <div className="flex flex-wrap text-xs text-gray-600 mt-2">
           <EditableField as="span" isEditing={isEditing} value={personalInfo.location} onSave={val => handleUpdate(p => ({ personalInfo: { ...p.personalInfo, location: val } }))} />
          <span className="mx-2 text-gray-300">|</span>
          <EditableField as="span" isEditing={isEditing} value={personalInfo.email} onSave={val => handleUpdate(p => ({ personalInfo: { ...p.personalInfo, email: val } }))} className="text-indigo-600 hover:underline" />
          <span className="mx-2 text-gray-300">|</span>
          <EditableField as="span" isEditing={isEditing} value={personalInfo.phone} onSave={val => handleUpdate(p => ({ personalInfo: { ...p.personalInfo, phone: val } }))} />
          {personalInfo.linkedin && <><span className="mx-2 text-gray-300">|</span><EditableField as="span" isEditing={isEditing} value={personalInfo.linkedin} onSave={val => handleUpdate(p => ({ personalInfo: { ...p.personalInfo, linkedin: val } }))} className="text-indigo-600 hover:underline" /></>}
          {personalInfo.github && <><span className="mx-2 text-gray-300">|</span><EditableField as="span" isEditing={isEditing} value={personalInfo.github} onSave={val => handleUpdate(p => ({ personalInfo: { ...p.personalInfo, github: val } }))} className="text-indigo-600 hover:underline" /></>}
        </div>
      </header>

      {isSectionVisible('summary') && (
        <section className="mb-5 editable-section">
            <SectionVisibilityToggle isEditing={isEditing} isVisible={isSectionVisible('summary')} onToggle={() => handleToggleSection('summary')} />
            <h2 className="text-sm font-bold uppercase tracking-widest text-gray-600 border-b border-gray-200 pb-1 mb-2">Summary</h2>
            <EditableField as="p" isEditing={isEditing} value={summary} onSave={val => handleUpdate(() => ({ summary: val }))} className="leading-relaxed" />
        </section>
      )}

      {isSectionVisible('skills') && (
        <section className="mb-5 editable-section">
            <SectionVisibilityToggle isEditing={isEditing} isVisible={isSectionVisible('skills')} onToggle={() => handleToggleSection('skills')} />
            <h2 className="text-sm font-bold uppercase tracking-widest text-gray-600 border-b border-gray-200 pb-1 mb-2">Skills</h2>
            <EditableField as="p" isEditing={isEditing} value={(skills || []).join(' | ')} onSave={val => handleUpdate(() => ({ skills: val.split('|').map(s=>s.trim()) }))} className="leading-relaxed" />
        </section>
      )}

      {isSectionVisible('experience') && (
        <section className="mb-5 editable-section">
          <SectionVisibilityToggle isEditing={isEditing} isVisible={isSectionVisible('experience')} onToggle={() => handleToggleSection('experience')} />
          <h2 className="text-sm font-bold uppercase tracking-widest text-gray-600 border-b border-gray-200 pb-1 mb-2">Experience</h2>
          {(experience || []).map((exp, index) => (
            <div key={index} className="mb-4 pdf-break-avoid">
              <div className="flex justify-between items-baseline">
                <div className="font-bold text-base text-gray-800">
                    <EditableField as="span" isEditing={isEditing} value={exp.role} onSave={val => handleUpdate(p => ({ experience: p.experience.map((e, i) => i === index ? {...e, role: val} : e) }))} />
                    <EditableField as="span" isEditing={isEditing} value={` at ${exp.company}`} onSave={val => handleUpdate(p => ({ experience: p.experience.map((e, i) => i === index ? {...e, company: val.replace(' at ','')} : e) }))} className="text-gray-600 font-normal" />
                </div>
                <div className="text-xs font-semibold text-gray-500">
                    <EditableField as="span" isEditing={isEditing} value={exp.startDate} onSave={val => handleUpdate(p => ({ experience: p.experience.map((e, i) => i === index ? {...e, startDate: val} : e) }))} />
                     – 
                    <EditableField as="span" isEditing={isEditing} value={exp.endDate} onSave={val => handleUpdate(p => ({ experience: p.experience.map((e, i) => i === index ? {...e, endDate: val} : e) }))} />
                </div>
              </div>
              <ul className="list-disc list-inside mt-1 text-gray-700 space-y-1">
                {(exp.description || []).map((desc, i) => <EditableField as="li" key={i} isEditing={isEditing} value={desc} onSave={val => handleUpdate(p => ({ experience: p.experience.map((e, idx) => idx === index ? {...e, description: e.description.map((d, didx) => didx === i ? val : d)} : e) }))} />)}
              </ul>
            </div>
          ))}
        </section>
      )}
      
      {isSectionVisible('projects') && (
        <section className="mb-5 editable-section">
          <SectionVisibilityToggle isEditing={isEditing} isVisible={isSectionVisible('projects')} onToggle={() => handleToggleSection('projects')} />
          <h2 className="text-sm font-bold uppercase tracking-widest text-gray-600 border-b border-gray-200 pb-1 mb-2">Projects</h2>
          {(projects || []).map((proj, index) => (
            <div key={index} className="mb-4 pdf-break-avoid">
               <div className="font-bold text-base text-gray-800">
                    <EditableField as="span" isEditing={isEditing} value={proj.name} onSave={val => handleUpdate(p => ({ projects: p.projects.map((pr, i) => i === index ? {...pr, name: val} : pr) }))} />
                </div>
              <ul className="list-disc list-inside mt-1 text-gray-700 space-y-1">
                {(proj.description || []).map((desc, i) => <EditableField as="li" key={i} isEditing={isEditing} value={desc} onSave={val => handleUpdate(p => ({ projects: p.projects.map((pr, idx) => idx === index ? {...pr, description: pr.description.map((d, didx) => didx === i ? val : d)} : pr) }))} />)}
              </ul>
            </div>
          ))}
        </section>
      )}

      {isSectionVisible('education') && (
        <section className="editable-section">
          <SectionVisibilityToggle isEditing={isEditing} isVisible={isSectionVisible('education')} onToggle={() => handleToggleSection('education')} />
          <h2 className="text-sm font-bold uppercase tracking-widest text-gray-600 border-b border-gray-200 pb-1 mb-2">Education</h2>
          {(education || []).map((edu, index) => (
            <div key={index} className="flex justify-between items-baseline pdf-break-avoid">
              <div>
                <EditableField as="h3" isEditing={isEditing} value={edu.institution} onSave={val => handleUpdate(p => ({ education: p.education.map((ed, i) => i === index ? {...ed, institution: val} : ed) }))} className="font-bold text-base text-gray-800" />
                <EditableField as="p" isEditing={isEditing} value={edu.degree} onSave={val => handleUpdate(p => ({ education: p.education.map((ed, i) => i === index ? {...ed, degree: val} : ed) }))} className="text-gray-600" />
              </div>
              <EditableField as="p" isEditing={isEditing} value={edu.graduationDate} onSave={val => handleUpdate(p => ({ education: p.education.map((ed, i) => i === index ? {...ed, graduationDate: val} : ed) }))} className="text-xs font-semibold text-gray-500" />
            </div>
          ))}
        </section>
      )}
    </div>
  );
};

export default TemplateProfessional;