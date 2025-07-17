"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { handleApiError, authApi } from "@/lib/api";

const schema = z.object({
  novaSenha: z
    .string()
    .min(8, "Senha deve ter pelo menos 8 caracteres")
    .regex(/[a-z]/, "Deve conter letra minúscula")
    .regex(/[A-Z]/, "Deve conter letra maiúscula")
    .regex(/[0-9]/, "Deve conter número")
    .regex(/[^a-zA-Z0-9]/, "Deve conter caractere especial"),
  confirmarSenha: z.string(),
}).refine((data) => data.novaSenha === data.confirmarSenha, {
  message: "As senhas não coincidem",
  path: ["confirmarSenha"],
});

type AtivarConviteFormData = z.infer<typeof schema>;

function AtivarConviteContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    setToken(searchParams.get("token"));
  }, [searchParams]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<AtivarConviteFormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: AtivarConviteFormData) => {
    if (!token) {
      toast({ title: "Token inválido", description: "O link de convite está incompleto ou expirado.", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    try {
      await authApi.activateInvite({
        token,
        novaSenha: data.novaSenha,
        confirmarSenha: data.confirmarSenha,
      });
      toast({
        title: "Conta ativada com sucesso!",
        description: "Agora você pode fazer login.",
      });
      reset();
      setTimeout(() => router.push("/login"), 1500);
    } catch (error) {
      toast({
        title: "Erro ao ativar convite",
        description: handleApiError(error),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 via-white to-blue-100">
      <div className="w-full max-w-md">
        <Card className="shadow-2xl border-0 bg-white/90 backdrop-blur-lg">
          <CardHeader className="space-y-1 text-center">
            <div className="mx-auto w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mb-4">
              <span className="text-2xl font-bold text-white">💡</span>
            </div>
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">
              Ativar Convite
            </CardTitle>
            <CardDescription className="text-gray-600">
              Defina sua senha para ativar sua conta e acessar o sistema.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="novaSenha">Nova Senha</Label>
                <Input
                  id="novaSenha"
                  type="password"
                  placeholder="Digite sua nova senha"
                  {...register("novaSenha")}
                  className={errors.novaSenha ? "border-red-500" : ""}
                />
                {errors.novaSenha && (
                  <p className="text-sm text-red-500">{errors.novaSenha.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmarSenha">Confirmar Senha</Label>
                <Input
                  id="confirmarSenha"
                  type="password"
                  placeholder="Confirme sua senha"
                  {...register("confirmarSenha")}
                  className={errors.confirmarSenha ? "border-red-500" : ""}
                />
                {errors.confirmarSenha && (
                  <p className="text-sm text-red-500">{errors.confirmarSenha.message}</p>
                )}
              </div>
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium py-2"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Ativando...
                  </div>
                ) : (
                  "Ativar Conta"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function AtivarConvitePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 via-white to-blue-100">
        <div className="w-full max-w-md">
          <Card className="shadow-2xl border-0 bg-white/90 backdrop-blur-lg">
            <CardContent className="flex items-center justify-center p-8">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-gray-600">Carregando...</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    }>
      <AtivarConviteContent />
    </Suspense>
  );
}