export interface ColdMailEmail {
  id: string;
  subject: string;
  body: string;
  createdAt: string;
}

export interface ColdMailSession {
  id: string;
  recipientName: string;
  recipientDesignation: string;
  companyName: string;
  createdAt: string;
  emails: ColdMailEmail[];
}

export interface ColdMailRequest {
  resumeId?: string;
  file?: File;
  custom_draft?: string;
  edit_instructions?: string;
  
  recipient_name: string;
  recipient_designation: string;
  company_name: string;
  sender_name: string;
  sender_role_or_goal: string;
  key_points_to_include: string;
  additional_info_for_llm: string;
  company_url?: string;
  
  // For editing
  generated_email_subject?: string;
  generated_email_body?: string;
  edit_inscription?: string;
  cold_mail_request_id?: string;
}

export interface ColdMailResponseData {
  subject: string;
  body: string;
  requestId?: string;
  responseId?: string;
}
