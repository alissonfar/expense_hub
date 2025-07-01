"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { Building2, ArrowLeft, Loader2, Mail, CheckCircle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

// =============================================
// 📋 SCHEMA DE VALIDAÇÃO
// =============================================

const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, "Email é obrigatório")
    .email("Email inválido")
    .max(150, "Email muito longo"),
});

type ForgotPasswordForm = z.infer<typeof forgotPasswordSchema>;

// =============================================
// 🔐 FORGOT PASSWORD PAGE COMPONENT
// =============================================

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [sentEmail, setSentEmail] = useState("");

  // =============================================
  // 📝 FORM CONFIGURATION
  // =============================================

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordForm>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  // =============================================
  // 🔄 SUBMIT HANDLER
  // =============================================

  const onSubmit = async (data: ForgotPasswordForm) => {
    try {
      setIsLoading(true);
      
      // Simular chamada da API de recuperação de senha
      // TODO: Implementar integração com o backend
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Por enquanto, apenas simulamos sucesso
      setSentEmail(data.email);
      setEmailSent(true);
      
      toast.success("Email de recuperação enviado!", {
        description: "Verifique sua caixa de entrada e spam."
      });
      
    } catch (error: any) {
      console.error("Erro ao enviar email de recuperação:", error);
      toast.error(error?.message || "Erro inesperado ao enviar email");
    } finally {
      setIsLoading(false);
    }
  };

  // =============================================
  // 🔄 RESEND EMAIL HANDLER
  // =============================================

  const handleResendEmail = async () => {
    try {
      setIsLoading(true);
      
      // Simular reenvio de email
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success("Email reenviado!", {
        description: "Verifique novamente sua caixa de entrada."
      });
      
    } catch (error: any) {
      console.error("Erro ao reenviar email:", error);
      toast.error("Erro ao reenviar email");
    } finally {
      setIsLoading(false);
    }
  };

  // =============================================
  // 🎨 RENDER - SUCCESS STATE
  // =============================================

  if (emailSent) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-primary/5 via-background to-accent/5">
        {/* Back Button */}
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

        {/* Main Content */}
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="w-full max-w-md space-y-8">
            {/* Header */}
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-green-100 text-green-600 shadow-lg dark:bg-green-900/30 dark:text-green-400">
                  <CheckCircle className="h-8 w-8" />
                </div>
              </div>

              <div className="space-y-2">
                <h1 className="text-2xl font-bold tracking-tight">
                  Email enviado!
                </h1>
                <p className="text-muted-foreground">
                  Enviamos as instruções de recuperação para seu email
                </p>
              </div>
            </div>

            {/* Success Card */}
            <Card className="glass-effect hover-lift">
              <CardContent className="p-6">
                <div className="space-y-4 text-center">
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      Email enviado para:
                    </p>
                    <p className="font-medium text-foreground">
                      {sentEmail}
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p>• Verifique sua caixa de entrada</p>
                      <p>• Não esqueça de olhar a pasta de spam</p>
                      <p>• O link expira em 24 horas</p>
                    </div>

                    <Button
                      variant="outline"
                      onClick={handleResendEmail}
                      disabled={isLoading}
                      className="w-full"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Reenviando...
                        </>
                      ) : (
                        "Reenviar email"
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="text-center space-y-4">
              <Button 
                className="gap-2 hover-glow"
                asChild
              >
                <Link href="/auth/login">
                  Voltar ao login
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>

              <p className="text-sm text-muted-foreground">
                Lembrou da senha?{" "}
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

        {/* Footer */}
        <footer className="p-4 text-center">
          <p className="text-xs text-muted-foreground">
            © 2025 Personal Expense Hub. Todos os direitos reservados.
          </p>
        </footer>
      </div>
    );
  }

  // =============================================
  // 🎨 RENDER - FORM STATE
  // =============================================

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-primary/5 via-background to-accent/5">
      {/* =============================================
          🔙 BACK TO LOGIN BUTTON
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
                <Building2 className="h-8 w-8" />
              </div>
            </div>

            {/* Title */}
            <div className="space-y-2">
              <h1 className="text-2xl font-bold tracking-tight">
                Esqueceu sua senha?
              </h1>
              <p className="text-muted-foreground">
                Digite seu email para receber instruções de recuperação
              </p>
            </div>
          </div>

          {/* =============================================
              📋 FORGOT PASSWORD FORM
              ============================================= */}
          <Card className="glass-effect hover-lift">
            <CardHeader className="space-y-1">
              <CardTitle className="text-xl text-center">Recuperar Senha</CardTitle>
              <CardDescription className="text-center">
                Enviaremos um link de recuperação para seu email
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {/* Email Field */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    disabled={isLoading || isSubmitting}
                    className={errors.email ? "border-destructive" : ""}
                    {...register("email")}
                  />
                  {errors.email && (
                    <p className="text-sm text-destructive">
                      {errors.email.message}
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
                      Enviando...
                    </>
                  ) : (
                    "Enviar instruções"
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* =============================================
              🔗 LINKS ADICIONAIS
              ============================================= */}
          <div className="space-y-4 text-center">
            {/* Back to Login */}
            <p className="text-sm text-muted-foreground">
              Lembrou da senha?{" "}
              <Link
                href="/auth/login"
                className="font-medium text-primary hover:text-primary-hover underline-offset-4 hover:underline"
              >
                Fazer login
              </Link>
            </p>

            {/* Register Link */}
            <p className="text-sm text-muted-foreground">
              Não tem uma conta?{" "}
              <Link
                href="/auth/register"
                className="font-medium text-primary hover:text-primary-hover underline-offset-4 hover:underline"
              >
                Criar conta grátis
              </Link>
            </p>

            {/* Security Note */}
            <div className="pt-4 border-t border-border">
              <div className="text-xs text-muted-foreground bg-muted/50 rounded-lg p-3">
                <p className="font-medium mb-1">🔒 Segurança</p>
                <p>
                  Por motivos de segurança, se o email não estiver cadastrado, 
                  você não receberá nenhuma mensagem.
                </p>
              </div>
            </div>
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
  );
} 