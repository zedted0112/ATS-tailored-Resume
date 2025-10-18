export interface PersonalInfo {
  name: string;
  email: string;
  phone: string;
  linkedin: string;
  github: string;
  website: string;
  location: string;
}

export interface WorkExperience {
  company: string;
  role: string;
  location: string;
  startDate: string;
  endDate: string;
  description: string[];
}

export interface Education {
  institution: string;
  degree: string;
  location: string;
  graduationDate: string;
}

export interface Project {
    name: string;
    description: string[];
    technologies: string[];
    link: string;
}

export type ResumeSection = 'summary' | 'experience' | 'education' | 'skills' | 'projects';

export interface ResumeData {
  personalInfo: PersonalInfo;
  summary: string;
  experience: WorkExperience[];
  education: Education[];
  skills: string[];
  projects: Project[];
  hiddenSections?: ResumeSection[];
}

export enum Template {
    PROFESSIONAL = 'Professional',
    MODERN = 'Modern',
    CLASSIC = 'Classic',
    SERIF = 'Serif',
}

export type AtsActionType = 'REPLACE_FIELD' | 'ADD_TO_ARRAY' | 'REPLACE_IN_ARRAY';

export interface AtsActionPayload {
    section: keyof ResumeData | 'personalInfo';
    field?: keyof PersonalInfo | keyof WorkExperience | keyof Education | keyof Project | 'description';
    index?: number;
    descriptionIndex?: number;
    original?: string;
    suggestion: string;
}

export interface AtsAction {
    type: AtsActionType;
    payload: AtsActionPayload;
}

export interface AtsFeedbackItem {
  description: string;
  action: AtsAction;
}

// Types for interactive resume tailoring
export interface TailorSuggestion {
    original: string;
    suggestion: string;
    experienceIndex?: number;
    descriptionIndex?: number;
    projectIndex?: number;
}

export interface TailorResult {
    summarySuggestion: string;
    missingKeywords: string[];
    experienceSuggestions: TailorSuggestion[];
    projectSuggestions: TailorSuggestion[];
}

export interface AppliedTailorSuggestions {
    summary: boolean;
    keywords: string[];
    experience: string[]; 
    projects: string[];
}