import {
  Github,
  Linkedin,
  Instagram,
  Mail,
  Youtube,
  Twitter,
  BookOpen,
  HelpCircle,
  Globe,
  LucideIcon,
} from "lucide-react";

export interface SocialConfig {
  name: string;
  icon: LucideIcon;
  getUrl: (value: string) => string;
}

export const socialRegistry: Record<string, SocialConfig> = {
  github: {
    name: "GitHub",
    icon: Github,
    getUrl: (username) => `https://github.com/${username}`,
  },
  linkedin: {
    name: "LinkedIn",
    icon: Linkedin,
    getUrl: (username) => `https://linkedin.com/in/${username}`,
  },
  instagram: {
    name: "Instagram",
    icon: Instagram,
    getUrl: (username) => `https://instagram.com/${username}`,
  },
  email: {
    name: "Email",
    icon: Mail,
    getUrl: (address) => `mailto:${address}`,
  },
  x: {
    name: "X / Twitter",
    icon: Twitter,
    getUrl: (username) => `https://x.com/${username}`,
  },
  youtube: {
    name: "YouTube",
    icon: Youtube,
    getUrl: (channel) => `https://youtube.com/${channel}`,
  },
  devto: {
    name: "Dev.to",
    icon: BookOpen,
    getUrl: (username) => `https://dev.to/${username}`,
  },
  stackoverflow: {
    name: "Stack Overflow",
    icon: HelpCircle,
    getUrl: (userId) => `https://stackoverflow.com/users/${userId}`,
  },
  website: {
    name: "Website",
    icon: Globe,
    getUrl: (url) => (url.startsWith("http") ? url : `https://${url}`),
  },
};
