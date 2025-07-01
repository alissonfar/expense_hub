"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { Eye, EyeOff, ArrowLeft, Loader2, User, Mail, Lock, Building2, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/lib/stores/auth-store";
import { toast } from "sonner";

// =============================================
// 📋 SCHEMA DE VALIDAÇÃO
// =============================================

const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Email é obrigatório")
    .email("Email inválido")
    .transform(email => email.toLowerCase().trim()),
  senha: z.string().min(1, "Senha é obrigatória"),
});

type LoginForm = z.infer<typeof loginSchema>;

// =============================================
// 📝 LOGIN PAGE COMPONENT
// =============================================

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showHubSelection, setShowHubSelection] = useState(false);
  const { login, selectHub, user, availableHubs, isLoading: authLoading } = useAuth();

  // =============================================
  // 📝 FORM CONFIGURATION
  // =============================================

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      senha: "",
    },
  });

  // =============================================
  // 🔄 SUBMIT HANDLER
  // =============================================

  const onSubmit = async (data: LoginForm) => {
    console.log('[Login] Submissão do formulário:', data);
    try {
      setIsLoading(true);
      
      const result = await login(data);
      console.log('[Login] Resultado do login:', result);
      
      if (result.success) {
        toast.success("Login realizado com sucesso!", {
          description: "Selecione um hub para continuar."
        });
        // Sempre mostrar seleção manual de hub, mesmo que só exista um
        setShowHubSelection(true);
      } else {
        toast.error(result.error || "Erro no login");
        console.error('[Login] Erro no login:', result.error);
      }
    } catch (error: any) {
      console.error('[Login] Erro inesperado no login:', error);
      toast.error(error?.message || "Erro inesperado no login");
    } finally {
      setIsLoading(false);
      console.log('[Login] Finalizou submissão do formulário. isLoading:', false);
    }
  };

  // =============================================
  // 🏢 HUB SELECTION HANDLER
  // =============================================

  const handleHubSelection = async (hubId: number) => {
    console.log('[Login] Seleção de hub iniciada. hubId:', hubId);
    try {
      setIsLoading(true);
      const result = await selectHub(hubId);
      console.log('[Login] Resultado do selectHub:', result);
      if (result.success) {
        toast.success("Hub selecionado com sucesso!", {
          description: "Redirecionando para o dashboard..."
        });
        // Pequeno delay para garantir exibição dos logs antes do redirecionamento
        await new Promise(r => setTimeout(r, 100));
        router.push(`/${hubId}/dashboard`);
      } else {
        toast.error(result.error || "Erro ao selecionar hub");
        console.error('[Login] Falha ao selecionar hub:', result.error);
      }
    } catch (error: any) {
      console.error('[Login] Erro inesperado ao selecionar hub:', error);
      toast.error(error?.message || "Erro inesperado ao selecionar hub");
    } finally {
      setIsLoading(false);
      console.log('[Login] Finalizou seleção de hub. isLoading:', false);
    }
  };

  // =============================================
  // 🔙 VOLTAR AO LOGIN
  // =============================================

  const handleBackToLogin = () => {
    setShowHubSelection(false);
  };

  // =============================================
  // 🎨 RENDER HUB SELECTION
  // =============================================

  if (showHubSelection && user && availableHubs.length > 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900">
              <Building2 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">
              Selecione um Hub
            </CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-400">
              Olá, {user.nome}! Escolha o hub que deseja acessar.
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <div className="space-y-3">
              {availableHubs.map((hub) => (
                <Button
                  key={hub.id}
                  variant="outline"
                  className="w-full justify-start h-auto p-4 border-2 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                  onClick={() => handleHubSelection(hub.id)}
                  disabled={isLoading}
                >
                  <div className="flex items-center space-x-3">
                    <Building2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    <div className="text-left">
                      <div className="font-medium text-gray-900 dark:text-white">
                        {hub.nome}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400 capitalize">
                        {hub.role.toLowerCase()}
                      </div>
                    </div>
                  </div>
                </Button>
              ))}
            </div>
            
            <Button
              variant="ghost"
              className="w-full"
              onClick={handleBackToLogin}
              disabled={isLoading}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar ao login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // =============================================
  // 🎨 RENDER LOGIN FORM
  // =============================================

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900">
            <User className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">
            Bem-vindo de volta
          </CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-400">
            Entre com suas credenciais para acessar sua conta
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Email Field */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Email
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  className="pl-10"
                  {...register("email")}
                  disabled={isLoading || authLoading}
                />
              </div>
              {errors.email && (
                <p className="text-sm text-red-600 dark:text-red-400">
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <Label htmlFor="senha" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Senha
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="senha"
                  type={showPassword ? "text" : "password"}
                  placeholder="Sua senha"
                  className="pl-10 pr-10"
                  {...register("senha")}
                  disabled={isLoading || authLoading}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading || authLoading}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </Button>
              </div>
              {errors.senha && (
                <p className="text-sm text-red-600 dark:text-red-400">
                  {errors.senha.message}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              disabled={isLoading || authLoading}
            >
              {isLoading || authLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Entrando...
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Entrar
                </>
              )}
            </Button>

            {/* Links */}
            <div className="text-center space-y-2">
              <Link
                href="/auth/forgot-password"
                className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 hover:underline"
              >
                Esqueceu sua senha?
              </Link>
              
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Não tem uma conta?{" "}
                <Link
                  href="/auth/register"
                  className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 hover:underline font-medium"
                >
                  Criar conta
                </Link>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
} 