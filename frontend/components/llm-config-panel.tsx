"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  CheckCircle,
  AlertCircle,
  Save,
  Key,
  Server,
  Cpu as Chip, // Alias for provider icon
  Loader2,
  Terminal,
  ChevronDown,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Provider =
  | "google"
  | "openai"
  | "anthropic"
  | "openrouter"
  | "deepseek"
  | "ollama"
  | "mistral";

interface ProviderConfig {
  id: Provider;
  name: string;
  defaultModel: string;
  defaultBase?: string;
  models: string[];
}

const PROVIDERS: ProviderConfig[] = [
  {
    id: "openai",
    name: "OpenAI",
    defaultModel: "gpt-4o",
    models: [
      "gpt-4o",
      "gpt-4o-mini",
      "gpt-4-turbo",
      "gpt-4",
      "gpt-3.5-turbo",
      "gpt-5-nano-2025-08-07",
    ],
  },
  {
    id: "anthropic",
    name: "Anthropic Claude",
    defaultModel: "claude-3-5-sonnet-latest",
    models: [
      "claude-3-5-sonnet-20240620",
      "claude-3-5-haiku-20241022",
      "claude-3-opus-20240229",
      "claude-3-sonnet-20240229",
      "claude-3-haiku-20240307",
      "claude-haiku-4-5-20251001",
      "claude-sonnet-4-20250514",
      "claude-opus-4-20250514",
    ],
  },
  {
    id: "google",
    name: "Google Gemini",
    defaultModel: "gemini-2.5-flash",
    models: [
      "gemini-2.0-flash",
      "gemini-2.5-flash-lite",
      "gemini-2.5-flash",
      "gemini-2.5-pro",
      "gemini-3-flash-preview",
      "gemini-3-pro-preview",
    ],
  },
  {
    id: "deepseek",
    name: "DeepSeek",
    defaultModel: "deepseek-chat",
    defaultBase: "https://api.deepseek.com",
    models: ["deepseek-chat", "deepseek-v3", "deepseek-v3.2"],
  },
  {
    id: "mistral",
    name: "Mistral AI",
    defaultModel: "mistral-large-latest",
    models: ["mistral-large-latest", "mistral-medium", "mistral-small"],
  },
  {
    id: "openrouter",
    name: "OpenRouter",
    defaultModel: "google/gemini-2.0-flash-001",
    defaultBase: "https://openrouter.ai/api/v1",
    models: [
      "google/gemini-2.5-flash",
      "anthropic/claude-3.5-sonnet",
      "openai/gpt-4o",
      "meta-llama/llama-3.1-70b-instruct",
      "mistralai/mistral-large",
      // OpenRouter supports thousands, so we just list a few popular ones + custom input
    ],
  },
  {
    id: "ollama",
    name: "Ollama (Local)",
    defaultModel: "llama3",
    defaultBase: "http://localhost:11434",
    models: ["llama3", "llama3.1", "mistral", "gemma2"],
  },
];

export function LlmConfigPanel() {
  const [provider, setProvider] = useState<Provider>("google");
  const [model, setModel] = useState("gemini-2.5-flash");
  const [apiKey, setApiKey] = useState("");
  const [apiBase, setApiBase] = useState("");
  const [hasStoredKey, setHasStoredKey] = useState(false);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);

  const [isCustomModel, setIsCustomModel] = useState(false);

  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Load existing config
  useEffect(() => {
    async function loadConfig() {
      try {
        const res = await fetch("/api/llm-config");
        if (res.ok) {
          const data = await res.json();
          // Check for config in the response (API returns { success: true, config: {...} })
          const config = data.config;
          if (config && config.provider) {
            setProvider(config.provider as Provider);

            const loadedModel =
              config.model ||
              PROVIDERS.find((p) => p.id === config.provider)?.defaultModel ||
              "";
            setModel(loadedModel);

            // Check if loaded model is in the predefined list for this provider
            const providerConfig = PROVIDERS.find(
              (p) => p.id === config.provider,
            );
            const isKnown = providerConfig?.models.some(
              (m) => m === loadedModel,
            );
            setIsCustomModel(!isKnown);

            setApiBase(config.apiBase || "");
            setHasStoredKey(config.hasApiKey);
            // Don't set apiKey, it's write-only
          }
        }
      } catch (err) {
        console.error("Failed to load LLM config:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadConfig();
  }, []);

  // Update defaults when provider changes
  const handleProviderChange = (newProvider: Provider) => {
    const prevProviderConfig = PROVIDERS.find((p) => p.id === provider);
    const newProviderConfig = PROVIDERS.find((p) => p.id === newProvider);

    setProvider(newProvider);
    setIsCustomModel(false);

    if (newProviderConfig) {
      // If model was default for previous provider, switch to default for new provider
      if (model === prevProviderConfig?.defaultModel) {
        setModel(newProviderConfig.defaultModel);
      } else {
        // Otherwise, reset to default model of new provider to avoid invalid cross-provider models
        setModel(newProviderConfig.defaultModel);
      }

      // Handle Base URL
      if (!apiBase || apiBase === prevProviderConfig?.defaultBase) {
        setApiBase(newProviderConfig.defaultBase || "");
      }
    }

    // Clear key input when switching providers
    setApiKey("");
    setHasStoredKey(false);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/llm-config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider,
          model,
          apiKey: apiKey || undefined,
          apiBase: apiBase || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok)
        throw new Error(data.error || "Failed to save configuration");

      setMessage({ type: "success", text: "Configuration saved successfully" });
      if (apiKey) {
        setHasStoredKey(true);
        setApiKey(""); // Clear input for security
      }
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setIsSaving(false);
    }
  };

  const handleTest = async () => {
    setIsTesting(true);
    setMessage(null);
    try {
      const res = await fetch("/api/llm-config/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider,
          model,
          apiKey: apiKey || undefined,
          apiBase: apiBase || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok)
        throw new Error(data.error || data.detail || "Connection failed");

      setMessage({
        type: "success",
        text: `Success! ${data.message || "Connection established."}`,
      });
    } catch (err: any) {
      setMessage({ type: "error", text: `Connection failed: ${err.message}` });
    } finally {
      setIsTesting(false);
    }
  };

  const currentProviderConfig = PROVIDERS.find((p) => p.id === provider);

  if (isLoading) {
    return (
      <Card className="backdrop-blur-xl bg-white/10 border-white/20 shadow-xl">
        <CardContent className="p-8 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-brand-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="backdrop-blur-xl bg-white/10 border-white/20 shadow-xl relative overflow-hidden">
      <CardHeader>
        <CardTitle className="text-brand-light flex items-center gap-2">
          <Chip className="h-5 w-5 text-brand-primary" />
          AI Model Configuration
        </CardTitle>
        <CardDescription className="text-brand-light/60">
          Configure your preferred AI provider. Keys are encrypted at rest.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Status Message */}
        <AnimatePresence>
          {message && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className={`rounded-md p-3 text-sm flex items-center gap-2 ${
                message.type === "success"
                  ? "bg-green-500/20 text-green-200 border border-green-500/30"
                  : "bg-red-500/20 text-red-200 border border-red-500/30"
              }`}
            >
              {message.type === "success" ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <AlertCircle className="h-4 w-4" />
              )}
              {message.text}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Provider Selection */}
          <div className="space-y-2">
            <Label className="text-brand-light">Provider</Label>
            <Select
              value={provider}
              onValueChange={(val) => handleProviderChange(val as Provider)}
            >
              <SelectTrigger className="bg-white/5 border-white/10 text-brand-light">
                <SelectValue placeholder="Select provider" />
              </SelectTrigger>
              <SelectContent className="bg-brand-dark border-white/10 text-brand-light">
                {PROVIDERS.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Model Selection */}
          <div className="space-y-2">
            <Label className="text-brand-light">Model Name</Label>

            {!isCustomModel ? (
              <Select
                value={model}
                onValueChange={(val) => {
                  if (val === "custom_input") {
                    setIsCustomModel(true);
                    setModel("");
                  } else {
                    setModel(val);
                  }
                }}
              >
                <SelectTrigger className="bg-white/5 border-white/10 text-brand-light">
                  <SelectValue placeholder="Select model" />
                </SelectTrigger>
                <SelectContent className="bg-brand-dark border-white/10 text-brand-light max-h-[300px]">
                  {currentProviderConfig?.models.map((m) => (
                    <SelectItem key={m} value={m}>
                      {m}
                    </SelectItem>
                  ))}
                  <SelectItem
                    value="custom_input"
                    className="text-brand-primary font-medium border-t border-white/10 mt-1"
                  >
                    Enter Custom Model ID...
                  </SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <div className="relative">
                <Input
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  placeholder={
                    currentProviderConfig?.defaultModel || "e.g. gpt-4o"
                  }
                  className="bg-white/5 border-white/10 text-brand-light placeholder:text-white/20 pr-8"
                  autoFocus
                />
                <button
                  onClick={() => {
                    setIsCustomModel(false);
                    setModel(currentProviderConfig?.defaultModel || "");
                  }}
                  className="absolute right-2 top-2.5 text-white/40 hover:text-white"
                  title="Back to list"
                >
                  <ChevronDown className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>

          {/* API Key Input */}
          <div className="space-y-2">
            <Label className="text-brand-light flex justify-between">
              <span>API Key</span>
              {hasStoredKey && (
                <span className="text-xs text-green-400 flex items-center gap-1">
                  <CheckCircle className="h-3 w-3" /> Configured
                </span>
              )}
            </Label>
            <div className="relative">
              <Input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder={
                  hasStoredKey
                    ? "•••••••••••••••• (Unchanged)"
                    : "Enter API Key"
                }
                className="bg-white/5 border-white/10 text-brand-light placeholder:text-white/20 pr-10"
              />
              <Key className="absolute right-3 top-2.5 h-4 w-4 text-white/30" />
            </div>
          </div>

          {/* Base URL Input */}
          <div className="space-y-2">
            <Label className="text-brand-light">API Base URL (Optional)</Label>
            <div className="relative">
              <Input
                value={apiBase}
                onChange={(e) => setApiBase(e.target.value)}
                placeholder={
                  currentProviderConfig?.defaultBase ||
                  "https://api.example.com/v1"
                }
                className="bg-white/5 border-white/10 text-brand-light placeholder:text-white/20 pr-10"
              />
              <Server className="absolute right-3 top-2.5 h-4 w-4 text-white/30" />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-white/10">
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="bg-brand-primary hover:bg-brand-primary/90 text-white flex-1"
          >
            {isSaving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Save Configuration
          </Button>

          <Button 
            onClick={handleTest} 
            disabled={isTesting || (!apiKey && !hasStoredKey && provider !== 'ollama')} // Allow testing Ollama without key
            variant="outline"
            className="border-white/20 text-brand-light hover:bg-white/10 flex-1"
            title={!apiKey && !hasStoredKey && provider !== 'ollama' ? "Enter API Key or Save Config first" : "Test Connection"}
          >
            {isTesting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Terminal className="mr-2 h-4 w-4" />}
            Test Connection
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
