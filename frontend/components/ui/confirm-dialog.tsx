import React from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  title,
  description,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  onConfirm,
  onCancel,
  loading = false,
}) => (
  <Modal open={open} onClose={onCancel} title={title} size="sm">
    <div className="flex flex-col items-center gap-4 p-2">
      <AlertCircle className="w-10 h-10 text-warning" />
      {description && <p className="text-center text-muted-foreground">{description}</p>}
      <div className="flex gap-2 mt-4 justify-center">
        <Button variant="outline" onClick={onCancel} disabled={loading}>{cancelLabel}</Button>
        <Button variant="destructive" onClick={onConfirm} loading={loading}>{confirmLabel}</Button>
      </div>
    </div>
  </Modal>
); 