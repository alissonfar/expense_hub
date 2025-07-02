import React from "react";
import { Button } from "@/components/ui/button";
import { Dropdown } from "@/components/ui/dropdown";
import { FileText, FileSpreadsheet, Download } from "lucide-react";

interface ExportButtonProps {
  onExportPDF?: () => void;
  onExportExcel?: () => void;
  className?: string;
}

export const ExportButton: React.FC<ExportButtonProps> = ({
  onExportPDF,
  onExportExcel,
  className = "",
}) => {
  return (
    <Dropdown
      trigger={
        <Button variant="outline" className={className}>
          <Download className="w-4 h-4 mr-2" /> Exportar
        </Button>
      }
      items={[
        { id: "pdf", label: "Exportar PDF", icon: <FileText className="w-4 h-4" />, onClick: onExportPDF },
        { id: "excel", label: "Exportar Excel", icon: <FileSpreadsheet className="w-4 h-4" />, onClick: onExportExcel },
      ]}
    />
  );
}; 