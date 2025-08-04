import PagamentoDetalheClient from './PagamentoDetalheClient';

export default async function PagamentoDetalhePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <PagamentoDetalheClient id={id} />;
} 