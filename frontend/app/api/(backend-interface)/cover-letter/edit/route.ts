import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";
import { getLlmHeaders } from "@/lib/llm-headers";

export const maxDuration = 1800;

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !(session.user as any).id) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }
    const userId = (session.user as any).id;
    const llmHeaders = await getLlmHeaders(userId);

    const data = await req.formData();

    const resumeId = data.get("resumeId") as string | null;
    const resumeFile = data.get("file") as File | null;

    const backendFormData = new FormData();

    if (resumeId) {
      const resume = await prisma.resume.findUnique({
        where: { id: resumeId, userId: userId },
      });
      if (!resume) {
        return NextResponse.json(
          { success: false, message: "Resume not found" },
          { status: 404 }
        );
      }
      const resumeText = resume.rawText;
      backendFormData.append("resume_text", resumeText);
    } else if (resumeFile) {
      const fileContent = await resumeFile.text();
      backendFormData.append("resume_text", fileContent);
    } else {
      return NextResponse.json(
        { success: false, message: "Resume content is missing" },
        { status: 400 }
      );
    }

    // Append other fields from the original form data
    const fieldsToForward = [
      "recipient_name",
      "company_name",
      "sender_name",
      "sender_role_or_goal",
      "job_description",
      "key_points_to_include",
      "additional_info_for_llm",
      "company_url",
      "jd_url",
      "generated_cover_letter",
      "edit_instructions",
    ];

    for (const key of fieldsToForward) {
      const value = data.get(key);
      if (value !== null) {
        backendFormData.append(key, value);
      }
    }

    const backendUrl = process.env.BACKEND_URL || "http://localhost:8000";
    const pythonApiUrl = `${backendUrl}/api/v2/cover-letter/edit/`;
    const response = await fetch(pythonApiUrl, {
      method: "POST",
      body: backendFormData,
      headers: { ...llmHeaders },
      signal: AbortSignal.timeout(1_800_000), // 30 minute timeout
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error("Python backend error:", errorBody);
      return NextResponse.json(
        {
          success: false,
          message: `Error from external service: ${response.statusText}`,
        },
        { status: response.status }
      );
    }

    const result = await response.json();

    // Support both shapes: {body} and {success, data: {body}}
    const letterDataCandidate =
      result && typeof result === "object" && "data" in result && (result as any).data
        ? (result as any).data
        : result;

    const body = (letterDataCandidate as any)?.body;

    if (!body) {
      if (result && typeof result === "object" && (result as any).success === false) {
        return NextResponse.json(
          {
            success: false,
            message:
              (result as any).message || "Failed to edit cover letter from external service",
          },
          { status: 400 }
        );
      }

      console.error("Python backend response missing 'body':", result);
      return NextResponse.json(
        {
          success: false,
          message: "Invalid response from external service: missing body.",
        },
        { status: 500 }
      );
    }

    const coverLetterRequestId = data.get("cover_letter_request_id") as string | null;

    let newRequestId = coverLetterRequestId;
    let newResponseId;

    if (coverLetterRequestId) {
      // Existing request, just add a new response
      const newResponse = await prisma.coverLetterResponse.create({
        data: {
          body,
          requestId: coverLetterRequestId,
        },
      });
      newResponseId = newResponse.id;
    } else {
      // New draft, create new request and response
      const newRequest = await prisma.coverLetterRequest.create({
        data: {
          userId: userId,
          recipientName: (data.get("recipient_name") as string) || "",
          companyName: (data.get("company_name") as string) || "",
          senderName: data.get("sender_name") as string,
          senderRoleOrGoal: data.get("sender_role_or_goal") as string,
          jobDescription: data.get("job_description") as string,
          keyPoints: data.get("key_points_to_include") as string,
          additionalInfo: data.get("additional_info_for_llm") as string,
          companyUrl: data.get("company_url") as string | null,
          jdUrl: (data.get("jd_url") as string | null) || null,
        },
      });
      newRequestId = newRequest.id;

      const newResponse = await prisma.coverLetterResponse.create({
        data: {
          body,
          requestId: newRequestId,
        },
      });
      newResponseId = newResponse.id;
    }

    return NextResponse.json({
      success: true,
      data: {
        body,
        requestId: newRequestId,
        responseId: newResponseId,
      },
    });
  } catch (error) {
    console.error("Error editing cover letter:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
