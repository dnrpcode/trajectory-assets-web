import { Layout } from '@/presentation/components/ui/Layout';
import { RoboAdvisorChat } from '@/presentation/components/chat/RoboAdvisorChat';
import { useActiveAssets } from '@/presentation/hooks/useAssets';
import { useAuthStore } from '@/presentation/hooks/useAuth';

export function ChatPage() {
  const { data: assets = [] } = useActiveAssets();
  const user = useAuthStore((s) => s.user);

  if (!user) return null;

  return (
    <Layout>
      <div className="mb-6">
        <h1 style={{ color: 'var(--text-primary)', fontSize: '20px', fontWeight: 700 }}>Robo Advisor</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: 4 }}>
          Konsultasikan portofolio dengan asisten AI berbasis data Anda.
        </p>
      </div>
      <div className="grid gap-6" style={{ gridTemplateColumns: '1fr 340px' }}>
        <RoboAdvisorChat assets={assets} user={user} />
        <div
          style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: '16px', padding: '24px' }}
        >
          <h4 style={{ color: 'var(--text-primary)', fontSize: '13px', fontWeight: 600, marginBottom: 12 }}>Topik Layanan</h4>
          <ul style={{ color: 'var(--text-secondary)', fontSize: '12px', lineHeight: 'var(--leading-relaxed)', listStyle: 'disc', paddingLeft: 16 }}>
            <li>Deviasi overweight/underweight kategori</li>
            <li>Rekomendasi rebalancing taktis</li>
            <li>Proyeksi CAGR dan akumulasi kekayaan</li>
            <li>Penjelasan profil risiko investasi</li>
          </ul>
        </div>
      </div>
    </Layout>
  );
}
