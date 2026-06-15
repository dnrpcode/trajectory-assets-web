import { useState, useRef, useEffect } from 'react';
import { Bot, Send } from 'lucide-react';
import { Asset } from '../../../domain/entities/Asset';
import { User } from '../../../domain/entities/User';
import { computeCategoryBreakdown, getRebalancingRecommendations } from '../../../shared/utils/portfolioProjections';
import { formatCurrencyCompact } from '../../../shared/utils/formatCurrency';

interface Props {
  assets: Asset[];
  user: User;
}

interface Message {
  id: string;
  role: 'user' | 'robo';
  text: string;
  timestamp: Date;
}

const QUICK_PROMPTS = [
  'Bagaimana kondisi portofolio saya?',
  'Apa rekomendasi rebalancing?',
  'Jelaskan profil risiko saya',
  'Estimasi proyeksi CAGR saya',
];

function buildWelcome(user: User): string {
  return `Halo, ${user.displayName?.split(' ')[0] ?? 'Investor'}! 👋 Saya Robo Advisor Trajectory. Saat ini profil risiko Anda adalah **${user.riskProfile}** dengan horizon investasi **${user.investmentHorizon}**. Tanyakan apa saja seputar portofolio, rebalancing, atau proyeksi investasi Anda.`;
}

function processQuery(query: string, assets: Asset[], user: User): string {
  const activeAssets = assets.filter((a) => a.status === 'active');
  const totalValue = activeAssets.reduce((s, a) => s + a.currentValueIDR, 0);

  const q = query.toLowerCase();

  if (q.includes('kondisi') || q.includes('overview') || q.includes('ringkasan') || q.includes('summary')) {
    if (totalValue === 0) {
      return 'Portofolio Anda masih kosong. Mulai dengan menambah posisi investasi pertama Anda di halaman Portfolio.';
    }
    const topAsset = [...activeAssets].sort((a, b) => b.currentValueIDR - a.currentValueIDR)[0];
    const unrealized = activeAssets.reduce((s, a) => s + a.unrealizedGainIDR, 0);
    const unrealizedPct = totalValue > 0 ? (unrealized / activeAssets.reduce((s, a) => s + a.totalCostBasisIDR, 0)) * 100 : 0;
    return `Portofolio Anda saat ini bernilai **${formatCurrencyCompact(totalValue)}** dengan ${activeAssets.length} aset aktif. Unrealized gain/loss: **${unrealizedPct >= 0 ? '+' : ''}${unrealizedPct.toFixed(2)}%** (${formatCurrencyCompact(unrealized)}). Aset terbesar: **${topAsset?.assetName ?? '-'}** senilai ${formatCurrencyCompact(topAsset?.currentValueIDR ?? 0)}.`;
  }

  if (q.includes('rebalancing') || q.includes('alokasi') || q.includes('distribusi') || q.includes('rekomendasi')) {
    if (totalValue === 0) {
      return 'Belum ada aset aktif untuk dianalisis. Tambahkan posisi investasi terlebih dahulu.';
    }
    const breakdown = computeCategoryBreakdown(assets, user);
    const { score, advices } = getRebalancingRecommendations(breakdown, totalValue);
    if (advices.length === 0) {
      return `Skor rebalancing Anda **${score}/100** — portofolio Anda sudah cukup seimbang dengan profil risiko ${user.riskProfile}. Pertahankan alokasi saat ini dan lakukan review bulanan.`;
    }
    const topAdvice = advices[0];
    return `Skor rebalancing Anda **${score}/100**. Rekomendasi utama: ${topAdvice.description} Total ada ${advices.length} rekomendasi — lihat halaman Rebalancing untuk detail lengkap.`;
  }

  if (q.includes('profil risiko') || q.includes('risk profile') || q.includes('konservatif') || q.includes('moderat') || q.includes('agresif')) {
    const desc: Record<string, string> = {
      conservative: 'Profil Konservatif mengutamakan keamanan modal. Alokasi lebih besar ke obligasi, reksa dana pendapatan tetap, dan emas. Cocok untuk investor yang tidak suka volatilitas tinggi.',
      moderate: 'Profil Moderat menyeimbangkan antara pertumbuhan dan stabilitas. Kombinasi saham, reksa dana campuran, dan obligasi. Volatilitas sedang dengan potensi return menengah.',
      aggressive: 'Profil Agresif mengejar return maksimal dengan toleransi risiko tinggi. Porsi saham dan kripto lebih besar. Cocok untuk investor jangka panjang yang siap dengan fluktuasi besar.',
    };
    return `Profil risiko Anda saat ini: **${user.riskProfile}** (horizon: ${user.investmentHorizon}). ${desc[user.riskProfile] ?? ''} Ubah profil risiko kapan saja di halaman Pengaturan.`;
  }

  if (q.includes('cagr') || q.includes('proyeksi') || q.includes('pertumbuhan') || q.includes('simulasi')) {
    if (totalValue === 0) {
      return 'Belum ada data portofolio untuk menghitung proyeksi CAGR. Tambahkan aset terlebih dahulu.';
    }
    const defaultRate = 8.5;
    const optimistic = Math.min(40, defaultRate * 1.5).toFixed(1);
    const pessimistic = Math.max(2, defaultRate * 0.5).toFixed(1);
    return `Berdasarkan kontribusi bulanan Anda, proyeksi CAGR estimasi base rate sekitar **${defaultRate}%/tahun**. Skenario optimis: ~${optimistic}%/tahun, pesimis: ~${pessimistic}%/tahun. Kunjungi halaman Simulasi CAGR untuk menyesuaikan parameter dan melihat grafik proyeksi lengkap.`;
  }

  if (q.includes('saham') || q.includes('reksa dana') || q.includes('emas') || q.includes('kripto') || q.includes('obligasi')) {
    const breakdown = computeCategoryBreakdown(assets, user);
    const matches = breakdown.filter((b) => q.includes(b.label.toLowerCase()) || q.includes(b.category));
    if (matches.length > 0) {
      const cat = matches[0];
      return `Alokasi **${cat.label}** Anda saat ini **${cat.actualPercentage.toFixed(1)}%** (target: ${cat.targetPercentage}%). Gap: ${cat.gap > 0 ? '+' : ''}${cat.gap.toFixed(1)}%. ${Math.abs(cat.gap) > 3 ? (cat.gap > 0 ? 'Kategori ini overweight — pertimbangkan pengurangan.' : 'Kategori ini underweight — pertimbangkan penambahan.') : 'Alokasi sudah mendekati target.'}`;
    }
  }

  return `Maaf, saya belum bisa menjawab pertanyaan tersebut secara spesifik. Coba tanyakan tentang: kondisi portofolio, rekomendasi rebalancing, profil risiko Anda, atau proyeksi CAGR. Gunakan tombol cepat di bawah untuk memulai.`;
}

export function RoboAdvisorChat({ assets, user }: Props) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '0',
      role: 'robo',
      text: buildWelcome(user),
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const send = (text: string) => {
    if (!text.trim()) return;
    const userMsg: Message = { id: Date.now().toString(), role: 'user', text: text.trim(), timestamp: new Date() };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);
    setTimeout(() => {
      const reply = processQuery(text, assets, user);
      const roboMsg: Message = { id: (Date.now() + 1).toString(), role: 'robo', text: reply, timestamp: new Date() };
      setMessages((prev) => [...prev, roboMsg]);
      setIsTyping(false);
    }, 700);
  };

  const handleKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send(input);
    }
  };

  const renderText = (text: string) => {
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i}>{part.slice(2, -2)}</strong>;
      }
      return <span key={i}>{part}</span>;
    });
  };

  return (
    <div
      className="flex flex-col rounded-3xl overflow-hidden"
      style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', height: '520px' }}
    >
      <div
        className="flex items-center gap-3 px-5 py-4 border-b flex-shrink-0"
        style={{ background: 'var(--bg-raised)', borderColor: 'var(--border-subtle)' }}
      >
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center"
          style={{ background: 'var(--blue-tint-2)', border: '1px solid rgba(77,124,255,0.3)' }}
        >
          <Bot size={20} strokeWidth={2} style={{ color: 'var(--ai-accent)' }} />
        </div>
        <div>
          <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Robo Advisor</p>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Berbasis data portofolio Anda</p>
        </div>
        <div
          className="ml-auto text-xs px-2 py-1 rounded-full"
          style={{ background: 'var(--gain-tint)', color: 'var(--gain-400)', border: '1px solid rgba(15,186,130,0.22)' }}
        >
          Online
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className="max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed"
              style={
                msg.role === 'user'
                  ? { background: 'var(--blue-500)', color: 'var(--text-on-accent)', borderBottomRightRadius: '4px' }
                  : { background: 'var(--bg-raised)', border: '1px solid var(--border-default)', color: 'var(--text-primary)', borderBottomLeftRadius: '4px', lineHeight: 'var(--leading-relaxed)' }
              }
            >
              {renderText(msg.text)}
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start">
            <div
              className="rounded-2xl px-4 py-3 flex items-center gap-1.5"
              style={{ background: 'var(--bg-raised)', border: '1px solid var(--border-default)', borderBottomLeftRadius: '4px' }}
            >
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="w-1.5 h-1.5 rounded-full animate-bounce"
                  style={{ background: 'var(--text-muted)', animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="flex-shrink-0 px-4 pb-3">
        <div className="flex gap-2 mb-3 flex-wrap">
          {QUICK_PROMPTS.map((prompt) => (
            <button
              key={prompt}
              onClick={() => send(prompt)}
              className="text-xs px-3 py-1.5 rounded-full transition-opacity hover:opacity-80"
              style={{ background: 'var(--blue-tint)', color: 'var(--blue-300)', border: '1px solid rgba(77,124,255,0.22)' }}
            >
              {prompt}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            className="flex-1 rounded-xl text-sm px-4 py-2.5 outline-none transition-colors"
            style={{ background: 'var(--bg-raised)', border: '1px solid var(--border-default)', color: 'var(--text-primary)' }}
            placeholder="Ketik pertanyaan..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKey}
          />
          <button
            onClick={() => send(input)}
            disabled={!input.trim() || isTyping}
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-opacity disabled:opacity-40"
            style={{ background: 'var(--blue-500)', color: '#fff' }}
          >
            <Send size={16} strokeWidth={2} />
          </button>
        </div>
      </div>
    </div>
  );
}
