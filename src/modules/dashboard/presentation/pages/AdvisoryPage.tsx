import { Layout } from '@/shared/ui/Layout';
import { Spinner } from '@/shared/ui/Spinner';
import { ReallocationAdvisory } from '../components/ReallocationAdvisory';
import { useActiveAssets } from '@/modules/portfolio/presentation/hooks/useAssets';
import { useAuthStore } from '@/modules/auth';
import { computeCategoryBreakdown, getRebalancingRecommendations } from '@/shared/utils/portfolioProjections';

export function AdvisoryPage() {
  const { data: assets = [], isLoading } = useActiveAssets();
  const user = useAuthStore((s) => s.user);

  if (!user) return null;

  const totalValue = assets.filter((a) => a.status === 'active').reduce((s, a) => s + a.currentValueIDR, 0);
  const breakdown = computeCategoryBreakdown(assets, user);
  const { score, advices } = getRebalancingRecommendations(breakdown, totalValue);

  return (
    <Layout>
      <div className="mb-6">
        <h1 style={{ color: 'var(--text-primary)', fontSize: '20px', fontWeight: 700, letterSpacing: 'var(--tracking-snug)' }}>Audit Rebalancing</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: 4 }}>
          Analisis kesesuaian alokasi portofolio dengan profil risiko {user.riskProfile.toUpperCase()}.
        </p>
      </div>
      {isLoading ? (
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      ) : (
        <ReallocationAdvisory
          score={score}
          breakdown={breakdown}
          advices={advices}
          totalValue={totalValue}
          riskProfileName={user.riskProfile}
        />
      )}
    </Layout>
  );
}
