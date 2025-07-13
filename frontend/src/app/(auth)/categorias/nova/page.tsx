'use client';

import CategoryForm from '@/components/categorias/CategoryForm';
import { useRouter } from 'next/navigation';

export default function NovaCategoriaPage() {
  const router = useRouter();
  return (
    <div className="max-w-2xl mx-auto py-10">
      <h1 className="text-2xl font-bold mb-6">Nova Categoria</h1>
      <CategoryForm onSuccess={() => router.push('/categorias')} onCancel={() => router.push('/categorias')} />
    </div>
  );
} 