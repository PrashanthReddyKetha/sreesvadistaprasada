'use client';
import React, { useCallback, useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import api from '@/api';

/* Admin › Messages — everything the site has sent (or chosen not to send) by email, text and WhatsApp. Read-only. */

const P = '#800020';
const card = { boxShadow: '0 2px 12px rgba(0,0,0,0.06)' };
const CHANNEL = { email: 'Email', sms: 'Text message', whatsapp: 'WhatsApp' };
const KIND = { service: 'About an order or plan', marketing: 'Reminder or invitation', alert: 'To you, from the system' };
const OUTCOME = { sent: { label: 'Sent', color: '#2E7D32' }, skipped: { label: 'Not sent', color: '#8D6E00' }, failed: { label: 'Failed', color: '#B91C1C' } };
const when = (iso) => new Date(iso + (/[zZ]|[+-]\d\d:\d\d$/.test(iso) ? '' : 'Z')).toLocaleString('en-GB', { timeZone: 'Europe/London', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
const outcomeOf = (status) => (status || '').split(':')[0];
const reasonOf = (status) => { const r = (status || '').split(':')[1]; return r ? r.trim() : ''; };

export default function MessagesTab() {
  const [days, setDays] = useState(30);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try { setData((await api.get('/admin/messages', { params: { days } })).data); }
    catch { setError('Could not load the messages. Please try again.'); }
    finally { setLoading(false); }
  }, [days]);
  useEffect(() => { load(); }, [load]);

  if (loading && !data) return <p className="text-center text-gray-400 py-16">Loading…</p>;
  if (error) return <p className="text-center py-16" style={{ color: '#B91C1C' }}>{error} <button onClick={load} className="underline ml-2">Retry</button></p>;

  const total = (o) => data.summary.filter(s => s.outcome === o).reduce((n, s) => n + s.count, 0);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        {[7, 30, 90].map(d => (
          <button key={d} onClick={() => setDays(d)} className="px-3 py-1.5 rounded-full text-sm font-semibold border"
            style={days === d ? { backgroundColor: P, color: '#fff', borderColor: P } : { borderColor: '#e0d9d0', color: '#5C4B47' }}>Last {d} days</button>
        ))}
        <button onClick={load} className="p-2 rounded-lg border ml-auto" style={{ borderColor: '#e0d9d0' }} aria-label="Refresh"><RefreshCw size={15} className={loading ? 'animate-spin' : ''} /></button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[['Sent', total('sent')], ['Not sent', total('skipped')], ['Failed', total('failed')], ['Unsubscribed from email', data.unsubscribed], ['Stopped WhatsApp', data.whatsapp_opted_out]].map(([label, value]) => (
          <div key={label} className="bg-white rounded-xl p-4" style={card}>
            <p className="text-xs text-gray-500 uppercase tracking-wider">{label}</p>
            <p className="text-2xl font-bold mt-1" style={{ color: label === 'Failed' && value > 0 ? '#B91C1C' : P }}>{value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl p-5" style={card}>
        <h3 className="font-bold mb-2" style={{ fontFamily: "'Playfair Display', serif", color: P }}>Were the emails opened?</h3>
        {!data.email_reports?.connected ? (
          <p className="text-sm text-gray-600">Not connected yet. Your email provider (Resend) can report when an email is delivered, opened and clicked; it needs a one-time set-up in the Resend dashboard and one setting on the server. Until then this stays empty.</p>
        ) : data.email_reports.sent === 0 ? <p className="text-sm text-gray-400">Connected. No emails in this period yet.</p> : (
          <>
            <p className="text-sm text-gray-600 mb-3">{data.email_reports.sent} sent · {data.email_reports.delivered} delivered · {data.email_reports.opened} opened · {data.email_reports.clicked} clicked</p>
            <table className="w-full text-sm">
              <thead><tr className="text-left text-xs text-gray-500 uppercase tracking-wider">{['Email', 'Sent', 'Opened', 'Clicked'].map(h => <th key={h} className="py-1 pr-4 font-semibold">{h}</th>)}</tr></thead>
              <tbody>{data.email_reports.by_subject.map(b => (
                <tr key={b.subject} className="border-t" style={{ borderColor: '#f9f6ee' }}>
                  <td className="py-1.5 pr-4">{b.subject}</td><td className="py-1.5 pr-4">{b.sent}</td>
                  <td className="py-1.5 pr-4">{b.opened} ({b.sent ? Math.round((b.opened / b.sent) * 100) : 0}%)</td>
                  <td className="py-1.5 pr-4">{b.clicked} ({b.sent ? Math.round((b.clicked / b.sent) * 100) : 0}%)</td>
                </tr>
              ))}</tbody>
            </table>
          </>
        )}
      </div>

      <div className="bg-white rounded-xl overflow-hidden" style={card}>
        <h3 className="px-4 py-3 font-bold border-b" style={{ fontFamily: "'Playfair Display', serif", color: P, borderColor: '#f0ebe6' }}>By channel</h3>
        {data.summary.length === 0 ? <p className="text-center text-gray-400 py-8 text-sm">Nothing sent in this period.</p> : (
          <table className="w-full text-sm">
            <thead style={{ backgroundColor: '#FDFBF7' }}><tr>{['Channel', 'Type', 'Result', 'Messages'].map(h => <th key={h} className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>)}</tr></thead>
            <tbody>{data.summary.map((s, i) => (
              <tr key={i} className="border-t" style={{ borderColor: '#f9f6ee' }}>
                <td className="px-4 py-2 font-medium">{CHANNEL[s.channel] || s.channel}</td>
                <td className="px-4 py-2 text-gray-600">{KIND[s.kind] || s.kind}</td>
                <td className="px-4 py-2" style={{ color: (OUTCOME[s.outcome] || {}).color }}>{(OUTCOME[s.outcome] || { label: s.outcome }).label}</td>
                <td className="px-4 py-2 text-gray-600">{s.count}</td>
              </tr>
            ))}</tbody>
          </table>
        )}
      </div>

      <div className="bg-white rounded-xl overflow-hidden" style={card}>
        <h3 className="px-4 py-3 font-bold border-b" style={{ fontFamily: "'Playfair Display', serif", color: P, borderColor: '#f0ebe6' }}>Latest emails and text messages</h3>
        {data.messages.length === 0 ? <p className="text-center text-gray-400 py-8 text-sm">Nothing yet. Messages appear here from the day this screen was added.</p> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead style={{ backgroundColor: '#FDFBF7' }}><tr>{['When', 'Channel', 'To', 'Message', 'Type', 'Result'].map(h => <th key={h} className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>)}</tr></thead>
              <tbody>{data.messages.map((m, i) => {
                const o = OUTCOME[outcomeOf(m.status)] || { label: m.status, color: '#616161' };
                return (
                  <tr key={i} className="border-t align-top" style={{ borderColor: '#f9f6ee' }}>
                    <td className="px-4 py-2 text-gray-500 whitespace-nowrap">{when(m.at)}</td>
                    <td className="px-4 py-2">{CHANNEL[m.channel] || m.channel}</td>
                    <td className="px-4 py-2 text-gray-600 break-all">{m.to}</td>
                    <td className="px-4 py-2 text-gray-600">{m.subject || '—'}</td>
                    <td className="px-4 py-2 text-gray-500 text-xs">{KIND[m.kind] || m.kind}</td>
                    <td className="px-4 py-2 whitespace-nowrap" style={{ color: o.color }}>{o.label}{reasonOf(m.status) && <span className="block text-xs text-gray-400">{reasonOf(m.status)}</span>}</td>
                  </tr>
                );
              })}</tbody>
            </table>
          </div>
        )}
      </div>
      <p className="text-xs text-gray-400">
        Messages about an order or plan are always sent. Reminders and invitations carry an unsubscribe link and are not sent to anyone who has unsubscribed.
        This record is kept for 400 days.
      </p>
    </div>
  );
}
