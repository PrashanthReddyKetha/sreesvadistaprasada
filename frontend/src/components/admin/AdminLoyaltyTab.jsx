import React, { useState, useEffect } from 'react';
import { Gift, Users, TrendingUp, AlertCircle, ChevronDown, ChevronUp, Plus, Minus } from 'lucide-react';
import api from '../../api';

const fmt = (iso) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
};
const fmtMoney = (n) => `£${Number(n || 0).toFixed(2)}`;

function StatCard({ icon: Icon, label, value, sub, color = '#800020' }) {
  return (
    <div className="bg-white rounded-xl border p-5 flex items-start gap-4" style={{ borderColor: 'rgba(128,0,32,0.12)' }}>
      <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${color}15` }}>
        <Icon size={20} style={{ color }} />
      </div>
      <div>
        <p className="text-2xl font-bold" style={{ color: '#2D2422' }}>{value}</p>
        <p className="text-xs font-semibold" style={{ color: '#5C4B47' }}>{label}</p>
        {sub && <p className="text-[11px] text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

function UserRow({ u, onSelect, selected }) {
  const position = u.loyalty_pending_reward ? 5 : (u.loyalty_order_count % 5);
  return (
    <div
      className="flex items-center justify-between px-4 py-3 cursor-pointer transition-colors hover:bg-[#800020]/5"
      style={{ borderBottom: '1px solid rgba(244,196,48,0.1)', backgroundColor: selected ? 'rgba(128,0,32,0.04)' : undefined }}
      onClick={onSelect}
    >
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold truncate" style={{ color: '#2D2422' }}>{u.name}</p>
        <p className="text-xs text-gray-400 truncate">{u.email}</p>
      </div>
      <div className="flex items-center gap-3 ml-4 flex-shrink-0">
        <div className="text-right">
          <p className="text-xs font-semibold" style={{ color: '#800020' }}>{u.loyalty_order_count} orders</p>
          <p className="text-[11px] text-gray-400">{u.rewards_earned ?? 0} earned · {u.rewards_redeemed ?? 0} redeemed</p>
        </div>
        {u.loyalty_pending_reward && (
          <span className="px-2 py-0.5 rounded-full text-[11px] font-bold flex-shrink-0"
            style={{ backgroundColor: '#FEF9C3', color: '#854D0E' }}>
            🎁 Ready
          </span>
        )}
        {!u.loyalty_pending_reward && position === 4 && (
          <span className="px-2 py-0.5 rounded-full text-[11px] font-bold flex-shrink-0"
            style={{ backgroundColor: 'rgba(128,0,32,0.08)', color: '#800020' }}>
            Almost!
          </span>
        )}
      </div>
    </div>
  );
}

function AdjustModal({ userId, userName, onClose, onDone }) {
  const [type, setType] = useState('add');
  const [amount, setAmount] = useState(1);
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!reason.trim()) { setError('Reason is required.'); return; }
    setLoading(true); setError('');
    try {
      await api.post('/admin/loyalty/adjust', { user_id: userId, type, amount: Number(amount), reason });
      onDone();
    } catch (e) {
      setError(e.response?.data?.detail || 'Failed to adjust.');
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative z-10 bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm space-y-4">
        <h3 className="font-bold text-base" style={{ color: '#800020', fontFamily: "'Playfair Display', serif" }}>
          Adjust loyalty — {userName}
        </h3>
        {error && <p className="text-xs p-2.5 rounded-lg" style={{ backgroundColor: '#FFF0F0', color: '#800020' }}>{error}</p>}
        <div className="space-y-3">
          <div>
            <label className="text-xs font-semibold block mb-1" style={{ color: '#5C4B47' }}>Action</label>
            <div className="flex gap-2">
              {['add', 'remove', 'grant'].map(t => (
                <button key={t} onClick={() => setType(t)}
                  className="flex-1 py-2 rounded-lg text-xs font-semibold capitalize transition-colors"
                  style={{
                    backgroundColor: type === t ? '#800020' : 'rgba(128,0,32,0.07)',
                    color: type === t ? 'white' : '#800020',
                  }}>
                  {t === 'grant' ? '🎁 Grant reward' : t === 'add' ? '+ Add orders' : '– Remove orders'}
                </button>
              ))}
            </div>
          </div>
          {type !== 'grant' && (
            <div>
              <label className="text-xs font-semibold block mb-1" style={{ color: '#5C4B47' }}>
                Orders to {type}
              </label>
              <div className="flex items-center gap-3">
                <button onClick={() => setAmount(a => Math.max(1, a - 1))}
                  className="w-8 h-8 rounded-full border flex items-center justify-center"
                  style={{ borderColor: 'rgba(128,0,32,0.3)', color: '#800020' }}>
                  <Minus size={13} />
                </button>
                <span className="text-lg font-bold w-8 text-center" style={{ color: '#2D2422' }}>{amount}</span>
                <button onClick={() => setAmount(a => a + 1)}
                  className="w-8 h-8 rounded-full border flex items-center justify-center"
                  style={{ borderColor: 'rgba(128,0,32,0.3)', color: '#800020' }}>
                  <Plus size={13} />
                </button>
              </div>
            </div>
          )}
          <div>
            <label className="text-xs font-semibold block mb-1" style={{ color: '#5C4B47' }}>Reason (required)</label>
            <textarea
              value={reason} onChange={e => setReason(e.target.value)}
              placeholder="e.g. Manual correction, goodwill gesture, data fix…"
              rows={2}
              className="w-full px-3 py-2 rounded-xl border-2 text-sm resize-none focus:outline-none"
              style={{ borderColor: 'rgba(128,0,32,0.2)', color: '#2D2422' }}
            />
          </div>
        </div>
        <div className="flex gap-3 pt-1">
          <button onClick={onClose}
            className="flex-1 py-2.5 text-sm rounded-xl border-2 font-semibold"
            style={{ borderColor: 'rgba(128,0,32,0.2)', color: '#800020' }}>
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={loading}
            className="flex-1 py-2.5 text-sm font-bold text-white rounded-xl disabled:opacity-60 transition-all hover:shadow-md"
            style={{ backgroundColor: '#800020' }}>
            {loading ? 'Saving…' : 'Apply'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminLoyaltyTab() {
  const [stats, setStats] = useState(null);
  const [pending, setPending] = useState([]);
  const [upcoming, setUpcoming] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState('pending'); // 'pending' | 'upcoming'
  const [selectedUser, setSelectedUser] = useState(null);
  const [userDetail, setUserDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [showAdjust, setShowAdjust] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [statsRes, pendingRes, upcomingRes] = await Promise.all([
        api.get('/admin/loyalty/stats'),
        api.get('/admin/loyalty/pending'),
        api.get('/admin/loyalty/upcoming'),
      ]);
      setStats(statsRes.data);
      setPending(pendingRes.data || []);
      setUpcoming(upcomingRes.data || []);
    } catch {}
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const loadUserDetail = async (userId) => {
    setDetailLoading(true); setUserDetail(null);
    try {
      const r = await api.get(`/admin/loyalty/user/${userId}`);
      setUserDetail(r.data);
    } catch {}
    finally { setDetailLoading(false); }
  };

  const handleSelectUser = (u) => {
    if (selectedUser?.id === u.id) { setSelectedUser(null); setUserDetail(null); return; }
    setSelectedUser(u);
    setShowHistory(false);
    loadUserDetail(u.id);
  };

  const handleAdjustDone = () => {
    setShowAdjust(false);
    load();
    if (selectedUser) loadUserDetail(selectedUser.id);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-6 h-6 border-2 border-[#800020]/30 border-t-[#800020] rounded-full animate-spin" />
      </div>
    );
  }

  const activeList = activeSection === 'pending' ? pending : upcoming;

  return (
    <div className="space-y-6">
      {showAdjust && selectedUser && (
        <AdjustModal
          userId={selectedUser.id}
          userName={selectedUser.name}
          onClose={() => setShowAdjust(false)}
          onDone={handleAdjustDone}
        />
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Loyalty members" value={stats?.total_members ?? 0} />
        <StatCard icon={Gift} label="Pending rewards" value={stats?.total_pending ?? 0} color="#B8860B" />
        <StatCard icon={TrendingUp} label="Rewards earned" value={stats?.total_rewards_earned ?? 0} color="#166534" />
        <StatCard icon={AlertCircle} label="Almost there (order 4)" value={stats?.total_upcoming ?? 0} color="#854D0E" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Left: user list */}
        <div className="bg-white rounded-xl border overflow-hidden" style={{ borderColor: 'rgba(128,0,32,0.12)' }}>
          {/* Section toggle */}
          <div className="flex border-b" style={{ borderColor: 'rgba(244,196,48,0.2)' }}>
            {[
              { id: 'pending', label: `🎁 Ready to redeem (${pending.length})` },
              { id: 'upcoming', label: `⏳ Almost there (${upcoming.length})` },
            ].map(s => (
              <button key={s.id} onClick={() => setActiveSection(s.id)}
                className="flex-1 py-3 text-xs font-semibold transition-colors"
                style={{
                  backgroundColor: activeSection === s.id ? 'rgba(128,0,32,0.06)' : 'white',
                  color: activeSection === s.id ? '#800020' : '#9CA3AF',
                  borderBottom: activeSection === s.id ? '2px solid #800020' : '2px solid transparent',
                }}>
                {s.label}
              </button>
            ))}
          </div>

          {activeList.length === 0 ? (
            <div className="text-center py-10 text-sm text-gray-400">
              {activeSection === 'pending' ? 'No pending rewards right now.' : 'No customers on order 4.'}
            </div>
          ) : (
            <div className="overflow-y-auto" style={{ maxHeight: '420px' }}>
              {activeList.map(u => (
                <UserRow key={u.id} u={u} selected={selectedUser?.id === u.id} onSelect={() => handleSelectUser(u)} />
              ))}
            </div>
          )}
        </div>

        {/* Right: selected user detail */}
        <div className="bg-white rounded-xl border overflow-hidden" style={{ borderColor: 'rgba(128,0,32,0.12)' }}>
          {!selectedUser ? (
            <div className="flex items-center justify-center h-full py-16 text-sm text-gray-400">
              Select a customer to view their loyalty profile
            </div>
          ) : (
            <div>
              <div className="px-5 py-4 border-b flex items-center justify-between" style={{ borderColor: 'rgba(244,196,48,0.2)' }}>
                <div>
                  <p className="font-bold text-sm" style={{ color: '#2D2422' }}>{selectedUser.name}</p>
                  <p className="text-xs text-gray-400">{selectedUser.email}</p>
                </div>
                <button
                  onClick={() => setShowAdjust(true)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors hover:bg-[#800020]/10"
                  style={{ color: '#800020', border: '1px solid rgba(128,0,32,0.25)' }}>
                  Adjust
                </button>
              </div>

              {detailLoading ? (
                <div className="flex items-center justify-center py-10">
                  <div className="w-5 h-5 border-2 border-[#800020]/30 border-t-[#800020] rounded-full animate-spin" />
                </div>
              ) : userDetail ? (
                <div className="px-5 py-4 space-y-4">
                  <div className="grid grid-cols-3 gap-3 text-center">
                    {[
                      ['Orders', userDetail.order_count],
                      ['Earned', userDetail.rewards_earned],
                      ['Redeemed', userDetail.rewards_redeemed],
                    ].map(([label, val]) => (
                      <div key={label} className="rounded-xl py-3" style={{ backgroundColor: 'rgba(128,0,32,0.05)' }}>
                        <p className="text-lg font-bold" style={{ color: '#800020' }}>{val ?? 0}</p>
                        <p className="text-[11px] text-gray-400">{label}</p>
                      </div>
                    ))}
                  </div>

                  {userDetail.pending_reward && (
                    <div className="rounded-xl px-4 py-3 text-sm font-semibold" style={{ backgroundColor: '#FEF9C3', color: '#854D0E' }}>
                      🎁 Free dish reward is pending — customer has been notified.
                    </div>
                  )}

                  {/* Qualifying order history */}
                  {userDetail.history?.length > 0 && (
                    <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'rgba(244,196,48,0.2)' }}>
                      <button
                        onClick={() => setShowHistory(v => !v)}
                        className="w-full flex items-center justify-between px-4 py-3 text-xs font-semibold"
                        style={{ color: '#2D2422' }}>
                        <span>Qualifying orders ({userDetail.history.length})</span>
                        {showHistory ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </button>
                      {showHistory && (
                        <div className="border-t divide-y" style={{ borderColor: 'rgba(244,196,48,0.15)' }}>
                          {userDetail.history.map((order, i) => (
                            <div key={order.id} className="flex items-center justify-between px-4 py-2.5 text-xs">
                              <div className="flex items-center gap-2">
                                <span className="w-5 h-5 rounded-full text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0"
                                  style={{ backgroundColor: '#800020' }}>
                                  {order.loyalty_order_number ?? i + 1}
                                </span>
                                <span className="text-gray-500">{fmt(order.created_at)}</span>
                              </div>
                              <span className="font-semibold" style={{ color: '#2D2422' }}>{fmtMoney(order.total)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Adjustment log */}
                  {userDetail.adjustments?.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold mb-2" style={{ color: '#5C4B47' }}>Manual adjustments</p>
                      <div className="space-y-1.5">
                        {userDetail.adjustments.map((a, i) => (
                          <div key={i} className="flex items-start justify-between text-xs">
                            <div>
                              <span className="font-semibold capitalize" style={{ color: a.type === 'remove' ? '#DC2626' : '#166534' }}>
                                {a.type === 'add' ? '+' : a.type === 'remove' ? '–' : '🎁'}{' '}
                                {a.type !== 'grant' ? `${a.amount} orders` : 'reward granted'}
                              </span>
                              <span className="text-gray-400 ml-2">{a.reason}</span>
                            </div>
                            <span className="text-gray-400 flex-shrink-0 ml-2">{fmt(a.created_at)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
