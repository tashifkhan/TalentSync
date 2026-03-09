"use client";

import { useState, useCallback, useMemo } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { SectionHeader } from "./section-header";
import { PersonalInfoForm } from "./forms/personal-info-form";
import { SummaryForm } from "./forms/summary-form";
import { WorkExperienceForm } from "./forms/work-experience-form";
import { EducationForm } from "./forms/education-form";
import { SkillsForm } from "./forms/skills-form";
import { ProjectsForm } from "./forms/projects-form";
import { PublicationsForm } from "./forms/publications-form";
import { CertificationsForm } from "./forms/certifications-form";
import { AchievementsForm } from "./forms/achievements-form";
import { PositionsForm } from "./forms/positions-form";
import { LanguagesForm } from "./forms/languages-form";
import { RecommendedRolesForm } from "./forms/recommended-roles-form";
import type { ResumeData, SectionMeta } from "@/types/resume";
import { DEFAULT_SECTION_ORDER } from "@/types/resume";

interface ResumeFormProps {
  data: ResumeData;
  onChange: (data: ResumeData) => void;
  sectionOrder: SectionMeta[];
  onSectionOrderChange: (order: SectionMeta[]) => void;
}

function getSectionItemCount(
  key: string,
  data: ResumeData
): number | undefined {
  switch (key) {
    case "work_experience":
      return data.work_experience?.length ?? 0;
    case "education":
      return data.education?.length ?? 0;
    case "skills_analysis":
      return data.skills_analysis?.length ?? 0;
    case "projects":
      return data.projects?.length ?? 0;
    case "publications":
      return data.publications?.length ?? 0;
    case "certifications":
      return data.certifications?.length ?? 0;
    case "achievements":
      return data.achievements?.length ?? 0;
    case "positions_of_responsibility":
      return data.positions_of_responsibility?.length ?? 0;
    case "languages":
      return data.languages?.length ?? 0;
    case "recommended_roles":
      return data.recommended_roles?.length ?? 0;
    default:
      return undefined;
  }
}

export function ResumeForm({
  data,
  onChange,
  sectionOrder,
  onSectionOrderChange,
}: ResumeFormProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    () => new Set(DEFAULT_SECTION_ORDER.slice(0, 3).map((s) => s.key))
  );

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const toggleExpanded = useCallback((key: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  const toggleVisibility = useCallback(
    (key: string) => {
      onSectionOrderChange(
        sectionOrder.map((s) =>
          s.key === key ? { ...s, isVisible: !s.isVisible } : s
        )
      );
    },
    [sectionOrder, onSectionOrderChange]
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      const oldIndex = sectionOrder.findIndex((s) => s.key === active.id);
      const newIndex = sectionOrder.findIndex((s) => s.key === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        const reordered = arrayMove(sectionOrder, oldIndex, newIndex).map(
          (s, i) => ({ ...s, order: i })
        );
        onSectionOrderChange(reordered);
      }
    },
    [sectionOrder, onSectionOrderChange]
  );

  const sectionKeys = useMemo(
    () => sectionOrder.map((s) => s.key),
    [sectionOrder]
  );

  const renderSectionForm = (key: string) => {
    switch (key) {
      case "personalInfo":
        return <PersonalInfoForm data={data} onChange={onChange} />;
      case "work_experience":
        return <WorkExperienceForm data={data} onChange={onChange} />;
      case "education":
        return <EducationForm data={data} onChange={onChange} />;
      case "skills_analysis":
        return <SkillsForm data={data} onChange={onChange} />;
      case "projects":
        return <ProjectsForm data={data} onChange={onChange} />;
      case "publications":
        return <PublicationsForm data={data} onChange={onChange} />;
      case "certifications":
        return <CertificationsForm data={data} onChange={onChange} />;
      case "achievements":
        return <AchievementsForm data={data} onChange={onChange} />;
      case "positions_of_responsibility":
        return <PositionsForm data={data} onChange={onChange} />;
      case "languages":
        return <LanguagesForm data={data} onChange={onChange} />;
      case "recommended_roles":
        return <RecommendedRolesForm data={data} onChange={onChange} />;
      default:
        return <SummaryForm data={data} onChange={onChange} />;
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={sectionKeys}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-0.5">
          {sectionOrder.map((section) => (
            <div key={section.key}>
              <SectionHeader
                section={section}
                isExpanded={expandedSections.has(section.key)}
                onToggleExpand={() => toggleExpanded(section.key)}
                onToggleVisibility={() => toggleVisibility(section.key)}
                itemCount={getSectionItemCount(section.key, data)}
              />
              {expandedSections.has(section.key) && (
                <div className="ml-[18px] pl-4 pr-2 pb-4 pt-2 border-l border-border/40">
                  {renderSectionForm(section.key)}
                </div>
              )}
            </div>
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
