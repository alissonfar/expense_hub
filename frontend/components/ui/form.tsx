import * as React from "react";
import { cn } from "@/lib/utils";
import { AlertCircle, CheckCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export interface FormField {
  name: string;
  label: string;
  type: "text" | "email" | "password" | "number" | "select" | "textarea" | "checkbox" | "radio";
  placeholder?: string;
  required?: boolean;
  validation?: {
    pattern?: RegExp;
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number;
    custom?: (value: any) => string | null;
  };
  options?: { value: string; label: string }[];
  group?: string;
  width?: "full" | "half" | "third";
}

export interface FormProps {
  fields: FormField[];
  onSubmit: (data: Record<string, any>) => void;
  submitText?: string;
  loading?: boolean;
  layout?: "vertical" | "horizontal" | "grid";
  className?: string;
}

export const Form: React.FC<FormProps> = ({
  fields,
  onSubmit,
  submitText = "Enviar",
  loading = false,
  layout = "vertical",
  className,
}) => {
  const [formData, setFormData] = React.useState<Record<string, any>>({});
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [touched, setTouched] = React.useState<Record<string, boolean>>({});

  const validateField = (name: string, value: any): string | null => {
    const field = fields.find(f => f.name === name);
    if (!field) return null;

    // Required validation
    if (field.required && (!value || value.toString().trim() === '')) {
      return `${field.label} é obrigatório`;
    }

    if (!value) return null;

    // Pattern validation
    if (field.validation?.pattern && !field.validation.pattern.test(value)) {
      return `${field.label} não está no formato correto`;
    }

    // Length validation
    if (field.validation?.minLength && value.length < field.validation.minLength) {
      return `${field.label} deve ter pelo menos ${field.validation.minLength} caracteres`;
    }

    if (field.validation?.maxLength && value.length > field.validation.maxLength) {
      return `${field.label} deve ter no máximo ${field.validation.maxLength} caracteres`;
    }

    // Number validation
    if (field.type === "number") {
      const numValue = Number(value);
      if (field.validation?.min && numValue < field.validation.min) {
        return `${field.label} deve ser maior que ${field.validation.min}`;
      }
      if (field.validation?.max && numValue > field.validation.max) {
        return `${field.label} deve ser menor que ${field.validation.max}`;
      }
    }

    // Custom validation
    if (field.validation?.custom) {
      const customError = field.validation.custom(value);
      if (customError) return customError;
    }

    return null;
  };

  const handleChange = (name: string, value: any) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Validate on change if field has been touched
    if (touched[name]) {
      const error = validateField(name, value);
      setErrors(prev => ({ ...prev, [name]: error || '' }));
    }
  };

  const handleBlur = (name: string) => {
    setTouched(prev => ({ ...prev, [name]: true }));
    const error = validateField(name, formData[name]);
    setErrors(prev => ({ ...prev, [name]: error || '' }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Mark all fields as touched and validate
    const newTouched: Record<string, boolean> = {};
    const newErrors: Record<string, string> = {};
    
    fields.forEach(field => {
      newTouched[field.name] = true;
      const error = validateField(field.name, formData[field.name]);
      if (error) newErrors[field.name] = error;
    });
    
    setTouched(newTouched);
    setErrors(newErrors);
    
    // If no errors, submit
    if (Object.keys(newErrors).length === 0) {
      onSubmit(formData);
    }
  };

  const renderField = (field: FormField) => {
    const fieldError = errors[field.name];
    const isTouched = touched[field.name];
    const value = formData[field.name] || '';

    const baseInputProps = {
      value,
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => 
        handleChange(field.name, e.target.value),
      onBlur: () => handleBlur(field.name),
      className: cn(
        "transition-all duration-200",
        fieldError && isTouched && "border-red-500 focus:border-red-500"
      ),
    };

    switch (field.type) {
      case "textarea":
        return (
          <textarea
            {...baseInputProps}
            placeholder={field.placeholder}
            rows={4}
            className={cn(
              "w-full p-3 rounded-lg border bg-background resize-none",
              baseInputProps.className
            )}
          />
        );

      case "select":
        return (
          <select
            {...baseInputProps}
            className={cn(
              "w-full p-3 rounded-lg border bg-background",
              baseInputProps.className
            )}
          >
            <option value="">{field.placeholder || "Selecione..."}</option>
            {field.options?.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );

      case "checkbox":
        return (
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={value}
              onChange={(e) => handleChange(field.name, e.target.checked)}
              onBlur={() => handleBlur(field.name)}
              className="rounded border-gray-300"
            />
            <Label className="text-sm">{field.label}</Label>
          </div>
        );

      case "radio":
        return (
          <div className="space-y-2">
            {field.options?.map(option => (
              <div key={option.value} className="flex items-center space-x-2">
                <input
                  type="radio"
                  name={field.name}
                  value={option.value}
                  checked={value === option.value}
                  onChange={(e) => handleChange(field.name, e.target.value)}
                  onBlur={() => handleBlur(field.name)}
                  className="border-gray-300"
                />
                <Label className="text-sm">{option.label}</Label>
              </div>
            ))}
          </div>
        );

      default:
        return (
          <Input
            {...baseInputProps}
            type={field.type}
            placeholder={field.placeholder}
          />
        );
    }
  };

  const getWidthClass = (width?: string) => {
    switch (width) {
      case "half": return "w-full md:w-1/2";
      case "third": return "w-full md:w-1/3";
      default: return "w-full";
    }
  };

  const groupedFields = React.useMemo(() => {
    const groups: Record<string, FormField[]> = {};
    fields.forEach(field => {
      const group = field.group || 'default';
      if (!groups[group]) groups[group] = [];
      groups[group].push(field);
    });
    return groups;
  }, [fields]);

  return (
    <form onSubmit={handleSubmit} className={cn("space-y-6", className)}>
      {Object.entries(groupedFields).map(([groupName, groupFields]) => (
        <div key={groupName} className="space-y-4">
          {groupName !== 'default' && (
            <h3 className="text-lg font-semibold text-foreground border-b border-white/10 pb-2">
              {groupName}
            </h3>
          )}
          
          <div className={cn(
            "space-y-4",
            layout === "grid" && "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4",
            layout === "horizontal" && "space-y-4"
          )}>
            {groupFields.map(field => {
              const fieldError = errors[field.name];
              const isTouched = touched[field.name];
              const value = formData[field.name] || '';
              
              return (
                <div
                  key={field.name}
                  className={cn(
                    layout === "horizontal" ? "flex items-center space-x-4" : "space-y-2",
                    getWidthClass(field.width)
                  )}
                >
                  {field.type !== "checkbox" && field.type !== "radio" && (
                    <Label className={cn(
                      "text-sm font-medium",
                      layout === "horizontal" && "w-1/3 flex-shrink-0"
                    )}>
                      {field.label}
                      {field.required && <span className="text-red-500 ml-1">*</span>}
                    </Label>
                  )}
                  
                  <div className={cn(
                    "flex-1",
                    layout === "horizontal" && "w-2/3"
                  )}>
                    {renderField(field)}
                    
                    {fieldError && isTouched && (
                      <div className="flex items-center gap-2 mt-1 text-red-500 text-sm animate-fade-in">
                        <AlertCircle className="h-4 w-4" />
                        {fieldError}
                      </div>
                    )}
                    
                    {!fieldError && isTouched && value && (
                      <div className="flex items-center gap-2 mt-1 text-green-500 text-sm animate-fade-in">
                        <CheckCircle className="h-4 w-4" />
                        Válido
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
      
      <div className="flex justify-end pt-4 border-t border-white/10">
        <Button type="submit" disabled={loading} className="min-w-32">
          {loading ? "Enviando..." : submitText}
        </Button>
      </div>
    </form>
  );
}; 