// src/types/resume.ts

export interface ResumeProfile {
  network: string;
  username: string;
  url: { href: string };
}

export interface ResumeItem {
  id: string;
  visible: boolean;
  institution?: string;
  company?: string;
  studyType?: string;
  area?: string;
  position?: string;
  date?: string;
  summary?: string;
  score?: string;
  url?: { href: string };
  keywords?: string[];
  name?: string;
  level?: number;
  description?: string;
  network?: string;
  username?: string;
}

export interface ResumeSection {
  name: string;
  visible: boolean;
  items: ResumeItem[];
}

export interface ResumeData {
  basics: {
    name: string;
    headline: string;
    email: string;
    phone?: string;
    location: string;
    url: { href: string };
    picture: { url: string };
  };
  sections: {
    summary: { content: string };
    education: ResumeSection;
    experience: ResumeSection;
    skills: ResumeSection;
    languages: ResumeSection;
    profiles: ResumeSection;
    // Add others if needed (awards, etc.)
  };
}
