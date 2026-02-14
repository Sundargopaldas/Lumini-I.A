import { useEffect, useMemo, useState } from 'react';
import { getUser } from '../utils/storage';
import CustomAlert from '../components/CustomAlert';

const pad = (n) => (n < 10 ? `0${n}` : `${n}`);
const toKey = (date) => {
  const d = new Date(date);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};
const fromKey = (key) => {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
};

export default function ModernCalendar() {
  const user = getUser() || {};
  const storageKey = `lumini_calendar_${user.id || 'anon'}`;
  const [events, setEvents] = useState({});
  const [current, setCurrent] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [weekAnchor, setWeekAnchor] = useState(new Date());
  const [view, setView] = useState('agenda');
  const [showDrawer, setShowDrawer] = useState(false);
  const [form, setForm] = useState({ date: '', title: '' });
  const [mode, setMode] = useState('create');
  const [editIndex, setEditIndex] = useState(null);
  const [editDateKey, setEditDateKey] = useState(null);
  const [alert, setAlert] = useState({ show: false, title: '', message: '', type: 'info' });
  const [filter, setFilter] = useState('all');
  const [query, setQuery] = useState('');

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) setEvents(JSON.parse(raw));
    } catch {}
  }, [storageKey]);

  const save = (data) => {
    setEvents(data);
    try {
      localStorage.setItem(storageKey, JSON.stringify(data));
    } catch {}
  };

  const days = useMemo(() => {
    const firstDay = new Date(current.getFullYear(), current.getMonth(), 1);
    const startWeekDay = firstDay.getDay();
    const daysInMonth = new Date(current.getFullYear(), current.getMonth() + 1, 0).getDate();
    const prevMonthDays = new Date(current.getFullYear(), current.getMonth(), 0).getDate();
    const cells = [];
    for (let i = 0; i < startWeekDay; i++) {
      const dayNum = prevMonthDays - startWeekDay + i + 1;
      const date = new Date(current.getFullYear(), current.getMonth() - 1, dayNum);
      cells.push({ date, outside: true });
    }
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(current.getFullYear(), current.getMonth(), d);
      cells.push({ date, outside: false });
    }
    while (cells.length % 7 !== 0) {
      const last = cells[cells.length - 1].date;
      const date = new Date(last.getFullYear(), last.getMonth(), last.getDate() + 1);
      cells.push({ date, outside: true });
    }
    return cells;
  }, [current]);

  const monthName = current.toLocaleString('pt-BR', { month: 'long', year: 'numeric' });

  const openAdd = (date) => {
    setMode('create');
    setEditIndex(null);
    setEditDateKey(null);
    setForm({ date: toKey(date), title: '' });
    setShowDrawer(true);
  };
  const openNewToday = () => {
    const d = new Date();
    setMode('create');
    setEditIndex(null);
    setEditDateKey(null);
    setForm({ date: toKey(d), title: '' });
    setShowDrawer(true);
  };
  const openEdit = (dateKey, idx, title) => {
    setMode('edit');
    setEditIndex(idx);
    setEditDateKey(dateKey);
    setForm({ date: dateKey, title });
    setShowDrawer(true);
  };

  const addEvent = (e) => {
    e.preventDefault();
    if (!form.date || !form.title.trim()) return;
    if (mode === 'edit' && editDateKey != null && editIndex != null) {
      const data = { ...events };
      const oldList = (data[editDateKey] || []).slice();
      const item = oldList[editIndex];
      if (!item) {
        setShowDrawer(false);
        return;
      }
      oldList.splice(editIndex, 1);
      if (oldList.length) data[editDateKey] = oldList; else delete data[editDateKey];
      const newKey = form.date;
      const newList = data[newKey] ? [...data[newKey]] : [];
      newList.push({ ...item, title: form.title.trim() });
      data[newKey] = newList;
      save(data);
      setShowDrawer(false);
      setAlert({ show: true, title: 'Sucesso', message: 'Evento atualizado', type: 'success' });
    } else {
      const data = { ...events };
      const list = data[form.date] ? [...data[form.date]] : [];
      list.push({ title: form.title.trim(), createdAt: Date.now(), status: 'active' });
      data[form.date] = list;
      save(data);
      setShowDrawer(false);
      setAlert({ show: true, title: 'Sucesso', message: 'Evento adicionado', type: 'success' });
    }
  };

  const removeEvent = (dateKey, idx) => {
    const data = { ...events };
    const list = (data[dateKey] || []).slice();
    list.splice(idx, 1);
    if (list.length === 0) delete data[dateKey];
    else data[dateKey] = list;
    save(data);
  };
  const setEventStatus = (dateKey, idx, status) => {
    const data = { ...events };
    const list = (data[dateKey] || []).slice();
    if (!list[idx]) return;
    list[idx] = { ...list[idx], status };
    data[dateKey] = list;
    save(data);
  };

  const isToday = (d) => {
    const t = new Date();
    return d.getFullYear() === t.getFullYear() && d.getMonth() === t.getMonth() && d.getDate() === t.getDate();
    };
  const isWeekend = (d) => {
    const w = d.getDay();
    return w === 0 || w === 6;
  };

  const agenda = useMemo(() => {
    const list = Object.entries(events)
      .flatMap(([k, arr]) => arr.map((e, i) => ({ date: k, ...e, i })))
      .filter(e => {
        const d = fromKey(e.date);
        return d.getMonth() === current.getMonth() && d.getFullYear() === current.getFullYear();
      })
      .filter(e => (filter === 'all' ? true : e.status === filter))
      .filter(e => (query.trim() ? e.title.toLowerCase().includes(query.trim().toLowerCase()) : true))
      .sort((a, b) => fromKey(a.date) - fromKey(b.date));
    const groups = {};
    for (const e of list) {
      if (!groups[e.date]) groups[e.date] = [];
      groups[e.date].push(e);
    }
    return groups;
  }, [events, current, filter]);

  const weekDays = useMemo(() => {
    const anchor = new Date(weekAnchor);
    const start = new Date(anchor);
    start.setDate(anchor.getDate() - anchor.getDay());
    const arr = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      arr.push(d);
    }
    return arr;
  }, [weekAnchor]);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <CustomAlert
        isOpen={alert.show}
        onClose={() => setAlert((a) => ({ ...a, show: false }))}
        title={alert.title}
        message={alert.message}
        type={alert.type}
      />

      <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
        <div className="px-5 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="text-lg font-semibold capitalize">
            {view === 'week'
              ? `${weekDays[0].toLocaleDateString('pt-BR')} – ${weekDays[6].toLocaleDateString('pt-BR')}`
              : monthName}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => view === 'week'
                ? setWeekAnchor(new Date(weekAnchor.getFullYear(), weekAnchor.getMonth(), weekAnchor.getDate() - 7))
                : setCurrent(new Date(current.getFullYear(), current.getMonth() - 1, 1))}
              className="px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition"
            >
              ←
            </button>
            <button
              onClick={() => {
                const t = new Date();
                if (view === 'week') setWeekAnchor(t);
                else setCurrent(new Date(t.getFullYear(), t.getMonth(), 1));
              }}
              className="px-3 py-2 rounded-lg bg-white text-purple-700 hover:bg-slate-100 transition"
            >
              Hoje
            </button>
            <button
              onClick={() => view === 'week'
                ? setWeekAnchor(new Date(weekAnchor.getFullYear(), weekAnchor.getMonth(), weekAnchor.getDate() + 7))
                : setCurrent(new Date(current.getFullYear(), current.getMonth() + 1, 1))}
              className="px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition"
            >
              →
            </button>
            <div className="ml-2 inline-flex rounded-lg bg-white/20 p-1">
              <button onClick={() => setView('agenda')} className={`px-3 py-1.5 rounded-md ${view==='agenda'?'bg-white text-purple-700':'text-white'}`}>Agenda</button>
              <button onClick={() => setView('week')} className={`px-3 py-1.5 rounded-md ${view==='week'?'bg-white text-purple-700':'text-white'}`}>Semana</button>
              <button onClick={() => setView('month')} className={`px-3 py-1.5 rounded-md ${view==='month'?'bg-white text-purple-700':'text-white'}`}>Mês</button>
            </div>
            <button
              onClick={openNewToday}
              className="ml-2 px-3 py-2 rounded-lg bg-white text-purple-700 hover:bg-slate-100 transition"
              title="Adicionar evento para hoje"
            >
              Novo evento
            </button>
          </div>
        </div>

        {view === 'agenda' ? (
          <div className="p-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Agenda do mês</h2>
              <div className="flex items-center gap-2">
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Buscar..."
                  className="px-3 py-2 rounded-lg border border-slate-300 dark:border-white/10 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm w-56"
                />
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="px-2 py-2 rounded-lg border border-slate-300 dark:border-white/10 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm"
                >
                  <option value="all">Todos</option>
                  <option value="active">Ativos</option>
                  <option value="done">Concluídos</option>
                  <option value="canceled">Cancelados</option>
                </select>
              </div>
            </div>
            <div className="space-y-6">
              {Object.keys(agenda).length === 0 && (
                <div className="text-slate-500 dark:text-slate-400 text-sm">Sem eventos</div>
              )}
              {Object.entries(agenda).map(([day, items]) => (
                <div key={day} className="rounded-xl border border-slate-200 dark:border-white/10">
                  <div className="px-4 py-2 border-b border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800/40 flex items-center justify-between">
                    <div className="text-base font-semibold text-purple-700 dark:text-purple-300">{fromKey(day).toLocaleDateString('pt-BR')}</div>
                    <div className="text-xs text-slate-500">{items.length} {items.length>1?'eventos':'evento'}</div>
                  </div>
                  <div className="p-4 space-y-2">
                    {items.map((e, idx) => {
                      const dot = e.status === 'done' ? 'bg-emerald-500' : e.status === 'canceled' ? 'bg-rose-500' : 'bg-purple-500';
                      const textCls = e.status === 'done' ? 'text-slate-500 line-through' : e.status === 'canceled' ? 'text-rose-400 line-through' : 'text-slate-700 dark:text-slate-200';
                      return (
                        <div key={`${day}-${idx}`} className="flex items-center justify-between p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10">
                          <div className="flex items-center gap-3 min-w-0">
                            <span className={`w-2 h-2 rounded-full ${dot}`} />
                            <button onClick={() => openEdit(day, e.i, e.title)} className={`text-base truncate text-left ${textCls} hover:underline`}>
                              {e.title}
                            </button>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {e.status === 'active' && (
                              <>
                                <button onClick={() => setEventStatus(day, e.i, 'done')} className="w-9 h-9 rounded bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300 hover:bg-emerald-100 flex items-center justify-center" title="Concluir" aria-label="Concluir">✓</button>
                                <button onClick={() => setEventStatus(day, e.i, 'canceled')} className="w-9 h-9 rounded bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300 hover:bg-amber-100 flex items-center justify-center" title="Cancelar" aria-label="Cancelar">✕</button>
                              </>
                            )}
                            <button onClick={() => removeEvent(day, e.i)} className="w-9 h-9 rounded bg-rose-50 text-rose-700 dark:bg-rose-900/20 dark:text-rose-300 hover:bg-rose-100 flex items-center justify-center" title="Apagar" aria-label="Apagar">🗑</button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : view === 'month' ? (
          <div className="px-5 py-4">
            <div className="grid grid-cols-7 gap-2 text-center text-xs font-medium text-slate-600 dark:text-slate-400 mb-2">
              {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((w) => (
                <div key={w} className="py-2">{w}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-px bg-slate-200/60 dark:bg-white/10 rounded-xl overflow-hidden">
              {days.map(({ date, outside }, idx) => {
                const key = toKey(date);
                const dayEvents = events[key] || [];
                const weekend = isWeekend(date) && !outside;
                return (
                  <div
                    key={idx}
                    className={`relative p-3 min-h-[120px] ${
                      outside ? 'bg-slate-50 dark:bg-slate-800/40 opacity-70' :
                      weekend ? 'bg-purple-50/30 dark:bg-purple-900/5' :
                      'bg-white dark:bg-slate-900'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className={`${outside ? 'text-slate-400' : 'text-slate-700 dark:text-slate-200'} text-sm`}>
                        <span className={`${isToday(date) ? 'inline-flex items-center justify-center w-7 h-7 rounded-full ring-2 ring-purple-500/60 text-purple-700 dark:text-purple-300' : ''}`}>
                          {date.getDate()}
                        </span>
                      </div>
                      {dayEvents.length > 0 && (
                        <span className="absolute top-2 right-2 text-[10px] px-1.5 py-0.5 rounded-full bg-purple-600/20 text-purple-700 dark:text-purple-300">
                          {dayEvents.length}
                        </span>
                      )}
                    </div>
                    <div className="mt-2 space-y-1">
                      {dayEvents.slice(0, 3).map((ev, i) => {
                        const status = ev.status || 'active';
                        const dot =
                          status === 'done' ? 'bg-emerald-500' :
                          status === 'canceled' ? 'bg-rose-500' :
                          'bg-purple-500';
                        const textCls =
                          status === 'done'
                            ? 'text-slate-500 line-through'
                            : status === 'canceled'
                              ? 'text-rose-400 line-through'
                              : 'text-slate-700 dark:text-slate-200';
                        return (
                          <button onClick={() => openEdit(key, i, ev.title)} key={i} className="flex items-center gap-2 text-[13px] px-2 py-1.5 rounded bg-purple-50 dark:bg-purple-900/10 w-full text-left">
                            <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
                            <span className={`truncate ${textCls}`}>{ev.title}</span>
                          </button>
                        );
                      })}
                    </div>
                    {!outside && (
                      <button
                        onClick={() => openAdd(date)}
                        className="mt-2 w-full text-xs text-purple-600 dark:text-purple-400 hover:underline text-left"
                      >
                        + Adicionar
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="px-5 py-4">
            <div className="grid grid-cols-7 gap-2 text-center text-xs font-medium text-slate-600 dark:text-slate-400 mb-4">
              {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((w, i) => (
                <div key={w} className="py-2">
                  <div>{w}</div>
                  <div className="text-sm font-semibold text-purple-700 dark:text-purple-300">{weekDays[i].toLocaleDateString('pt-BR')}</div>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-3">
              {weekDays.map((d, idx) => {
                const key = toKey(d);
                const dayEvents = events[key] || [];
                return (
                  <div key={idx} className="rounded-xl border border-slate-200 dark:border-white/10 p-3 bg-white dark:bg-slate-900 min-h-[180px]">
                    <div className="flex items-center justify-between mb-2">
                      <div className={`text-sm ${isToday(d) ? 'font-semibold text-purple-700 dark:text-purple-300' : 'text-slate-600 dark:text-slate-400'}`}>{d.getDate()}</div>
                      <button onClick={() => openAdd(d)} className="text-xs text-purple-600 dark:text-purple-400 hover:underline">+ Adicionar</button>
                    </div>
                    <div className="space-y-2">
                      {dayEvents.length === 0 && <div className="text-xs text-slate-400">Sem eventos</div>}
                      {dayEvents.map((ev, i) => {
                        const status = ev.status || 'active';
                        const dot = status === 'done' ? 'bg-emerald-500' : status === 'canceled' ? 'bg-rose-500' : 'bg-purple-500';
                        const textCls = status === 'done' ? 'text-slate-500 line-through' : status === 'canceled' ? 'text-rose-400 line-through' : 'text-slate-700 dark:text-slate-200';
                        return (
                          <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/40">
                            <button onClick={() => openEdit(key, i, ev.title)} className={`flex items-center gap-2 min-w-0 text-left ${textCls}`}>
                              <span className={`w-2 h-2 rounded-full ${dot}`} />
                              <span className="truncate">{ev.title}</span>
                            </button>
                            <div className="flex items-center gap-1">
                              {status === 'active' && (
                                <>
                                  <button onClick={() => setEventStatus(key, i, 'done')} className="w-7 h-7 rounded bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300 flex items-center justify-center">✓</button>
                                  <button onClick={() => setEventStatus(key, i, 'canceled')} className="w-7 h-7 rounded bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300 flex items-center justify-center">✕</button>
                                </>
                              )}
                              <button onClick={() => removeEvent(key, i)} className="w-7 h-7 rounded bg-rose-50 text-rose-700 dark:bg-rose-900/20 dark:text-rose-300 flex items-center justify-center">🗑</button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {showDrawer && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowDrawer(false)} />
          <div className="absolute top-0 right-0 h-full w-full max-w-md bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-white/10 shadow-xl transform transition-transform translate-x-0">
            <div className="p-6 flex items-center justify-between border-b border-slate-200 dark:border-white/10">
              <div className="text-lg font-bold text-slate-900 dark:text-white">{mode === 'edit' ? 'Editar Evento' : 'Novo Evento'}</div>
              <button onClick={() => setShowDrawer(false)} className="w-9 h-9 rounded bg-slate-100 dark:bg-white/10">✕</button>
            </div>
            <form onSubmit={addEvent} className="p-6 space-y-4">
              <div>
                <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">Data</div>
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-white/10 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  required
                />
              </div>
              <div>
                <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">Título</div>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="Ex: Pagar DAS, Reunião com Cliente"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-white/10 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  required
                />
              </div>
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowDrawer(false)}
                  className="px-4 py-2 rounded-lg bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 text-slate-700 dark:text-slate-300"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white"
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <button
        onClick={openNewToday}
        className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-purple-600 hover:bg-purple-700 text-white shadow-lg flex items-center justify-center"
        title="Novo evento"
        aria-label="Novo evento"
      >
        +
      </button>
    </div>
  );
}
