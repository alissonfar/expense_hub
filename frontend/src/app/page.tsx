import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export default async function Home() {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get('@PersonalExpenseHub:refreshToken')?.value;
  const hubAtual = cookieStore.get('@PersonalExpenseHub:hubAtual')?.value;
  const usuario = cookieStore.get('@PersonalExpenseHub:usuario')?.value;

  const isAuthenticated = Boolean(refreshToken && usuario);
  const hasSelectedHub = Boolean(hubAtual);

  if (isAuthenticated) {
    if (hasSelectedHub) {
      redirect('/dashboard');
    }
    redirect('/select-hub');
  }
  redirect('/login');
} 