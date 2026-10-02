export interface CoverLetterRecipient {
  company: string;
  department?: string;
  contactPerson?: string;
  address?: string;
  city?: string;
  country?: string;
}

export interface CoverLetterPosition {
  title: string;
  referenceNumber?: string;
  date?: string;
}

export interface CoverLetterContent {
  salutation: string;
  paragraphs: string[];
  bulletPoints?: string[];
  closing: string;
  signOffName: string;
}

export interface CoverLetterData {
  basics: {
    name: string;
    headline?: string;
    email: string;
    phone?: string;
    location: string;
    url?: { href: string };
    picture?: { url: string };
  };
  profiles?: Array<{
    network: string;
    username: string;
    url: { href: string };
  }>;
  keyCompetencies?: string[];
  recipient: CoverLetterRecipient;
  position: CoverLetterPosition;
  content: CoverLetterContent;
}
