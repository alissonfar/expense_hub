import * as React from "react";
import { cn } from "@/lib/utils";
import { Crown, Shield, UserCheck, Eye } from "lucide-react";

const roleIcons = {
  PROPRIETARIO: Crown,
  ADMINISTRADOR: Shield,
  COLABORADOR: UserCheck,
  VISUALIZADOR: Eye,
};

const statusColors = {
  online: "bg-green-400",
  offline: "bg-gray-400",
  busy: "bg-red-400",
};

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  name: string;
  src?: string;
  status?: "online" | "offline" | "busy";
  role?: "PROPRIETARIO" | "ADMINISTRADOR" | "COLABORADOR" | "VISUALIZADOR";
}

export const Avatar = React.forwardRef<HTMLDivElement, AvatarProps>(
  ({ name, src, status = "offline", role, className, ...props }, ref) => {
    const initials = name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
    const RoleIcon = role ? roleIcons[role] : null;
    return (
      <div
        ref={ref}
        className={cn(
          "relative w-14 h-14 rounded-full glass-effect border-2 border-primary/30 shadow-lg flex items-center justify-center overflow-hidden group transition-all hover:scale-105",
          className
        )}
        {...props}
      >
        {src ? (
          <img
            src={src}
            alt={name}
            className="w-full h-full object-cover rounded-full"
          />
        ) : (
          <span className="text-xl font-bold text-primary bg-primary/10 w-full h-full flex items-center justify-center">
            {initials}
          </span>
        )}
        {/* Badge de status */}
        <span className={cn(
          "absolute bottom-1 right-1 w-3 h-3 rounded-full border-2 border-white",
          statusColors[status]
        )} />
        {/* Badge de papel */}
        {RoleIcon && (
          <span className="absolute -top-1 -right-1 bg-white rounded-full p-1 shadow-md">
            <RoleIcon className="h-3 w-3 text-primary" />
          </span>
        )}
      </div>
    );
  }
);
Avatar.displayName = "Avatar"; 