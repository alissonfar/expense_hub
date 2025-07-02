"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { Eye, EyeOff, Building2, Loader2, User, Mail, Lock, Phone, CheckCircle } from "lucide-react";
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

const registerSchema = z.object({
  nome: z
    .string()
    .min(2, "Nome deve ter pelo menos 2 caracteres")
    .max(100, "Nome deve ter no máximo 100 caracteres")
    .regex(/^[a-zA-ZÀ-ÿ\s]+$/, "Nome deve conter apenas letras e espaços"),
  
  email: z
    .string()
    .min(1, "Email é obrigatório")
    .email("Email inválido")
    .max(255, "Email deve ter no máximo 255 caracteres")
    .transform(email => email.toLowerCase().trim()),
  
  telefone: z
    .string()
    .regex(/^\(\d{2}\)\s\d{4,5}-\d{4}$/, "Telefone deve estar no formato (XX) XXXXX-XXXX")
    .optional()
    .or(z.literal("")),
  
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
  
  nomeHub: z
    .string()
    .min(3, "O nome do Hub deve ter pelo menos 3 caracteres")
    .max(50, "O nome do Hub deve ter no máximo 50 caracteres"),
}).refine(data => data.senha === data.confirmarSenha, {
  message: "Senhas não coincidem",
  path: ["confirmarSenha"],
});

type RegisterForm = z.infer<typeof registerSchema>;

// =============================================
// 📝 REGISTER PAGE COMPONENT
// =============================================

export default function RegisterPage() {
  const router = useRouter();
  const { updateStrength, strength: passwordStrength } = usePasswordStrength();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { register: registerUser, isLoading: authLoading } = useAuth();
  const toast = useToast();

  // =============================================
  // 📝 FORM CONFIGURATION
  // =============================================

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      nome: "",
      email: "",
      telefone: "",
      senha: "",
      confirmarSenha: "",
      nomeHub: "",
    },
  });

  const watchPassword = watch("senha");

  // Atualizar força da senha quando ela mudar
  React.useEffect(() => {
    updateStrength(watchPassword);
  }, [watchPassword, updateStrength]);

  // =============================================
  // 🔄 SUBMIT HANDLER
  // =============================================

  const onSubmit = async (data: RegisterForm) => {
    try {
      setIsLoading(true);
      
      // Preparar dados para registro
      const registrationData = {
        nome: data.nome.trim(),
        email: data.email.toLowerCase().trim(),
        telefone: data.telefone?.trim() || "",
        senha: data.senha,
        nomeHub: data.nomeHub.trim(),
      };

      // Tentar registrar usuário
      const result = await registerUser(registrationData);
      
      if (result.success) {
        toast.success("Conta criada com sucesso!", "Você será redirecionado para fazer login.");
        
        // Redirecionar para login
        setTimeout(() => {
          router.push("/auth/login");
        }, 1500);
      } else {
        toast.error(result.error || "Erro ao criar conta");
      }
    } catch (error: any) {
      console.error("Erro no registro:", error);
      toast.error(error?.message || "Erro inesperado ao criar conta");
    } finally {
      setIsLoading(false);
    }
  };

  // =============================================
  // 🎨 RENDER
  // =============================================

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900">
            <Building2 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">
            Criar conta
          </CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-400">
            Crie sua conta e seu primeiro hub financeiro
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Nome Field */}
            <div className="space-y-2">
              <Label htmlFor="nome" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Nome completo
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="nome"
                  type="text"
                  placeholder="Seu nome completo"
                  className="pl-10"
                  {...register("nome")}
                  disabled={isLoading || authLoading}
                />
              </div>
              {errors.nome && (
                <p className="text-sm text-red-600 dark:text-red-400">
                  {errors.nome.message}
                </p>
              )}
            </div>

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

            {/* Telefone Field */}
            <div className="space-y-2">
              <Label htmlFor="telefone" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Telefone (opcional)
              </Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="telefone"
                  type="tel"
                  placeholder="(11) 99999-9999"
                  className="pl-10"
                  {...register("telefone")}
                  disabled={isLoading || authLoading}
                />
              </div>
              {errors.telefone && (
                <p className="text-sm text-red-600 dark:text-red-400">
                  {errors.telefone.message}
                </p>
              )}
            </div>

            {/* Nome do Hub Field */}
            <div className="space-y-2">
              <Label htmlFor="nomeHub" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Nome do seu Hub
              </Label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="nomeHub"
                  type="text"
                  placeholder="Ex: Casa, Trabalho, Viagem"
                  className="pl-10"
                  {...register("nomeHub")}
                  disabled={isLoading || authLoading}
                />
              </div>
              {errors.nomeHub && (
                <p className="text-sm text-red-600 dark:text-red-400">
                  {errors.nomeHub.message}
                </p>
              )}
            </div>

            {/* Senha Field */}
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
              
              {/* Password Strength Indicator */}
              {watchPassword && (
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-300 ${passwordStrength.color}`}
                        style={{ width: `${(passwordStrength.score / 7) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {passwordStrength.text}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Confirmar Senha Field */}
            <div className="space-y-2">
              <Label htmlFor="confirmarSenha" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Confirmar senha
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="confirmarSenha"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirme sua senha"
                  className="pl-10 pr-10"
                  {...register("confirmarSenha")}
                  disabled={isLoading || authLoading}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  disabled={isLoading || authLoading}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </Button>
              </div>
              {errors.confirmarSenha && (
                <p className="text-sm text-red-600 dark:text-red-400">
                  {errors.confirmarSenha.message}
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
                  Criando conta...
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Criar conta
                </>
              )}
            </Button>

            {/* Links */}
            <div className="text-center space-y-2">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Já tem uma conta?{" "}
                <Link
                  href="/auth/login"
                  className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 hover:underline font-medium"
                >
                  Fazer login
                </Link>
              </div>
              
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Recebeu um convite?{" "}
                <Link
                  href="/auth/activate-invite"
                  className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 hover:underline font-medium"
                >
                  Ativar convite
                </Link>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
    <ToastContainer toasts={toast.toasts} onRemove={toast.removeToast} />
  </>
  );
} 