import { GoogleGenAI, Type } from "@google/genai";
import type { ResumeData, AtsFeedbackItem, TailorResult } from '../types';

const ai = new GoogleGenAI({apiKey: process.env.API_KEY!});

const resumeSchema = {
    type: Type.OBJECT,
    properties: {
        personalInfo: {
            type: Type.OBJECT,
            properties: {
                name: { type: Type.STRING },
                email: { type: Type.STRING },
                phone: { type: Type.STRING },
                linkedin: { type: Type.STRING },
                github: { type: Type.STRING },
                website: { type: Type.STRING },
                location: { type: Type.STRING },
            },
            required: ['name', 'email', 'phone', 'location']
        },
        summary: { type: Type.STRING },
        experience: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    company: { type: Type.STRING },
                    role: { type: Type.STRING },
                    location: { type: Type.STRING },
                    startDate: { type: Type.STRING },
                    endDate: { type: Type.STRING },
                    description: { type: Type.ARRAY, items: { type: Type.STRING } },
                },
                required: ['company', 'role', 'startDate', 'endDate', 'description']
            }
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
                required: ['institution', 'degree', 'graduationDate']
            }
        },
        skills: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
        },
        projects: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    name: { type: Type.STRING },
                    description: { type: Type.ARRAY, items: { type: Type.STRING } },
                    technologies: { type: Type.ARRAY, items: { type: Type.STRING } },
                    link: { type: Type.STRING },
                },
                required: ['name', 'description', 'technologies']
            }
        }
    },
    required: ['personalInfo', 'summary', 'experience', 'education', 'skills']
};


export const parseResume = async (text: string): Promise<ResumeData> => {
    const systemInstruction = `You are an expert resume parsing AI. Your task is to accurately convert resume text into a structured JSON object based on the provided schema. Follow these rules strictly:
1.  **Section Integrity**: Correctly identify the boundaries for each major section (Summary, Experience, Projects, Education, Skills).
2.  **Project Parsing**: A project entry starts with a distinct title, often bolded or larger, and may be followed by a URL. All subsequent bullet points or descriptive paragraphs belong to THAT ONE project. Do not create new, separate project entries from bullet points within a single project's description. A new project only begins when you encounter another distinct project title.
3.  **Bullet Points**: For 'experience' and 'projects', correctly parse multi-line descriptions into an array of strings, with each string representing one bullet point or a single descriptive line.
4.  **Completeness**: Extract all available information for every field defined in the schema. If a section is not present in the resume, provide an empty array or empty string for it.`;

    const prompt = `Parse the following resume text into a structured JSON object according to your instructions.
    
    Resume Text:
    ---
    ${text}
    ---
    `;
    
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: prompt,
        config: {
            systemInstruction: systemInstruction,
            responseMimeType: "application/json",
            responseSchema: resumeSchema
        }
    });

    try {
        const jsonText = response.text.trim();
        const parsedData = JSON.parse(jsonText);
        return parsedData as ResumeData;
    } catch (e) {
        console.error("Error parsing resume JSON from Gemini:", e);
        console.error("Raw response:", response.text);
        throw new Error("Failed to parse the resume structure from the AI response.");
    }
};

const atsFeedbackSchema = {
    type: Type.ARRAY,
    items: {
        type: Type.OBJECT,
        properties: {
            description: { type: Type.STRING, description: "A concise description of the issue and the suggested improvement." },
            action: {
                type: Type.OBJECT,
                properties: {
                    type: { type: Type.STRING, description: "The type of action to perform: 'REPLACE_FIELD', 'ADD_TO_ARRAY', or 'REPLACE_IN_ARRAY'." },
                    payload: {
                        type: Type.OBJECT,
                        properties: {
                            section: { type: Type.STRING, description: "The top-level key in the resume data to modify (e.g., 'summary', 'experience')." },
                            field: { type: Type.STRING, description: "The specific field to modify within a section item." },
                            index: { type: Type.NUMBER, description: "The index of the item in a section array (e.g., for 'experience')." },
                            descriptionIndex: { type: Type.NUMBER, description: "The index for a description bullet point inside an experience or project item." },
                            original: { type: Type.STRING, description: "The original text to be replaced." },
                            suggestion: { type: Type.STRING, description: "The new suggested text." },
                        },
                        required: ['section', 'suggestion']
                    }
                },
                required: ['type', 'payload']
            }
        },
        required: ['description', 'action']
    }
};

export const getAtsFeedback = async (resumeData: ResumeData): Promise<AtsFeedbackItem[]> => {
    const prompt = `You are an expert ATS analyst and senior career coach. Your goal is to provide up to 10 specific, high-impact, actionable feedback items to help this resume pass automated systems AND impress human recruiters.

    Analyze the provided resume JSON. For each issue you find, create a feedback item with a clear description and a programmatic action to fix it.

    **CRITICAL RULES:**
    1.  **NO GENERIC ADVICE IN SUGGESTIONS:** Do not give vague advice like "Quantify achievements." Your role is to DO IT for the user.
    2.  **REWRITE, DON'T ADVISE:** For any suggestion involving text change, you MUST rewrite the user's actual bullet points. The 'suggestion' field in your payload MUST be the complete, rewritten sentence. The 'description' field should explain WHY you made the change (e.g., "Strengthened this bullet with a quantifiable result.").
    3.  **ACTION-ORIENTED:** Every piece of feedback must be something the user can apply with one click.
    4.  **EXACT MATCHING:** The 'original' field in your payload MUST EXACTLY match the text from the resume data. This is critical for the programmatic replacement to work.
    5.  **FOCUS ON IMPACT:** Prioritize feedback that makes the candidate look more accomplished and results-oriented. Use the STAR (Situation, Task, Action, Result) method as inspiration.

    **Example of perfect feedback:**
    - Description: "This rewrite quantifies the impact of your work by highlighting a measurable outcome, which is highly effective."
    - Action: { type: 'REPLACE_IN_ARRAY', payload: { section: 'experience', index: 0, descriptionIndex: 1, original: 'Developed a new feature for the main application.', suggestion: 'Spearheaded the development of a new user account feature, resulting in a 15% increase in user retention over three months.' } }

    Resume JSON:
    ---
    ${JSON.stringify(resumeData, null, 2)}
    ---
    `;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: atsFeedbackSchema
        }
    });

    try {
        const jsonText = response.text.trim();
        const feedback = JSON.parse(jsonText);
        return feedback as AtsFeedbackItem[];
    } catch (e) {
        console.error("Error parsing ATS feedback JSON from Gemini:", e);
        console.error("Raw response:", response.text);
        throw new Error("Failed to parse ATS feedback from the AI response.");
    }
};

const tailorResultSchema = {
    type: Type.OBJECT,
    properties: {
        summarySuggestion: { type: Type.STRING },
        missingKeywords: { type: Type.ARRAY, items: { type: Type.STRING } },
        experienceSuggestions: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    original: { type: Type.STRING },
                    suggestion: { type: Type.STRING },
                    experienceIndex: { type: Type.NUMBER },
                    descriptionIndex: { type: Type.NUMBER },
                },
                required: ['original', 'suggestion', 'experienceIndex', 'descriptionIndex']
            }
        },
        projectSuggestions: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    original: { type: Type.STRING },
                    suggestion: { type: Type.STRING },
                    projectIndex: { type: Type.NUMBER },
                    descriptionIndex: { type: Type.NUMBER },
                },
                required: ['original', 'suggestion', 'projectIndex', 'descriptionIndex']
            }
        }
    },
    required: ['summarySuggestion', 'missingKeywords', 'experienceSuggestions', 'projectSuggestions']
};

export const tailorResume = async (resumeData: ResumeData, jobDescription: string): Promise<TailorResult> => {
    const prompt = `You are an expert resume writer. Your task is to tailor the provided resume to the given job description.
    1.  Identify important keywords from the job description that are missing from the resume's skills section.
    2.  Rewrite the resume summary to be more aligned with the job description.
    3.  Suggest improvements for the work experience and project description bullet points to better match the job's requirements, using keywords from the description where appropriate.

    Resume JSON:
    ---
    ${JSON.stringify(resumeData, null, 2)}
    ---

    Job Description:
    ---
    ${jobDescription}
    ---

    Provide the output in a structured JSON format.
    `;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: tailorResultSchema
        }
    });

    try {
        const jsonText = response.text.trim();
        const result = JSON.parse(jsonText);
        return result as TailorResult;
    } catch (e) {
        console.error("Error parsing tailor result JSON from Gemini:", e);
        console.error("Raw response:", response.text);
        throw new Error("Failed to parse tailoring suggestions from the AI response.");
    }
};