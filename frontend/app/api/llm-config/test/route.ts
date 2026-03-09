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
        const { provider, model, apiKey, apiBase, configId } = await request.json();

        let effectiveApiKey = apiKey;

        // If no API key provided in request, try to get from stored config
        if (!effectiveApiKey || typeof effectiveApiKey !== "string" || effectiveApiKey.trim() === "") {
            const user = await prisma.user.findUnique({
                where: { email: session.user.email },
            });

            if (user) {
                // If configId is provided, use that config's key; otherwise use active config
                const config = configId
                    ? await prisma.llmConfig.findUnique({ where: { id: configId } })
                    : await prisma.llmConfig.findFirst({ where: { userId: user.id, isActive: true } });

                if (config?.encryptedKey) {
                    effectiveApiKey = decrypt(config.encryptedKey);
                }
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
                api_base: apiBase || null,
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("Backend LLM test failed:", errorText);
            return NextResponse.json(
                {
                    success: false,
                    message: `Backend connection failed: ${response.status} ${response.statusText}`,
                },
                { status: response.status }
            );
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error("Error testing LLM config:", error);
        return NextResponse.json({ success: false, message: "Internal Error" }, { status: 500 });
    }
}
