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


const TemplateModern: React.FC<TemplateProps> = ({ data, setData, isEditing }) => {
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
    <div className="font-sans text-gray-800 bg-white p-2">
      <header className="text-center mb-6">
        <EditableField as="h1" isEditing={isEditing} value={personalInfo.name} onSave={val => handleUpdate(p => ({ personalInfo: { ...p.personalInfo, name: val } }))} className="text-4xl font-bold text-gray-900 tracking-tight" />
        <div className="flex flex-wrap justify-center items-center gap-x-4 gap-y-1 mt-2 text-sm text-gray-600">
           <EditableField as="span" isEditing={isEditing} value={personalInfo.location} onSave={val => handleUpdate(p => ({ personalInfo: { ...p.personalInfo, location: val } }))} />
          <EditableField as="span" isEditing={isEditing} value={personalInfo.email} onSave={val => handleUpdate(p => ({ personalInfo: { ...p.personalInfo, email: val } }))} className="text-indigo-600 hover:underline" />
          <EditableField as="span" isEditing={isEditing} value={personalInfo.phone} onSave={val => handleUpdate(p => ({ personalInfo: { ...p.personalInfo, phone: val } }))} />
          {personalInfo.linkedin && <EditableField as="span" isEditing={isEditing} value={personalInfo.linkedin} onSave={val => handleUpdate(p => ({ personalInfo: { ...p.personalInfo, linkedin: val } }))} className="text-indigo-600 hover:underline" />}
          {personalInfo.github && <EditableField as="span" isEditing={isEditing} value={personalInfo.github} onSave={val => handleUpdate(p => ({ personalInfo: { ...p.personalInfo, github: val } }))} className="text-indigo-600 hover:underline" />}
        </div>
      </header>

      {isSectionVisible('summary') && (
        <section className="mb-6 editable-section">
            <SectionVisibilityToggle isEditing={isEditing} isVisible={isSectionVisible('summary')} onToggle={() => handleToggleSection('summary')} />
            <h2 className="text-sm font-bold uppercase tracking-wider text-indigo-700 border-b-2 border-indigo-200 pb-1 mb-3">Summary</h2>
            <EditableField as="p" isEditing={isEditing} value={summary} onSave={val => handleUpdate(() => ({ summary: val }))} className="text-sm leading-relaxed" />
        </section>
      )}

      {isSectionVisible('skills') && (
        <section className="mb-6 editable-section">
            <SectionVisibilityToggle isEditing={isEditing} isVisible={isSectionVisible('skills')} onToggle={() => handleToggleSection('skills')} />
            <h2 className="text-sm font-bold uppercase tracking-wider text-indigo-700 border-b-2 border-indigo-200 pb-1 mb-3">Skills</h2>
            <div className="flex flex-wrap">
            {(skills || []).map((skill, index) => (
                <EditableField as="span" key={index} isEditing={isEditing} value={skill} onSave={val => handleUpdate(p => ({ skills: p.skills.map((s, i) => i === index ? val : s) }))} className="text-sm bg-indigo-100 text-indigo-800 rounded-full px-3 py-1 mr-2 mb-2" />
            ))}
            </div>
        </section>
      )}

      {isSectionVisible('experience') && (
        <section className="mb-6 editable-section">
          <SectionVisibilityToggle isEditing={isEditing} isVisible={isSectionVisible('experience')} onToggle={() => handleToggleSection('experience')} />
          <h2 className="text-sm font-bold uppercase tracking-wider text-indigo-700 border-b-2 border-indigo-200 pb-1 mb-3">Experience</h2>
          {(experience || []).map((exp, index) => (
            <div key={index} className="mb-4">
              <div className="flex justify-between items-baseline">
                <EditableField as="h3" isEditing={isEditing} value={exp.role} onSave={val => handleUpdate(p => ({ experience: p.experience.map((e, i) => i === index ? {...e, role: val} : e) }))} className="text-base font-semibold text-gray-900" />
                <div className="text-xs font-medium text-gray-500">
                    <EditableField as="span" isEditing={isEditing} value={exp.startDate} onSave={val => handleUpdate(p => ({ experience: p.experience.map((e, i) => i === index ? {...e, startDate: val} : e) }))} />
                     - 
                    <EditableField as="span" isEditing={isEditing} value={exp.endDate} onSave={val => handleUpdate(p => ({ experience: p.experience.map((e, i) => i === index ? {...e, endDate: val} : e) }))} />
                </div>
              </div>
              <div className="flex justify-between items-baseline">
                <EditableField as="p" isEditing={isEditing} value={exp.company} onSave={val => handleUpdate(p => ({ experience: p.experience.map((e, i) => i === index ? {...e, company: val} : e) }))} className="text-sm font-medium text-gray-700" />
                <EditableField as="p" isEditing={isEditing} value={exp.location} onSave={val => handleUpdate(p => ({ experience: p.experience.map((e, i) => i === index ? {...e, location: val} : e) }))} className="text-xs font-medium text-gray-500" />
              </div>
              <ul className="list-disc list-inside mt-1 text-sm text-gray-600 space-y-1">
                {(exp.description || []).map((desc, i) => <EditableField as="li" key={i} isEditing={isEditing} value={desc} onSave={val => handleUpdate(p => ({ experience: p.experience.map((e, idx) => idx === index ? {...e, description: e.description.map((d, didx) => didx === i ? val : d)} : e) }))} />)}
              </ul>
            </div>
          ))}
        </section>
      )}
      
      {isSectionVisible('projects') && (
        <section className="mb-6 editable-section">
          <SectionVisibilityToggle isEditing={isEditing} isVisible={isSectionVisible('projects')} onToggle={() => handleToggleSection('projects')} />
          <h2 className="text-sm font-bold uppercase tracking-wider text-indigo-700 border-b-2 border-indigo-200 pb-1 mb-3">Projects</h2>
          {(projects || []).map((proj, index) => (
            <div key={index} className="mb-4">
              <div className="flex justify-between items-baseline">
                <EditableField as="h3" isEditing={isEditing} value={proj.name} onSave={val => handleUpdate(p => ({ projects: p.projects.map((pr, i) => i === index ? {...pr, name: val} : pr) }))} className="text-base font-semibold text-gray-900" />
                {proj.link && <EditableField as="span" isEditing={isEditing} value={proj.link} onSave={val => handleUpdate(p => ({ projects: p.projects.map((pr, i) => i === index ? {...pr, link: val} : pr) }))} className="text-xs text-indigo-600 hover:underline" />}
              </div>
              <ul className="list-disc list-inside mt-1 text-sm text-gray-600 space-y-1">
                {(proj.description || []).map((desc, i) => <EditableField as="li" key={i} isEditing={isEditing} value={desc} onSave={val => handleUpdate(p => ({ projects: p.projects.map((pr, idx) => idx === index ? {...pr, description: pr.description.map((d, didx) => didx === i ? val : d)} : pr) }))} />)}
              </ul>
              <p className="text-xs text-gray-500 mt-2">
                  <strong>Technologies:</strong> <EditableField as="span" isEditing={isEditing} value={(proj.technologies || []).join(', ')} onSave={val => handleUpdate(p => ({ projects: p.projects.map((pr, i) => i === index ? {...pr, technologies: val.split(',').map(t => t.trim())} : pr) }))} />
              </p>
            </div>
          ))}
        </section>
      )}

      {isSectionVisible('education') && (
        <section className="editable-section">
          <SectionVisibilityToggle isEditing={isEditing} isVisible={isSectionVisible('education')} onToggle={() => handleToggleSection('education')} />
          <h2 className="text-sm font-bold uppercase tracking-wider text-indigo-700 border-b-2 border-indigo-200 pb-1 mb-3">Education</h2>
          {(education || []).map((edu, index) => (
            <div key={index} className="flex justify-between items-baseline">
              <div>
                <EditableField as="h3" isEditing={isEditing} value={edu.institution} onSave={val => handleUpdate(p => ({ education: p.education.map((ed, i) => i === index ? {...ed, institution: val} : ed) }))} className="text-base font-semibold text-gray-900" />
                <EditableField as="p" isEditing={isEditing} value={edu.degree} onSave={val => handleUpdate(p => ({ education: p.education.map((ed, i) => i === index ? {...ed, degree: val} : ed) }))} className="text-sm text-gray-700" />
              </div>
              <EditableField as="p" isEditing={isEditing} value={edu.graduationDate} onSave={val => handleUpdate(p => ({ education: p.education.map((ed, i) => i === index ? {...ed, graduationDate: val} : ed) }))} className="text-xs font-medium text-gray-500" />
            </div>
          ))}
        </section>
      )}
    </div>
  );
};

export default TemplateModern;