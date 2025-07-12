import TransacaoDetalheClient from './TransacaoDetalheClient';

export default async function TransacaoDetalhePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <TransacaoDetalheClient id={id} />;
} 