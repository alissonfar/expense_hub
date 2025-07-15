"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { changePasswordSchema } from "@/lib/validations";

const perfilSchema = z.object({
  nome: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  telefone: z.string().optional(),
});

type PerfilFormData = z.infer<typeof perfilSchema>;

type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;

export default function PerfilPage() {
  const { usuario, atualizarPerfil, alterarSenha } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  const form = useForm<PerfilFormData>({
    resolver: zodResolver(perfilSchema),
    defaultValues: { nome: "", telefone: "" },
  });

  useEffect(() => {
    if (usuario) {
      form.reset({ nome: usuario.nome || "", telefone: usuario.telefone || "" });
    }
    // eslint-disable-next-line
  }, [usuario]);

  const onSubmit = async (data: PerfilFormData) => {
    setLoading(true);
    try {
      await atualizarPerfil(data);
      toast({ title: "Perfil atualizado com sucesso!" });
    } catch (error: unknown) {
      let message = "Tente novamente.";
      if (error && typeof error === 'object' && 'response' in error && error.response && typeof error.response === 'object' && 'data' in error.response && error.response.data && typeof error.response.data === 'object' && 'message' in error.response.data) {
        message = (error.response.data as { message?: string }).message || message;
      }
      toast({ title: "Erro ao atualizar perfil", description: message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  // Formulário de alteração de senha
  const passwordForm = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
  });

  const onChangePassword = async (data: ChangePasswordFormData) => {
    setLoading(true);
    try {
      await alterarSenha(data.senhaAtual, data.novaSenha);
      toast({ title: "Senha alterada com sucesso!" });
      setShowPasswordModal(false);
      passwordForm.reset();
    } catch (error: unknown) {
      let message = "Tente novamente.";
      if (error && typeof error === 'object' && 'response' in error && error.response && typeof error.response === 'object' && 'data' in error.response && error.response.data && typeof error.response.data === 'object' && 'message' in error.response.data) {
        message = (error.response.data as { message?: string }).message || message;
      }
      toast({ title: "Erro ao alterar senha", description: message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  // Corrigir data de cadastro
  const dataCadastro = usuario?.data_cadastro
    ? (() => {
        const d = new Date(usuario.data_cadastro);
        return isNaN(d.getTime()) ? "Não disponível" : d.toLocaleDateString();
      })()
    : "Não disponível";

  return (
    <div className="flex min-h-[80vh] items-center justify-center py-8 px-2">
      <Card className="w-full max-w-2xl shadow-lg">
        <CardHeader>
          <CardTitle>Meu Perfil</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome</Label>
              <Input id="nome" {...form.register("nome")}
                disabled={loading}
                placeholder="Seu nome completo" />
              {form.formState.errors.nome && (
                <p className="text-sm text-red-500">{form.formState.errors.nome.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="telefone">Telefone</Label>
              <Input id="telefone" {...form.register("telefone")}
                disabled={loading}
                placeholder="(11) 99999-9999" />
              {form.formState.errors.telefone && (
                <p className="text-sm text-red-500">{form.formState.errors.telefone.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={usuario?.email || ""} disabled readOnly />
            </div>
            <div className="space-y-2">
              <Label>Data de Cadastro</Label>
              <Input value={dataCadastro} disabled readOnly />
            </div>
            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <Button type="submit" disabled={loading || form.formState.isSubmitting} className="w-full sm:w-auto">
                {form.formState.isSubmitting ? "Salvando..." : "Salvar"}
              </Button>
              <Button type="button" variant="outline" onClick={() => setShowPasswordModal(true)} disabled={loading} className="w-full sm:w-auto">
                Alterar Senha
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
      <Dialog open={showPasswordModal} onOpenChange={setShowPasswordModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Alterar Senha</DialogTitle>
          </DialogHeader>
          <form onSubmit={passwordForm.handleSubmit(onChangePassword)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="senhaAtual">Senha Atual</Label>
              <Input id="senhaAtual" type="password" {...passwordForm.register("senhaAtual")} disabled={loading} />
              {passwordForm.formState.errors.senhaAtual && (
                <p className="text-sm text-red-500">{passwordForm.formState.errors.senhaAtual.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="novaSenha">Nova Senha</Label>
              <Input id="novaSenha" type="password" {...passwordForm.register("novaSenha")} disabled={loading} />
              {passwordForm.formState.errors.novaSenha && (
                <p className="text-sm text-red-500">{passwordForm.formState.errors.novaSenha.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmarNovaSenha">Confirmar Nova Senha</Label>
              <Input id="confirmarNovaSenha" type="password" {...passwordForm.register("confirmarNovaSenha")} disabled={loading} />
              {passwordForm.formState.errors.confirmarNovaSenha && (
                <p className="text-sm text-red-500">{passwordForm.formState.errors.confirmarNovaSenha.message}</p>
              )}
            </div>
            <Button type="submit" disabled={loading || passwordForm.formState.isSubmitting} className="w-full">
              {passwordForm.formState.isSubmitting ? "Salvando..." : "Salvar Senha"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
} 