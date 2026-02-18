"use client";

import { useState, useEffect, useCallback } from "react";
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
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  CheckCircle,
  AlertCircle,
  Save,
  Key,
  Server,
  Cpu as Chip,
  Loader2,
  Terminal,
  ChevronDown,
  Plus,
  Pencil,
  Trash2,
  Zap,
  Radio,
  Tag,
  Sparkles,
  Settings2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

// --- Types ---

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
  icon?: React.ReactNode;
  color?: string;
}

interface LlmConfigItem {
  id: string;
  label: string;
  provider: string;
  model: string;
  apiBase: string | null;
  hasApiKey: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// --- Constants ---

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
    color: "bg-green-500/10 text-green-500 border-green-500/20",
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
    color: "bg-orange-500/10 text-orange-500 border-orange-500/20",
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
    color: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  },
  {
    id: "deepseek",
    name: "DeepSeek",
    defaultModel: "deepseek-chat",
    defaultBase: "https://api.deepseek.com",
    models: ["deepseek-chat", "deepseek-v3", "deepseek-v3.2"],
    color: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  },
  {
    id: "mistral",
    name: "Mistral AI",
    defaultModel: "mistral-large-latest",
    models: ["mistral-large-latest", "mistral-medium", "mistral-small"],
    color: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
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
    ],
    color: "bg-pink-500/10 text-pink-500 border-pink-500/20",
  },
  {
    id: "ollama",
    name: "Ollama (Local)",
    defaultModel: "llama3",
    defaultBase: "http://localhost:11434",
    models: ["llama3", "llama3.1", "mistral", "gemma2"],
    color: "bg-slate-500/10 text-slate-500 border-slate-500/20",
  },
];

function getProviderDisplayName(id: string): string {
  return PROVIDERS.find((p) => p.id === id)?.name || id;
}

function getProviderStyle(id: string): string {
  return (
    PROVIDERS.find((p) => p.id === id)?.color ||
    "bg-gray-500/10 text-gray-400 border-gray-500/20"
  );
}

// --- Config Editor Form (used inside dialog) ---

function ConfigEditorForm({
  mode,
  initialData,
  onSave,
  onTest,
  isSaving,
  isTesting,
  message,
}: {
  mode: "create" | "edit";
  initialData?: LlmConfigItem;
  onSave: (data: {
    label: string;
    provider: string;
    model: string;
    apiKey: string;
    apiBase: string;
  }) => void;
  onTest: (data: {
    provider: string;
    model: string;
    apiKey: string;
    apiBase: string;
    configId?: string;
  }) => void;
  isSaving: boolean;
  isTesting: boolean;
  message: { type: "success" | "error"; text: string } | null;
}) {
  const [label, setLabel] = useState(initialData?.label || "");
  const [provider, setProvider] = useState<Provider>(
    (initialData?.provider as Provider) || "google"
  );
  const [model, setModel] = useState(
    initialData?.model || "gemini-2.5-flash"
  );
  const [apiKey, setApiKey] = useState("");
  const [apiBase, setApiBase] = useState(initialData?.apiBase || "");
  const [isCustomModel, setIsCustomModel] = useState(false);

  // Check if loaded model is custom on mount
  useEffect(() => {
    if (initialData?.model) {
      const providerConfig = PROVIDERS.find(
        (p) => p.id === initialData.provider
      );
      const isKnown = providerConfig?.models.some(
        (m) => m === initialData.model
      );
      setIsCustomModel(!isKnown);
    }
  }, [initialData]);

  const handleProviderChange = (newProvider: Provider) => {
    const prevProviderConfig = PROVIDERS.find((p) => p.id === provider);
    const newProviderConfig = PROVIDERS.find((p) => p.id === newProvider);

    setProvider(newProvider);
    setIsCustomModel(false);

    if (newProviderConfig) {
      setModel(newProviderConfig.defaultModel);
      if (!apiBase || apiBase === prevProviderConfig?.defaultBase) {
        setApiBase(newProviderConfig.defaultBase || "");
      }
    }

    setApiKey("");
  };

  const currentProviderConfig = PROVIDERS.find((p) => p.id === provider);

  return (
    <div className="space-y-6">
      {/* Status Message */}
      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ opacity: 0, height: 0, y: -10 }}
            animate={{ opacity: 1, height: "auto", y: 0 }}
            exit={{ opacity: 0, height: 0, y: -10 }}
            className={`rounded-lg p-3 text-sm flex items-start gap-3 border backdrop-blur-sm shadow-sm ${
              message.type === "success"
                ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/20"
                : "bg-rose-500/10 text-rose-300 border-rose-500/20"
            }`}
          >
            {message.type === "success" ? (
              <CheckCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
            )}
            <span className="leading-relaxed">{message.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-4">
        {/* Label */}
        <div className="space-y-2">
          <Label className="text-brand-light/90 font-medium flex items-center gap-2 text-sm">
            <Tag className="h-4 w-4 text-brand-primary" />
            Configuration Label
          </Label>
          <Input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder='e.g. "Production (GPT-4)", "Testing (Ollama)"'
            className="bg-white/5 border-white/10 text-brand-light placeholder:text-white/20 focus:border-brand-primary/50 transition-all duration-300 h-11"
            maxLength={50}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Provider */}
          <div className="space-y-2">
            <Label className="text-brand-light/90 font-medium text-sm">
              Provider
            </Label>
            <Select
              value={provider}
              onValueChange={(val) => handleProviderChange(val as Provider)}
            >
              <SelectTrigger className="bg-white/5 border-white/10 text-brand-light h-11 focus:ring-brand-primary/20">
                <SelectValue placeholder="Select provider" />
              </SelectTrigger>
              <SelectContent className="bg-zinc-950 border-white/10 text-brand-light backdrop-blur-xl">
                {PROVIDERS.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Model */}
          <div className="space-y-2">
            <Label className="text-brand-light/90 font-medium text-sm">
              Model
            </Label>
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
                <SelectTrigger className="bg-white/5 border-white/10 text-brand-light h-11 focus:ring-brand-primary/20">
                  <SelectValue placeholder="Select model" />
                </SelectTrigger>
                <SelectContent className="bg-brand-dark border-white/10 text-brand-light backdrop-blur-xl max-h-[300px]">
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
              <div className="relative group">
                <Input
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  placeholder={
                    currentProviderConfig?.defaultModel || "e.g. gpt-4o"
                  }
                  className="bg-white/5 border-white/10 text-brand-light placeholder:text-white/20 pr-10 h-11 focus:border-brand-primary/50 transition-all duration-300"
                  autoFocus
                />
                <button
                  onClick={() => {
                    setIsCustomModel(false);
                    setModel(currentProviderConfig?.defaultModel || "");
                  }}
                  className="absolute right-3 top-3.5 text-white/40 hover:text-white transition-colors"
                  title="Back to list"
                >
                  <ChevronDown className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* API Key */}
        <div className="space-y-2">
          <Label className="text-brand-light/90 font-medium flex justify-between items-center text-sm">
            <span>API Key</span>
            {initialData?.hasApiKey && !apiKey && (
              <Badge
                variant="outline"
                className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-xs py-0 h-5"
              >
                <CheckCircle className="h-3 w-3 mr-1" /> Configured
              </Badge>
            )}
          </Label>
          <div className="relative group">
            <Input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={
                initialData?.hasApiKey
                  ? "Leave blank to keep current key"
                  : "Enter your API Key"
              }
              className="bg-white/5 border-white/10 text-brand-light placeholder:text-white/20 pr-10 h-11 focus:border-brand-primary/50 transition-all duration-300 font-mono text-sm"
            />
            <Key className="absolute right-3 top-3.5 h-4 w-4 text-white/30 group-hover:text-white/50 transition-colors" />
          </div>
        </div>

        {/* Base URL */}
        <div className="space-y-2">
          <Label className="text-brand-light/90 font-medium text-sm">
            API Base URL (Optional)
          </Label>
          <div className="relative group">
            <Input
              value={apiBase}
              onChange={(e) => setApiBase(e.target.value)}
              placeholder={
                currentProviderConfig?.defaultBase ||
                "https://api.example.com/v1"
              }
              className="bg-white/5 border-white/10 text-brand-light placeholder:text-white/20 pr-10 h-11 focus:border-brand-primary/50 transition-all duration-300 font-mono text-sm"
            />
            <Server className="absolute right-3 top-3.5 h-4 w-4 text-white/30 group-hover:text-white/50 transition-colors" />
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-white/10 mt-6">
        <Button
          onClick={() =>
            onTest({
              provider,
              model,
              apiKey,
              apiBase,
              configId: initialData?.id,
            })
          }
          disabled={
            isTesting ||
            (!apiKey && !initialData?.hasApiKey && provider !== "ollama")
          }
          variant="ghost"
          className="border border-white/10 text-brand-light hover:bg-white/5 hover:text-white flex-1 h-11 transition-all duration-300"
          title={
            !apiKey && !initialData?.hasApiKey && provider !== "ollama"
              ? "Enter API Key first"
              : "Test Connection"
          }
        >
          {isTesting ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Terminal className="mr-2 h-4 w-4" />
          )}
          Test Connection
        </Button>

        <Button
          onClick={() => onSave({ label, provider, model, apiKey, apiBase })}
          disabled={isSaving || !label.trim() || !model}
          className="bg-brand-primary hover:bg-brand-primary/90 text-white flex-1 h-11 shadow-[0_0_20px_rgba(var(--brand-primary-rgb),0.3)] hover:shadow-[0_0_25px_rgba(var(--brand-primary-rgb),0.5)] transition-all duration-300"
        >
          {isSaving ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          {mode === "create" ? "Create Config" : "Save Changes"}
        </Button>
      </div>
    </div>
  );
}

// --- Config Card (single config in the list) ---

function ConfigCard({
  config,
  onEdit,
  onActivate,
  onDelete,
  isActivating,
}: {
  config: LlmConfigItem;
  onEdit: () => void;
  onActivate: () => void;
  onDelete: () => void;
  isActivating: boolean;
}) {
  const providerStyle = getProviderStyle(config.provider);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
      className={cn(
        "group relative rounded-xl border p-5 transition-all duration-300 flex flex-col sm:flex-row gap-4 sm:items-center justify-between",
        config.isActive
          ? "bg-brand-primary/5 border-brand-primary/40 shadow-[0_0_30px_-5px_rgba(var(--brand-primary-rgb),0.1)]"
          : "bg-white/[0.02] border-white/5 hover:border-white/20 hover:bg-white/[0.04] hover:shadow-lg hover:shadow-black/20"
      )}
    >
      {/* Active Indicator Glow */}
      {config.isActive && (
        <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-brand-primary/10 via-transparent to-transparent opacity-20 pointer-events-none" />
      )}

      {/* Left: Info */}
      <div className="flex-1 min-w-0 relative z-10">
        <div className="flex items-center gap-3 mb-2">
          <h3
            className={cn(
              "font-semibold truncate text-lg tracking-tight",
              config.isActive ? "text-brand-light" : "text-brand-light/80"
            )}
          >
            {config.label}
          </h3>
          {config.isActive && (
            <Badge className="bg-brand-primary text-white border-none shadow-[0_0_10px_rgba(var(--brand-primary-rgb),0.4)] animate-pulse-slow">
              Active
            </Badge>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3 text-sm">
          <Badge
            variant="outline"
            className={cn("text-xs py-0.5 h-6 font-medium", providerStyle)}
          >
            {getProviderDisplayName(config.provider)}
          </Badge>

          <span className="text-brand-light/40 font-light hidden sm:inline">
            •
          </span>

          <span className="truncate font-mono text-xs text-brand-light/60 bg-white/5 px-2 py-0.5 rounded-md">
            {config.model}
          </span>
        </div>

        <div className="flex items-center gap-4 mt-3 text-xs text-brand-light/40 font-medium">
          {config.hasApiKey ? (
            <span className="flex items-center gap-1.5 text-emerald-400/80">
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_5px_rgba(52,211,153,0.5)]" />
              Key Configured
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-amber-400/70">
              <div className="h-1.5 w-1.5 rounded-full bg-amber-400" />
              Missing Key
            </span>
          )}
          {config.apiBase && (
            <>
              <span className="text-white/10">|</span>
              <span className="flex items-center gap-1.5 truncate max-w-[150px]">
                <Server className="h-3 w-3" />
                Custom Base URL
              </span>
            </>
          )}
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2 relative z-10 self-start sm:self-auto">
        {!config.isActive && (
          <Button
            onClick={onActivate}
            disabled={isActivating}
            variant="ghost"
            size="sm"
            className="h-9 px-3 text-brand-light/60 hover:text-brand-primary hover:bg-brand-primary/10 transition-colors border border-transparent hover:border-brand-primary/20"
            title="Set as active"
          >
            {isActivating ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Zap className="h-4 w-4 mr-2" />
            )}
            Activate
          </Button>
        )}
        
        <div className="flex items-center gap-1 border-l border-white/10 pl-2 ml-1">
          <Button
            onClick={onEdit}
            variant="ghost"
            size="icon"
            className="h-9 w-9 text-brand-light/40 hover:text-brand-light hover:bg-white/10 transition-colors rounded-lg"
            title="Edit"
          >
            <Settings2 className="h-4 w-4" />
          </Button>
          <Button
            onClick={onDelete}
            variant="ghost"
            size="icon"
            className="h-9 w-9 text-brand-light/40 hover:text-rose-400 hover:bg-rose-500/10 transition-colors rounded-lg"
            title="Delete"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

// --- Main Panel ---

export function LlmConfigPanel() {
  const [configs, setConfigs] = useState<LlmConfigItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"create" | "edit">("create");
  const [editingConfig, setEditingConfig] = useState<LlmConfigItem | undefined>(
    undefined
  );

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState<LlmConfigItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Form state
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isActivating, setIsActivating] = useState<string | null>(null);
  const [formMessage, setFormMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Toast-like message for the list view
  const [listMessage, setListMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Load configs
  const loadConfigs = useCallback(async () => {
    try {
      const res = await fetch("/api/llm-config");
      if (res.ok) {
        const data = await res.json();
        setConfigs(data.configs || []);
      }
    } catch (err) {
      console.error("Failed to load LLM configs:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadConfigs();
  }, [loadConfigs]);

  // Clear list message after timeout
  useEffect(() => {
    if (listMessage) {
      const timer = setTimeout(() => setListMessage(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [listMessage]);

  // Open create dialog
  const handleOpenCreate = () => {
    setDialogMode("create");
    setEditingConfig(undefined);
    setFormMessage(null);
    setDialogOpen(true);
  };

  // Open edit dialog
  const handleOpenEdit = (config: LlmConfigItem) => {
    setDialogMode("edit");
    setEditingConfig(config);
    setFormMessage(null);
    setDialogOpen(true);
  };

  // Save (create or update)
  const handleSave = async (data: {
    label: string;
    provider: string;
    model: string;
    apiKey: string;
    apiBase: string;
  }) => {
    setIsSaving(true);
    setFormMessage(null);

    try {
      const body: any = {
        label: data.label,
        provider: data.provider,
        model: data.model,
        apiBase: data.apiBase || undefined,
      };
      if (data.apiKey) body.apiKey = data.apiKey;

      let res: Response;

      if (dialogMode === "create") {
        res = await fetch("/api/llm-config", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
      } else {
        res = await fetch(`/api/llm-config/${editingConfig!.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
      }

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.message || "Failed to save configuration");
      }

      setFormMessage({
        type: "success",
        text:
          dialogMode === "create"
            ? "Configuration created successfully"
            : "Configuration updated successfully",
      });

      // Reload configs and close dialog after brief delay
      await loadConfigs();
      setTimeout(() => {
        setDialogOpen(false);
        setFormMessage(null);
      }, 800);
    } catch (err: any) {
      setFormMessage({ type: "error", text: err.message });
    } finally {
      setIsSaving(false);
    }
  };

  // Test connection
  const handleTest = async (data: {
    provider: string;
    model: string;
    apiKey: string;
    apiBase: string;
    configId?: string;
  }) => {
    setIsTesting(true);
    setFormMessage(null);

    try {
      const res = await fetch("/api/llm-config/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: data.provider,
          model: data.model,
          apiKey: data.apiKey || undefined,
          apiBase: data.apiBase || undefined,
          configId: data.configId,
        }),
      });

      const result = await res.json();
      if (!res.ok) {
        throw new Error(
          result.message || result.detail || "Connection failed"
        );
      }

      setFormMessage({
        type: "success",
        text: `Connection successful! ${result.message || ""}`,
      });
    } catch (err: any) {
      setFormMessage({
        type: "error",
        text: `Connection failed: ${err.message}`,
      });
    } finally {
      setIsTesting(false);
    }
  };

  // Activate
  const handleActivate = async (config: LlmConfigItem) => {
    setIsActivating(config.id);
    try {
      const res = await fetch(`/api/llm-config/${config.id}/activate`, {
        method: "PATCH",
      });
      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.message || "Failed to activate");
      }

      setListMessage({
        type: "success",
        text: `"${config.label}" is now your active configuration`,
      });
      await loadConfigs();
    } catch (err: any) {
      setListMessage({ type: "error", text: err.message });
    } finally {
      setIsActivating(null);
    }
  };

  // Delete
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);

    try {
      const res = await fetch(`/api/llm-config/${deleteTarget.id}`, {
        method: "DELETE",
      });
      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.message || "Failed to delete");
      }

      setListMessage({
        type: "success",
        text: `"${deleteTarget.label}" has been deleted`,
      });
      setDeleteTarget(null);
      await loadConfigs();
    } catch (err: any) {
      setListMessage({ type: "error", text: err.message });
    } finally {
      setIsDeleting(false);
    }
  };

  // --- Render ---

  if (isLoading) {
    return (
      <Card className="backdrop-blur-xl bg-white/[0.02] border-white/10 shadow-2xl animate-pulse">
        <CardContent className="p-12 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-brand-primary/50" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="backdrop-blur-3xl bg-white/[0.04] border-white/10 shadow-2xl relative overflow-hidden group/card">
        {/* Subtle background gradient mesh */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-brand-primary/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3 pointer-events-none" />
        
        <CardHeader className="relative z-10 pb-2">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="space-y-1">
              <CardTitle className="text-2xl font-bold text-white flex items-center gap-3">
                <div className="p-2 rounded-lg bg-brand-primary/10 border border-brand-primary/20">
                  <Chip className="h-6 w-6 text-brand-primary" />
                </div>
                AI Model Configurations
              </CardTitle>
              <CardDescription className="text-brand-light/60 max-w-lg leading-relaxed text-sm">
                Manage multiple AI provider configurations. The active config is
                used for all AI operations across the platform.
              </CardDescription>
            </div>
            <Button
              onClick={handleOpenCreate}
              size="default"
              className="bg-brand-primary hover:bg-brand-primary/90 text-white shadow-[0_0_20px_rgba(var(--brand-primary-rgb),0.2)] hover:shadow-[0_0_30px_rgba(var(--brand-primary-rgb),0.4)] transition-all duration-300 font-medium"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Config
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4 pt-6 relative z-10">
          {/* List-level message */}
          <AnimatePresence>
            {listMessage && (
              <motion.div
                initial={{ opacity: 0, height: 0, scale: 0.95 }}
                animate={{ opacity: 1, height: "auto", scale: 1 }}
                exit={{ opacity: 0, height: 0, scale: 0.95 }}
                className={`rounded-lg p-3 text-sm flex items-center gap-2 border backdrop-blur-md ${
                  listMessage.type === "success"
                    ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/20"
                    : "bg-rose-500/10 text-rose-300 border-rose-500/20"
                }`}
              >
                {listMessage.type === "success" ? (
                  <CheckCircle className="h-4 w-4 flex-shrink-0" />
                ) : (
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                )}
                {listMessage.text}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Config List */}
          {configs.length === 0 ? (
            <div className="text-center py-16 px-4 rounded-xl border border-dashed border-white/10 bg-white/[0.01]">
              <div className="mx-auto w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                <Sparkles className="h-8 w-8 text-brand-light/20" />
              </div>
              <p className="text-brand-light font-medium mb-1 text-lg">
                No configurations yet
              </p>
              <p className="text-brand-light/40 text-sm mb-6 max-w-sm mx-auto">
                Add your first AI model configuration to unlock the full power of the platform.
              </p>
              <Button
                onClick={handleOpenCreate}
                variant="outline"
                className="border-white/10 text-brand-light hover:bg-white/5 hover:text-white"
              >
                <Plus className="mr-2 h-4 w-4" />
                Create your first config
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              <AnimatePresence mode="popLayout">
                {configs.map((config) => (
                  <ConfigCard
                    key={config.id}
                    config={config}
                    onEdit={() => handleOpenEdit(config)}
                    onActivate={() => handleActivate(config)}
                    onDelete={() => setDeleteTarget(config)}
                    isActivating={isActivating === config.id}
                  />
                ))}
              </AnimatePresence>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setFormMessage(null);
        }}
      >
        <DialogContent className="bg-zinc-950 backdrop-blur-2xl border-white/10 text-brand-light sm:max-w-xl shadow-2xl p-0 overflow-hidden gap-0">
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-brand-primary to-transparent opacity-50" />
          
          <DialogHeader className="p-6 pb-2 space-y-1">
            <DialogTitle className="text-2xl font-bold text-white flex items-center gap-3">
              {dialogMode === "create" ? (
                <>
                  <div className="p-2 rounded-lg bg-brand-primary/10 border border-brand-primary/20">
                    <Plus className="h-5 w-5 text-brand-primary" />
                  </div>
                  New Configuration
                </>
              ) : (
                <>
                  <div className="p-2 rounded-lg bg-brand-primary/10 border border-brand-primary/20">
                    <Pencil className="h-5 w-5 text-brand-primary" />
                  </div>
                  Edit Configuration
                </>
              )}
            </DialogTitle>
            <DialogDescription className="text-brand-light/50 text-base ml-14">
              {dialogMode === "create"
                ? "Connect a new AI provider to your account."
                : `Update settings for "${editingConfig?.label}"`}
            </DialogDescription>
          </DialogHeader>

          <div className="p-6 pt-4">
            <ConfigEditorForm
              key={editingConfig?.id || "create"}
              mode={dialogMode}
              initialData={editingConfig}
              onSave={handleSave}
              onTest={handleTest}
              isSaving={isSaving}
              isTesting={isTesting}
              message={formMessage}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <DialogContent className="bg-zinc-950 backdrop-blur-xl border-white/10 text-brand-light sm:max-w-md p-6 shadow-2xl">
          <DialogHeader className="space-y-3">
            <div className="mx-auto w-12 h-12 rounded-full bg-rose-500/10 flex items-center justify-center border border-rose-500/20 mb-2">
              <Trash2 className="h-6 w-6 text-rose-500" />
            </div>
            <DialogTitle className="text-xl font-bold text-white text-center">
              Delete Configuration?
            </DialogTitle>
            <DialogDescription className="text-brand-light/60 text-center leading-relaxed">
              Are you sure you want to delete{" "}
              <span className="text-white font-semibold">
                &quot;{deleteTarget?.label}&quot;
              </span>
              ? This action cannot be undone.
              {deleteTarget?.isActive && (
                <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg text-amber-200 text-xs text-left flex gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>
                    Warning: This is your currently active configuration. Deleting it will automatically switch to your most recently updated config.
                  </span>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="grid grid-cols-2 gap-3 sm:space-x-0 mt-6">
            <Button
              onClick={() => setDeleteTarget(null)}
              variant="outline"
              className="border-white/10 text-brand-light hover:bg-white/5 h-11"
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-rose-500 hover:bg-rose-600 text-white h-11 shadow-lg shadow-rose-500/20"
            >
              {isDeleting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="mr-2 h-4 w-4" />
              )}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
