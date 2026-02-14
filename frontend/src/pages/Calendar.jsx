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

export default function Calendar() {
  const user = getUser() || {};
  const storageKey = `lumini_calendar_${user.id || 'anon'}`;
  const [events, setEvents] = useState({});
  const [current, setCurrent] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ date: '', title: '' });
  const [alert, setAlert] = useState({ show: false, title: '', message: '', type: 'info' });
  const [listFilter, setListFilter] = useState('all');

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) setEvents(JSON.parse(raw));
    } catch {
      // ignore
    }
  }, [storageKey]);

  const save = (data) => {
    setEvents(data);
    try {
      localStorage.setItem(storageKey, JSON.stringify(data));
    } catch {
      // ignore
    }
  };

  const days = useMemo(() => {
    const firstDay = new Date(current.getFullYear(), current.getMonth(), 1);
    const startWeekDay = firstDay.getDay(); // 0 Sun .. 6 Sat
    const daysInMonth = new Date(current.getFullYear(), current.getMonth() + 1, 0).getDate();
    const prevMonthDays = new Date(current.getFullYear(), current.getMonth(), 0).getDate();

    const cells = [];
    // leading blanks from previous month
    for (let i = 0; i < startWeekDay; i++) {
      const dayNum = prevMonthDays - startWeekDay + i + 1;
      const date = new Date(current.getFullYear(), current.getMonth() - 1, dayNum);
      cells.push({ date, outside: true });
    }
    // current month days
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(current.getFullYear(), current.getMonth(), d);
      cells.push({ date, outside: false });
    }
    // trailing blanks to complete 6 weeks grid
    while (cells.length % 7 !== 0) {
      const last = cells[cells.length - 1].date;
      const date = new Date(last.getFullYear(), last.getMonth(), last.getDate() + 1);
      cells.push({ date, outside: true });
    }
    return cells;
  }, [current]);

  const monthName = current.toLocaleString('pt-BR', { month: 'long', year: 'numeric' });

  const openAdd = (date) => {
    setForm({ date: toKey(date), title: '' });
    setShowModal(true);
  };
  const openNewToday = () => {
    const d = new Date();
    setForm({ date: toKey(d), title: '' });
    setShowModal(true);
  };
  const focusDate = (dateKey) => {
    const el = document.getElementById(`evt-${dateKey}`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const addEvent = (e) => {
    e.preventDefault();
    if (!form.date || !form.title.trim()) return;
    const data = { ...events };
    const list = data[form.date] ? [...data[form.date]] : [];
    list.push({ title: form.title.trim(), createdAt: Date.now(), status: 'active' });
    data[form.date] = list;
    save(data);
    setShowModal(false);
    setAlert({ show: true, title: 'Sucesso', message: 'Evento adicionado', type: 'success' });
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
        <div className="px-5 py-4 bg-gradient-to-r from-purple-600 via-fuchsia-500 to-pink-500 text-white flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="text-lg font-semibold capitalize">{monthName}</div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrent(new Date(current.getFullYear(), current.getMonth() - 1, 1))}
              className="px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition"
            >
              ←
            </button>
            <button
              onClick={() => setCurrent(new Date(new Date().getFullYear(), new Date().getMonth(), 1))}
              className="px-3 py-2 rounded-lg bg-white text-purple-700 hover:bg-slate-100 transition"
            >
              Hoje
            </button>
            <button
              onClick={() => setCurrent(new Date(current.getFullYear(), current.getMonth() + 1, 1))}
              className="px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition"
            >
              →
            </button>
            <button
              onClick={openNewToday}
              className="ml-2 px-3 py-2 rounded-lg bg-white text-purple-700 hover:bg-slate-100 transition"
              title="Adicionar evento para hoje"
            >
              Novo evento
            </button>
          </div>
        </div>
        <div className="px-5 py-4 lg:flex lg:items-start lg:gap-6">
          <div className="lg:flex-1">
            <div className="grid grid-cols-7 gap-2 text-center text-[11px] sm:text-xs font-medium text-slate-600 dark:text-slate-400 mb-2">
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
                    className={`relative p-3 min-h-[110px] transition ${
                      outside ? 'bg-slate-50 dark:bg-slate-800/40 opacity-70' :
                      weekend ? 'bg-purple-50/30 dark:bg-purple-900/5' :
                      'bg-white dark:bg-slate-900'
                    } hover:bg-slate-50 dark:hover:bg-slate-800`}
                  >
                    <div className="flex items-center justify-between">
                      <div className={`${outside ? 'text-slate-400' : 'text-slate-700 dark:text-slate-200'} text-sm`}>
                        <span className={`${isToday(date) ? 'inline-flex items-center justify-center w-6 h-6 rounded-full ring-2 ring-purple-500/60 text-purple-700 dark:text-purple-300' : ''}`}>
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
                      {dayEvents.slice(0, 2).map((ev, i) => {
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
                          <div key={i} className="flex items-center gap-2 text-xs px-2 py-1 rounded bg-purple-50 dark:bg-purple-900/10">
                            <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
                            <span className={`truncate ${textCls}`}>{ev.title}</span>
                          </div>
                        );
                      })}
                      {dayEvents.length > 2 && (
                        <button onClick={() => focusDate(key)} className="text-[11px] text-purple-600 dark:text-purple-400 hover:underline">
                          + {dayEvents.length - 2} mais
                        </button>
                      )}
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
          <div className="mt-6 lg:mt-0 lg:w-80 flex-shrink-0">
            <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 p-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-base font-semibold text-slate-900 dark:text-white">Próximos eventos</h2>
                <select
                  value={listFilter}
                  onChange={(e) => setListFilter(e.target.value)}
                  className="px-2 py-1 rounded border border-slate-300 dark:border-white/10 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm"
                  aria-label="Filtrar eventos"
                >
                  <option value="all">Todos</option>
                  <option value="active">Ativos</option>
                  <option value="done">Concluídos</option>
                  <option value="canceled">Cancelados</option>
                </select>
              </div>
              <div className="space-y-2 max-h-[420px] overflow-auto pr-1">
                {Object.keys(events).length === 0 && (
                  <div className="text-sm text-slate-500 dark:text-slate-400">Sem eventos</div>
                )}
                {Object.entries(events)
                  .flatMap(([k, list]) => list.map((e, idx) => ({ date: k, title: e.title, status: e.status || 'active', i: idx })))
                  .filter(e => {
                    const d = fromKey(e.date);
                    return d.getMonth() === current.getMonth() && d.getFullYear() === current.getFullYear();
                  })
                  .filter(e => listFilter === 'all' ? true : e.status === listFilter)
                  .sort((a, b) => fromKey(a.date) - fromKey(b.date))
                  .map((e, i) => (
                    <div key={`${e.date}-${i}`} id={`evt-${e.date}`} className="flex items-center justify-between p-3 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800/40">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="text-sm font-semibold text-purple-700 dark:text-purple-300 whitespace-nowrap">{fromKey(e.date).toLocaleDateString('pt-BR')}</div>
                        <div className={`text-base truncate ${e.status === 'done' ? 'text-slate-500 line-through' : e.status === 'canceled' ? 'text-rose-400 line-through' : 'text-slate-700 dark:text-slate-200'}`}>{e.title}</div>
                      </div>
                      <div className="flex items-center gap-1 whitespace-nowrap shrink-0">
                        {e.status === 'active' && (
                          <>
                            <button
                              onClick={() => setEventStatus(e.date, e.i, 'done')}
                              className="w-7 h-7 rounded bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300 hover:bg-emerald-100 flex items-center justify-center"
                              title="Concluir"
                              aria-label="Concluir"
                            >
                              ✓
                            </button>
                            <button
                              onClick={() => setEventStatus(e.date, e.i, 'canceled')}
                              className="w-7 h-7 rounded bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300 hover:bg-amber-100 flex items-center justify-center"
                              title="Cancelar"
                              aria-label="Cancelar"
                            >
                              ✕
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => removeEvent(e.date, e.i)}
                          className="w-7 h-7 rounded bg-rose-50 text-rose-700 dark:bg-rose-900/20 dark:text-rose-300 hover:bg-rose-100 flex items-center justify-center"
                          title="Apagar"
                          aria-label="Apagar"
                        >
                          🗑
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-900 rounded-xl p-6 w-full max-w-md border border-slate-200 dark:border-white/10">
            <h2 className="text-lg font-bold mb-4 text-slate-900 dark:text-white">Novo Evento</h2>
            <form onSubmit={addEvent} className="space-y-4">
              <div>
                <label className="block text-sm text-slate-600 dark:text-slate-400 mb-1">Data</label>
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-white/10 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-slate-600 dark:text-slate-400 mb-1">Título</label>
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
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 text-slate-700 dark:text-slate-300 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white transition"
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
