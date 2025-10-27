import React from 'react';
import type { ResumeData, WorkExperience, Education, Project } from '../types';
import { TrashIcon } from './icons';

interface ResumeEditorProps {
  resumeData: ResumeData;
  setResumeData: React.Dispatch<React.SetStateAction<ResumeData | null>>;
}

const ResumeEditor: React.FC<ResumeEditorProps> = ({ resumeData, setResumeData }) => {
  const handlePersonalInfoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setResumeData(prev => prev ? { ...prev, personalInfo: { ...prev.personalInfo, [name]: value } } : null);
  };

  const handleSummaryChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setResumeData(prev => prev ? { ...prev, summary: e.target.value } : null);
  };

  const handleSkillsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
     setResumeData(prev => prev ? { ...prev, skills: e.target.value.split(',').map(s => s.trim()) } : null);
  };
  
  const handleGenericChange = <T,>(
    section: keyof ResumeData, 
    index: number, 
    field: keyof T, 
    value: string | string[]
  ) => {
     setResumeData(prev => {
        if (!prev) return null;
        const sectionData = prev[section] as T[];
        const updatedSection = [...sectionData];
        updatedSection[index] = { ...updatedSection[index], [field]: value };
        return { ...prev, [section]: updatedSection };
     });
  };

  const handleAddItem = <T,>(section: keyof ResumeData, newItem: T) => {
    setResumeData(prev => {
      if (!prev) return null;
      const sectionData = prev[section] as T[];
      return { ...prev, [section]: [...(sectionData || []), newItem] };
    });
  };

  const handleRemoveItem = (section: keyof ResumeData, index: number) => {
    setResumeData(prev => {
      if (!prev) return null;
      const sectionData = prev[section] as any[];
      return { ...prev, [section]: sectionData.filter((_, i) => i !== index) };
    });
  };

  if (!resumeData) return null;

  const inputClass = "block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-1 focus:ring-teal-400 focus:border-teal-400 sm:text-sm text-gray-200";
  const smallInputClass = "w-full bg-transparent border-b border-gray-600 py-1 px-1 focus:outline-none focus:border-teal-400 transition-colors";
  
  return (
    <div className="space-y-8">
      {/* Personal Info */}
      <div className="space-y-4">
        <h3 className="text-base font-semibold text-gray-200 border-b border-gray-700 pb-2">Personal Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.keys(resumeData.personalInfo).map(key => (
                <div key={key}>
                    <label className="block text-xs font-medium text-gray-400 capitalize mb-1">{key}</label>
                    <input
                        type="text"
                        name={key}
                        value={resumeData.personalInfo[key as keyof typeof resumeData.personalInfo]}
                        onChange={handlePersonalInfoChange}
                        className={inputClass}
                    />
                </div>
            ))}
        </div>
      </div>

      {/* Summary */}
      <div>
        <h3 className="text-base font-semibold text-gray-200 border-b border-gray-700 pb-2">Summary</h3>
        <textarea
          value={resumeData.summary}
          onChange={handleSummaryChange}
          rows={4}
          className={`mt-2 ${inputClass}`}
        />
      </div>

       {/* Skills */}
      <div>
        <h3 className="text-base font-semibold text-gray-200 border-b border-gray-700 pb-2">Skills</h3>
        <p className="text-xs text-gray-500 my-1">Enter skills separated by commas.</p>
        <input
          type="text"
          value={(resumeData.skills || []).join(', ')}
          onChange={handleSkillsChange}
          className={inputClass}
        />
      </div>


      {/* Experience */}
      <div>
        <h3 className="text-base font-semibold text-gray-200 border-b border-gray-700 pb-2">Work Experience</h3>
        {(resumeData.experience || []).map((exp, index) => (
          <div key={index} className="mt-4 p-4 border border-gray-700 rounded-lg relative bg-gray-900/30">
            <button onClick={() => handleRemoveItem('experience', index)} className="absolute top-3 right-3 text-gray-500 hover:text-red-400 transition-colors"><TrashIcon className="h-5 w-5"/></button>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input placeholder="Company" value={exp.company} onChange={(e) => handleGenericChange<WorkExperience>('experience', index, 'company', e.target.value)} className={smallInputClass} />
              <input placeholder="Role" value={exp.role} onChange={(e) => handleGenericChange<WorkExperience>('experience', index, 'role', e.target.value)} className={smallInputClass} />
              <input placeholder="Location" value={exp.location} onChange={(e) => handleGenericChange<WorkExperience>('experience', index, 'location', e.target.value)} className={smallInputClass} />
              <input placeholder="Start Date" value={exp.startDate} onChange={(e) => handleGenericChange<WorkExperience>('experience', index, 'startDate', e.target.value)} className={smallInputClass} />
              <input placeholder="End Date" value={exp.endDate} onChange={(e) => handleGenericChange<WorkExperience>('experience', index, 'endDate', e.target.value)} className={smallInputClass} />
            </div>
            <textarea
              placeholder="Description (one point per line)"
              value={(exp.description || []).join('\n')}
              onChange={(e) => handleGenericChange<WorkExperience>('experience', index, 'description', e.target.value.split('\n'))}
              rows={3}
              className={`mt-4 ${inputClass}`}
            />
          </div>
        ))}
        <button onClick={() => handleAddItem<WorkExperience>('experience', { company: '', role: '', location: '', startDate: '', endDate: '', description: [] })} className="mt-3 text-teal-400 hover:text-teal-300 text-sm font-medium">+ Add Experience</button>
      </div>

      {/* Education */}
      <div>
        <h3 className="text-base font-semibold text-gray-200 border-b border-gray-700 pb-2">Education</h3>
        {(resumeData.education || []).map((edu, index) => (
          <div key={index} className="mt-4 p-4 border border-gray-700 rounded-lg relative bg-gray-900/30">
            <button onClick={() => handleRemoveItem('education', index)} className="absolute top-3 right-3 text-gray-500 hover:text-red-400 transition-colors"><TrashIcon className="h-5 w-5"/></button>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input placeholder="Institution" value={edu.institution} onChange={(e) => handleGenericChange<Education>('education', index, 'institution', e.target.value)} className={smallInputClass} />
              <input placeholder="Degree" value={edu.degree} onChange={(e) => handleGenericChange<Education>('education', index, 'degree', e.target.value)} className={smallInputClass} />
              <input placeholder="Location" value={edu.location} onChange={(e) => handleGenericChange<Education>('education', index, 'location', e.target.value)} className={smallInputClass} />
              <input placeholder="Graduation Date" value={edu.graduationDate} onChange={(e) => handleGenericChange<Education>('education', index, 'graduationDate', e.target.value)} className={smallInputClass} />
            </div>
          </div>
        ))}
        <button onClick={() => handleAddItem<Education>('education', { institution: '', degree: '', location: '', graduationDate: '' })} className="mt-3 text-teal-400 hover:text-teal-300 text-sm font-medium">+ Add Education</button>
      </div>

       {/* Projects */}
       <div>
        <h3 className="text-base font-semibold text-gray-200 border-b border-gray-700 pb-2">Projects</h3>
        {(resumeData.projects || []).map((proj, index) => (
          <div key={index} className="mt-4 p-4 border border-gray-700 rounded-lg relative bg-gray-900/30">
            <button onClick={() => handleRemoveItem('projects', index)} className="absolute top-3 right-3 text-gray-500 hover:text-red-400 transition-colors"><TrashIcon className="h-5 w-5"/></button>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-2">
                <input placeholder="Project Name" value={proj.name} onChange={(e) => handleGenericChange<Project>('projects', index, 'name', e.target.value)} className={`${smallInputClass} font-semibold`} />
                <input placeholder="Link" value={proj.link} onChange={(e) => handleGenericChange<Project>('projects', index, 'link', e.target.value)} className={smallInputClass} />
            </div>
            <textarea
              placeholder="Description (one point per line)"
              value={(proj.description || []).join('\n')}
              onChange={(e) => handleGenericChange<Project>('projects', index, 'description', e.target.value.split('\n'))}
              rows={3}
              className={`mt-2 ${inputClass}`}
            />
             <input placeholder="Technologies (comma separated)" value={(proj.technologies || []).join(', ')} onChange={(e) => handleGenericChange<Project>('projects', index, 'technologies', e.target.value.split(',').map(t=>t.trim()))} className={`${smallInputClass} mt-2`} />
          </div>
        ))}
        <button onClick={() => handleAddItem<Project>('projects', { name: '', description: [], technologies: [], link: '' })} className="mt-3 text-teal-400 hover:text-teal-300 text-sm font-medium">+ Add Project</button>
      </div>

    </div>
  );
};

export default ResumeEditor;
