import { GoogleGenAI, Type } from "@google/genai";
import type { ResumeData, AtsResult, TailorResult } from '../types';

const blankResumeData: ResumeData = {
  personalInfo: { name: '', email: '', phone: '', linkedin: '', github: '', website: '', location: '' },
  summary: '',
  experience: [],
  education: [],
  skills: [],
  projects: [],
  hiddenSections: []
};


export const parseResumeWithGemini = async (resumeText: string): Promise<ResumeData> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: `Based on the provided schema, parse the following resume text into a JSON object.

Resume Text:
---
${resumeText}
---
`,
    config: {
      systemInstruction: `You are a highly precise resume parsing engine. Your ONLY function is to extract information from a resume and fit it into a given JSON schema.

**CRITICAL RULES:**
1.  **STRICT ADHERENCE TO SCHEMA:** You MUST follow the provided JSON schema exactly.
2.  **ISOLATE THE SUMMARY:** The 'summary' field is ONLY for a brief, introductory professional summary or objective statement. It should be a single, short paragraph.
3.  **ABSOLUTE PROHIBITION:** Under NO circumstances should you place the entire resume content, or content from other sections like 'Experience' or 'Skills', into the 'summary' field. This is a critical failure.
4.  **SEPARATE SECTIONS:** Each section (summary, experience, skills, education, projects) is distinct and MUST be parsed independently. Do not merge them.
5.  **HANDLE MISSING SECTIONS:** If a section does not exist in the resume, you MUST return an empty value for it (e.g., an empty string "" or an empty array []).
6.  **DISCARD UNKNOWN TEXT:** If you find text that does not clearly belong to any section in the schema, discard it. Do NOT add it to the summary or any other field.`,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          personalInfo: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING, description: "Full name" },
              email: { type: Type.STRING, description: "Email address" },
              phone: { type: Type.STRING, description: "Phone number" },
              linkedin: { type: Type.STRING, description: "LinkedIn profile URL or handle" },
              github: { type: Type.STRING, description: "GitHub profile URL or handle" },
              website: { type: Type.STRING, description: "Personal website or portfolio URL" },
              location: { type: Type.STRING, description: "City and State, e.g., San Francisco, CA" },
            },
          },
          summary: {
            type: Type.STRING,
            description: "A professional summary or objective statement.",
          },
          experience: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                company: { type: Type.STRING },
                role: { type: Type.STRING },
                location: { type: Type.STRING },
                startDate: { type: Type.STRING },
                endDate: { type: Type.STRING, description: "e.g., 'Present' or 'Dec 2020'" },
                description: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
              },
            },
          },
          education: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                institution: { type: Type.STRING },
                degree: { type: Type.STRING },
                location: { type: Type.STRING },
                graduationDate: { type: Type.STRING },
              },
            },
          },
          skills: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "A list of technical and soft skills."
          },
          projects: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    name: {type: Type.STRING},
                    description: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING },
                    },
                    technologies: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING },
                    },
                    link: {type: Type.STRING, description: "URL to the project or repository"}
                }
            }
          }
        },
      },
    },
  });

  const jsonString = response.text.trim();
  let parsedJson: Partial<ResumeData>;
  try {
      parsedJson = JSON.parse(jsonString);
  } catch (e) {
      console.error("Gemini returned invalid JSON:", jsonString);
      throw new Error("The AI failed to return a valid resume structure. Please try again.");
  }

  // Merge with defaults to ensure all keys exist and prevent crashes from malformed AI responses.
  const robustData: ResumeData = {
      ...blankResumeData,
      ...parsedJson,
      personalInfo: {
          ...blankResumeData.personalInfo,
          ...(parsedJson.personalInfo || {})
      },
      summary: parsedJson.summary || '',
      experience: parsedJson.experience || [],
      education: parsedJson.education || [],
      skills: parsedJson.skills || [],
      projects: parsedJson.projects || [],
  };

  return robustData;
};


export const getAtsScoreWithGemini = async (resumeText: string): Promise<AtsResult> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: `Analyze the following resume text from the perspective of an Applicant Tracking System (ATS). Provide a score out of 100 and give 3-5 brief, actionable feedback points for improvement. Focus on formatting, keywords, and clarity that would make it more ATS-friendly.

Resume Text:
---
${resumeText}
---
`,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    score: {
                        type: Type.INTEGER,
                        description: "An ATS-friendliness score from 0 to 100."
                    },
                    feedback: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING },
                        description: "An array of brief, actionable tips to improve the ATS score."
                    }
                }
            }
        }
    });

    const jsonString = response.text.trim();
    const parsedJson = JSON.parse(jsonString);
    return parsedJson as AtsResult;
};

export const tailorResumeForJob = async (resumeText: string, jobDescription: string): Promise<TailorResult> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: `Analyze the following resume against the provided job description. Provide specific, actionable suggestions to tailor the resume for this job application.

Resume Text:
---
${resumeText}
---

Job Description:
---
${jobDescription}
---
`,
        config: {
            systemInstruction: `You are an expert career coach and resume writer. Your task is to help a job seeker tailor their resume to a specific job description.
1.  **Rewrite the Summary:** Create a new professional summary that is concise (2-4 sentences) and directly incorporates key requirements and language from the job description.
2.  **Identify Missing Keywords:** List critical keywords and skills from the job description that are not present in the resume.
3.  **Enhance Experience Bullets:** Select up to three bullet points from the resume's experience section and rewrite them to better align with the responsibilities and desired qualifications mentioned in the job description. Use quantifiable achievements where possible.
Your response MUST be in the specified JSON format.`,
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    suggestedSummary: {
                        type: Type.STRING,
                        description: "A rewritten professional summary tailored to the job description."
                    },
                    missingKeywords: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING },
                        description: "A list of important keywords from the job description missing in the resume."
                    },
                    experienceSuggestions: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                original: { type: Type.STRING, description: "The original bullet point from the resume." },
                                suggestion: { type: Type.STRING, description: "The improved, tailored bullet point." }
                            },
                             required: ["original", "suggestion"]
                        },
                        description: "Suggestions for rewriting experience bullet points."
                    }
                }
            }
        }
    });

    const jsonString = response.text.trim();
    return JSON.parse(jsonString) as TailorResult;
};