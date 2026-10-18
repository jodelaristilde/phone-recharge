import React, { useMemo, useState } from 'react';
import { History, X, ChevronLeft, ChevronRight, CheckCircle, Calendar } from 'lucide-react';

const TZ = 'America/New_York';
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// "YYYY-MM-DD" for a Date, in Eastern time
const easternKey = (d) => {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(d);
  const get = (t) => parts.find((p) => p.type === t).value;
  return `${get('year')}-${get('month')}-${get('day')}`;
};

// Which business day a history entry belongs to.
// The reset runs at ~3–4 AM Eastern the morning AFTER the sales day, so
// stepping back 6 hours from the reset time lands on the sales day.
// (The stored date text is a mix of M/D and D/M formats, so it isn't reliable.)
const entryDayKey = (entry) => {
  const t = new Date(entry.timestamp || '').getTime();
  if (t) return easternKey(new Date(t - 6 * 60 * 60 * 1000));
  const [p1, p2, y] = String(entry.date || '').split('/').map(Number);
  if (!p1 || !p2 || !y) return null;
  const [day, month] = p2 > 12 ? [p2, p1] : [p1, p2];
  return `${y}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
};

const keyFor = (y, m, d) =>
  `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

const prettyDate = (key) => {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  });
};

const HistoryCalendar = ({ history, isLoading, onClose, todayRequests = [] }) => {
  const todayKey = easternKey(new Date());
  const [todayY, todayM] = todayKey.split('-').map(Number);

  const [viewYear, setViewYear] = useState(todayY);
  const [viewMonth, setViewMonth] = useState(todayM - 1); // 0-based
  const [selectedKey, setSelectedKey] = useState(null);

  // Group history entries by business day (merge if a day appears twice)
  const byDay = useMemo(() => {
    const map = {};
    for (const entry of history || []) {
      const key = entryDayKey(entry);
      if (!key) continue;
      if (!map[key]) map[key] = { totalSold: 0, totalRequests: 0, requests: [] };
      map[key].totalSold += entry.totalSold || 0;
      map[key].totalRequests += entry.totalRequests || 0;
      map[key].requests.push(...(entry.requests || []));
    }
    return map;
  }, [history]);

  const todaySummary = {
    totalSold: todayRequests.reduce((s, r) => s + (r.amount || 0), 0),
    totalRequests: todayRequests.length,
    requests: todayRequests,
  };

  const firstWeekday = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const cells = [
    ...Array(firstWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const monthTotal = cells.reduce((sum, d) => {
    if (!d) return sum;
    const k = keyFor(viewYear, viewMonth, d);
    if (k === todayKey) return sum + todaySummary.totalSold;
    return sum + (byDay[k]?.totalSold || 0);
  }, 0);

  const isCurrentMonth = viewYear === todayY && viewMonth === todayM - 1;

  const changeMonth = (delta) => {
    let m = viewMonth + delta;
    let y = viewYear;
    if (m < 0) { m = 11; y -= 1; }
    if (m > 11) { m = 0; y += 1; }
    setViewMonth(m);
    setViewYear(y);
    setSelectedKey(null);
  };

  const selected = selectedKey
    ? selectedKey === todayKey
      ? todaySummary
      : byDay[selectedKey]
    : null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] flex flex-col border border-gray-700">
        <div className="flex items-center justify-between p-5 border-b border-gray-700">
          <h2 className="text-2xl font-bold text-orange-400 flex items-center gap-2">
            <History className="w-6 h-6" />
            History
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors" aria-label="Close">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto">
          {isLoading ? (
            <div className="text-center py-8 text-gray-400">Loading history...</div>
          ) : (
            <>
              {/* Month navigation */}
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={() => changeMonth(-1)}
                  className="p-2 rounded-lg bg-gray-700 text-gray-200 hover:bg-gray-600"
                  aria-label="Previous month"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <div className="text-center">
                  <p className="text-white font-semibold text-lg">
                    {new Date(viewYear, viewMonth, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </p>
                  <p className="text-sm text-gray-400">
                    Month total: <span className="text-orange-400 font-semibold">${monthTotal.toFixed(2)}</span>
                  </p>
                </div>
                <button
                  onClick={() => changeMonth(1)}
                  disabled={isCurrentMonth}
                  className="p-2 rounded-lg bg-gray-700 text-gray-200 hover:bg-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                  aria-label="Next month"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>

              {/* Calendar grid */}
              <div className="grid grid-cols-7 gap-1 text-center">
                {WEEKDAYS.map((w) => (
                  <div key={w} className="text-xs font-semibold text-gray-400 py-1">{w}</div>
                ))}
                {cells.map((d, i) => {
                  if (!d) return <div key={`blank-${i}`} />;
                  const k = keyFor(viewYear, viewMonth, d);
                  const isToday = k === todayKey;
                  const isFuture = k > todayKey;
                  const info = isToday ? todaySummary : byDay[k];
                  const hasActivity = info && info.totalRequests > 0;
                  const isSelected = k === selectedKey;

                  return (
                    <button
                      key={k}
                      disabled={isFuture}
                      onClick={() => setSelectedKey(isSelected ? null : k)}
                      className={[
                        'relative h-12 sm:h-14 rounded-lg flex flex-col items-center justify-center text-sm transition-colors',
                        isFuture ? 'text-gray-600 cursor-default' : 'text-gray-200 hover:bg-gray-600',
                        hasActivity && !isSelected ? 'bg-gray-700' : '',
                        isSelected ? 'bg-orange-600 text-white hover:bg-orange-600' : '',
                        isToday && !isSelected ? 'ring-2 ring-orange-400' : '',
                      ].join(' ')}
                    >
                      <span className={isToday ? 'font-bold' : ''}>{d}</span>
                      {hasActivity && (
                        <span className={`mt-1 w-2 h-2 rounded-full ${isSelected ? 'bg-white' : 'bg-green-400'}`} />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Legend */}
              <div className="flex flex-wrap gap-4 justify-center mt-3 text-xs text-gray-400">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-green-400" /> Sales that day
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded ring-2 ring-orange-400" /> Today
                </span>
              </div>

              {/* Selected day details */}
              {selectedKey && (
                <div className="mt-5 bg-gray-700 rounded-lg border border-gray-600 overflow-hidden">
                  <div className="p-4 flex items-center justify-between">
                    <div>
                      <p className="text-white font-semibold flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-orange-400" />
                        {prettyDate(selectedKey)}
                        {selectedKey === todayKey && (
                          <span className="text-xs bg-orange-600 text-white px-2 py-0.5 rounded-full">Today</span>
                        )}
                      </p>
                      <p className="text-gray-400 text-sm mt-1">{selected?.totalRequests || 0} request(s)</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-orange-400 font-semibold">Total Sold</p>
                      <p className="text-2xl font-bold text-white">${(selected?.totalSold || 0).toFixed(2)}</p>
                    </div>
                  </div>

                  {selected && selected.requests.length > 0 ? (
                    <div className="border-t border-gray-600 p-4 overflow-x-auto">
                      <h4 className="text-sm font-semibold text-orange-400 mb-3 flex items-center gap-2">
                        <CheckCircle className="w-4 h-4" />
                        Individual Requests
                      </h4>
                      <table className="w-full">
                        <thead className="bg-gray-600">
                          <tr>
                            <th className="px-3 py-2 text-left text-xs font-semibold text-orange-400">Time</th>
                            <th className="px-3 py-2 text-left text-xs font-semibold text-orange-400">Phone Number</th>
                            <th className="px-3 py-2 text-left text-xs font-semibold text-orange-400">Amount</th>
                            <th className="px-3 py-2 text-left text-xs font-semibold text-orange-400">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selected.requests.map((req) => (
                            <tr key={req.id} className="border-b border-gray-600">
                              <td className="px-3 py-2 text-sm text-gray-300">{req.timestamp}</td>
                              <td className="px-3 py-2 text-sm font-medium text-white">{req.phoneNumber}</td>
                              <td className="px-3 py-2 text-sm font-semibold text-orange-400">${(req.amount || 0).toFixed(2)}</td>
                              <td className="px-3 py-2">
                                {req.completed ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-700 text-green-100 rounded-full text-xs font-medium">
                                    <CheckCircle className="w-3 h-3" /> Complete
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center px-2 py-1 bg-yellow-700 text-yellow-100 rounded-full text-xs font-medium">
                                    Pending
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="border-t border-gray-600 p-6 text-center text-gray-400 text-sm">
                      No sales recorded for this day
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default HistoryCalendar;
