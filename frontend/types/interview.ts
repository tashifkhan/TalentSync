export interface QuestionAnswer {
  question: string;
  answer: string;
}

export interface InterviewSession {
  id: string;
  role: string;
  companyName: string;
  createdAt: string;
  questionsAndAnswers: QuestionAnswer[];
}

export interface InterviewRequest {
  resumeId?: string;
  file?: File;
  job_description: string;
  company_name: string;
  interview_type: string;
}
