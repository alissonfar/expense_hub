import React from "react";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tooltip } from "@/components/ui/tooltip";

export interface RolePermission {
  role: string;
  label: string;
  description: string;
  enabled: boolean;
}

interface RolePermissionsEditorProps {
  permissions: RolePermission[];
  onChange: (perms: RolePermission[]) => void;
  className?: string;
}

export const RolePermissionsEditor: React.FC<RolePermissionsEditorProps> = ({
  permissions,
  onChange,
  className = "",
}) => {
  const handleToggle = (idx: number) => {
    const updated = permissions.map((p, i) => i === idx ? { ...p, enabled: !p.enabled } : p);
    onChange(updated);
  };
  return (
    <div className={`bg-white/60 dark:bg-gray-900/60 p-6 rounded-2xl shadow-lg backdrop-blur-md border border-white/20 ${className}`}>
      <h4 className="font-bold mb-4 text-lg">Permissões do Membro</h4>
      <div className="space-y-3">
        {permissions.map((perm, idx) => (
          <div key={perm.role} className="flex items-center gap-3">
            <Badge variant="secondary">{perm.label}</Badge>
            <Tooltip content={perm.description} position="right">
              <span className="text-xs text-muted-foreground cursor-help">{perm.description}</span>
            </Tooltip>
            <Switch checked={perm.enabled} onCheckedChange={() => handleToggle(idx)} />
          </div>
        ))}
      </div>
    </div>
  );
}; 