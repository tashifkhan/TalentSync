export interface CoverLetterSession {
  id: string;
  recipientName: string;
  companyName: string;
  createdAt: string;
  letters: CoverLetterEntry[];
}

export interface CoverLetterEntry {
  id: string;
  body: string;
  createdAt: string;
}

export interface CoverLetterRequest {
  resumeId?: string;
  file?: File;
  recipient_name: string;
  company_name: string;
  sender_name: string;
  sender_role_or_goal: string;
  job_description: string;
  jd_url?: string;
  key_points_to_include: string;
  additional_info_for_llm: string;
  company_url?: string;

  // For editing
  generated_cover_letter?: string;
  edit_instructions?: string;
  cover_letter_request_id?: string;
}

export interface CoverLetterResponseData {
  body: string;
  requestId?: string;
  responseId?: string;
}
