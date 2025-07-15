"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { configuracoesApi } from "@/lib/api";

const schema = z.object({
  theme_interface: z.enum(["light", "dark", "auto"], {
    required_error: "Selecione um tema."
  })
});

type ConfiguracoesFormData = z.infer<typeof schema>;

export default function ConfiguracoesPage() {
  const { toast } = useToast();
  const form = useForm<ConfiguracoesFormData>({
    resolver: zodResolver(schema),
    defaultValues: { theme_interface: "light" }
  });

  // Carregar configurações atuais ao montar
  useEffect(() => {
    configuracoesApi.getInterface()
      .then((res) => {
        if (res?.data?.theme_interface) {
          form.reset({ theme_interface: res.data.theme_interface });
        }
      })
      .catch(() => {
        toast({ title: "Erro ao carregar configurações", variant: "destructive" });
      });
    // eslint-disable-next-line
  }, []);

  const onSubmit = async (data: ConfiguracoesFormData) => {
    try {
      await configuracoesApi.updateInterface({ theme_interface: data.theme_interface });
      toast({ title: "Configuração salva com sucesso!" });
    } catch (error) {
      toast({ title: "Erro ao salvar configuração", variant: "destructive" });
    }
  };

  return (
    <div className="max-w-xl mx-auto py-10">
      <Card>
        <CardHeader>
          <CardTitle>Configurações do Sistema</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="theme_interface">Tema da Interface</Label>
              <Select
                value={form.watch("theme_interface")}
                onValueChange={value => form.setValue("theme_interface", value as any)}
                disabled={form.formState.isSubmitting}
              >
                <SelectTrigger id="theme_interface">
                  <SelectValue placeholder="Selecione o tema" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">Claro</SelectItem>
                  <SelectItem value="dark">Escuro</SelectItem>
                  <SelectItem value="auto">Automático</SelectItem>
                </SelectContent>
              </Select>
              {form.formState.errors.theme_interface && (
                <p className="text-sm text-red-500">{form.formState.errors.theme_interface.message}</p>
              )}
            </div>

            {/* Espaço para futuras opções (idioma, moeda, notificações, etc) */}
            <div className="space-y-2 opacity-50 cursor-not-allowed">
              <Label>Idioma, Moeda, Notificações</Label>
              <p className="text-xs text-muted-foreground">Em breve você poderá personalizar mais opções aqui.</p>
            </div>

            <Button type="submit" disabled={form.formState.isSubmitting} className="w-full">
              {form.formState.isSubmitting ? "Salvando..." : "Salvar Configurações"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
} 