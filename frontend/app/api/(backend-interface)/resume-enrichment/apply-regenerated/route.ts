import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";
import { getLlmHeaders } from "@/lib/llm-headers";
import type { RegeneratedItem } from "@/types/enrichment";

export const maxDuration = 1800;

interface ApplyRegeneratedRequestBody {
  resumeId: string;
  items: RegeneratedItem[];
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, message: "Authentication required" },
        { status: 401 }
      );
    }

    const userId = (session.user as { id: string }).id;

    // Parse request body
    const body: ApplyRegeneratedRequestBody = await request.json();
    const { resumeId, items } = body;

    if (!resumeId) {
      return NextResponse.json(
        { success: false, message: "Resume ID is required" },
        { status: 400 }
      );
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, message: "Regenerated items are required" },
        { status: 400 }
      );
    }

    // Get resume from database
    const resume = await prisma.resume.findUnique({
      where: { id: resumeId },
      include: {
        analysis: true,
      },
    });

    if (!resume) {
      return NextResponse.json(
        { success: false, message: "Resume not found" },
        { status: 404 }
      );
    }

    // Check ownership
    if (resume.userId !== userId) {
      return NextResponse.json(
        { success: false, message: "Access denied" },
        { status: 403 }
      );
    }

    if (!resume.analysis) {
      return NextResponse.json(
        { success: false, message: "Resume has no analysis data" },
        { status: 400 }
      );
    }

    // Sanitize to prevent Pydantic validation errors when a string is expected but null is given.
    // Handles nulls at any depth: inside objects, inside arrays, or at the top level.
    const sanitizeNulls = (obj: any): any => {
      if (obj === null || obj === undefined) return "";
      if (Array.isArray(obj)) return obj.map(sanitizeNulls);
      if (typeof obj === "object") {
        const newObj: any = {};
        for (const [k, v] of Object.entries(obj)) {
          newObj[k] = sanitizeNulls(v);
        }
        return newObj;
      }
      return obj;
    };

    // Build request payload for backend
    const rawPayload = {
      resume_data: {
        skills_analysis: (resume.analysis.skillsAnalysis as any[]) || [],
        recommended_roles: (resume.analysis.recommendedRoles as string[]) || [],
        languages: (resume.analysis.languages as any[]) || [],
        education: (resume.analysis.education as any[]) || [],
        work_experience: (resume.analysis.workExperience as any[]) || [],
        projects: (resume.analysis.projects as any[]) || [],
        publications: (resume.analysis.publications as any[]) || [],
        positions_of_responsibility:
          (resume.analysis.positionsOfResponsibility as any[]) || [],
        certifications: (resume.analysis.certifications as any[]) || [],
        achievements: (resume.analysis.achievements as any[]) || [],
        name: resume.analysis.name || "",
        email: resume.analysis.email || "",
        contact: resume.analysis.contact || "",
        linkedin: resume.analysis.linkedin || undefined,
        github: resume.analysis.github || undefined,
        blog: resume.analysis.blog || null,
        portfolio: resume.analysis.portfolio || undefined,
        predicted_field: resume.analysis.predictedField || "",
      },
      items,
    };

    const backendPayload = sanitizeNulls(rawPayload);

    const backendUrl = process.env.BACKEND_URL || "http://localhost:8000";
    const llmHeaders = await getLlmHeaders(userId);

    const backendResponse = await fetch(
      `${backendUrl}/api/v1/resume/enrichment/apply-regenerated`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...llmHeaders,
        },
        body: JSON.stringify(backendPayload),
        signal: AbortSignal.timeout(1_800_000), // 30 minute timeout
      }
    );

    if (!backendResponse.ok) {
      const errorText = await backendResponse.text();
      console.error("Apply regenerated API - Backend error:", {
        status: backendResponse.status,
        error: errorText.substring(0, 500),
      });

      let errorMessage = "Failed to apply regenerated items";
      try {
        const errorData = JSON.parse(errorText);
        errorMessage =
          errorData.detail?.message ||
          errorData.message ||
          errorData.detail ||
          errorMessage;
      } catch {
        // Use default error message
      }

      return NextResponse.json(
        { success: false, message: errorMessage },
        { status: backendResponse.status }
      );
    }

    const responseData = await backendResponse.json();
    const updated = responseData.updated_resume;

    if (!updated) {
      return NextResponse.json(
        { success: false, message: "Backend did not return updated resume" },
        { status: 500 }
      );
    }

    // Update the analysis in the database using backend result
    await prisma.analysis.update({
      where: { resumeId },
      data: {
        skillsAnalysis: updated.skills_analysis || [],
        recommendedRoles: updated.recommended_roles || [],
        languages: updated.languages || [],
        education: updated.education || [],
        workExperience: updated.work_experience || [],
        projects: updated.projects || [],
        publications: updated.publications || [],
        positionsOfResponsibility: updated.positions_of_responsibility || [],
        certifications: updated.certifications || [],
        achievements: updated.achievements || [],
        name: updated.name || "",
        email: updated.email || "",
        contact: updated.contact || "",
        linkedin: updated.linkedin || "",
        github: updated.github || "",
        blog: updated.blog || "",
        portfolio: updated.portfolio || "",
        predictedField: updated.predicted_field || "",
      },
    });

    return NextResponse.json({
      success: true,
      message: "Regenerated items applied successfully",
      appliedCount: items.length,
    });

  } catch (error) {
    console.error("Apply regenerated API - Error:", error);

    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
