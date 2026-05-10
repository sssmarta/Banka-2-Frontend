import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Handshake, Search, ScrollText, Upload } from 'lucide-react';
import otcService from '@/services/otcService';
import OtcHubCard from '@/components/otc/OtcHubCard';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface HubStats {
  discoveryCount: number;
  bankCount: number;
  activeOffersCount: number;
  myTurnCount: number;
  activeContractsCount: number;
  exercisedContractsCount: number;
  myPublicCount: number;
  loading: boolean;
}

const INITIAL_STATS: HubStats = {
  discoveryCount: 0,
  bankCount: 0,
  activeOffersCount: 0,
  myTurnCount: 0,
  activeContractsCount: 0,
  exercisedContractsCount: 0,
  myPublicCount: 0,
  loading: true,
};

export default function OtcHubPage() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<HubStats>(INITIAL_STATS);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [listings, offers, contracts, myPublic] = await Promise.all([
          otcService.listDiscovery().catch(() => []),
          otcService.listMyActiveOffers().catch(() => []),
          otcService.listMyContracts('ALL').catch(() => []),
          otcService.listMyPublicListings().catch(() => []),
        ]);
        if (cancelled) return;
        const banks = new Set<string>();
        listings.forEach((l) => banks.add(l.sellerName ?? 'Banka 2'));
        setStats({
          discoveryCount: listings.length,
          bankCount: banks.size,
          activeOffersCount: offers.filter((o) => o.status === 'ACTIVE').length,
          myTurnCount: offers.filter((o) => o.status === 'ACTIVE' && o.myTurn).length,
          activeContractsCount: contracts.filter((c) => c.status === 'ACTIVE').length,
          exercisedContractsCount: contracts.filter((c) => c.status === 'EXERCISED').length,
          myPublicCount: myPublic.length,
          loading: false,
        });
      } catch {
        if (!cancelled) setStats({ ...INITIAL_STATS, loading: false });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-500/20">
          <Handshake className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">OTC trgovina</h1>
          <p className="text-sm text-muted-foreground">
            Direktna kupoprodaja akcija unutar i izmedju banaka — bez provizije berze
          </p>
        </div>
      </div>

      <Alert>
        <AlertDescription className="text-sm">
          <strong>Kako funkcionise:</strong> kreni od <em>Pretrazi</em> da vidis sta drugi nude, ili
          <em> Moje javne akcije</em> da objavis svoje za druge. Pregovori se vode izmedju kupca i
          prodavca preko ponuda i kontraponuda. Kad obe strane potvrde, sklapa se opcioni ugovor
          koji kupac moze da iskoristi do <em>settlement</em> datuma.
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <OtcHubCard
          icon={Search}
          title="Pretrazi"
          gradientFrom="from-indigo-500"
          gradientTo="to-violet-600"
          primaryStat={String(stats.discoveryCount)}
          primaryStatLabel="javnih akcija"
          secondaryStat={
            stats.bankCount > 0
              ? `iz ${stats.bankCount} ${stats.bankCount === 1 ? 'banke' : 'banaka'}`
              : 'iz nase + partnerskih banaka'
          }
          loading={stats.loading}
          onClick={() => navigate('/otc/discovery')}
          dataTestId="hub-discovery"
        />
        <OtcHubCard
          icon={Handshake}
          title="Moji pregovori"
          gradientFrom="from-emerald-500"
          gradientTo="to-teal-600"
          primaryStat={String(stats.activeOffersCount)}
          primaryStatLabel="aktivna pregovora"
          warningBadge={stats.myTurnCount > 0}
          warningBadgeText={`${stats.myTurnCount} ceka tebe`}
          loading={stats.loading}
          onClick={() => navigate('/otc/pregovori')}
          dataTestId="hub-negotiations"
        />
        <OtcHubCard
          icon={ScrollText}
          title="Sklopljeni ugovori"
          gradientFrom="from-amber-500"
          gradientTo="to-orange-600"
          primaryStat={String(stats.activeContractsCount)}
          primaryStatLabel="ACTIVE"
          secondaryStat={
            stats.exercisedContractsCount > 0
              ? `${stats.exercisedContractsCount} EXERCISED`
              : 'Bez iskoriscenih ugovora'
          }
          loading={stats.loading}
          onClick={() => navigate('/otc/ugovori')}
          dataTestId="hub-contracts"
        />
        <OtcHubCard
          icon={Upload}
          title="Moje javne akcije"
          gradientFrom="from-pink-500"
          gradientTo="to-rose-600"
          primaryStat={String(stats.myPublicCount)}
          primaryStatLabel={stats.myPublicCount === 1 ? 'javna' : 'javnih'}
          secondaryStat="Iz Portfolio-a"
          loading={stats.loading}
          onClick={() => navigate('/otc/moje')}
          dataTestId="hub-my-public"
        />
      </div>
    </div>
  );
}
