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
  location:string;
  graduationDate: string;
}

export interface Project {
    name: string;
    description: string[];
    technologies: string[];
    link: string;
}

export type ResumeSection = 'summary' | 'skills' | 'experience' | 'projects' | 'education';

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
  SERIF = 'Serif'
}

export interface AtsResult {
  score: number;
  feedback: string[];
}

export interface TailorSuggestion {
    original: string;
    suggestion: string;
}

export interface TailorResult {
  suggestedSummary: string;
  missingKeywords: string[];
  experienceSuggestions: TailorSuggestion[];
}