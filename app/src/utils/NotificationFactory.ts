import type { AppNotification } from '../store/useAppStore';

export class NotificationFactory {
  // Método fábrica estático
  public static createNotification(
    tipo: 'aviso' | 'critico' | 'recomendacao',
    id: string,
    titulo: string,
    mensagem: string,
    lida: boolean = false,
    acao?: { tipo: 'servicos_hoje' | 'arvores_risco' | 'servicos_atrasados', id?: string }
  ): AppNotification {
    return {
      id,
      titulo,
      mensagem,
      tipo,
      lida,
      data_criacao: new Date().toISOString(),
      acao
    };
  }
}
