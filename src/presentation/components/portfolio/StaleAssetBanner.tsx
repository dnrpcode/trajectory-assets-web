import { useNavigate } from 'react-router-dom';
import { Button } from '../ui/Button';

interface Props {
  count: number;
}

export function StaleAssetBanner({ count }: Props) {
  const navigate = useNavigate();
  if (count === 0) return null;
  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <span className="text-2xl">⚠️</span>
        <div>
          <p className="font-medium text-amber-900">
            {count} aset belum diperbarui bulan ini
          </p>
          <p className="text-sm text-amber-700">
            Perbarui harga untuk akurasi portofolio yang lebih baik
          </p>
        </div>
      </div>
      <Button
        variant="secondary"
        size="sm"
        onClick={() => navigate('/portfolio?filter=stale')}
        className="border-amber-300 text-amber-700 hover:bg-amber-100 shrink-0"
      >
        Update Sekarang
      </Button>
    </div>
  );
}
