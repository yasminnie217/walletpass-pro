'use client';

import { useState, useEffect, useRef } from 'react';
import { ScanLine, CheckCircle, Loader2, Camera } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/src/lib/supabase';
import { useAuth } from '@/src/hooks/useAuth';
import { useClient } from '@/src/hooks/useClient';
import type { Member } from '@/src/types';

type ScanState = 'idle' | 'scanning' | 'loading' | 'result';

interface ScanResult {
  member: Member;
  newPunches: number;
  rewardReady: boolean;
}

/**
 * Cœur du scanner (caméra QR + ajout de tampon + écran de résultat), sans chrome.
 * Réutilisé par la page desktop /scanner et la PWA caissier /caisse/scan.
 */
export function ScannerCore() {
  const { user } = useAuth();
  const { client } = useClient();
  const [state, setState] = useState<ScanState>('idle');
  const [result, setResult] = useState<ScanResult | null>(null);
  const [manualId, setManualId] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const [redeeming, setRedeeming] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const scannerRef = useRef<any>(null);
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const totalStamps = client?.total_stamps || 5;

  useEffect(() => {
    return () => {
      stopScanner();
      if (cooldownRef.current) clearInterval(cooldownRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch {
        // ignore
      }
      scannerRef.current = null;
    }
  };

  const startScanner = async () => {
    setState('scanning');
    await new Promise(r => setTimeout(r, 100));

    const { Html5Qrcode } = await import('html5-qrcode');
    const scanner = new Html5Qrcode('qr-reader');
    scannerRef.current = scanner;

    try {
      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        async (decodedText: string) => {
          await stopScanner();
          await processPassId(decodedText);
        },
        undefined
      );
    } catch {
      setState('idle');
      toast.error("Impossible d'accéder à la caméra.");
    }
  };

  const processPassId = async (passId: string) => {
    if (!user) return;
    setState('loading');
    try {
      const cleanId = passId.trim();

      let member: Member | null = null;
      const { data: byId } = await supabase
        .from('members')
        .select('*')
        .eq('client_id', user.id)
        .eq('id', cleanId)
        .maybeSingle();
      member = byId as Member | null;

      if (!member) {
        const { data: byPassId } = await supabase
          .from('members')
          .select('*')
          .eq('client_id', user.id)
          .eq('pass_id', cleanId)
          .maybeSingle();
        member = byPassId as Member | null;
      }

      if (!member) {
        toast.error('Membre introuvable. Vérifiez le QR code.');
        setState('idle');
        return;
      }

      const newPunches = (member.punches || 0) + 1;
      const rewardReady = newPunches >= totalStamps;

      await supabase.from('punches').insert({ member_id: member.id, client_id: user.id });
      await supabase
        .from('members')
        .update({ punches: newPunches, reward_available: rewardReady })
        .eq('id', member.id);

      if (member.google_wallet_object_id) {
        try {
          await fetch('/api/google-wallet/add-punch', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ memberId: member.id, newPoints: newPunches }),
          });
        } catch { /* non-blocking */ }
      }

      setResult({ member, newPunches, rewardReady });
      setState('result');
      startCooldown();
    } catch {
      toast.error('Une erreur est survenue.');
      setState('idle');
    }
  };

  const startCooldown = () => {
    setCooldown(5);
    cooldownRef.current = setInterval(() => {
      setCooldown(c => {
        if (c <= 1) {
          if (cooldownRef.current) clearInterval(cooldownRef.current);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
  };

  const handleManual = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualId.trim()) return;
    await stopScanner();
    await processPassId(manualId.trim());
    setManualId('');
  };

  const handleRedeem = async () => {
    if (!result) return;
    setRedeeming(true);
    try {
      await supabase
        .from('members')
        .update({ punches: 0, reward_available: false })
        .eq('id', result.member.id);

      // Remet aussi la carte Google Wallet à 0 (non-bloquant)
      if (result.member.google_wallet_object_id) {
        try {
          await fetch('/api/google-wallet/add-punch', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ memberId: result.member.id, newPoints: 0 }),
          });
        } catch { /* non-blocking */ }
      }

      toast.success(`Récompense utilisée pour ${result.member.first_name}. Carte remise à zéro!`);
      setResult(null);
      setState('idle');
    } catch {
      toast.error('Erreur lors de la réinitialisation.');
    } finally {
      setRedeeming(false);
    }
  };

  const resetScanner = () => {
    setResult(null);
    setState('idle');
  };

  return (
    <div className="max-w-lg mx-auto">
      {/* Camera viewport */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-4">
        <div
          className="relative flex items-center justify-center"
          style={{ minHeight: '300px', background: '#0a0a0a' }}
        >
          <div id="qr-reader" className="w-full" style={{ display: state === 'scanning' ? 'block' : 'none' }} />

          {state !== 'scanning' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-white/40">
              <Camera size={48} className="mb-3" />
              <p className="text-sm">La caméra apparaîtra ici.</p>
            </div>
          )}

          {state === 'scanning' && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="relative w-56 h-56">
                {[['top-0 left-0', 'border-t-2 border-l-2'],
                  ['top-0 right-0', 'border-t-2 border-r-2'],
                  ['bottom-0 left-0', 'border-b-2 border-l-2'],
                  ['bottom-0 right-0', 'border-b-2 border-r-2']].map(([pos, border], i) => (
                  <div key={i} className={`absolute ${pos} w-8 h-8 ${border}`} style={{ borderColor: '#00704A' }} />
                ))}
              </div>
            </div>
          )}

          {state === 'loading' && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/60">
              <Loader2 size={40} className="text-white animate-spin" />
            </div>
          )}
        </div>
      </div>

      {state === 'idle' && (
        <button
          onClick={startScanner}
          className="w-full py-4 rounded-full text-white font-semibold text-base flex items-center justify-center gap-2 transition-all hover:opacity-90 mb-4"
          style={{ background: '#00704A' }}
        >
          <ScanLine size={20} />
          Scanner une carte
        </button>
      )}

      {state === 'scanning' && (
        <button
          onClick={() => { stopScanner(); setState('idle'); }}
          className="w-full py-4 rounded-full font-semibold text-base border border-gray-300 text-ink hover:bg-cream transition-all mb-4"
        >
          Annuler
        </button>
      )}

      {state === 'result' && result && (
        <div className="bg-white rounded-xl shadow-sm p-6 mb-4">
          <div className="flex items-center gap-3 mb-4">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold"
              style={{ background: '#1E3932' }}
            >
              {result.member.first_name.charAt(0)}{result.member.last_name.charAt(0)}
            </div>
            <div>
              <p className="text-ink font-semibold text-lg">{result.member.first_name} {result.member.last_name}</p>
              <p className="text-mist text-sm">{result.member.email}</p>
            </div>
          </div>

          <div className="mb-4">
            <div className="flex justify-between text-sm mb-1.5">
              <span className="text-mist">Progression</span>
              <span className="font-semibold text-ink" style={{ fontFamily: '"JetBrains Mono", monospace' }}>
                {result.newPunches}/{totalStamps}
              </span>
            </div>
            <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min((result.newPunches / totalStamps) * 100, 100)}%`,
                  background: '#CBA258',
                }}
              />
            </div>
          </div>

          {result.rewardReady ? (
            <div className="space-y-3">
              <div
                className="flex items-center gap-2 p-3 rounded-xl text-sm font-semibold"
                style={{ background: '#CBA25820', color: '#CBA258' }}
              >
                🎉 Récompense disponible!
              </div>
              <button
                onClick={handleRedeem}
                disabled={redeeming}
                className="w-full py-3 rounded-full text-white font-medium text-sm flex items-center justify-center gap-2 transition-all hover:opacity-90 disabled:opacity-60"
                style={{ background: '#CBA258' }}
              >
                {redeeming ? <Loader2 size={16} className="animate-spin" /> : '🎁'}
                Marquer la récompense comme utilisée
              </button>
            </div>
          ) : (
            <div
              className="flex items-center gap-2 p-3 rounded-xl text-sm font-semibold"
              style={{ background: '#00704A15', color: '#00704A' }}
            >
              <CheckCircle size={16} />
              Tampon ajouté!
            </div>
          )}

          <button
            onClick={resetScanner}
            disabled={cooldown > 0}
            className="w-full mt-4 py-3 rounded-full text-white font-medium text-sm transition-all hover:opacity-90 disabled:opacity-50"
            style={{ background: '#00704A' }}
          >
            {cooldown > 0 ? `Scanner suivant (${cooldown}s)` : 'Scanner suivant'}
          </button>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm p-5">
        <p className="text-mist text-sm mb-3">Ou saisir l&apos;ID membre manuellement</p>
        <form onSubmit={handleManual} className="flex gap-2">
          <input
            type="text"
            value={manualId}
            onChange={e => setManualId(e.target.value)}
            placeholder="ID membre…"
            className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-matcha/30"
            style={{ fontFamily: '"JetBrains Mono", monospace' }}
          />
          <button
            type="submit"
            className="px-5 py-2.5 rounded-full text-white text-sm font-medium transition-all hover:opacity-90"
            style={{ background: '#00704A' }}
          >
            Valider
          </button>
        </form>
      </div>
    </div>
  );
}
