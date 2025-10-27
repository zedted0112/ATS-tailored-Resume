import type { ResumeData } from './types';

export const initialResumeData: ResumeData = {
  personalInfo: {
    name: "Jane Doe",
    email: "jane.doe@example.com",
    phone: "123-456-7890",
    linkedin: "linkedin.com/in/janedoe",
    github: "github.com/janedoe",
    website: "janedoe.dev",
    location: "San Francisco, CA"
  },
  summary: "A highly motivated and results-oriented software engineer with 5+ years of experience in developing and scaling web applications. Proficient in React, Node.js, and cloud technologies. Passionate about creating user-friendly and efficient solutions.",
  experience: [
    {
      company: "Tech Solutions Inc.",
      role: "Senior Software Engineer",
      location: "San Francisco, CA",
      startDate: "Jan 2021",
      endDate: "Present",
      description: [
        "Led the development of a new customer-facing analytics dashboard using React and D3.js, resulting in a 20% increase in user engagement.",
        "Architected and implemented a microservices-based backend using Node.js and Docker, improving system scalability and reducing latency by 30%.",
        "Mentored junior engineers and conducted code reviews to maintain high code quality standards."
      ]
    },
    {
      company: "Innovate Corp.",
      role: "Software Engineer",
      location: "Palo Alto, CA",
      startDate: "Jun 2018",
      endDate: "Dec 2020",
      description: [
        "Developed and maintained features for a large-scale e-commerce platform using TypeScript and GraphQL.",
        "Collaborated with cross-functional teams to deliver high-quality software on schedule.",
        "Contributed to the migration of legacy code to a modern React codebase."
      ]
    }
  ],
  education: [
    {
      institution: "University of California, Berkeley",
      degree: "B.S. in Computer Science",
      location: "Berkeley, CA",
      graduationDate: "May 2018",
      cgpa: "3.9/4.0"
    }
  ],
  skills: [
    "JavaScript (ES6+)", "TypeScript", "React", "Node.js", "Express", "Python", "GraphQL", "REST APIs", "SQL", "PostgreSQL", "MongoDB", "Docker", "AWS", "CI/CD", "Git"
  ],
  projects: [
      {
          name: "Project Portfolio Website",
          role: "Lead Developer",
          date: "Fall 2023",
          description: [
              "Built a personal portfolio website to showcase my projects and skills.",
              "Developed with Next.js for server-side rendering and static site generation.",
              "Styled with Tailwind CSS for a modern and responsive design."
          ],
          technologies: ["Next.js", "React", "Tailwind CSS", "Vercel"],
          link: "github.com/janedoe/portfolio"
      }
  ],
  coursework: [
      "Data Structures and Algorithms",
      "Object Oriented Programming",
      "Database Management Systems",
      "Operating Systems"
  ],
  certifications: [
      { name: "AWS Certified Cloud Practitioner", date: "Oct 2023" },
      { name: "Google Professional Data Engineer", date: "Jan 2024" }
  ],
  hiddenSections: []
};