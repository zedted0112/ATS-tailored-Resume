import { GoogleGenAI, Type } from "@google/genai";
import type { ResumeData, AtsFeedbackItem, TailorResult, InterviewQuestion, CompanyBriefing, GroundingSource } from '../types';

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
                    cgpa: { type: Type.STRING },
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
                    role: { type: Type.STRING },
                    description: { type: Type.ARRAY, items: { type: Type.STRING } },
                    technologies: { type: Type.ARRAY, items: { type: Type.STRING } },
                    link: { type: Type.STRING },
                    date: { type: Type.STRING },
                },
                required: ['name', 'description', 'technologies']
            }
        },
        coursework: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
        },
        certifications: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    name: { type: Type.STRING },
                    date: { type: Type.STRING }
                },
                required: ['name', 'date']
            }
        }
    },
    required: ['personalInfo', 'summary', 'experience', 'education', 'skills']
};


export const parseResume = async (text: string): Promise<ResumeData> => {
    const systemInstruction = `You are an expert resume parsing AI. Your task is to accurately convert resume text into a structured JSON object based on the provided schema. Follow these rules strictly:
1.  **Section Integrity**: Correctly identify the boundaries for each major section (Summary, Experience, Projects, Education, Skills, Coursework, Certifications).
2.  **Project Parsing**: A project entry starts with a distinct title, often bolded or larger, and may be followed by a URL. A project might also have a role (e.g., 'Open Source Contributor'). All subsequent bullet points or descriptive paragraphs belong to THAT ONE project. Do not create new, separate project entries from bullet points within a single project's description. A new project only begins when you encounter another distinct project title.
3.  **Bullet Points**: For 'experience' and 'projects', correctly parse multi-line descriptions into an array of strings, with each string representing one bullet point or a single descriptive line.
4.  **Dates**: Accurately extract dates for all relevant sections including experience, education, projects, and certifications.
5.  **Completeness**: Extract all available information for every field defined in the schema. If a section is not present in the resume, provide an empty array or empty string for it.`;

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
        // Ensure arrays are not null
        const fieldsToEnsureArray = ['experience', 'education', 'skills', 'projects', 'coursework', 'certifications'];
        fieldsToEnsureArray.forEach(field => {
            if (!parsedData[field]) {
                parsedData[field] = [];
            }
        });
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

const interviewQuestionsSchema = {
    type: Type.ARRAY,
    items: {
        type: Type.OBJECT,
        properties: {
            question: { type: Type.STRING, description: "A relevant interview question based on the resume and job description." },
            sampleAnswer: { type: Type.STRING, description: "A detailed sample answer to the question, personalized with details from the user's resume. Should use the STAR method where appropriate." },
            tip: { type: Type.STRING, description: "A short, actionable tip for the user on how to deliver or personalize this answer." },
            interviewerInsight: { type: Type.STRING, description: "An explanation of what the interviewer is trying to assess with this question (e.g., problem-solving skills, cultural fit, etc.)." },
        },
        required: ['question', 'sampleAnswer', 'tip', 'interviewerInsight']
    }
};

export const getInterviewQuestions = async (resumeData: ResumeData, jobDescription: string, existingQuestions: InterviewQuestion[] = []): Promise<InterviewQuestion[]> => {
    
    const isGeneratingMore = existingQuestions.length > 0;
    
    const prompt = `You are a world-class career coach and senior hiring manager. Your task is to help a candidate prepare for their interview by generating personalized questions and answers.

    Analyze the provided resume and the target job description. Based on this, generate ${isGeneratingMore ? '3-4 MORE' : '5-7'} insightful interview questions. The questions should be a mix of behavioral, technical, and situational.

    ${isGeneratingMore ? `**CRITICAL: DO NOT** repeat or generate questions similar to these already provided: ${JSON.stringify(existingQuestions.map(q => q.question))}` : ''}

    For each question, you MUST:
    1.  **Craft a Strong Sample Answer:** The answer should be detailed and directly reference specific achievements, projects, or skills from the candidate's resume. Use the STAR (Situation, Task, Action, Result) method for behavioral questions.
    2.  **Provide an Actionable Tip:** Give a brief tip on how the candidate can best deliver this answer or personalize it further.
    3.  **Explain the "Why" (Interviewer's Insight):** Provide a short analysis of what an interviewer is *really* looking for with this question. What skills, traits, or red flags are they trying to uncover?

    Resume JSON:
    ---
    ${JSON.stringify(resumeData, null, 2)}
    ---

    Job Description:
    ---
    ${jobDescription}
    ---

    Provide the output as a structured JSON array.
    `;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: interviewQuestionsSchema
        }
    });

    try {
        const jsonText = response.text.trim();
        const questions = JSON.parse(jsonText);
        return questions as InterviewQuestion[];
    } catch (e) {
        console.error("Error parsing interview questions JSON from Gemini:", e);
        console.error("Raw response:", response.text);
        throw new Error("Failed to parse interview questions from the AI response.");
    }
};


export const generateElevatorPitch = async (resumeData: ResumeData, jobDescription: string): Promise<string> => {
    const prompt = `Based on the following resume and job description, craft a compelling 30-60 second elevator pitch for the "Tell me about yourself" interview question. The pitch should be professional, concise, and directly connect the candidate's most relevant skills and experiences to the job requirements.

    Resume JSON:
    ---
    ${JSON.stringify(resumeData, null, 2)}
    ---

    Job Description:
    ---
    ${jobDescription}
    ---
    `;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: { pitch: { type: Type.STRING } }
            }
        }
    });

    try {
        const jsonText = response.text.trim();
        const result = JSON.parse(jsonText);
        return result.pitch;
    } catch (e) {
        console.error("Error parsing elevator pitch JSON from Gemini:", e);
        throw new Error("Failed to generate elevator pitch.");
    }
};

export const generateSmartQuestions = async (jobDescription: string, companyName: string): Promise<string[]> => {
    const prompt = `You are a senior hiring manager. Based on the provided job description for a role at "${companyName}", generate 3-5 insightful questions a top candidate should ask the interviewer. These questions should go beyond generic topics and demonstrate genuine interest, critical thinking, and a desire to understand the team, the role's challenges, and its strategic importance.

    Job Description:
    ---
    ${jobDescription}
    ---
    `;
    
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: { questions: { type: Type.ARRAY, items: { type: Type.STRING } } }
            }
        }
    });
    
    try {
        const jsonText = response.text.trim();
        const result = JSON.parse(jsonText);
        return result.questions;
    } catch (e) {
        console.error("Error parsing smart questions JSON from Gemini:", e);
        throw new Error("Failed to generate smart questions.");
    }
};

export const generateCompanyBriefing = async (companyName: string): Promise<CompanyBriefing> => {
    const prompt = `Generate a concise company briefing for "${companyName}". Use your knowledge and search capabilities to provide the most up-to-date information.
    
    The briefing must include the following sections:
    1.  **Mission & Vision:** A brief summary of the company's core purpose and goals.
    2.  **Recent News & Developments:** 2-3 key recent events, product launches, or announcements.
    3.  **Key Competitors:** A short list of the company's main competitors.

    Format the output in clear, readable markdown.
    `;
    
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
            tools: [{ googleSearch: {} }],
        },
    });

    const sources: GroundingSource[] = response.candidates?.[0]?.groundingMetadata?.groundingChunks
        ?.map((chunk: any) => ({
            uri: chunk.web?.uri,
            title: chunk.web?.title,
        }))
        .filter((source: GroundingSource) => source.uri && source.title) || [];
    
    // Deduplicate sources
    const uniqueSources = Array.from(new Map(sources.map(item => [item.uri, item])).values());

    return {
        content: response.text.trim(),
        sources: uniqueSources,
    };
};

export const getFollowUpAnswer = async (context: string, userQuestion: string): Promise<string> => {
    const prompt = `You are a helpful and concise career coach AI. A user has a follow-up question about a suggestion or piece of information you provided.
    
    Here is the original context you provided:
    ---
    ${context}
    ---

    Here is the user's question about it:
    ---
    ${userQuestion}
    ---

    Please provide a direct and helpful answer to the user's question. Be clear and encouraging.
    `;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
    });

    return response.text.trim();
};