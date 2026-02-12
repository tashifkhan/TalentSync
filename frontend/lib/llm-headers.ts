import { prisma } from "@/lib/prisma";
import { decrypt } from "@/lib/encryption";

export async function getLlmHeaders(userId: string): Promise<Record<string, string>> {
  if (!userId) {
    return {};
  }

  try {
    const config = await prisma.llmConfig.findUnique({
      where: { userId },
    });

    if (!config) {
      return {};
    }

    const headers: Record<string, string> = {
      "X-LLM-Provider": config.provider,
      "X-LLM-Model": config.model,
    };

    if (config.encryptedKey) {
      const decryptedKey = decrypt(config.encryptedKey);
      if (decryptedKey) {
        headers["X-LLM-Key"] = decryptedKey;
      }
    }

    if (config.apiBase) {
      headers["X-LLM-Base"] = config.apiBase;
    }

    return headers;
  } catch (error) {
    console.error("Error fetching LLM headers:", error);
    return {};
  }
}
