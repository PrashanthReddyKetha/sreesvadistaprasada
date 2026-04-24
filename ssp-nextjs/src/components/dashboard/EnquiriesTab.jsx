'use client';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { MessageSquare, ArrowLeft, RefreshCw, Send, CheckCircle } from 'lucide-react';
import api from '@/api';

const ENQ_STATUS_COLORS = {
  new:       { bg:'#EFF6FF', text:'#1D4ED8' },
  contacted: { bg:'#FFF8E1', text:'#B8860B' },
  resolved:  { bg:'#DCFCE7', text:'#166534' },
};

function EnqBadge({ status }) {
  const s = ENQ_STATUS_COLORS[status] || { bg:'#F3F4F6', text:'#374151' };
  return (
    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize"
      style={{ backgroundColor: s.bg, color: s.text }}>{status}</span>
  );
}

function EmptyEnquiries({ link }) {
  return (
    <div className="text-center py-12">
      <MessageSquare size={40} className="mx-auto mb-4 text-gray-300" />
      <p className="font-semibold mb-1" style={{ color: '#5C4B47' }}>No enquiries yet</p>
      <p className="text-sm mb-4" style={{ color: '#9C7B6B' }}>Have a question or special request? Get in touch with us.</p>
      <a href={link} className="text-sm font-semibold underline" style={{ color: '#800020' }}>Send an Enquiry</a>
    </div>
  );
}

export default function EnquiriesTab({ enquiries, reload }) {
  const [sub, setSub]               = useState('contact');
  const [selected, setSelected]     = useState(null);
  const [messages, setMessages]     = useState([]);
  const [msgLoading, setMsgLoading] = useState(false);
  const [replyText, setReplyText]   = useState('');
  const [sending, setSending]       = useState(false);
  const pollRef                     = useRef(null);
  const threadEndRef                = useRef(null);

  const list = sub === 'contact' ? (enquiries.contact || []) : (enquiries.catering || []);

  const openConversation = useCallback(async (type, enq) => {
    setSelected({ type, enq });
    setMessages([]);
    setReplyText('');
    setMsgLoading(true);
    try {
      const res = await api.get(`/enquiries/${type}/${enq.id}/messages`);
      setMessages(res.data);
      reload();
    } finally { setMsgLoading(false); }
  }, [reload]);

  useEffect(() => {
    threadEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!selected) { clearInterval(pollRef.current); return; }
    pollRef.current = setInterval(async () => {
      try {
        const res = await api.get(`/enquiries/${selected.type}/${selected.enq.id}/messages`);
        setMessages(res.data);
      } catch {}
    }, 8000);
    return () => clearInterval(pollRef.current);
  }, [selected]);

  const sendReply = async () => {
    if (!replyText.trim() || !selected) return;
    setSending(true);
    try {
      const res = await api.post(`/enquiries/${selected.type}/${selected.enq.id}/reply`, { text: replyText.trim() });
      setMessages(m => [...m, res.data]);
      setReplyText('');
      reload();
    } catch (e) {
      alert(e.response?.data?.detail || 'Failed to send reply');
    } finally { setSending(false); }
  };

  if (!selected) {
    return (
      <div className="space-y-4">
        <div className="flex gap-2">
          {[['contact','Contact Messages', enquiries.contact?.length||0],
            ['catering','Catering Enquiries', enquiries.catering?.length||0]].map(([key,label,count])=>(
            <button key={key} onClick={()=>setSub(key)}
              className="px-4 py-2 rounded-xl text-sm font-semibold transition-all"
              style={{ backgroundColor:sub===key?'#800020':'#FDFBF7', color:sub===key?'white':'#5C4B47',
                       border:sub===key?'none':'1px solid rgba(128,0,32,0.15)' }}>
              {label} ({count})
            </button>
          ))}
        </div>

        {list.length === 0 ? (
          <EmptyEnquiries link="/contact" />
        ) : (
          <div className="space-y-3">
            {list.map(enq => (
              <div key={enq.id}
                className="rounded-2xl p-4 cursor-pointer hover:shadow-md transition-shadow flex items-start gap-3"
                style={{ backgroundColor:'#FDFBF7', border:`1px solid ${enq.unread ? '#FCA5A5' : 'rgba(244,196,48,0.2)'}` }}
                onClick={() => openConversation(sub, enq)}>
                <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold text-sm"
                  style={{ backgroundColor:'#800020' }}>
                  {enq.name?.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-0.5">
                    <p className="font-semibold text-sm" style={{ color:'#3D2B1F' }}>{enq.name}</p>
                    <EnqBadge status={enq.status} />
                    {enq.unread > 0 && (
                      <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold text-white" style={{ backgroundColor:'#DC2626' }}>
                        {enq.unread} new
                      </span>
                    )}
                  </div>
                  {sub === 'contact' && (
                    <p className="text-xs font-medium mb-0.5" style={{ color:'#800020' }}>{enq.subject}</p>
                  )}
                  {sub === 'catering' && (
                    <p className="text-xs font-medium mb-0.5" style={{ color:'#800020' }}>
                      {enq.event_type} · {enq.guest_count} guests · {enq.event_date}
                    </p>
                  )}
                  <p className="text-xs line-clamp-1" style={{ color:'#9C7B6B' }}>
                    {sub === 'contact' ? enq.message : enq.additional_details || 'Catering enquiry'}
                  </p>
                </div>
                <span className="text-[10px] text-gray-400 whitespace-nowrap flex-shrink-0">
                  {new Date(enq.created_at).toLocaleDateString('en-GB', { day:'numeric', month:'short' })}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  const { type, enq } = selected;

  return (
    <div className="flex flex-col" style={{ minHeight:'60vh' }}>
      <div className="rounded-2xl p-4 mb-3 flex items-start gap-3"
        style={{ backgroundColor:'#FDFBF7', border:'1px solid rgba(244,196,48,0.2)' }}>
        <button onClick={() => setSelected(null)}
          className="p-2 rounded-xl hover:bg-[#800020]/10 transition-colors flex-shrink-0">
          <ArrowLeft size={18} style={{ color:'#800020' }} />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-bold" style={{ color:'#3D2B1F' }}>{enq.name}</p>
            <EnqBadge status={enq.status} />
          </div>
          {type === 'contact' && enq.subject && (
            <p className="text-sm font-medium mt-0.5" style={{ color:'#800020' }}>Re: {enq.subject}</p>
          )}
          {type === 'catering' && (
            <p className="text-xs mt-0.5" style={{ color:'#9C7B6B' }}>
              {enq.event_type} · {enq.guest_count} guests · {enq.event_date}
            </p>
          )}
        </div>
      </div>

      <div className="rounded-2xl p-4 mb-3 border-l-4" style={{ backgroundColor:'#FDFBF7', borderLeftColor:'#B8860B' }}>
        <p className="text-[10px] font-semibold uppercase tracking-wider mb-1.5" style={{ color:'#B8860B' }}>
          Your original message
        </p>
        {type === 'contact' ? (
          <p className="text-sm leading-relaxed" style={{ color:'#3D2B1F' }}>{enq.message}</p>
        ) : (
          <p className="text-sm" style={{ color:'#3D2B1F' }}>
            {enq.event_type} event for {enq.guest_count} guests on {enq.event_date}
            {enq.additional_details ? ` — ${enq.additional_details}` : ''}
          </p>
        )}
      </div>

      <div className="flex-1 rounded-2xl p-4 mb-3 overflow-y-auto space-y-3"
        style={{ backgroundColor:'#FDFBF7', border:'1px solid rgba(244,196,48,0.2)', maxHeight:'320px' }}>
        {msgLoading ? (
          <div className="flex justify-center py-8"><RefreshCw size={18} className="animate-spin text-gray-400" /></div>
        ) : messages.length === 0 ? (
          <p className="text-center text-sm py-8" style={{ color:'#9C7B6B' }}>
            No replies yet — we'll respond as soon as possible.
          </p>
        ) : (
          <>
            {messages.map(msg => {
              const isAdmin = msg.sender === 'admin';
              return (
                <div key={msg.id} className={`flex ${isAdmin ? 'justify-start' : 'justify-end'}`}>
                  <div className={`max-w-[78%] rounded-2xl px-4 py-2.5 ${isAdmin ? 'rounded-tl-sm' : 'rounded-tr-sm'}`}
                    style={{ backgroundColor: isAdmin ? '#F3F4F6' : '#800020', color: isAdmin ? '#1F2937' : 'white' }}>
                    <p className={`text-[10px] font-semibold mb-1 ${isAdmin ? 'text-gray-500' : 'text-[#F4C430]'}`}>
                      {msg.sender_name}
                    </p>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                    <p className={`text-[10px] mt-1.5 ${isAdmin ? 'text-gray-400' : 'text-white/60'}`}>
                      {new Date(msg.created_at).toLocaleString('en-GB', { day:'numeric', month:'short', hour:'2-digit', minute:'2-digit' })}
                    </p>
                  </div>
                </div>
              );
            })}
            <div ref={threadEndRef} />
          </>
        )}
      </div>

      <div className="rounded-2xl p-3 flex gap-2 items-end"
        style={{ backgroundColor:'#FDFBF7', border:'1px solid rgba(244,196,48,0.2)' }}>
        <textarea
          value={replyText}
          onChange={e => setReplyText(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendReply(); } }}
          placeholder="Reply to the team… (Enter to send)"
          rows={2}
          className="flex-1 resize-none rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#800020]/30"
          style={{ borderColor:'rgba(128,0,32,0.2)', color:'#3D2B1F', backgroundColor:'white' }}
        />
        <button onClick={sendReply} disabled={sending || !replyText.trim()}
          className="p-3 rounded-xl text-white flex-shrink-0 disabled:opacity-40"
          style={{ backgroundColor:'#800020' }}>
          {sending ? <RefreshCw size={16} className="animate-spin" /> : <Send size={16} />}
        </button>
      </div>

      {enq.status === 'resolved' && (
        <p className="text-xs text-center mt-2" style={{ color:'#166534' }}>
          <CheckCircle size={12} className="inline mr-1" /> This enquiry is resolved. Replying will reopen it automatically.
        </p>
      )}
    </div>
  );
}
