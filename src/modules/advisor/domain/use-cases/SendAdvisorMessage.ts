import { IAIAdvisorRepository } from "../repositories/IAIAdvisorRepository";
import {
  AdvisorMessage,
  AdvisorAction,
  AdvisorResponse,
} from "../entities/AdvisorConversation";
import { Asset } from "@/modules/portfolio/domain/entities/Asset";
import { User } from "@/modules/user/domain/entities/User";
import { AllocationTarget, RiskProfile } from "@/shared/types";
import { formatCurrencyCompact } from "@/shared/utils/formatCurrency";
import {
  computeCategoryBreakdown,
  getRebalancingRecommendations,
} from "@/shared/utils/portfolioProjections";
import { CATEGORY_LABELS } from "@/shared/constants/categories";

export interface SendAdvisorMessageInput {
  assets: Asset[];
  user: User;
  history: AdvisorMessage[];
  userMessage: string;
}

const VALID_RISK_PROFILES: ReadonlySet<string> = new Set(['conservative', 'moderate', 'aggressive']);

function sanitize(value: string, maxLen = 100): string {
  return value.replace(/[`\n\r]/g, ' ').slice(0, maxLen);
}

export class SendAdvisorMessage {
  constructor(private aiRepo: IAIAdvisorRepository) {}

  isAvailable(): boolean {
    return this.aiRepo.isAvailable();
  }

  async execute(input: SendAdvisorMessageInput): Promise<AdvisorResponse> {
    const { assets, user, history, userMessage } = input;
    const systemPrompt = this.buildSystemPrompt(assets, user);
    const rawContent = await this.aiRepo.sendMessage(
      systemPrompt,
      history,
      userMessage,
    );
    return this.parseActionFromResponse(rawContent, user);
  }

  private buildSystemPrompt(assets: Asset[], user: User): string {
    const activeAssets = assets.filter((a) => a.status === "active");
    const totalValue = activeAssets.reduce((s, a) => s + a.currentValueIDR, 0);
    const totalCost = activeAssets.reduce((s, a) => s + a.totalCostBasisIDR, 0);
    const unrealizedGain = totalValue - totalCost;
    const unrealizedGainPct =
      totalCost > 0 ? (unrealizedGain / totalCost) * 100 : 0;

    const breakdown = computeCategoryBreakdown(assets, user);
    const { score, advices } = getRebalancingRecommendations(
      breakdown,
      totalValue,
    );

    const assetList = activeAssets
      .sort((a, b) => b.currentValueIDR - a.currentValueIDR)
      .map(
        (a) =>
          `- ${sanitize(a.assetName)}${a.ticker ? ` (${sanitize(a.ticker, 20)})` : ""}: ${formatCurrencyCompact(a.currentValueIDR)} | gain ${a.unrealizedGainPct >= 0 ? "+" : ""}${a.unrealizedGainPct.toFixed(1)}% | platform: ${sanitize(a.platform, 50)}`,
      )
      .join("\n");

    const allocationList = breakdown
      .map(
        (b) =>
          `- ${CATEGORY_LABELS[b.category]}: aktual ${b.actualPercentage.toFixed(1)}% vs target ${b.targetPercentage}% (gap: ${b.gap > 0 ? "+" : ""}${b.gap.toFixed(1)}%)`,
      )
      .join("\n");

    const allocationJson = JSON.stringify(user.targetAllocation, null, 2);

    return `Kamu adalah Robo Advisor Trajectory, asisten keuangan pribadi berbahasa Indonesia yang cerdas dan ramah. Kamu membantu investor retail Indonesia menganalisis dan mengoptimalkan portofolio mereka.

## Data Portofolio User Saat Ini

**Profil:**
- Nama: ${sanitize(user.displayName ?? '', 80)}
- Profil Risiko: ${sanitize(user.riskProfile ?? '', 20)}
- Horizon Investasi: ${user.investmentHorizon}

**Nilai Portofolio:**
- Total Nilai: ${formatCurrencyCompact(totalValue)}
- Unrealized Gain/Loss: ${unrealizedGainPct >= 0 ? "+" : ""}${unrealizedGainPct.toFixed(1)}% (${formatCurrencyCompact(unrealizedGain)})
- Skor Rebalancing: ${score}/100

**Aset Aktif (${activeAssets.length} aset):**
${assetList || "(belum ada aset)"}

**Alokasi Aktual vs Target:**
${allocationList || "(belum ada data)"}

**Target Alokasi Saat Ini (JSON):**
${allocationJson}

**Rekomendasi Rebalancing:**
${advices.length > 0 ? advices.map((a) =>
  a.type === "increase"
    ? `- Posisi ${a.categoryLabel} saat ini ${a.actualPct.toFixed(1)}%, di bawah target ideal (${a.targetPct}%). Rekomendasi: tambah sekitar Rp ${a.actionAmount.toLocaleString("id-ID")}.`
    : `- ${a.categoryLabel} overweight di ${a.actualPct.toFixed(1)}% (target ${a.targetPct}%). Pertimbangkan take profit sekitar Rp ${a.actionAmount.toLocaleString("id-ID")} untuk menjaga profil risiko.`
).join("\n") : "- Portofolio sudah cukup seimbang"}

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

## Format Output yang Harus Diikuti

1. **Jangan gunakan tabel atau format kompleks** — output harus mudah dibaca di chat
2. **Gunakan struktur simpel:**
   - Satu paragraf pembukaan (apa yang user tanya)
   - Bullet points untuk insight penting (max 5 poin)
   - Satu paragraf kesimpulan dengan rekomendasi
3. **Hindari daftar panjang** — ringkas menjadi 3-4 item utama
4. **Gunakan emoji minimal** untuk visual (✓, ✕, ↑, ↓)
5. **Persentase dan nominal cukup inline** — jangan tabel

Contoh format BAIK:
"Emas Anda 28.8% (target 10%), berarti overweight Rp 5.6jt. Sebaiknya ambil profit sebagian untuk beli saham & obligasi yang masih kurang. Dengan begitu: (✓ risiko turun) (✓ diversifikasi meningkat) (✓ cash ada untuk opportunity buying)."

Contoh format BURUK:
[tabel panjang dengan banyak kolom dan baris]

PENTING:
- Hanya tambahkan blok action jika user MEMINTA perubahan atau kamu sangat yakin perlu diubah
- Total persentase targetAllocation HARUS tepat 100%
- Nilai tidak boleh negatif
- Jelaskan DULU sebelum action, jangan langsung action
- Jika user belum konfirmasi, JANGAN tambahkan action
- Gunakan bahasa Indonesia yang natural dan mudah dipahami
- Jawab singkat dan to the point, maksimal 2-3 paragraf (hindari detail panjang)`;
  }

  private parseActionFromResponse(
    content: string,
    user: User,
  ): AdvisorResponse {
    const actionRegex = /```action\s*([\s\S]*?)```/;
    const match = content.match(actionRegex);

    if (!match) return { text: content, action: null };

    const cleanText = content.replace(actionRegex, "").trim();

    try {
      const parsed = JSON.parse(match[1].trim()) as {
        type: string;
        riskProfile?: string;
        targetAllocation?: Record<string, number>;
        summary?: string;
      };

      if (parsed.type === "updateRiskProfile" && parsed.riskProfile && VALID_RISK_PROFILES.has(parsed.riskProfile)) {
        const action: AdvisorAction = {
          type: "updateRiskProfile",
          riskProfile: parsed.riskProfile as RiskProfile,
          summary:
            parsed.summary ?? `Ubah profil risiko ke ${parsed.riskProfile}`,
        };
        return { text: cleanText, action };
      }

      if (parsed.type === "updateTargetAllocation" && parsed.targetAllocation) {
        const total = Object.values(parsed.targetAllocation).reduce(
          (s, v) => s + v,
          0,
        );
        if (Math.abs(total - 100) > 0.5)
          return { text: cleanText, action: null };
        const action: AdvisorAction = {
          type: "updateTargetAllocation",
          targetAllocation:
            parsed.targetAllocation as unknown as AllocationTarget,
          summary: parsed.summary ?? "Ubah target alokasi",
        };
        return { text: cleanText, action };
      }
    } catch {
      // JSON parse failed
    }

    // suppress unused parameter warning
    void user;
    return { text: cleanText, action: null };
  }
}
