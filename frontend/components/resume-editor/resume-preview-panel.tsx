"use client";

import { useMemo, useRef, useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import {
  Mail,
  Phone,
  Globe,
  Linkedin,
  Github,
  ExternalLink,
} from "lucide-react";
import type { ResumeData, SectionMeta } from "@/types/resume";

interface ResumePreviewPanelProps {
  data: ResumeData;
  sectionOrder: SectionMeta[];
  className?: string;
}

/* ------------------------------------------------------------------ */
/*  Miniature "document" preview -- mimics a printed A4 resume          */
/* ------------------------------------------------------------------ */

function SectionDivider() {
  return <hr className="border-t border-neutral-300 my-2.5" />;
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-[10px] font-bold uppercase tracking-[0.12em] text-neutral-700 mb-1.5 pb-0.5 border-b border-neutral-200">
      {children}
    </h3>
  );
}

/* ---------- section renderers ------------------------------------ */

function PersonalInfoSection({ data }: { data: ResumeData }) {
  const links = [
    data.linkedin ? { icon: Linkedin, href: data.linkedin } : null,
    data.github ? { icon: Github, href: data.github } : null,
    data.portfolio ? { icon: Globe, href: data.portfolio } : null,
    data.blog ? { icon: ExternalLink, href: data.blog } : null,
  ].filter(Boolean) as { icon: React.ElementType; href: string }[];

  return (
    <div className="text-center mb-3">
      <h2 className="text-[14px] font-bold text-neutral-900 leading-tight tracking-tight">
        {data.name || "Your Name"}
      </h2>
      <div className="flex items-center justify-center gap-2.5 mt-1 flex-wrap text-[7.5px] text-neutral-600">
        {data.email && (
          <span className="flex items-center gap-0.5">
            <Mail className="h-2 w-2" />
            {data.email}
          </span>
        )}
        {data.contact && (
          <span className="flex items-center gap-0.5">
            <Phone className="h-2 w-2" />
            {data.contact}
          </span>
        )}
        {links.map((l, i) => (
          <span key={i} className="flex items-center gap-0.5">
            <l.icon className="h-2 w-2" />
            <span className="truncate max-w-[90px]">
              {l.href
                .replace(/^https?:\/\/(www\.)?/, "")
                .replace(/\/$/, "")}
            </span>
          </span>
        ))}
      </div>
      {data.predicted_field && (
        <p className="text-[7px] text-neutral-500 mt-1.5 italic leading-tight max-w-[80%] mx-auto">
          {data.predicted_field}
        </p>
      )}
    </div>
  );
}

function WorkExperienceSection({ data }: { data: ResumeData }) {
  if (!data.work_experience?.length) return null;
  return (
    <>
      <SectionDivider />
      <SectionTitle>Work Experience</SectionTitle>
      <div className="space-y-2">
        {data.work_experience.map((exp, i) => (
          <div key={i}>
            <div className="flex justify-between items-baseline">
              <span className="text-[8.5px] font-semibold text-neutral-800">
                {exp.role || "Role"}
              </span>
            </div>
            {exp.company_and_duration && (
              <p className="text-[7px] text-neutral-500 italic">
                {exp.company_and_duration}
              </p>
            )}
            {exp.bullet_points?.length > 0 && (
              <ul className="mt-0.5 space-y-px pl-2.5">
                {exp.bullet_points.map((bp, j) => (
                  <li
                    key={j}
                    className="text-[6.5px] text-neutral-700 leading-[1.4] list-disc ml-1"
                  >
                    {bp}
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    </>
  );
}

function EducationSection({ data }: { data: ResumeData }) {
  if (!data.education?.length) return null;
  return (
    <>
      <SectionDivider />
      <SectionTitle>Education</SectionTitle>
      <div className="space-y-0.5">
        {data.education.map((edu, i) => (
          <p key={i} className="text-[7px] text-neutral-700 leading-tight">
            {edu.education_detail}
          </p>
        ))}
      </div>
    </>
  );
}

function SkillsSection({ data }: { data: ResumeData }) {
  if (!data.skills_analysis?.length) return null;
  return (
    <>
      <SectionDivider />
      <SectionTitle>Skills</SectionTitle>
      <div className="flex flex-wrap gap-x-1 gap-y-0.5">
        {data.skills_analysis.map((skill, i) => (
          <span
            key={i}
            className="text-[6.5px] text-neutral-700 bg-neutral-100 border border-neutral-200 rounded px-1 py-px"
          >
            {skill.skill_name}
          </span>
        ))}
      </div>
    </>
  );
}

function ProjectsSection({ data }: { data: ResumeData }) {
  if (!data.projects?.length) return null;
  return (
    <>
      <SectionDivider />
      <SectionTitle>Projects</SectionTitle>
      <div className="space-y-1.5">
        {data.projects.map((proj, i) => (
          <div key={i}>
            <span className="text-[8px] font-semibold text-neutral-800">
              {proj.title || "Project"}
            </span>
            {proj.technologies_used?.length > 0 && (
              <span className="text-[6.5px] text-neutral-500 ml-1">
                ({proj.technologies_used.join(", ")})
              </span>
            )}
            {proj.description && (
              <p className="text-[6.5px] text-neutral-600 leading-tight mt-0.5">
                {proj.description.length > 200
                  ? proj.description.slice(0, 200) + "..."
                  : proj.description}
              </p>
            )}
          </div>
        ))}
      </div>
    </>
  );
}

function PublicationsSection({ data }: { data: ResumeData }) {
  if (!data.publications?.length) return null;
  return (
    <>
      <SectionDivider />
      <SectionTitle>Publications</SectionTitle>
      <div className="space-y-0.5">
        {data.publications.map((pub, i) => (
          <p key={i} className="text-[7px] text-neutral-700 leading-tight">
            <span className="font-medium">{pub.title}</span>
            {pub.authors && <span> -- {pub.authors}</span>}
            {pub.journal_conference && (
              <span>, {pub.journal_conference}</span>
            )}
            {pub.year && <span> ({pub.year})</span>}
          </p>
        ))}
      </div>
    </>
  );
}

function CertificationsSection({ data }: { data: ResumeData }) {
  if (!data.certifications?.length) return null;
  return (
    <>
      <SectionDivider />
      <SectionTitle>Certifications</SectionTitle>
      <div className="space-y-0.5">
        {data.certifications.map((cert, i) => (
          <p key={i} className="text-[7px] text-neutral-700 leading-tight">
            <span className="font-medium">{cert.name}</span>
            {cert.issuing_organization && (
              <span> -- {cert.issuing_organization}</span>
            )}
            {cert.issue_date && <span> ({cert.issue_date})</span>}
          </p>
        ))}
      </div>
    </>
  );
}

function AchievementsSection({ data }: { data: ResumeData }) {
  if (!data.achievements?.length) return null;
  return (
    <>
      <SectionDivider />
      <SectionTitle>Achievements</SectionTitle>
      <div className="space-y-0.5">
        {data.achievements.map((ach, i) => (
          <p key={i} className="text-[7px] text-neutral-700 leading-tight">
            <span className="font-medium">{ach.title}</span>
            {ach.description && <span> -- {ach.description}</span>}
            {ach.year && <span> ({ach.year})</span>}
          </p>
        ))}
      </div>
    </>
  );
}

function PositionsSection({ data }: { data: ResumeData }) {
  if (!data.positions_of_responsibility?.length) return null;
  return (
    <>
      <SectionDivider />
      <SectionTitle>Positions of Responsibility</SectionTitle>
      <div className="space-y-1">
        {data.positions_of_responsibility.map((pos, i) => (
          <div key={i}>
            <span className="text-[8px] font-semibold text-neutral-800">
              {pos.title}
            </span>
            {pos.organization && (
              <span className="text-[7px] text-neutral-500 ml-1">
                at {pos.organization}
              </span>
            )}
            {pos.duration && (
              <span className="text-[6.5px] text-neutral-400 ml-1">
                ({pos.duration})
              </span>
            )}
            {pos.description && (
              <p className="text-[6.5px] text-neutral-600 leading-tight">
                {pos.description}
              </p>
            )}
          </div>
        ))}
      </div>
    </>
  );
}

function LanguagesSection({ data }: { data: ResumeData }) {
  if (!data.languages?.length) return null;
  return (
    <>
      <SectionDivider />
      <SectionTitle>Languages</SectionTitle>
      <p className="text-[7px] text-neutral-700">
        {data.languages.map((l) => l.language).join(", ")}
      </p>
    </>
  );
}

function RecommendedRolesSection({ data }: { data: ResumeData }) {
  if (!data.recommended_roles?.length) return null;
  return (
    <>
      <SectionDivider />
      <SectionTitle>Target Roles</SectionTitle>
      <p className="text-[7px] text-neutral-700">
        {data.recommended_roles.join(", ")}
      </p>
    </>
  );
}

/* ---------- section key -> renderer map -------------------------- */

const SECTION_RENDERERS: Record<
  string,
  (props: { data: ResumeData }) => React.ReactNode
> = {
  personalInfo: PersonalInfoSection,
  work_experience: WorkExperienceSection,
  education: EducationSection,
  skills_analysis: SkillsSection,
  projects: ProjectsSection,
  publications: PublicationsSection,
  certifications: CertificationsSection,
  achievements: AchievementsSection,
  positions_of_responsibility: PositionsSection,
  languages: LanguagesSection,
  recommended_roles: RecommendedRolesSection,
};

/* ------------------------------------------------------------------ */
/*  Main preview panel                                                 */
/* ------------------------------------------------------------------ */

export function ResumePreviewPanel({
  data,
  sectionOrder,
  className,
}: ResumePreviewPanelProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  const PAGE_WIDTH = 595;
  const PAGE_HEIGHT = 842;

  useEffect(() => {
    function updateScale() {
      if (!containerRef.current) return;
      const containerWidth = containerRef.current.clientWidth;
      const available = containerWidth - 48;
      const newScale = Math.min(1, available / PAGE_WIDTH);
      setScale(newScale);
    }

    updateScale();

    const observer = new ResizeObserver(updateScale);
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const visibleSections = useMemo(
    () => sectionOrder.filter((s) => s.isVisible),
    [sectionOrder]
  );

  return (
    <div
      ref={containerRef}
      className={cn(
        "flex items-start justify-center overflow-auto py-5 px-4",
        className
      )}
    >
      <div
        style={{
          width: PAGE_WIDTH,
          minHeight: PAGE_HEIGHT,
          transform: `scale(${scale})`,
          transformOrigin: "top center",
        }}
      >
        <div
          className="bg-white rounded shadow-2xl shadow-black/20 ring-1 ring-neutral-200/50 px-10 py-8"
          style={{
            width: PAGE_WIDTH,
            minHeight: PAGE_HEIGHT,
            fontFamily: "'Georgia', 'Times New Roman', serif",
          }}
        >
          {visibleSections.map((section) => {
            const Renderer = SECTION_RENDERERS[section.key];
            if (!Renderer) return null;
            return <Renderer key={section.key} data={data} />;
          })}

          {visibleSections.length === 0 && (
            <div className="flex items-center justify-center h-40">
              <p className="text-[9px] text-neutral-400 italic">
                All sections hidden. Toggle visibility in the editor.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
