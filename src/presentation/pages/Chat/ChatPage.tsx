import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Layout } from '@/presentation/components/ui/Layout';
import { RoboAdvisorChat } from '@/presentation/components/chat/RoboAdvisorChat';
import { useActiveAssets } from '@/presentation/hooks/useAssets';
import { useAuthStore } from '@/presentation/hooks/useAuth';
import { updateUserProfile } from '@/infrastructure/di/container';
import { AllocationTarget, RiskProfile } from '@/shared/types';
import { getAllocationTarget } from '@/shared/constants/allocationTargets';
import { ShieldCheck, PieChart, TrendingUp, Bot } from 'lucide-react';

const TOPICS = [
  { icon: <Bot size={14} strokeWidth={2} />, label: 'Kondisi portofolio' },
  { icon: <TrendingUp size={14} strokeWidth={2} />, label: 'Proyeksi CAGR & akumulasi' },
  { icon: <PieChart size={14} strokeWidth={2} />, label: 'Rebalancing & alokasi' },
  { icon: <ShieldCheck size={14} strokeWidth={2} />, label: 'Profil risiko investasi' },
];

export function ChatPage() {
  const { data: assets = [] } = useActiveAssets();
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const queryClient = useQueryClient();

  const handleUpdateRiskProfile = useCallback(
    async (riskProfile: RiskProfile) => {
      if (!user) return;
      const newAllocation = getAllocationTarget(riskProfile, user.investmentHorizon);
      await updateUserProfile.execute(user.id, { riskProfile, targetAllocation: newAllocation });
      const updated = { ...user, riskProfile, targetAllocation: newAllocation };
      setUser(updated);
      queryClient.invalidateQueries({ queryKey: ['portfolioSummary', user.id] });
    },
    [user, setUser, queryClient],
  );

  const handleUpdateTargetAllocation = useCallback(
    async (targetAllocation: AllocationTarget) => {
      if (!user) return;
      await updateUserProfile.execute(user.id, { targetAllocation });
      setUser({ ...user, targetAllocation });
      queryClient.invalidateQueries({ queryKey: ['portfolioSummary', user.id] });
    },
    [user, setUser, queryClient],
  );

  if (!user) return null;

  return (
    <Layout>
      <div className="mb-6">
        <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)', letterSpacing: 'var(--tracking-snug)' }}>
          Robo Advisor
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
          Konsultasikan portofolio dengan AI berbasis data Anda secara real-time.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[1fr_300px] gap-6">
        <RoboAdvisorChat
          assets={assets}
          user={user}
          onUpdateRiskProfile={handleUpdateRiskProfile}
          onUpdateTargetAllocation={handleUpdateTargetAllocation}
        />

        <div className="space-y-4">
          {/* Service topics */}
          <div
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: '16px', padding: '20px' }}
          >
            <h4 className="text-xs font-semibold uppercase mb-4" style={{ color: 'var(--text-muted)', letterSpacing: 'var(--tracking-caps)' }}>
              Topik Layanan
            </h4>
            <div className="space-y-3">
              {TOPICS.map(({ icon, label }) => (
                <div key={label} className="flex items-center gap-3">
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: 'var(--bg-raised)', color: 'var(--blue-400)' }}
                  >
                    {icon}
                  </div>
                  <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Current profile card */}
          <div
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: '16px', padding: '20px' }}
          >
            <h4 className="text-xs font-semibold uppercase mb-4" style={{ color: 'var(--text-muted)', letterSpacing: 'var(--tracking-caps)' }}>
              Profil Anda
            </h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Profil Risiko</span>
                <span
                  className="text-xs font-semibold px-2 py-0.5 rounded-full capitalize"
                  style={{ background: 'var(--blue-tint)', color: 'var(--blue-300)', border: '1px solid rgba(77,124,255,0.2)' }}
                >
                  {user.riskProfile}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Horizon</span>
                <span className="text-xs font-semibold capitalize" style={{ color: 'var(--text-secondary)' }}>
                  {user.investmentHorizon}
                </span>
              </div>
              <div className="pt-2 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
                <p className="text-xs mb-2" style={{ color: 'var(--text-muted)' }}>Target Alokasi</p>
                {(Object.entries(user.targetAllocation) as [string, number][])
                  .filter(([, v]) => v > 0)
                  .sort(([, a], [, b]) => b - a)
                  .map(([cat, pct]) => (
                    <div key={cat} className="flex items-center justify-between mb-1">
                      <span className="text-xs capitalize" style={{ color: 'var(--text-secondary)' }}>{cat.replace('_', ' ')}</span>
                      <div className="flex items-center gap-2">
                        <div
                          className="h-1.5 rounded-full"
                          style={{ width: `${pct}px`, maxWidth: 60, background: 'var(--blue-400)', opacity: 0.7 }}
                        />
                        <span className="text-xs font-mono" style={{ color: 'var(--text-primary)' }}>{pct}%</span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>

          {/* AI note */}
          <p className="text-xs text-center px-2" style={{ color: 'var(--text-muted)', lineHeight: 'var(--leading-relaxed)' }}>
            Perubahan profil & alokasi hanya diterapkan setelah Anda mengonfirmasi saran AI.
          </p>
        </div>
      </div>
    </Layout>
  );
}
