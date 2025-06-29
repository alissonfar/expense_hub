'use client'

import React from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

interface ConfirmationDialogProps {
  /** O elemento que aciona a abertura do diálogo (geralmente um botão). Omitir se o diálogo for controlado externamente. */
  trigger?: React.ReactNode
  /** Estado de abertura do diálogo, para controle externo. */
  open?: boolean
  /** Função para alterar o estado de abertura, para controle externo. */
  onOpenChange?: (isOpen: boolean) => void
  /** O título exibido no cabeçalho do diálogo. */
  title: string
  /** A descrição ou corpo do diálogo. Pode ser uma string ou um nó React para maior flexibilidade. */
  description: React.ReactNode
  /** A função a ser executada quando o botão de confirmação for clicado. */
  onConfirm: () => void
  /** O texto do botão de confirmação. */
  confirmText?: string
  /** O variant do botão de confirmação (cor). Padrão é 'destructive'. */
  confirmVariant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
  /** O texto do botão de cancelamento. */
  cancelText?: string
  /** Se true, desabilita o botão de confirmação e exibe um estado de carregamento. */
  isConfirming?: boolean
  /** Texto a ser exibido no botão de confirmação durante o carregamento. */
  confirmingText?: string
}

/**
 * Um componente de diálogo reutilizável para solicitar confirmação do usuário antes de executar uma ação.
 * Pode ser usado de forma controlada (com props `open` e `onOpenChange`) ou não controlada (com a prop `trigger`).
 */
export function ConfirmationDialog({
  trigger,
  open,
  onOpenChange,
  title,
  description,
  onConfirm,
  confirmText = 'Confirmar',
  confirmVariant = 'destructive',
  cancelText = 'Cancelar',
  isConfirming = false,
  confirmingText = 'Confirmando...',
}: ConfirmationDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription asChild>
            {/* Usar um div wrapper garante que o React trate a descrição corretamente, seja string ou nó. */}
            <div>{description}</div>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">{cancelText}</Button>
          </DialogClose>
          <Button
            onClick={onConfirm}
            variant={confirmVariant}
            disabled={isConfirming}
          >
            {isConfirming ? confirmingText : confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 