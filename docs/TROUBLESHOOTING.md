# 🔧 TROUBLESHOOTING - PERSONAL EXPENSE HUB

**Última atualização:** 24/06/2025  
**Versão:** 1.0.0

Este documento contém as soluções para problemas técnicos encontrados e resolvidos durante o desenvolvimento do Personal Expense Hub.

---

## 🐛 **PROBLEMAS RESOLVIDOS**

### **1. PROBLEMA: Valores Monetários Exibindo R$ 0,00**

#### **Sintomas:**
- Console: `[formatCurrency] Valor inválido recebido: 100`
- Interface mostrando R$ 0,00 em vez dos valores corretos
- Warnings repetidos no console durante renderização

#### **Causa Raiz:**
O Prisma ORM retorna campos `DECIMAL` do PostgreSQL como objetos `Decimal` em vez de números primitivos JavaScript.

#### **Solução Backend:**
```typescript
// ✅ Conversão automática em transacaoController.ts
res.json({
  data: {
    ...transacao,
    valor_total: Number(transacao.valor_total), // Decimal → Number
    valor_parcela: Number(transacao.valor_parcela),
    transacao_participantes: transacao.transacao_participantes.map((p: any) => ({
      ...p,
      valor_devido: Number(p.valor_devido),
      valor_recebido: Number(p.valor_recebido),
      valor_pago: Number(p.valor_pago)
    }))
  }
});
```

#### **Solução Frontend:**
```typescript
// ✅ formatCurrency robusta em utils.ts
export function formatCurrency(value: number | string | any): string {
  let numericValue: number;
  
  if (typeof value === 'string') {
    numericValue = parseFloat(value);
  } else if (typeof value === 'number') {
    numericValue = value;
  } else if (value && typeof value === 'object' && 'toNumber' in value) {
    numericValue = value.toNumber(); // Para objetos Decimal
  } else {
    return 'R$ 0,00'
  }
  
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(numericValue)
}
```

---

### **2. PROBLEMA: Erros TypeScript**

#### **Correções Implementadas:**

##### **Null Safety:**
```typescript
// ❌ ANTES: params.id
// ✅ DEPOIS: params?.id
const id = parseInt(params?.id as string)
```

##### **Propriedades Corretas:**
```typescript
// ❌ ANTES: tagRelacao.tags.nome
// ✅ DEPOIS: tagRelacao.tag.nome
{tagRelacao.tag.nome}
```

##### **Proteção Undefined:**
```typescript
// ❌ ANTES: formData.descricao.length
// ✅ DEPOIS: (formData.descricao || '').length
{(formData.descricao || '').length}/200 caracteres
```

---

### **3. PROBLEMA: Imports Incorretos**

#### **Solução:**
```typescript
// ❌ ANTES: AlertDialog components
import { AlertDialog, AlertDialogTitle } from '@/components/ui/dialog'

// ✅ DEPOIS: Dialog components
import { Dialog, DialogTitle } from '@/components/ui/dialog'
```

---

### **4. PROBLEMA: Cache Corrompido**

#### **Solução:**
```bash
# Limpar cache Next.js
taskkill /f /im node.exe
rmdir /s /q .next
npm cache clean --force
npm run dev
```

---

## 🎯 **RESULTADO FINAL**

- ✅ **Zero erros TypeScript**
- ✅ **Valores monetários corretos**
- ✅ **Console limpo**
- ✅ **Navegação funcional**
- ✅ **Performance otimizada**

**Sistema 100% funcional e pronto para produção!** 🚀 
