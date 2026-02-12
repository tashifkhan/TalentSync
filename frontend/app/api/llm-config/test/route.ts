import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";
import { decrypt } from "@/lib/encryption";

export async function POST(request: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
        return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    try {
        const { provider, model, apiKey, apiBase } = await request.json();

        let effectiveApiKey = apiKey;

        // If no API key provided in request, try to get from stored config
        if (!effectiveApiKey || typeof effectiveApiKey !== 'string' || effectiveApiKey.trim() === "") {
             const user = await prisma.user.findUnique({
                 where: { email: session.user.email },
                 include: { llmConfig: true }
             });
             
             if (user?.llmConfig?.encryptedKey) {
                 effectiveApiKey = decrypt(user.llmConfig.encryptedKey);
             }
        }

        // Forward to Backend
        const backendUrl = process.env.BACKEND_URL || "http://127.0.0.1:8000";
        const response = await fetch(`${backendUrl}/api/v1/llm/test`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                provider,
                model,
                api_key: effectiveApiKey || null, 
                api_base: apiBase || null
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("Backend LLM test failed:", errorText);
            return NextResponse.json({ 
                success: false, 
                message: `Backend connection failed: ${response.status} ${response.statusText}` 
            }, { status: response.status });
        }

        const data = await response.json();
        return NextResponse.json(data);

    } catch (error) {
        console.error("Error testing LLM config:", error);
        return NextResponse.json({ success: false, message: "Internal Error" }, { status: 500 });
    }
}
