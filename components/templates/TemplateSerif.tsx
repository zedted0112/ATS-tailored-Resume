



import React from 'react';
import type { ResumeData, ResumeSection } from '../../types';
import { TemplateProps } from '../ResumePreview';
import { EyeIcon, EyeOffIcon } from '../icons';

const EditableField: React.FC<{ isEditing?: boolean; value: string; onSave: (newValue: string) => void, className?: string; style?: React.CSSProperties, as?: 'div' | 'p' | 'span' | 'h1' | 'h3' | 'li' }> = ({ isEditing, value, onSave, className, style, as: Component = 'div' }) => {
    return (
        <Component
            contentEditable={isEditing}
            suppressContentEditableWarning
            onBlur={(e) => onSave(e.currentTarget.innerText)}
            className={`${className} ${isEditing ? 'ring-1 ring-indigo-300 rounded-sm px-1' : ''}`}
            style={style}
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


const TemplateSerif: React.FC<TemplateProps> = ({ data, setData, isEditing }) => {
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
    <div className="text-gray-900 bg-white p-2" style={{ fontFamily: "'Times New Roman', serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Libre+Baskerville&display=swap');`}</style>
      
      <header className="text-center mb-8">
        <EditableField as="h1" isEditing={isEditing} value={personalInfo.name} onSave={val => handleUpdate(p => ({ personalInfo: { ...p.personalInfo, name: val } }))} className="text-3xl font-bold" style={{ fontFamily: "'Libre Baskerville', serif" }} />
        <div className="text-xs mt-2">
          <EditableField as="span" isEditing={isEditing} value={personalInfo.location} onSave={val => handleUpdate(p => ({ personalInfo: { ...p.personalInfo, location: val } }))} />
          <span className="mx-2">|</span>
          <EditableField as="span" isEditing={isEditing} value={personalInfo.email} onSave={val => handleUpdate(p => ({ personalInfo: { ...p.personalInfo, email: val } }))} className="hover:underline" />
          <span className="mx-2">|</span>
          <EditableField as="span" isEditing={isEditing} value={personalInfo.phone} onSave={val => handleUpdate(p => ({ personalInfo: { ...p.personalInfo, phone: val } }))} />
          {personalInfo.linkedin && <><span className="mx-2">|</span><EditableField as="span" isEditing={isEditing} value={personalInfo.linkedin} onSave={val => handleUpdate(p => ({ personalInfo: { ...p.personalInfo, linkedin: val } }))} className="hover:underline" /></>}
        </div>
      </header>

      <div className="space-y-6 text-sm">
        {isSectionVisible('summary') && (
            <section className="editable-section">
                <SectionVisibilityToggle isEditing={isEditing} isVisible={isSectionVisible('summary')} onToggle={() => handleToggleSection('summary')} />
                <h2 className="text-lg font-bold border-b border-gray-400 pb-1 mb-2" style={{ fontFamily: "'Libre Baskerville', serif" }}>Summary</h2>
                <EditableField as="p" isEditing={isEditing} value={summary} onSave={val => handleUpdate(() => ({ summary: val }))} className="leading-relaxed" style={{ fontFamily: "Georgia, serif" }} />
            </section>
        )}

        {isSectionVisible('experience') && (
            <section className="editable-section">
                <SectionVisibilityToggle isEditing={isEditing} isVisible={isSectionVisible('experience')} onToggle={() => handleToggleSection('experience')} />
                <h2 className="text-lg font-bold border-b border-gray-400 pb-1 mb-2" style={{ fontFamily: "'Libre Baskerville', serif" }}>Experience</h2>
                <div className="space-y-4">
                    {(experience || []).map((exp, index) => (
                    <div key={index} className="pdf-break-avoid">
                        <div className="flex justify-between">
                        <EditableField as="h3" isEditing={isEditing} value={exp.role} onSave={val => handleUpdate(p => ({ experience: p.experience.map((e, i) => i === index ? {...e, role: val} : e) }))} className="font-bold" />
                        <p className="font-bold"><EditableField as="span" isEditing={isEditing} value={exp.startDate} onSave={val => handleUpdate(p => ({ experience: p.experience.map((e, i) => i === index ? {...e, startDate: val} : e) }))} /> - <EditableField as="span" isEditing={isEditing} value={exp.endDate} onSave={val => handleUpdate(p => ({ experience: p.experience.map((e, i) => i === index ? {...e, endDate: val} : e) }))} /></p>
                        </div>
                        <div className="flex justify-between italic">
                        <EditableField as="p" isEditing={isEditing} value={exp.company} onSave={val => handleUpdate(p => ({ experience: p.experience.map((e, i) => i === index ? {...e, company: val} : e) }))} />
                        <EditableField as="p" isEditing={isEditing} value={exp.location} onSave={val => handleUpdate(p => ({ experience: p.experience.map((e, i) => i === index ? {...e, location: val} : e) }))} />
                        </div>
                        <ul className="list-disc list-inside mt-1 pl-4 space-y-1" style={{ fontFamily: "Georgia, serif" }}>
                        {(exp.description || []).map((desc, i) => <EditableField as="li" key={i} isEditing={isEditing} value={desc} onSave={val => handleUpdate(p => ({ experience: p.experience.map((e, idx) => idx === index ? {...e, description: e.description.map((d, didx) => didx === i ? val : d)} : e) }))} />)}
                        </ul>
                    </div>
                    ))}
                </div>
            </section>
        )}

        {isSectionVisible('projects') && (
            <section className="editable-section">
                <SectionVisibilityToggle isEditing={isEditing} isVisible={isSectionVisible('projects')} onToggle={() => handleToggleSection('projects')} />
                <h2 className="text-lg font-bold border-b border-gray-400 pb-1 mb-2" style={{ fontFamily: "'Libre Baskerville', serif" }}>Projects</h2>
                <div className="space-y-3">
                    {(projects || []).map((proj, index) => (
                    <div key={index} className="pdf-break-avoid">
                        <div className="flex justify-between">
                        <EditableField as="h3" isEditing={isEditing} value={proj.name} onSave={val => handleUpdate(p => ({ projects: p.projects.map((pr, i) => i === index ? {...pr, name: val} : pr) }))} className="font-bold" />
                        {proj.link && <EditableField as="span" isEditing={isEditing} value={proj.link} onSave={val => handleUpdate(p => ({ projects: p.projects.map((pr, i) => i === index ? {...pr, link: val} : pr) }))} className="italic hover:underline" />}
                        </div>
                        <ul className="list-disc list-inside mt-1 pl-4 space-y-1" style={{ fontFamily: "Georgia, serif" }}>
                            {(proj.description || []).map((desc, i) => <EditableField as="li" key={i} isEditing={isEditing} value={desc} onSave={val => handleUpdate(p => ({ projects: p.projects.map((pr, idx) => idx === index ? {...pr, description: pr.description.map((d, didx) => didx === i ? val : d)} : pr) }))} />)}
                        </ul>
                        <p className="text-xs italic mt-1">Key Technologies: <EditableField as="span" isEditing={isEditing} value={(proj.technologies || []).join(', ')} onSave={val => handleUpdate(p => ({ projects: p.projects.map((pr, i) => i === index ? {...pr, technologies: val.split(',').map(t => t.trim())} : pr) }))} /></p>
                    </div>
                    ))}
                </div>
            </section>
        )}
        
        {isSectionVisible('education') && (
            <section className="editable-section">
                <SectionVisibilityToggle isEditing={isEditing} isVisible={isSectionVisible('education')} onToggle={() => handleToggleSection('education')} />
                <h2 className="text-lg font-bold border-b border-gray-400 pb-1 mb-2" style={{ fontFamily: "'Libre Baskerville', serif" }}>Education</h2>
                {(education || []).map((edu, index) => (
                <div key={index} className="flex justify-between pdf-break-avoid">
                    <div>
                    <EditableField as="h3" isEditing={isEditing} value={edu.institution} onSave={val => handleUpdate(p => ({ education: p.education.map((ed, i) => i === index ? {...ed, institution: val} : ed) }))} className="font-bold" />
                    <EditableField as="p" isEditing={isEditing} value={edu.degree} onSave={val => handleUpdate(p => ({ education: p.education.map((ed, i) => i === index ? {...ed, degree: val} : ed) }))} className="italic" />
                    </div>
                    <EditableField as="p" isEditing={isEditing} value={edu.graduationDate} onSave={val => handleUpdate(p => ({ education: p.education.map((ed, i) => i === index ? {...ed, graduationDate: val} : ed) }))} />
                </div>
                ))}
            </section>
        )}

        {isSectionVisible('skills') && (
            <section className="editable-section">
                <SectionVisibilityToggle isEditing={isEditing} isVisible={isSectionVisible('skills')} onToggle={() => handleToggleSection('skills')} />
                <h2 className="text-lg font-bold border-b border-gray-400 pb-1 mb-2" style={{ fontFamily: "'Libre Baskerville', serif" }}>Skills</h2>
                <EditableField as="p" isEditing={isEditing} value={(skills || []).join(', ')} onSave={val => handleUpdate(() => ({ skills: val.split(',').map(s=>s.trim()) }))} className="leading-relaxed" style={{ fontFamily: "Georgia, serif" }} />
            </section>
        )}
      </div>
    </div>
  );
};

export default TemplateSerif;