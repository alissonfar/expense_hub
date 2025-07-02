"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { Eye, EyeOff, ArrowLeft, Loader2, UserPlus, CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/lib/stores/auth-store";
import { useToast, ToastContainer } from "@/lib/hooks/useToast";
import { usePasswordStrength } from "@/lib/hooks/usePasswordStrength";

// =============================================
// 📋 SCHEMA DE VALIDAÇÃO
// =============================================

const activateInviteSchema = z.object({
  token: z
    .string()
    .min(1, "Token é obrigatório")
    .min(10, "Token inválido"),
  senha: z
    .string()
    .min(8, "Senha deve ter pelo menos 8 caracteres")
    .max(128, "Senha deve ter no máximo 128 caracteres")
    .regex(/[a-z]/, "Senha deve conter pelo menos uma letra minúscula")
    .regex(/[A-Z]/, "Senha deve conter pelo menos uma letra maiúscula")
    .regex(/\d/, "Senha deve conter pelo menos um número")
    .regex(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/, "Senha deve conter pelo menos um caractere especial")
    .refine(password => !/\s/.test(password), "Senha não pode conter espaços"),
  confirmarSenha: z
    .string()
    .min(1, "Confirmação de senha é obrigatória"),
}).refine((data) => data.senha === data.confirmarSenha, {
  message: "Senhas não coincidem",
  path: ["confirmarSenha"],
});

type ActivateInviteForm = z.infer<typeof activateInviteSchema>;

// =============================================
// 👥 ACTIVATE INVITE PAGE COMPONENT
// =============================================

export default function ActivateInvitePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { updateStrength, strength: passwordStrength } = usePasswordStrength();
  const { register: registerUser, isLoading: authLoading } = useAuth();
  const toast = useToast();
  
  const [loadingInvite, setLoadingInvite] = useState(true);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteData, setInviteData] = useState<any>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activated, setActivated] = useState(false);

  // =============================================
  // 📝 FORM CONFIGURATION
  // =============================================

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ActivateInviteForm>({
    resolver: zodResolver(activateInviteSchema),
    defaultValues: {
      token: "",
      senha: "",
      confirmarSenha: "",
    },
  });

  const watchPassword = watch("senha");

  // =============================================
  // 🔄 LOAD INVITE DATA
  // =============================================

  useEffect(() => {
    const token = searchParams.get('token');
    if (token) {
      setValue('token', token);
      loadInviteData();
    } else {
      setInviteError("Token de convite não fornecido");
      setLoadingInvite(false);
    }
  }, [searchParams, setValue]);

  const loadInviteData = async () => {
    try {
      setLoadingInvite(true);
      
      // Simular carregamento dos dados do convite
      // TODO: Implementar integração com o backend
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Simulando dados do convite
      const mockInviteData = {
        valid: true,
        hubName: "Finanças da Família Silva",
        inviterName: "João Silva",
        inviterEmail: "joao@example.com",
        role: "COLABORADOR",
        userEmail: "maria@example.com",
        userName: "Maria Silva"
      };
      
      setInviteData(mockInviteData);
      
    } catch (error: any) {
      console.error("Erro ao carregar convite:", error);
      setInviteError("Erro ao carregar dados do convite");
    } finally {
      setLoadingInvite(false);
    }
  };

  // =============================================
  // 🔄 SUBMIT HANDLER
  // =============================================

  const onSubmit = async (_data: ActivateInviteForm) => {
    try {
      setIsLoading(true);
      
      // Tentar ativar convite
      const result = await registerUser(_data);
      
      if (result.success) {
        toast.success("Convite ativado com sucesso!", "Você será redirecionado para fazer login.");
        
        // Redirecionar para login
        setTimeout(() => {
          router.push("/auth/login");
        }, 1500);
      } else {
        throw new Error(result.error || "Erro ao ativar convite");
      }
    } catch (error: any) {
      console.error("Erro ao ativar convite:", error);
      toast.error(error?.message || "Erro inesperado ao ativar convite");
    } finally {
      setIsLoading(false);
    }
  };

  // =============================================
  // 🎨 PASSWORD STRENGTH INDICATOR
  // =============================================

  // Atualizar força da senha quando ela mudar
  React.useEffect(() => {
    updateStrength(watchPassword);
  }, [watchPassword, updateStrength]);

  // =============================================
  // 🎨 RENDER - LOADING STATE
  // =============================================

  if (loadingInvite) {
    return (
      <>
        <div className="min-h-screen flex flex-col bg-gradient-to-br from-primary/5 via-background to-accent/5">
        <div className="flex-1 flex items-center justify-center p-4">
          <Card className="glass-effect w-full max-w-md">
            <CardContent className="p-8">
              <div className="flex flex-col items-center space-y-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-muted-foreground">Carregando convite...</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      <ToastContainer toasts={toast.toasts} onRemove={toast.removeToast} />
    </>
    );
  }

  // =============================================
  // 🎨 RENDER - ERROR STATE
  // =============================================

  if (inviteError || !inviteData?.valid) {
    return (
      <>
        <div className="min-h-screen flex flex-col bg-gradient-to-br from-primary/5 via-background to-accent/5">
        <div className="absolute top-4 left-4 z-10">
          <Button variant="ghost" size="sm" className="gap-2 hover-lift" asChild>
            <Link href="/auth/login">
              <ArrowLeft className="h-4 w-4" />
              Voltar ao login
            </Link>
          </Button>
        </div>

        <div className="flex-1 flex items-center justify-center p-4">
          <div className="w-full max-w-md space-y-8">
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-100 text-red-600 shadow-lg dark:bg-red-900/30 dark:text-red-400">
                  <AlertCircle className="h-8 w-8" />
                </div>
              </div>

              <div className="space-y-2">
                <h1 className="text-2xl font-bold tracking-tight">
                  Convite inválido
                </h1>
                <p className="text-muted-foreground">
                  {inviteError || "Este convite pode ter expirado ou já foi usado"}
                </p>
              </div>
            </div>

            <Card className="glass-effect">
              <CardContent className="p-6 text-center space-y-4">
                <p className="text-sm text-muted-foreground">
                  Possíveis motivos:
                </p>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>• Convite expirado (válido por 7 dias)</p>
                  <p>• Convite já foi ativado</p>
                  <p>• Link de convite inválido</p>
                </div>

                <Button className="w-full" asChild>
                  <Link href="/auth/login">
                    Ir para login
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        <footer className="p-4 text-center">
          <p className="text-xs text-muted-foreground">
            © 2025 Personal Expense Hub. Todos os direitos reservados.
          </p>
        </footer>
      </div>
      <ToastContainer toasts={toast.toasts} onRemove={toast.removeToast} />
    </>
    );
  }

  // =============================================
  // 🎨 RENDER - SUCCESS STATE
  // =============================================

  if (activated) {
    return (
      <>
        <div className="min-h-screen flex flex-col bg-gradient-to-br from-primary/5 via-background to-accent/5">
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="w-full max-w-md space-y-8">
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-green-100 text-green-600 shadow-lg dark:bg-green-900/30 dark:text-green-400">
                  <CheckCircle className="h-8 w-8" />
                </div>
              </div>

              <div className="space-y-2">
                <h1 className="text-2xl font-bold tracking-tight">
                  Convite ativado!
                </h1>
                <p className="text-muted-foreground">
                  Você agora faz parte do hub "{inviteData.hubName}"
                </p>
              </div>
            </div>

            <Card className="glass-effect">
              <CardContent className="p-6 text-center space-y-4">
                <p className="text-sm text-muted-foreground">
                  Redirecionando para o login em alguns segundos...
                </p>

                <Button className="w-full" asChild>
                  <Link href="/auth/login">
                    Ir para login agora
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        <footer className="p-4 text-center">
          <p className="text-xs text-muted-foreground">
            © 2025 Personal Expense Hub. Todos os direitos reservados.
          </p>
        </footer>
      </div>
      <ToastContainer toasts={toast.toasts} onRemove={toast.removeToast} />
    </>
    );
  }

  // =============================================
  // 🎨 RENDER - FORM STATE
  // =============================================

  return (
    <>
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-primary/5 via-background to-accent/5">
      {/* =============================================
          🔙 BACK BUTTON
          ============================================= */}
      <div className="absolute top-4 left-4 z-10">
        <Button
          variant="ghost"
          size="sm"
          className="gap-2 hover-lift"
          asChild
        >
          <Link href="/auth/login">
            <ArrowLeft className="h-4 w-4" />
            Voltar ao login
          </Link>
        </Button>
      </div>

      {/* =============================================
          📱 MAIN CONTENT
          ============================================= */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-8">
          {/* =============================================
              🎨 HEADER SECTION
              ============================================= */}
          <div className="text-center space-y-4">
            {/* Logo */}
            <div className="flex justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-primary text-white shadow-lg hover-glow">
                <UserPlus className="h-8 w-8" />
              </div>
            </div>

            {/* Title */}
            <div className="space-y-2">
              <h1 className="text-2xl font-bold tracking-tight">
                Ativar convite
              </h1>
              <p className="text-muted-foreground">
                Você foi convidado para participar de um hub financeiro
              </p>
            </div>
          </div>

          {/* =============================================
              📋 INVITE INFO CARD
              ============================================= */}
          <Card className="glass-effect">
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="text-center">
                  <h3 className="font-semibold text-lg">
                    {inviteData.hubName}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Convite enviado por {inviteData.inviterName}
                  </p>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Email:</span>
                    <span className="font-medium">{inviteData.userEmail}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Cargo:</span>
                    <span className="font-medium">{inviteData.role}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* =============================================
              📋 ACTIVATION FORM
              ============================================= */}
          <Card className="glass-effect hover-lift">
            <CardHeader className="space-y-1">
              <CardTitle className="text-xl text-center">Definir Senha</CardTitle>
              <CardDescription className="text-center">
                Crie uma senha para acessar sua conta
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {/* Hidden Token Field */}
                <input type="hidden" {...register("token")} />

                {/* Password Field */}
                <div className="space-y-2">
                  <Label htmlFor="senha">Nova senha</Label>
                  <div className="relative">
                    <Input
                      id="senha"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      disabled={isLoading || isSubmitting}
                      className={`pr-10 ${errors.senha ? "border-destructive" : ""}`}
                      {...register("senha")}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={isLoading || isSubmitting}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                  
                  {/* Password Strength Indicator */}
                  {watchPassword && (
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                          <div 
                            className={`h-full transition-all duration-300 ${passwordStrength.color}`}
                            style={{ width: `${(passwordStrength.score / 7) * 100}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {passwordStrength.text}
                        </span>
                      </div>
                    </div>
                  )}
                  
                  {errors.senha && (
                    <p className="text-sm text-destructive">
                      {errors.senha.message}
                    </p>
                  )}
                </div>

                {/* Confirm Password Field */}
                <div className="space-y-2">
                  <Label htmlFor="confirmarSenha">Confirmar senha</Label>
                  <div className="relative">
                    <Input
                      id="confirmarSenha"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="••••••••"
                      disabled={isLoading || isSubmitting}
                      className={`pr-10 ${errors.confirmarSenha ? "border-destructive" : ""}`}
                      {...register("confirmarSenha")}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      disabled={isLoading || isSubmitting}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                  {errors.confirmarSenha && (
                    <p className="text-sm text-destructive">
                      {errors.confirmarSenha.message}
                    </p>
                  )}
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  className="w-full hover-glow"
                  disabled={isLoading || isSubmitting}
                >
                  {isLoading || isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Ativando convite...
                    </>
                  ) : (
                    "Ativar convite"
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* =============================================
              🔗 LINKS ADICIONAIS
              ============================================= */}
          <div className="text-center space-y-4">
            <p className="text-sm text-muted-foreground">
              Já tem uma conta?{" "}
              <Link
                href="/auth/login"
                className="font-medium text-primary hover:text-primary-hover underline-offset-4 hover:underline"
              >
                Fazer login
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* =============================================
          📄 FOOTER
          ============================================= */}
      <footer className="p-4 text-center">
        <p className="text-xs text-muted-foreground">
          © 2025 Personal Expense Hub. Todos os direitos reservados.
        </p>
      </footer>
    </div>
    <ToastContainer toasts={toast.toasts} onRemove={toast.removeToast} />
  </>
  );
} 