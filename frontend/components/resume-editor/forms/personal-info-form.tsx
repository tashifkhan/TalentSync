"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  User,
  Mail,
  Phone,
  Linkedin,
  Github,
  Globe,
  BookOpen,
} from "lucide-react";
import type { ResumeData } from "@/types/resume";

interface PersonalInfoFormProps {
  data: ResumeData;
  onChange: (data: ResumeData) => void;
}

function FieldRow({
  icon: Icon,
  label,
  id,
  placeholder,
  value,
  onChange,
  type = "text",
}: {
  icon: React.ElementType;
  label: string;
  id: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label
        htmlFor={id}
        className="text-xs font-medium text-muted-foreground flex items-center gap-1.5"
      >
        <Icon className="h-3 w-3 text-brand-primary/60" />
        {label}
      </Label>
      <Input
        id={id}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-muted/30 border-border/60 focus:border-brand-primary/40 focus:ring-brand-primary/20 transition-colors"
      />
    </div>
  );
}

export function PersonalInfoForm({ data, onChange }: PersonalInfoFormProps) {
  const update = (field: keyof ResumeData, value: string) => {
    onChange({ ...data, [field]: value });
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FieldRow
          icon={User}
          label="Full Name"
          id="name"
          placeholder="John Doe"
          value={data.name ?? ""}
          onChange={(v) => update("name", v)}
        />
        <FieldRow
          icon={Mail}
          label="Email"
          id="email"
          placeholder="john@example.com"
          value={data.email ?? ""}
          onChange={(v) => update("email", v)}
          type="email"
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FieldRow
          icon={Phone}
          label="Phone"
          id="contact"
          placeholder="+1 (555) 123-4567"
          value={data.contact ?? ""}
          onChange={(v) => update("contact", v)}
        />
        <FieldRow
          icon={Linkedin}
          label="LinkedIn"
          id="linkedin"
          placeholder="linkedin.com/in/johndoe"
          value={data.linkedin ?? ""}
          onChange={(v) => update("linkedin", v)}
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FieldRow
          icon={Github}
          label="GitHub"
          id="github"
          placeholder="github.com/johndoe"
          value={data.github ?? ""}
          onChange={(v) => update("github", v)}
        />
        <FieldRow
          icon={Globe}
          label="Portfolio"
          id="portfolio"
          placeholder="johndoe.dev"
          value={data.portfolio ?? ""}
          onChange={(v) => update("portfolio", v)}
        />
      </div>
      <FieldRow
        icon={BookOpen}
        label="Blog / Website"
        id="blog"
        placeholder="blog.johndoe.dev"
        value={data.blog ?? ""}
        onChange={(v) => update("blog", v)}
      />
    </div>
  );
}
