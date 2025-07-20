import { EmailData } from '../types/email';
import { EmailUtils } from '../utils/emailUtils';

export class EmailTemplates {
  /**
   * Gera template HTML para convite de novo membro (versão avançada)
   */
  static generateInviteHtml(data: EmailData): string {
    const activationLink = EmailUtils.generateActivationLink(
      data.conviteToken, 
      process.env.FRONTEND_URL || 'http://localhost:3000'
    );
    
    const sanitizedNome = EmailUtils.sanitizeHtml(data.nome);
    const sanitizedHubNome = EmailUtils.sanitizeHtml(data.hubNome);
    const sanitizedConvidadorNome = EmailUtils.sanitizeHtml(data.convidadorNome);
    const expirationDate = EmailUtils.formatDate(new Date(Date.now() + 24 * 60 * 60 * 1000));

    return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Convite para o Hub ${sanitizedHubNome}</title>
    <style>
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
            line-height: 1.6; 
            color: #333; 
            max-width: 600px; 
            margin: 0 auto; 
            padding: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
        }
        .container { 
            background: white; 
            border-radius: 16px; 
            padding: 40px; 
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
            margin: 20px auto;
        }
        .header { 
            text-align: center; 
            margin-bottom: 40px; 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            border-radius: 12px;
            margin: -40px -40px 40px -40px;
        }
        .logo { 
            font-size: 48px; 
            margin-bottom: 15px; 
            display: block;
        }
        .title { 
            font-size: 28px; 
            font-weight: bold; 
            margin-bottom: 10px; 
            text-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .subtitle { 
            font-size: 18px; 
            opacity: 0.9;
        }
        .content { 
            margin-bottom: 30px; 
        }
        .greeting {
            font-size: 24px;
            color: #1e40af;
            margin-bottom: 20px;
            font-weight: 600;
        }
        .highlight { 
            background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%); 
            padding: 25px; 
            border-radius: 12px; 
            border-left: 5px solid #3b82f6; 
            margin: 25px 0; 
            box-shadow: 0 4px 6px rgba(59, 130, 246, 0.1);
        }
        .button-container {
            text-align: center;
            margin: 30px 0;
        }
        .button { 
            display: inline-block; 
            background: linear-gradient(135deg, #3b82f6, #1e40af); 
            color: white; 
            padding: 18px 36px; 
            text-decoration: none; 
            border-radius: 12px; 
            font-weight: bold; 
            font-size: 16px;
            text-align: center; 
            margin: 20px 0; 
            box-shadow: 0 8px 16px rgba(59, 130, 246, 0.3);
            transition: all 0.3s ease;
            border: none;
            cursor: pointer;
        }
        .button:hover { 
            background: linear-gradient(135deg, #2563eb, #1e3a8a); 
            transform: translateY(-2px);
            box-shadow: 0 12px 24px rgba(59, 130, 246, 0.4);
        }
        .footer { 
            text-align: center; 
            margin-top: 40px; 
            padding-top: 25px; 
            border-top: 2px solid #e5e7eb; 
            color: #6b7280; 
            font-size: 14px; 
        }
        .warning { 
            background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); 
            border: 2px solid #f59e0b; 
            color: #92400e; 
            padding: 20px; 
            border-radius: 12px; 
            margin: 25px 0; 
            font-size: 14px; 
            box-shadow: 0 4px 6px rgba(245, 158, 11, 0.1);
        }
        .info { 
            background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); 
            border: 2px solid #0ea5e9; 
            color: #0c4a6e; 
            padding: 20px; 
            border-radius: 12px; 
            margin: 25px 0; 
            font-size: 14px; 
            box-shadow: 0 4px 6px rgba(14, 165, 233, 0.1);
        }
        .link-box {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            padding: 15px;
            border-radius: 8px;
            margin: 15px 0;
            word-break: break-all;
            font-family: 'Courier New', monospace;
            font-size: 12px;
            color: #475569;
        }
        .features {
            display: flex;
            justify-content: space-around;
            margin: 30px 0;
            flex-wrap: wrap;
        }
        .feature {
            text-align: center;
            flex: 1;
            min-width: 120px;
            margin: 10px;
        }
        .feature-icon {
            font-size: 24px;
            margin-bottom: 8px;
        }
        .feature-text {
            font-size: 12px;
            color: #6b7280;
        }
        @media (max-width: 600px) {
            .container {
                margin: 10px;
                padding: 20px;
            }
            .header {
                margin: -20px -20px 30px -20px;
                padding: 20px;
            }
            .title {
                font-size: 24px;
            }
            .greeting {
                font-size: 20px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <span class="logo">💡</span>
            <div class="title">Expense Hub</div>
            <div class="subtitle">Gestão Inteligente de Despesas</div>
        </div>
        
        <div class="content">
            <div class="greeting">Olá, ${sanitizedNome}! 👋</div>
            
            <p>Você foi convidado por <strong>${sanitizedConvidadorNome}</strong> para participar do Hub <strong>"${sanitizedHubNome}"</strong> no Expense Hub.</p>
            
            <div class="highlight">
                <h3 style="margin-top: 0; color: #1e40af;">🎯 O que é o Expense Hub?</h3>
                <p style="margin-bottom: 0;">Uma plataforma completa para gerenciar despesas compartilhadas, controlar gastos e manter o controle financeiro em grupo de forma simples e eficiente.</p>
            </div>
            
            <div class="features">
                <div class="feature">
                    <div class="feature-icon">💰</div>
                    <div class="feature-text">Controle de Gastos</div>
                </div>
                <div class="feature">
                    <div class="feature-icon">📊</div>
                    <div class="feature-text">Relatórios</div>
                </div>
                <div class="feature">
                    <div class="feature-icon">👥</div>
                    <div class="feature-text">Colaboração</div>
                </div>
                <div class="feature">
                    <div class="feature-icon">🔒</div>
                    <div class="feature-text">Segurança</div>
                </div>
            </div>
            
            <p>Para ativar sua conta e começar a usar o sistema, clique no botão abaixo:</p>
            
            <div class="button-container">
                <a href="${activationLink}" class="button">
                    🚀 Ativar Minha Conta
                </a>
            </div>
            
            <div class="warning">
                <strong>⚠️ Importante:</strong> Este convite expira em <strong>${expirationDate}</strong>. 
                Após esse prazo, será necessário solicitar um novo convite.
            </div>
            
            <div class="info">
                <strong>💡 Dica:</strong> Se o botão não funcionar, copie e cole este link no seu navegador:
                <div class="link-box">${activationLink}</div>
            </div>
        </div>
        
        <div class="footer">
            <p>Este email foi enviado automaticamente pelo sistema Expense Hub.</p>
            <p>Se você não esperava este convite, pode ignorar este email com segurança.</p>
            <p>© 2025 Expense Hub. Todos os direitos reservados.</p>
        </div>
    </div>
</body>
</html>`;
  }

  /**
   * Gera template de texto plano para convite de novo membro
   */
  static generateInviteText(data: EmailData): string {
    const activationLink = EmailUtils.generateActivationLink(
      data.conviteToken, 
      process.env.FRONTEND_URL || 'http://localhost:3000'
    );
    
    const expirationDate = EmailUtils.formatDate(new Date(Date.now() + 24 * 60 * 60 * 1000));

    return `
Expense Hub - Convite para Participar do Hub

Olá, ${data.nome}!

Você foi convidado por ${data.convidadorNome} para participar do Hub "${data.hubNome}" no Expense Hub.

O que é o Expense Hub?
Uma plataforma completa para gerenciar despesas compartilhadas, controlar gastos e manter o controle financeiro em grupo.

Para ativar sua conta e começar a usar o sistema, acesse este link:

${activationLink}

IMPORTANTE: Este convite expira em ${expirationDate}. Após esse prazo, será necessário solicitar um novo convite.

Se o link não funcionar, copie e cole a URL acima no seu navegador.

Este email foi enviado automaticamente pelo sistema Expense Hub.
Se você não esperava este convite, pode ignorar este email com segurança.

© 2025 Expense Hub. Todos os direitos reservados.
`.trim();
  }

  /**
   * Gera template HTML para reenvio de convite
   */
  static generateReinviteHtml(data: EmailData): string {
    const activationLink = EmailUtils.generateActivationLink(
      data.conviteToken, 
      process.env.FRONTEND_URL || 'http://localhost:3000'
    );
    
    const sanitizedNome = EmailUtils.sanitizeHtml(data.nome);
    const sanitizedHubNome = EmailUtils.sanitizeHtml(data.hubNome);
    const sanitizedConvidadorNome = EmailUtils.sanitizeHtml(data.convidadorNome);
    const expirationDate = EmailUtils.formatDate(new Date(Date.now() + 24 * 60 * 60 * 1000));

    return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Novo Convite para o Hub ${sanitizedHubNome}</title>
    <style>
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
            line-height: 1.6; 
            color: #333; 
            max-width: 600px; 
            margin: 0 auto; 
            padding: 20px;
            background-color: #f8fafc;
        }
        .container { 
            background: white; 
            border-radius: 12px; 
            padding: 40px; 
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .header { 
            text-align: center; 
            margin-bottom: 30px; 
        }
        .logo { 
            font-size: 32px; 
            margin-bottom: 10px; 
        }
        .title { 
            color: #1e40af; 
            font-size: 24px; 
            font-weight: bold; 
            margin-bottom: 10px; 
        }
        .subtitle { 
            color: #6b7280; 
            font-size: 16px; 
        }
        .content { 
            margin-bottom: 30px; 
        }
        .highlight { 
            background: #fef3c7; 
            padding: 20px; 
            border-radius: 8px; 
            border-left: 4px solid #f59e0b; 
            margin: 20px 0; 
        }
        .button { 
            display: inline-block; 
            background: linear-gradient(135deg, #3b82f6, #1e40af); 
            color: white; 
            padding: 16px 32px; 
            text-decoration: none; 
            border-radius: 8px; 
            font-weight: bold; 
            text-align: center; 
            margin: 20px 0; 
            box-shadow: 0 4px 6px rgba(59, 130, 246, 0.3);
        }
        .button:hover { 
            background: linear-gradient(135deg, #2563eb, #1e3a8a); 
        }
        .footer { 
            text-align: center; 
            margin-top: 40px; 
            padding-top: 20px; 
            border-top: 1px solid #e5e7eb; 
            color: #6b7280; 
            font-size: 14px; 
        }
        .warning { 
            background: #fef3c7; 
            border: 1px solid #f59e0b; 
            color: #92400e; 
            padding: 15px; 
            border-radius: 8px; 
            margin: 20px 0; 
            font-size: 14px; 
        }
        .info { 
            background: #f0f9ff; 
            border: 1px solid #0ea5e9; 
            color: #0c4a6e; 
            padding: 15px; 
            border-radius: 8px; 
            margin: 20px 0; 
            font-size: 14px; 
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">💡</div>
            <div class="title">Expense Hub</div>
            <div class="subtitle">Gestão Inteligente de Despesas</div>
        </div>
        
        <div class="content">
            <h2>Olá, ${sanitizedNome}!</h2>
            
            <p>Um novo convite foi enviado por <strong>${sanitizedConvidadorNome}</strong> para o Hub <strong>"${sanitizedHubNome}"</strong>.</p>
            
            <div class="highlight">
                <p><strong>🔄 Novo Convite Gerado</strong></p>
                <p>Seu convite anterior expirou ou foi invalidado. Este é um novo convite válido por 24 horas.</p>
            </div>
            
            <p>Para ativar sua conta, clique no botão abaixo:</p>
            
            <div style="text-align: center;">
                <a href="${activationLink}" class="button">
                    🚀 Ativar Minha Conta
                </a>
            </div>
            
            <div class="warning">
                <strong>⚠️ Importante:</strong> Este convite expira em <strong>${expirationDate}</strong>. 
                Após esse prazo, será necessário solicitar um novo convite.
            </div>
            
            <div class="info">
                <strong>💡 Dica:</strong> Se o botão não funcionar, copie e cole este link no seu navegador:<br>
                <a href="${activationLink}" style="color: #0ea5e9; word-break: break-all;">${activationLink}</a>
            </div>
        </div>
        
        <div class="footer">
            <p>Este email foi enviado automaticamente pelo sistema Expense Hub.</p>
            <p>Se você não esperava este convite, pode ignorar este email com segurança.</p>
            <p>© 2025 Expense Hub. Todos os direitos reservados.</p>
        </div>
    </div>
</body>
</html>`;
  }

  /**
   * Gera template de texto plano para reenvio de convite
   */
  static generateReinviteText(data: EmailData): string {
    const activationLink = EmailUtils.generateActivationLink(
      data.conviteToken, 
      process.env.FRONTEND_URL || 'http://localhost:3000'
    );
    
    const expirationDate = EmailUtils.formatDate(new Date(Date.now() + 24 * 60 * 60 * 1000));

    return `
Expense Hub - Novo Convite para o Hub

Olá, ${data.nome}!

Um novo convite foi enviado por ${data.convidadorNome} para o Hub "${data.hubNome}".

🔄 Novo Convite Gerado
Seu convite anterior expirou ou foi invalidado. Este é um novo convite válido por 24 horas.

Para ativar sua conta, acesse este link:

${activationLink}

IMPORTANTE: Este convite expira em ${expirationDate}. Após esse prazo, será necessário solicitar um novo convite.

Se o link não funcionar, copie e cole a URL acima no seu navegador.

Este email foi enviado automaticamente pelo sistema Expense Hub.
Se você não esperava este convite, pode ignorar este email com segurança.

© 2025 Expense Hub. Todos os direitos reservados.
`.trim();
  }
} 