import { useState, useCallback } from 'react';
import { Asset } from '../../domain/entities/Asset';
import { User } from '../../domain/entities/User';
import { AllocationTarget, RiskProfile } from '../../shared/types';
import { formatCurrencyCompact } from '../../shared/utils/formatCurrency';
import { computeCategoryBreakdown, getRebalancingRecommendations } from '../../shared/utils/portfolioProjections';
import { CATEGORY_LABELS } from '../../shared/constants/categories';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface PendingAction {
  type: 'updateRiskProfile' | 'updateTargetAllocation';
  riskProfile?: RiskProfile;
  targetAllocation?: AllocationTarget;
  summary: string;
}

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-haiku-4-5-20251001';

function buildSystemPrompt(assets: Asset[], user: User): string {
  const activeAssets = assets.filter((a) => a.status === 'active');
  const totalValue = activeAssets.reduce((s, a) => s + a.currentValueIDR, 0);
  const totalCost = activeAssets.reduce((s, a) => s + a.totalCostBasisIDR, 0);
  const unrealizedGain = totalValue - totalCost;
  const unrealizedGainPct = totalCost > 0 ? (unrealizedGain / totalCost) * 100 : 0;

  const breakdown = computeCategoryBreakdown(assets, user);
  const { score, advices } = getRebalancingRecommendations(breakdown, totalValue);

  const assetList = activeAssets
    .sort((a, b) => b.currentValueIDR - a.currentValueIDR)
    .map(
      (a) =>
        `- ${a.assetName}${a.ticker ? ` (${a.ticker})` : ''}: ${formatCurrencyCompact(a.currentValueIDR)} | gain ${a.unrealizedGainPct >= 0 ? '+' : ''}${a.unrealizedGainPct.toFixed(1)}% | platform: ${a.platform}`,
    )
    .join('\n');

  const allocationList = breakdown
    .map(
      (b) =>
        `- ${CATEGORY_LABELS[b.category]}: aktual ${b.actualPercentage.toFixed(1)}% vs target ${b.targetPercentage}% (gap: ${b.gap > 0 ? '+' : ''}${b.gap.toFixed(1)}%)`,
    )
    .join('\n');

  const allocationJson = JSON.stringify(user.targetAllocation, null, 2);

  return `Kamu adalah Robo Advisor Trajectory, asisten keuangan pribadi berbahasa Indonesia yang cerdas dan ramah. Kamu membantu investor retail Indonesia menganalisis dan mengoptimalkan portofolio mereka.

## Data Portofolio User Saat Ini

**Profil:**
- Nama: ${user.displayName}
- Profil Risiko: ${user.riskProfile}
- Horizon Investasi: ${user.investmentHorizon}

**Nilai Portofolio:**
- Total Nilai: ${formatCurrencyCompact(totalValue)}
- Unrealized Gain/Loss: ${unrealizedGainPct >= 0 ? '+' : ''}${unrealizedGainPct.toFixed(1)}% (${formatCurrencyCompact(unrealizedGain)})
- Skor Rebalancing: ${score}/100

**Aset Aktif (${activeAssets.length} aset):**
${assetList || '(belum ada aset)'}

**Alokasi Aktual vs Target:**
${allocationList || '(belum ada data)'}

**Target Alokasi Saat Ini (JSON):**
${allocationJson}

**Rekomendasi Rebalancing:**
${advices.length > 0 ? advices.map((a) => `- ${a.description}`).join('\n') : '- Portofolio sudah cukup seimbang'}

## Kemampuan Kamu

Kamu bisa:
1. Menganalisis kondisi portofolio dan memberikan saran
2. Menjelaskan konsep investasi
3. **Merekomendasikan perubahan profil risiko** (conservative/moderate/aggressive)
4. **Merekomendasikan perubahan target alokasi** (persentase per kategori)

## Format Respons untuk Aksi

Jika user ingin mengubah profil risiko atau target alokasi, SELALU:
1. Jelaskan dulu alasan dan implikasi perubahan tersebut
2. Di AKHIR respons, tambahkan blok JSON action dengan format tepat ini:

Untuk update profil risiko:
\`\`\`action
{"type":"updateRiskProfile","riskProfile":"moderate","summary":"Ubah profil risiko dari ${user.riskProfile} ke moderate"}
\`\`\`

Untuk update target alokasi (semua 7 kategori HARUS ada dan HARUS total 100%):
\`\`\`action
{"type":"updateTargetAllocation","targetAllocation":{"saham":40,"reksa_dana":20,"obligasi_sbn":15,"emas":10,"kripto":10,"cash":5,"lainnya":0},"summary":"Deskripsi singkat perubahan alokasi"}
\`\`\`

PENTING:
- Hanya tambahkan blok action jika user MEMINTA perubahan atau kamu sangat yakin perlu diubah
- Total persentase targetAllocation HARUS tepat 100%
- Nilai tidak boleh negatif
- Jelaskan DULU sebelum action, jangan langsung action
- Jika user belum konfirmasi, JANGAN tambahkan action
- Gunakan bahasa Indonesia yang natural dan mudah dipahami
- Jawab singkat dan to the point, maksimal 3-4 paragraf kecuali diminta detail`;
}

function parseActionFromResponse(content: string): { text: string; action: PendingAction | null } {
  const actionRegex = /```action\s*([\s\S]*?)```/;
  const match = content.match(actionRegex);

  if (!match) return { text: content, action: null };

  const cleanText = content.replace(actionRegex, '').trim();

  try {
    const parsed = JSON.parse(match[1].trim());

    if (parsed.type === 'updateRiskProfile' && parsed.riskProfile) {
      return {
        text: cleanText,
        action: {
          type: 'updateRiskProfile',
          riskProfile: parsed.riskProfile as RiskProfile,
          summary: parsed.summary ?? `Ubah profil risiko ke ${parsed.riskProfile}`,
        },
      };
    }

    if (parsed.type === 'updateTargetAllocation' && parsed.targetAllocation) {
      const total = Object.values(parsed.targetAllocation as Record<string, number>).reduce((s, v) => s + v, 0);
      if (Math.abs(total - 100) > 0.5) return { text: cleanText, action: null };
      return {
        text: cleanText,
        action: {
          type: 'updateTargetAllocation',
          targetAllocation: parsed.targetAllocation as AllocationTarget,
          summary: parsed.summary ?? 'Ubah target alokasi',
        },
      };
    }
  } catch {
    // JSON parse failed
  }

  return { text: cleanText, action: null };
}

export function useClaudeAdvisor(assets: Asset[], user: User) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const [error, setError] = useState<string | null>(null);

  const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY as string;
  const hasApiKey = apiKey && apiKey !== 'your_anthropic_api_key_here';

  const sendMessage = useCallback(
    async (userText: string) => {
      if (!userText.trim() || isLoading) return;

      const userMsg: ChatMessage = {
        id: Date.now().toString(),
        role: 'user',
        content: userText.trim(),
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMsg]);
      setIsLoading(true);
      setError(null);
      setPendingAction(null);

      const historyForApi = [...messages, userMsg].map((m) => ({
        role: m.role,
        content: m.content,
      }));

      try {
        const response = await fetch(ANTHROPIC_API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
            'anthropic-dangerous-direct-browser-access': 'true',
          },
          body: JSON.stringify({
            model: MODEL,
            max_tokens: 1024,
            system: buildSystemPrompt(assets, user),
            messages: historyForApi,
          }),
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error((errData as { error?: { message?: string } }).error?.message ?? `API error ${response.status}`);
        }

        const data = await response.json() as { content: { type: string; text: string }[] };
        const rawContent = data.content.find((c) => c.type === 'text')?.text ?? '';

        const { text, action } = parseActionFromResponse(rawContent);

        const assistantMsg: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: text,
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, assistantMsg]);
        if (action) setPendingAction(action);
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : 'Gagal terhubung ke AI';
        setError(errMsg);
        const errMsgObj: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: `Maaf, terjadi kesalahan: ${errMsg}. Coba lagi dalam beberapa saat.`,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errMsgObj]);
      } finally {
        setIsLoading(false);
      }
    },
    [messages, assets, user, apiKey, isLoading],
  );

  const dismissAction = useCallback(() => setPendingAction(null), []);

  return {
    messages,
    isLoading,
    pendingAction,
    error,
    hasApiKey,
    sendMessage,
    dismissAction,
  };
}
