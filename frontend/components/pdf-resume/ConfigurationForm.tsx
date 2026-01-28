import { Settings } from "lucide-react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";

interface ConfigurationFormProps {
  selectedTemplate: string;
  setSelectedTemplate: (value: string) => void;
  fontSize: number;
  setFontSize: (value: number) => void;
  colorScheme: string;
  setColorScheme: (value: string) => void;
}

export default function ConfigurationForm({
  selectedTemplate,
  setSelectedTemplate,
  fontSize,
  setFontSize,
  colorScheme,
  setColorScheme,
}: ConfigurationFormProps) {
  return (
    <div className="space-y-4">
      {/* Section Header */}
      <div className="flex items-center gap-3 pb-3 border-b border-white/10">
        <div className="flex items-center justify-center w-8 h-8 bg-brand-primary/10 rounded-lg">
          <Settings className="h-4 w-4 text-brand-primary" />
        </div>
        <div>
          <h3 className="text-brand-light text-base font-semibold">
            Configuration
          </h3>
          <p className="text-brand-light/60 text-xs">
            Customize your resume appearance
          </p>
        </div>
      </div>

      {/* Grid Layout for Template and Color */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Template Selection */}
        <div>
          <Label
            htmlFor="template"
            className="text-brand-light text-sm font-medium mb-1.5 block"
          >
            Template
          </Label>
          <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
            <SelectTrigger className="bg-white/5 border-white/20 text-brand-light focus:ring-brand-primary/50 focus:border-brand-primary/50 h-10">
              <SelectValue placeholder="Select template" />
            </SelectTrigger>
            <SelectContent className="bg-brand-dark border-white/20">
              <SelectItem
                value="professional"
                className="text-brand-light focus:bg-brand-primary/20 focus:text-white"
              >
                Professional
              </SelectItem>
              <SelectItem
                value="modern"
                className="text-brand-light focus:bg-brand-primary/20 focus:text-white"
              >
                Modern
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Color Scheme */}
        <div>
          <Label
            htmlFor="colorScheme"
            className="text-brand-light text-sm font-medium mb-1.5 block"
          >
            Color Scheme
          </Label>
          <Select value={colorScheme} onValueChange={setColorScheme}>
            <SelectTrigger className="bg-white/5 border-white/20 text-brand-light focus:ring-brand-primary/50 focus:border-brand-primary/50 h-10">
              <SelectValue placeholder="Select color" />
            </SelectTrigger>
            <SelectContent className="bg-brand-dark border-white/20">
              <SelectItem
                value="default"
                className="text-brand-light focus:bg-brand-primary/20 focus:text-white"
              >
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-slate-500" />
                  <span>Gray</span>
                </div>
              </SelectItem>
              <SelectItem
                value="blue"
                className="text-brand-light focus:bg-brand-primary/20 focus:text-white"
              >
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500" />
                  <span>Blue</span>
                </div>
              </SelectItem>
              <SelectItem
                value="green"
                className="text-brand-light focus:bg-brand-primary/20 focus:text-white"
              >
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-emerald-500" />
                  <span>Green</span>
                </div>
              </SelectItem>
              <SelectItem
                value="red"
                className="text-brand-light focus:bg-brand-primary/20 focus:text-white"
              >
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <span>Red</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Font Size Slider */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <Label
            htmlFor="fontSize"
            className="text-brand-light text-sm font-medium"
          >
            Font Size
          </Label>
          <span className="text-brand-primary text-sm font-medium">{fontSize}pt</span>
        </div>
        <Slider
          value={[fontSize]}
          onValueChange={(value) => setFontSize(value[0])}
          min={8}
          max={12}
          step={1}
          className="w-full"
        />
        <div className="flex justify-between mt-1">
          <span className="text-brand-light/40 text-xs">8pt</span>
          <span className="text-brand-light/40 text-xs">12pt</span>
        </div>
      </div>
    </div>
  );
}
