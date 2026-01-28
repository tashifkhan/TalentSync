import { apiClient } from "./api-client";

export interface LinkedInPostRequest {
  topic: string;
  tone: string;
  audience: string;
  length: string;
  hashtags_option: string;
  cta_text: string;
  mimic_examples: string;
  language: string;
  post_count: number;
  emoji_level: number;
  github_project_url: string;
  enable_research: boolean;
}

export interface GeneratedPost {
  text: string;
  hashtags?: string[];
  cta_suggestion?: string;
  sources?: { title: string; link: string }[];
  github_project_name?: string;
}

export interface LinkedInPostResponse {
  success: boolean;
  message?: string;
  posts: GeneratedPost[];
}

export const linkedinService = {
  generatePosts: (data: LinkedInPostRequest) => 
    apiClient.post<LinkedInPostResponse>("/api/linkedin-post-generator", data),
};
