import { useMemo, useState, useRef, useCallback } from 'react';
import {
  Bell, Calendar as CalendarIcon, CheckCircle2, ChevronLeft, ChevronRight,
  Wrench, TrendingUp, Send, ChevronDown, Clock
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { ReminderModal } from '../components/alerts/ReminderModal';

// ─── Tipos ────────────────────────────────────────────────────────────────────

type AlertCategory = 'operacional' | 'comercial';
type AlertGroup = 'semana' | 'mes' | 'breve';

interface UnifiedAlert {
  id: string;
  serviceId: string;
  category: AlertCategory;
  tipo: string;
  data: string;
  horario?: string;
  responsavel: string;
  treeIds: string[];
  alertStatus: 'atrasado' | 'semana' | 'mes';
  group: AlertGroup;
  // Comercial específico
  data_validade?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getAlertStatus(dateStr: string): 'atrasado' | 'semana' | 'mes' {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(dateStr + 'T00:00:00');
  d.setHours(0, 0, 0, 0);
  const diff = Math.ceil((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (diff < 0) return 'atrasado';
  if (diff <= 7) return 'semana';
  return 'mes';
}

function getAlertGroup(dateStr: string): AlertGroup {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(dateStr + 'T00:00:00');
  d.setHours(0, 0, 0, 0);
  const diff = Math.ceil((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (diff <= 7) return 'semana';   // inclui atrasados e esta semana
  if (diff <= 30) return 'mes';
  return 'breve';
}

// ─── Sub-componentes ──────────────────────────────────────────────────────────

function CategoryBadge({ category }: { category: AlertCategory }) {
  if (category === 'operacional') {
    return (
      <span className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-full">
        <Wrench size={9} /> Técnico
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-amber-600 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-full">
      <TrendingUp size={9} /> Manutenção
    </span>
  );
}

interface AlertCardProps {
  alert: UnifiedAlert;
  focused: boolean;
  expanded: boolean;
  onToggle: () => void;
  cardRef: (el: HTMLDivElement | null) => void;
}

function AlertCard({ alert, focused, expanded, onToggle, cardRef }: AlertCardProps) {
  const { openReminderModal, openPostServiceModal } = useAppStore();
  const { trees, clients } = useAppStore();

  const isOp = alert.category === 'operacional';

  // Cores por GRUPO de tempo (diferencia visualmente as 3 seções)
  // Atrasados sempre vermelho, independente do grupo
  const isLate = alert.alertStatus === 'atrasado';

  const groupColors = {
    semana: { bg: 'bg-orange-50',  border: 'border-orange-200', dot: 'bg-orange-500', label: 'Esta semana',      text: 'text-orange-700' },
    mes:    { bg: 'bg-sky-50',     border: 'border-sky-200',    dot: 'bg-sky-500',    label: 'Próximos 30 dias', text: 'text-sky-700'    },
    breve:  { bg: 'bg-slate-50',   border: 'border-slate-200',  dot: 'bg-slate-400',  label: 'Em breve',         text: 'text-slate-500'  },
  };
  const lateColors = { bg: 'bg-red-50', border: 'border-red-200', dot: 'bg-red-500', label: 'Atrasado', text: 'text-red-700' };

  const colors = isLate ? lateColors : groupColors[alert.group];

  const relatedTrees = trees.filter(t => alert.treeIds.includes(t.id));
  const relatedClients = [...new Set(
    relatedTrees.map(t => clients.find(c => c.id === t.cliente_id)).filter(Boolean)
  )] as typeof clients;

  const isToday = new Date(alert.data + 'T00:00:00').setHours(0,0,0,0) <= new Date().setHours(0,0,0,0);

  return (
    <div
      ref={cardRef}
      className={`rounded-2xl border transition-all duration-300 shadow-sm
        ${focused ? 'ring-2 ring-primary ring-offset-2 shadow-md scale-[1.01]' : 'hover:shadow-md'}
        ${colors.bg} ${colors.border}
      `}
    >
      {/* Header do card (sempre visível) */}
      <div
        className="p-4 cursor-pointer select-none"
        onClick={onToggle}
      >
        <div className="flex justify-between items-start mb-2">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${colors.dot} ${alert.alertStatus !== 'mes' ? 'animate-pulse' : ''}`} />
            <span className={`text-[11px] font-bold uppercase tracking-wide ${colors.text}`}>
              {colors.label}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <CategoryBadge category={alert.category} />
            <ChevronDown
              size={15}
              className={`text-slate-400 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
            />
          </div>
        </div>

        <h3 className="font-bold text-slate-800 text-sm mb-1">{alert.tipo}</h3>
        <div className="flex items-center gap-3 text-[11px] text-slate-500">
          <span className="flex items-center gap-1">
            <Clock size={10} />
            {new Date(alert.data + 'T00:00:00').toLocaleDateString('pt-BR')}
            {alert.horario && ` às ${alert.horario}`}
          </span>
          <span>{alert.responsavel}</span>
        </div>
      </div>

      {/* Painel expandido */}
      {expanded && (
        <div className="border-t border-slate-200/80 bg-white/60 p-4 flex flex-col gap-3 animate-in slide-in-from-top-2 duration-200">
          {/* Árvores */}
          {relatedTrees.length > 0 && (
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Árvores</p>
              <div className="flex flex-wrap gap-1.5">
                {relatedTrees.map(t => (
                  <span key={t.id} className="text-[10px] bg-white border border-slate-200 text-slate-600 px-2 py-0.5 rounded-md font-medium">
                    {t.especie}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Clientes */}
          {relatedClients.length > 0 && (
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Proprietário</p>
              <div className="flex flex-wrap gap-1.5">
                {relatedClients.map(c => (
                  <span key={c.id} className="text-[10px] bg-white border border-slate-200 text-slate-600 px-2 py-0.5 rounded-md font-medium">
                    {c.nome}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Ações condicionais */}
          <div className="flex gap-2 pt-1">
            {isOp ? (
              <>
                {isToday && (
                  <button
                    onClick={() => openPostServiceModal(alert.serviceId)}
                    className="flex-1 flex items-center justify-center gap-1.5 bg-emerald-500 hover:bg-emerald-600 text-white px-3 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 shadow-sm"
                  >
                    <CheckCircle2 size={13} /> Confirmar Visita
                  </button>
                )}
                <button
                  onClick={() => openReminderModal(alert.serviceId)}
                  className="flex items-center justify-center gap-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 px-3 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 shadow-sm"
                >
                  <Send size={13} /> Avisar
                </button>
              </>
            ) : (
              <button
                onClick={() => openReminderModal(alert.serviceId)}
                className="flex-1 flex items-center justify-center gap-1.5 bg-amber-500 hover:bg-amber-600 text-white px-3 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 shadow-sm"
              >
                <Send size={13} /> Disparar Lembrete ao Cliente
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Página Principal ─────────────────────────────────────────────────────────

export function Alerts() {
  const { services } = useAppStore();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const monthNames = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

  // Montar lista unificada de alertas
  const alerts = useMemo<UnifiedAlert[]>(() => {
    const result: UnifiedAlert[] = [];

    services.forEach(s => {
      if (s.status !== 'concluido') {
        result.push({
          id: `op-${s.id}`,
          serviceId: s.id,
          category: 'operacional',
          tipo: s.tipo,
          data: s.data,
          horario: s.horario,
          responsavel: s.responsavel,
          treeIds: s.treeIds,
          alertStatus: getAlertStatus(s.data),
          group: getAlertGroup(s.data),
        });
      }

      if (s.status === 'concluido' && s.data_validade_servico) {
        result.push({
          id: `com-${s.id}`,
          serviceId: s.id,
          category: 'comercial',
          tipo: `Retorno: ${s.tipo}`,
          data: s.data_validade_servico,
          responsavel: s.responsavel,
          treeIds: s.treeIds,
          alertStatus: getAlertStatus(s.data_validade_servico),
          group: getAlertGroup(s.data_validade_servico),
          data_validade: s.data_validade_servico,
        });
      }
    });

    return result.sort((a, b) =>
      new Date(a.data + 'T00:00:00').getTime() - new Date(b.data + 'T00:00:00').getTime()
    );
  }, [services]);

  const groupedAlerts = useMemo(() => ({
    semana: alerts.filter(a => a.group === 'semana'),
    mes:    alerts.filter(a => a.group === 'mes'),
    breve:  alerts.filter(a => a.group === 'breve'),
  }), [alerts]);

  // Clique em evento do calendário → scroll + foco no card
  const handleCalendarClick = useCallback((alertId: string) => {
    setFocusedId(alertId);
    setExpandedId(alertId);
    setTimeout(() => {
      const el = cardRefs.current[alertId];
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 50);
    // Remove foco visual após 2s
    setTimeout(() => setFocusedId(null), 2000);
  }, []);

  // Toggle expand de card
  const handleToggle = (id: string) => {
    setExpandedId(prev => prev === id ? null : id);
  };

  // Calendário
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();
  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const todayNum = new Date().getDate();
  const todayMonth = new Date().getMonth();

  return (
    <div className="h-full flex gap-4 relative">
      <ReminderModal />

      {/* ── Lista (30%) ── */}
      <div className="w-[340px] min-w-[300px] h-full bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col z-10 relative overflow-hidden">
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 shrink-0">
          <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <Bell size={16} className="text-primary" /> Painel de Alertas
          </h2>
          <p className="text-slate-400 text-xs mt-0.5">{alerts.length} evento{alerts.length !== 1 ? 's' : ''} pendente{alerts.length !== 1 ? 's' : ''}</p>

          {/* Legenda */}
          <div className="flex gap-3 mt-3">
            <span className="flex items-center gap-1 text-[10px] text-slate-500">
              <span className="w-2 h-2 rounded-full bg-blue-500 inline-block" /> Técnico
            </span>
            <span className="flex items-center gap-1 text-[10px] text-slate-500">
              <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" /> Manutenção
            </span>
          </div>
        </div>

        {/* Lista de alertas com grupos */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-5 pb-4">
          {alerts.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-slate-400 text-center border-2 border-dashed border-slate-100 rounded-2xl p-8 mt-4">
              <CheckCircle2 size={40} className="text-emerald-400 mb-3" />
              <p className="font-bold text-sm">Tudo em dia!</p>
              <p className="text-xs mt-1">Nenhum alerta pendente.</p>
            </div>
          ) : (
            <>
              {/* Grupo: Esta Semana */}
              {groupedAlerts.semana.length > 0 && (
                <div className="flex flex-col gap-2">
                  <h3 className="text-[10px] font-bold uppercase tracking-widest text-red-500 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse inline-block" />
                    Esta semana ({groupedAlerts.semana.length})
                  </h3>
                  {groupedAlerts.semana.map(alert => (
                    <AlertCard key={alert.id} alert={alert} focused={focusedId === alert.id}
                      expanded={expandedId === alert.id} onToggle={() => handleToggle(alert.id)}
                      cardRef={el => { cardRefs.current[alert.id] = el; }} />
                  ))}
                </div>
              )}

              {/* Grupo: Próximos 30 dias */}
              {groupedAlerts.mes.length > 0 && (
                <div className="flex flex-col gap-2">
                  <h3 className="text-[10px] font-bold uppercase tracking-widest text-amber-500 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block" />
                    Próximos 30 dias ({groupedAlerts.mes.length})
                  </h3>
                  {groupedAlerts.mes.map(alert => (
                    <AlertCard key={alert.id} alert={alert} focused={focusedId === alert.id}
                      expanded={expandedId === alert.id} onToggle={() => handleToggle(alert.id)}
                      cardRef={el => { cardRefs.current[alert.id] = el; }} />
                  ))}
                </div>
              )}

              {/* Grupo: Em Breve */}
              {groupedAlerts.breve.length > 0 && (
                <div className="flex flex-col gap-2">
                  <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400 inline-block" />
                    Em breve ({groupedAlerts.breve.length})
                  </h3>
                  {groupedAlerts.breve.map(alert => (
                    <AlertCard key={alert.id} alert={alert} focused={focusedId === alert.id}
                      expanded={expandedId === alert.id} onToggle={() => handleToggle(alert.id)}
                      cardRef={el => { cardRefs.current[alert.id] = el; }} />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* ── Calendário (70%) ── */}
      <div className="flex-1 h-full bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col overflow-hidden">
        
        {/* Header Calendário */}
        <div className="flex justify-between items-center mb-5 shrink-0">
          <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <CalendarIcon size={16} className="text-primary" /> Visão Mensal
          </h3>
          <div className="flex items-center gap-3 bg-slate-50 px-2 py-1.5 rounded-xl border border-slate-100">
            <button onClick={prevMonth} className="p-1.5 hover:bg-white rounded-lg text-slate-500 transition-colors">
              <ChevronLeft size={16} />
            </button>
            <span className="font-bold text-slate-700 min-w-[130px] text-center text-sm">
              {monthNames[month]} {year}
            </span>
            <button onClick={nextMonth} className="p-1.5 hover:bg-white rounded-lg text-slate-500 transition-colors">
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {/* Grid */}
        <div className="flex-1 border border-slate-100 rounded-2xl overflow-hidden flex flex-col bg-slate-50/50 min-h-0">
          {/* Dias da semana */}
          <div className="grid grid-cols-7 border-b border-slate-100 bg-white shrink-0">
            {['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'].map(d => (
              <div key={d} className="py-2 text-center text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                {d}
              </div>
            ))}
          </div>

          {/* Células */}
          <div className="grid grid-cols-7 flex-1 bg-slate-100 gap-[1px] overflow-hidden">
            {Array.from({ length: 42 }).map((_, index) => {
              const dayNumber = index - firstDay + 1;
              const isCurrentMonth = dayNumber > 0 && dayNumber <= daysInMonth;
              const isToday = isCurrentMonth && dayNumber === todayNum && month === todayMonth;

              // Alertas neste dia
              let dayAlerts: UnifiedAlert[] = [];
              if (isCurrentMonth) {
                const dateStr = new Date(year, month, dayNumber).toISOString().split('T')[0];
                dayAlerts = alerts.filter(a => a.data.startsWith(dateStr));
              }

              return (
                <div
                  key={index}
                  className={`bg-white flex flex-col transition-colors min-h-0 overflow-hidden p-1.5
                    ${!isCurrentMonth ? 'opacity-25' : 'hover:bg-slate-50'}
                  `}
                >
                  <span className={`text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full mb-1 shrink-0
                    ${isToday ? 'bg-primary text-white' : 'text-slate-600'}
                  `}>
                    {isCurrentMonth ? dayNumber : ''}
                  </span>

                  <div className="flex flex-col gap-0.5 overflow-y-auto">
                    {dayAlerts.map(a => {
                      const isOp = a.category === 'operacional';
                      return (
                        <button
                          key={a.id}
                          onClick={() => handleCalendarClick(a.id)}
                          title={a.tipo}
                          className={`w-full text-left text-[8px] font-bold uppercase px-1 py-0.5 rounded truncate border transition-transform active:scale-95
                            ${isOp
                              ? 'bg-blue-50 text-blue-600 border-blue-100 hover:bg-blue-100'
                              : 'bg-amber-50 text-amber-600 border-amber-100 hover:bg-amber-100'
                            }
                          `}
                        >
                          {isOp ? '🔧' : '🔔'} {a.tipo}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Legenda rodapé */}
        <div className="flex gap-4 mt-3 shrink-0 text-[10px] text-slate-400 justify-end">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-blue-100 border border-blue-200 inline-block" /> Agendamento Técnico</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-amber-100 border border-amber-200 inline-block" /> Manutenção a Vencer</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-primary inline-block" /> Hoje</span>
        </div>
      </div>
    </div>
  );
}
