import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";
import { getLlmHeaders } from "@/lib/llm-headers";

interface BackendCoverLetterResponse {
  success: boolean;
  message: string;
  body: string;
}

function validateCoverLetterRequest(data: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!data.sender_name?.trim()) {
    errors.push("Sender name is required");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

function sanitizeTextForReact(text: string): string {
  if (!text || typeof text !== "string") {
    return "";
  }

  const sanitized = text
    .replace(/<[^>]*>/g, "")
    .replace(/&[^;]+;/g, (entity) => {
      const entities: { [key: string]: string } = {
        "&amp;": "&",
        "&lt;": "<",
        "&gt;": ">",
        "&quot;": '"',
        "&#39;": "'",
        "&nbsp;": " ",
      };
      return entities[entity] || entity;
    })
    .trim();

  return sanitized;
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, message: "Authentication required" },
        { status: 401 }
      );
    }

    const userId = (session.user as any).id;
    const llmHeaders = await getLlmHeaders(userId);

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const resumeId = formData.get("resumeId") as string | null;

    const requestData = {
      recipient_name: formData.get("recipient_name") as string,
      company_name: formData.get("company_name") as string,
      sender_name: formData.get("sender_name") as string,
      sender_role_or_goal: formData.get("sender_role_or_goal") as string,
      job_description: formData.get("job_description") as string,
      key_points_to_include: formData.get("key_points_to_include") as string,
      additional_info_for_llm: formData.get("additional_info_for_llm") as string,
      company_url: formData.get("company_url") as string,
      jd_url: formData.get("jd_url") as string,
    };

    // Validate request data
    const validation = validateCoverLetterRequest(requestData);
    if (!validation.isValid) {
      return NextResponse.json(
        {
          success: false,
          message: "Validation failed",
          errors: validation.errors,
        },
        { status: 400 }
      );
    }

    // Validate resume source
    if (!file && !resumeId) {
      return NextResponse.json(
        {
          success: false,
          message: "Either upload a resume file or select an existing resume",
        },
        { status: 400 }
      );
    }

    if (file && resumeId) {
      return NextResponse.json(
        {
          success: false,
          message: "Please either upload a file or select an existing resume, not both",
        },
        { status: 400 }
      );
    }

    const backendUrl = process.env.BACKEND_URL || "http://localhost:8000";
    let backendResponse: Response;

    try {
      if (file) {
        // File upload - read file content and send as resume_text to v2-style text endpoint
        const fileContent = await file.text();

        const backendFormData = new FormData();
        backendFormData.append("resume_text", fileContent);
        backendFormData.append("recipient_name", requestData.recipient_name || "");
        backendFormData.append("company_name", requestData.company_name || "");
        backendFormData.append("sender_name", requestData.sender_name);
        backendFormData.append("sender_role_or_goal", requestData.sender_role_or_goal || "");
        backendFormData.append("job_description", requestData.job_description || "");
        backendFormData.append("key_points_to_include", requestData.key_points_to_include || "");
        backendFormData.append("additional_info_for_llm", requestData.additional_info_for_llm || "");
        if (requestData.company_url) {
          backendFormData.append("company_url", requestData.company_url);
        }
        if (requestData.jd_url) {
          backendFormData.append("jd_url", requestData.jd_url);
        }

        backendResponse = await fetch(`${backendUrl}/api/v2/cover-letter/generator/`, {
          method: "POST",
          body: backendFormData,
          signal: AbortSignal.timeout(600000),
          headers: { ...llmHeaders },
        });
      } else if (resumeId) {
        // Existing resume from database
        const user = await prisma.user.findUnique({
          where: { email: session.user.email },
          include: { role: true },
        });

        if (!user) {
          return NextResponse.json(
            { success: false, message: "User not found" },
            { status: 404 }
          );
        }

        const resume = await prisma.resume.findUnique({
          where: { id: resumeId },
          include: { user: true },
        });

        if (!resume) {
          return NextResponse.json(
            { success: false, message: "Resume not found" },
            { status: 404 }
          );
        }

        const canAccess =
          resume.userId === user.id ||
          user.role?.name === "Admin" ||
          user.role?.name === "Recruiter";

        if (!canAccess) {
          return NextResponse.json(
            { success: false, message: "Access denied to this resume" },
            { status: 403 }
          );
        }

        const resumeText = resume.rawText;
        if (!resumeText || resumeText.trim().length < 100) {
          return NextResponse.json(
            {
              success: false,
              message: "Resume text is too short or invalid. Please select a different resume.",
            },
            { status: 400 }
          );
        }

        const backendFormData = new FormData();
        backendFormData.append("resume_text", resumeText);
        backendFormData.append("recipient_name", requestData.recipient_name || "");
        backendFormData.append("company_name", requestData.company_name || "");
        backendFormData.append("sender_name", requestData.sender_name);
        backendFormData.append("sender_role_or_goal", requestData.sender_role_or_goal || "");
        backendFormData.append("job_description", requestData.job_description || "");
        backendFormData.append("key_points_to_include", requestData.key_points_to_include || "");
        backendFormData.append("additional_info_for_llm", requestData.additional_info_for_llm || "");
        if (requestData.company_url) {
          backendFormData.append("company_url", requestData.company_url);
        }
        if (requestData.jd_url) {
          backendFormData.append("jd_url", requestData.jd_url);
        }

        backendResponse = await fetch(`${backendUrl}/api/v2/cover-letter/generator/`, {
          method: "POST",
          body: backendFormData,
          signal: AbortSignal.timeout(600000),
          headers: { ...llmHeaders },
        });
      } else {
        return NextResponse.json(
          {
            success: false,
            message: "Invalid request: no resume source provided",
          },
          { status: 400 }
        );
      }

      if (!backendResponse.ok) {
        const errorText = await backendResponse.text();
        console.error("Cover Letter API - Backend error:", {
          status: backendResponse.status,
          statusText: backendResponse.statusText,
          error: errorText.substring(0, 300),
        });

        let errorMessage = "Failed to generate cover letter";

        try {
          const errorData = JSON.parse(errorText);
          if (errorData.detail?.message) {
            errorMessage = errorData.detail.message;
          } else if (errorData.message) {
            errorMessage = errorData.message;
          } else if (errorData.detail) {
            errorMessage =
              typeof errorData.detail === "string"
                ? errorData.detail
                : JSON.stringify(errorData.detail);
          }
        } catch {
          if (errorText.includes("<html") || errorText.includes("<!DOCTYPE")) {
            const titleMatch = errorText.match(/<title>(.*?)<\/title>/i);
            if (titleMatch?.[1]) {
              errorMessage = `Server error: ${titleMatch[1].replace(/<[^>]*>/g, "").trim()}`;
            } else {
              errorMessage = "Server returned an HTML error page";
            }
          } else if (errorText.length > 0 && errorText.length < 200) {
            errorMessage = `Server error: ${errorText.trim()}`;
          }
        }

        return NextResponse.json(
          {
            success: false,
            message: errorMessage,
            body: "",
          },
          { status: backendResponse.status }
        );
      }

      let backendData: BackendCoverLetterResponse;
      const responseText = await backendResponse.text();

      try {
        backendData = JSON.parse(responseText);
      } catch {
        console.error("Cover Letter API - JSON parsing error:", {
          responseText: responseText.substring(0, 500),
        });

        return NextResponse.json(
          {
            success: false,
            message:
              "The cover letter generation service returned an invalid response. Please try again.",
            body: "",
          },
          { status: 502 }
        );
      }

      if (!backendData.body) {
        console.error("Cover Letter API - Invalid backend response:", backendData);
        return NextResponse.json(
          {
            success: false,
            message: "Invalid response from cover letter generation service",
            body: "",
          },
          { status: 500 }
        );
      }

      const sanitizedBody = sanitizeTextForReact(backendData.body);

      // Store cover letter request in database
      let requestId: string | undefined;
      let responseId: string | undefined;
      try {
        const user = await prisma.user.findUnique({
          where: { email: session.user.email },
        });

        if (user) {
          const coverLetterRequest = await prisma.coverLetterRequest.create({
            data: {
              userId: user.id,
              recipientName: requestData.recipient_name || "",
              companyName: requestData.company_name || "",
              senderName: requestData.sender_name,
              senderRoleOrGoal: requestData.sender_role_or_goal,
              jobDescription: requestData.job_description,
              keyPoints: requestData.key_points_to_include,
              additionalInfo: requestData.additional_info_for_llm,
              companyUrl: requestData.company_url,
              jdUrl: requestData.jd_url || null,
            },
          });

          requestId = coverLetterRequest.id;

          const coverLetterResponse = await prisma.coverLetterResponse.create({
            data: {
              requestId: coverLetterRequest.id,
              body: sanitizedBody,
            },
          });

          responseId = coverLetterResponse.id;
        }
      } catch (dbError) {
        console.error("Cover Letter API - Database error (non-critical):", dbError);
      }

      return NextResponse.json({
        success: true,
        message: "Cover letter generated successfully",
        body: sanitizedBody,
        requestId,
        responseId,
      });
    } catch (fetchError) {
      console.error("Cover Letter API - Fetch error:", fetchError);

      let errorMessage = "Failed to connect to cover letter generation service";

      if (fetchError instanceof Error) {
        if (fetchError.name === "AbortError") {
          errorMessage =
            "Request timed out. Cover letter generation took too long — please try again.";
        } else if (
          fetchError.message.includes("ECONNREFUSED") ||
          fetchError.message.includes("ENOTFOUND")
        ) {
          errorMessage =
            "Cannot connect to cover letter generation service. Please try again later.";
        } else if (
          fetchError.message.includes("NetworkError") ||
          fetchError.message.includes("Failed to fetch")
        ) {
          errorMessage =
            "Network error occurred. Please check your connection and try again.";
        } else {
          errorMessage = `Connection error: ${fetchError.message}`;
        }
      }

      return NextResponse.json(
        {
          success: false,
          message: errorMessage,
          body: "",
        },
        { status: 503 }
      );
    }
  } catch (error) {
    console.error("Cover Letter API - Unexpected error:", error);
    return NextResponse.json(
      {
        success: false,
        message: `An unexpected error occurred: ${error instanceof Error ? error.message : "Unknown error"}`,
        body: "",
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Reuse same resume listing as cold mail
    const resumes = await prisma.resume.findMany({
      where: {
        userId: (session.user as any).id,
      },
      select: {
        id: true,
        customName: true,
        uploadDate: true,
        analysis: {
          select: {
            name: true,
            predictedField: true,
          },
        },
      },
      orderBy: {
        uploadDate: "desc",
      },
    });

    return NextResponse.json({
      success: true,
      message: "User resumes retrieved successfully",
      data: {
        resumes: resumes.map((resume) => ({
          id: resume.id,
          customName: resume.customName,
          uploadDate: resume.uploadDate,
          candidateName: resume.analysis?.name,
          predictedField: resume.analysis?.predictedField,
        })),
        total: resumes.length,
      },
    });
  } catch (error) {
    console.error("Error fetching user resumes:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
