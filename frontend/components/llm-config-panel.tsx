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
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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

function getProviderDisplayName(id: string): string {
  return PROVIDERS.find((p) => p.id === id)?.name || id;
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
    <div className="space-y-5">
      {/* Status Message */}
      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className={`rounded-lg p-3 text-sm flex items-center gap-2 ${
              message.type === "success"
                ? "bg-green-500/15 text-green-300 border border-green-500/25"
                : "bg-red-500/15 text-red-300 border border-red-500/25"
            }`}
          >
            {message.type === "success" ? (
              <CheckCircle className="h-4 w-4 flex-shrink-0" />
            ) : (
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
            )}
            {message.text}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Label */}
      <div className="space-y-2">
        <Label className="text-brand-light flex items-center gap-1.5">
          <Tag className="h-3.5 w-3.5 text-brand-primary" />
          Label
        </Label>
        <Input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder='e.g. "Fast & Cheap", "High Quality", "Local Ollama"'
          className="bg-white/5 border-white/10 text-brand-light placeholder:text-white/20"
          maxLength={50}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Provider */}
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

        {/* Model */}
        <div className="space-y-2">
          <Label className="text-brand-light">Model</Label>
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

        {/* API Key */}
        <div className="space-y-2">
          <Label className="text-brand-light flex justify-between">
            <span>API Key</span>
            {initialData?.hasApiKey && !apiKey && (
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
                initialData?.hasApiKey
                  ? "Leave blank to keep current key"
                  : "Enter API Key"
              }
              className="bg-white/5 border-white/10 text-brand-light placeholder:text-white/20 pr-10"
            />
            <Key className="absolute right-3 top-2.5 h-4 w-4 text-white/30" />
          </div>
        </div>

        {/* Base URL */}
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
      <div className="flex flex-col sm:flex-row gap-3 pt-3 border-t border-white/10">
        <Button
          onClick={() => onSave({ label, provider, model, apiKey, apiBase })}
          disabled={isSaving || !label.trim() || !model}
          className="bg-brand-primary hover:bg-brand-primary/90 text-white flex-1"
        >
          {isSaving ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          {mode === "create" ? "Create Configuration" : "Save Changes"}
        </Button>

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
          variant="outline"
          className="border-white/20 text-brand-light hover:bg-white/10 flex-1"
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
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12, transition: { duration: 0.2 } }}
      className={`group relative rounded-xl border p-4 transition-all duration-200 ${
        config.isActive
          ? "bg-brand-primary/8 border-brand-primary/40 shadow-[0_0_20px_rgba(var(--brand-primary-rgb,99,102,241),0.08)]"
          : "bg-white/[0.03] border-white/10 hover:border-white/20 hover:bg-white/[0.05]"
      }`}
    >
      {/* Active indicator line */}
      {config.isActive && (
        <div className="absolute left-0 top-3 bottom-3 w-[3px] rounded-full bg-brand-primary" />
      )}

      <div className="flex items-start justify-between gap-3">
        {/* Left: Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <h3 className="text-brand-light font-medium truncate text-[15px]">
              {config.label}
            </h3>
            {config.isActive && (
              <Badge className="bg-brand-primary/20 text-brand-primary border-brand-primary/30 text-[10px] px-1.5 py-0 uppercase tracking-wider font-semibold">
                Active
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-3 text-sm text-brand-light/50">
            <span className="flex items-center gap-1">
              <Chip className="h-3 w-3" />
              {getProviderDisplayName(config.provider)}
            </span>
            <span className="text-white/20">|</span>
            <span className="truncate font-mono text-xs">{config.model}</span>
          </div>

          <div className="flex items-center gap-3 mt-1.5 text-xs text-brand-light/30">
            {config.hasApiKey ? (
              <span className="flex items-center gap-1 text-green-400/70">
                <Key className="h-3 w-3" />
                Key set
              </span>
            ) : (
              <span className="flex items-center gap-1 text-yellow-400/60">
                <Key className="h-3 w-3" />
                No key
              </span>
            )}
            {config.apiBase && (
              <>
                <span className="text-white/15">|</span>
                <span className="flex items-center gap-1 truncate">
                  <Server className="h-3 w-3" />
                  {config.apiBase}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1 shrink-0">
          {!config.isActive && (
            <Button
              onClick={onActivate}
              disabled={isActivating}
              variant="ghost"
              size="sm"
              className="h-8 px-2.5 text-brand-light/50 hover:text-brand-primary hover:bg-brand-primary/10"
              title="Set as active"
            >
              {isActivating ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Radio className="h-3.5 w-3.5" />
              )}
            </Button>
          )}
          <Button
            onClick={onEdit}
            variant="ghost"
            size="sm"
            className="h-8 px-2.5 text-brand-light/50 hover:text-brand-light hover:bg-white/10"
            title="Edit"
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button
            onClick={onDelete}
            variant="ghost"
            size="sm"
            className="h-8 px-2.5 text-brand-light/50 hover:text-red-400 hover:bg-red-500/10"
            title="Delete"
          >
            <Trash2 className="h-3.5 w-3.5" />
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
      <Card className="backdrop-blur-xl bg-white/10 border-white/20 shadow-xl">
        <CardContent className="p-8 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-brand-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="backdrop-blur-xl bg-white/10 border-white/20 shadow-xl relative overflow-hidden">
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle className="text-brand-light flex items-center gap-2">
                <Chip className="h-5 w-5 text-brand-primary" />
                AI Model Configurations
              </CardTitle>
              <CardDescription className="text-brand-light/60 mt-1">
                Manage multiple AI provider configurations. The active config is
                used for all AI operations across the platform.
              </CardDescription>
            </div>
            <Button
              onClick={handleOpenCreate}
              size="sm"
              className="bg-brand-primary hover:bg-brand-primary/90 text-white shrink-0"
            >
              <Plus className="mr-1.5 h-4 w-4" />
              Add Config
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-3">
          {/* List-level message */}
          <AnimatePresence>
            {listMessage && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className={`rounded-lg p-3 text-sm flex items-center gap-2 ${
                  listMessage.type === "success"
                    ? "bg-green-500/15 text-green-300 border border-green-500/25"
                    : "bg-red-500/15 text-red-300 border border-red-500/25"
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
            <div className="text-center py-10">
              <Zap className="h-10 w-10 text-brand-light/20 mx-auto mb-3" />
              <p className="text-brand-light/50 text-sm mb-1">
                No configurations yet
              </p>
              <p className="text-brand-light/30 text-xs mb-4">
                Add your first AI model configuration to get started
              </p>
              <Button
                onClick={handleOpenCreate}
                variant="outline"
                size="sm"
                className="border-white/20 text-brand-light hover:bg-white/10"
              >
                <Plus className="mr-1.5 h-4 w-4" />
                Create your first config
              </Button>
            </div>
          ) : (
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
        <DialogContent className="bg-brand-dark/95 backdrop-blur-xl border-white/15 text-brand-light sm:max-w-xl">
          <DialogHeader>
            <DialogTitle className="text-brand-light flex items-center gap-2">
              {dialogMode === "create" ? (
                <>
                  <Plus className="h-5 w-5 text-brand-primary" />
                  New Configuration
                </>
              ) : (
                <>
                  <Pencil className="h-5 w-5 text-brand-primary" />
                  Edit Configuration
                </>
              )}
            </DialogTitle>
            <DialogDescription className="text-brand-light/50">
              {dialogMode === "create"
                ? "Set up a new AI provider configuration with a custom label."
                : `Editing "${editingConfig?.label}"`}
            </DialogDescription>
          </DialogHeader>

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
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <DialogContent className="bg-brand-dark/95 backdrop-blur-xl border-white/15 text-brand-light sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-brand-light flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-red-400" />
              Delete Configuration
            </DialogTitle>
            <DialogDescription className="text-brand-light/50">
              Are you sure you want to delete{" "}
              <span className="text-brand-light font-medium">
                &quot;{deleteTarget?.label}&quot;
              </span>
              ? This action cannot be undone.
              {deleteTarget?.isActive && (
                <span className="block mt-2 text-yellow-400/80">
                  This is your active configuration. The most recently updated
                  config will become active instead.
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              onClick={() => setDeleteTarget(null)}
              variant="outline"
              className="border-white/20 text-brand-light hover:bg-white/10"
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-500 hover:bg-red-600 text-white"
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
