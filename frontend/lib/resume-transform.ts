/**
 * Resume data transformation utilities.
 * Converts between UI resume analysis formats when needed.
 */

import type { ResumeData as TalentSyncResumeData } from "@/types/resume";
import type { SelectableItem, RegenerateItemType } from "@/types/enrichment";


/**
 * Extract selectable items from TalentSync Analysis for the regeneration wizard.
 * Returns work experience, projects, and skills as selectable items.
 */
export function extractSelectableItems(
  analysis: TalentSyncResumeData
): SelectableItem[] {
  const items: SelectableItem[] = [];

  // Add work experience
  (analysis.work_experience || []).forEach((work, index) => {
    items.push({
      id: `experience-${index}`,
      type: "experience" as RegenerateItemType,
      title: work.role,
      subtitle: work.company_and_duration,
      content: work.bullet_points || [],
      selected: false,
    });
  });

  // Add projects
  (analysis.projects || []).forEach((proj, index) => {
    items.push({
      id: `project-${index}`,
      type: "project" as RegenerateItemType,
      title: proj.title,
      subtitle: proj.technologies_used?.join(", "),
      content: proj.description ? [proj.description] : [],
      selected: false,
    });
  });

  // Add skills as a single item (grouped)
  if (analysis.skills_analysis && analysis.skills_analysis.length > 0) {
    items.push({
      id: "skills-0",
      type: "skills" as RegenerateItemType,
      title: "Technical Skills",
      subtitle: `${analysis.skills_analysis.length} skills`,
      content: analysis.skills_analysis.map((s) => s.skill_name),
      selected: false,
    });
  }

  return items;
}

/**
 * Deep merge two objects, preferring values from the source.
 */
export function deepMergeResume(
  target: TalentSyncResumeData,
  source: Partial<TalentSyncResumeData>
): TalentSyncResumeData {
  return { ...target, ...source };
}
