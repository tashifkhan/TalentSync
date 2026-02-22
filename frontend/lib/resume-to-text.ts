import type { ResumeData } from "@/types/resume";

/**
 * Converts structured ResumeData into a clean plain-text representation.
 * Used to populate the `rawText` field for manual resumes and after edits,
 * ensuring ATS text-based evaluation works consistently.
 */
export function resumeDataToText(data: ResumeData): string {
  const sections: string[] = [];

  // Personal info header
  const personalLines: string[] = [];
  if (data.name) personalLines.push(data.name);
  if (data.email) personalLines.push(`Email: ${data.email}`);
  if (data.contact) personalLines.push(`Phone: ${data.contact}`);
  if (data.linkedin) personalLines.push(`LinkedIn: ${data.linkedin}`);
  if (data.github) personalLines.push(`GitHub: ${data.github}`);
  if (data.portfolio) personalLines.push(`Portfolio: ${data.portfolio}`);
  if (data.blog) personalLines.push(`Blog: ${data.blog}`);
  if (personalLines.length > 0) {
    sections.push(personalLines.join("\n"));
  }

  // Predicted field / Summary
  if (data.predicted_field) {
    sections.push(`PROFESSIONAL SUMMARY\n${data.predicted_field}`);
  }

  // Work Experience
  if (data.work_experience?.length > 0) {
    const expLines = data.work_experience.map((exp) => {
      const header = [exp.role, exp.company_and_duration]
        .filter(Boolean)
        .join(" | ");
      const bullets = exp.bullet_points
        ?.map((bp) => `  - ${bp}`)
        .join("\n");
      return [header, bullets].filter(Boolean).join("\n");
    });
    sections.push(`WORK EXPERIENCE\n${expLines.join("\n\n")}`);
  }

  // Education
  if (data.education?.length > 0) {
    const eduLines = data.education
      .map((e) => e.education_detail)
      .filter(Boolean);
    sections.push(`EDUCATION\n${eduLines.join("\n")}`);
  }

  // Skills
  if (data.skills_analysis?.length > 0) {
    const skillNames = data.skills_analysis
      .map((s) => s.skill_name)
      .filter(Boolean);
    sections.push(`SKILLS\n${skillNames.join(", ")}`);
  }

  // Projects
  if (data.projects?.length > 0) {
    const projLines = data.projects.map((p) => {
      const parts: string[] = [];
      if (p.title) parts.push(p.title);
      if (p.technologies_used?.length > 0) {
        parts.push(`Technologies: ${p.technologies_used.join(", ")}`);
      }
      if (p.description) parts.push(p.description);
      if (p.live_link) parts.push(`Live: ${p.live_link}`);
      if (p.repo_link) parts.push(`Repo: ${p.repo_link}`);
      return parts.join("\n  ");
    });
    sections.push(`PROJECTS\n${projLines.join("\n\n")}`);
  }

  // Publications
  if (data.publications?.length > 0) {
    const pubLines = data.publications.map((p) => {
      const parts = [p.title, p.authors, p.journal_conference, p.year]
        .filter(Boolean)
        .join(". ");
      return parts;
    });
    sections.push(`PUBLICATIONS\n${pubLines.join("\n")}`);
  }

  // Certifications
  if (data.certifications?.length > 0) {
    const certLines = data.certifications.map((c) => {
      return [c.name, c.issuing_organization, c.issue_date]
        .filter(Boolean)
        .join(" - ");
    });
    sections.push(`CERTIFICATIONS\n${certLines.join("\n")}`);
  }

  // Achievements
  if (data.achievements?.length > 0) {
    const achLines = data.achievements.map((a) => {
      return [a.title, a.description, a.year].filter(Boolean).join(" - ");
    });
    sections.push(`ACHIEVEMENTS\n${achLines.join("\n")}`);
  }

  // Positions of Responsibility
  if (data.positions_of_responsibility?.length > 0) {
    const posLines = data.positions_of_responsibility.map((p) => {
      return [p.title, p.organization, p.duration, p.description]
        .filter(Boolean)
        .join(" | ");
    });
    sections.push(
      `POSITIONS OF RESPONSIBILITY\n${posLines.join("\n")}`
    );
  }

  // Languages
  if (data.languages?.length > 0) {
    const langNames = data.languages
      .map((l) => l.language)
      .filter(Boolean);
    sections.push(`LANGUAGES\n${langNames.join(", ")}`);
  }

  // Recommended Roles
  if (data.recommended_roles?.length > 0) {
    sections.push(
      `TARGET ROLES\n${data.recommended_roles.join(", ")}`
    );
  }

  return sections.join("\n\n---\n\n");
}

/**
 * Creates an empty ResumeData skeleton for new manual resumes.
 */
export function createEmptyResumeData(): ResumeData {
  return {
    name: "",
    email: "",
    contact: "",
    linkedin: "",
    github: "",
    blog: "",
    portfolio: "",
    predicted_field: "",
    skills_analysis: [],
    recommended_roles: [],
    languages: [],
    education: [],
    work_experience: [],
    projects: [],
    publications: [],
    positions_of_responsibility: [],
    certifications: [],
    achievements: [],
  };
}
