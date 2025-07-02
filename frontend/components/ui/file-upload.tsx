import React, { useRef } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Upload, X } from "lucide-react";

interface FileUploadProps {
  label?: string;
  accept?: string;
  multiple?: boolean;
  onChange?: (files: File[]) => void;
  className?: string;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  label = "Enviar arquivo",
  accept = "*",
  multiple = false,
  onChange,
  className = "",
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = React.useState<File[]>([]);
  const [dragActive, setDragActive] = React.useState(false);

  const handleFiles = (fileList: FileList | null) => {
    if (!fileList) return;
    const arr = Array.from(fileList);
    setFiles(arr);
    onChange?.(arr);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleRemove = (idx: number) => {
    const newFiles = files.filter((_, i) => i !== idx);
    setFiles(newFiles);
    onChange?.(newFiles);
  };

  return (
    <div className={cn(
      "flex flex-col items-center justify-center p-6 rounded-2xl bg-white/60 dark:bg-gray-900/60 shadow-lg backdrop-blur-md border border-dashed border-primary/40 gap-3 w-full max-w-md",
      dragActive && "border-2 border-primary bg-primary/10",
      className
    )}
      onDragOver={e => { e.preventDefault(); setDragActive(true); }}
      onDragLeave={e => { e.preventDefault(); setDragActive(false); }}
      onDrop={handleDrop}
    >
      <Upload className="w-8 h-8 text-primary mb-2" />
      <p className="font-semibold text-gray-900 dark:text-white text-center">{label}</p>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        className="hidden"
        onChange={e => handleFiles(e.target.files)}
      />
      <Button variant="outline" onClick={() => inputRef.current?.click()}>
        Selecionar arquivo
      </Button>
      {files.length > 0 && (
        <div className="w-full mt-4 space-y-2">
          {files.map((file, idx) => (
            <div key={idx} className="flex items-center justify-between bg-white/80 dark:bg-gray-800/80 rounded-lg px-3 py-2 shadow">
              <span className="truncate text-sm font-medium">{file.name}</span>
              <Button variant="ghost" size="icon" onClick={() => handleRemove(idx)}>
                <X className="w-4 h-4 text-red-500" />
              </Button>
            </div>
          ))}
        </div>
      )}
      <p className="text-xs text-muted-foreground text-center mt-2">Arraste e solte arquivos aqui ou clique para selecionar.</p>
    </div>
  );
}; 