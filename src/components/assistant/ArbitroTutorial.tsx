/**
 * Phase 5 — Tutorial mode za nove korisnike Arbitro asistenta.
 *
 * Prikazuje se prvi put kad korisnik otvori panel (localStorage flag
 * `arbitro:tutorialDone` = false). 5 koraka kroz osnovne flow-ove:
 *  1. Postavi obicno pitanje (RAG + Wikipedia tool calling)
 *  2. Aktiviraj voice input (Web Speech API)
 *  3. Probaj agentic mode (ali bez stvarne akcije, samo demo)
 *  4. Aktiviraj TTS toggle
 *  5. Otvori istoriju razgovora
 *
 * Korisnik moze preskociti bilo kad — flag se postavlja na "done" i ne
 * prikazuje se vise (osim ako ne resetuje sessionStorage).
 */
import { useEffect, useState } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  History,
  Mic,
  Settings,
  Sparkles,
  Volume2,
  Zap,
  X,
} from 'lucide-react';

const STORAGE_KEY = 'arbitro:tutorialDone';

interface TutorialStep {
  icon: typeof Sparkles;
  title: string;
  description: string;
}

const STEPS: TutorialStep[] = [
  {
    icon: Sparkles,
    title: 'Postavi pitanje',
    description:
      'Napisi bilo sta o aplikaciji — npr. "Kako da kreiram fond?" ili "Sta je AON nalog?". ' +
      'Asistent koristi Banka 2 spec + Wikipediju za odgovor.',
  },
  {
    icon: Mic,
    title: 'Govori umesto kucanja',
    description:
      'Klikni mic ikonicu da pricas. Web Speech API transkribuje u realnom vremenu (srpski + engleski). ' +
      'Kad prestaneš, automatski salje pitanje.',
  },
  {
    icon: Zap,
    title: 'Agentic mode (BETA)',
    description:
      'U Settings dropdown-u ukljuci "Agentic mode" pa kazi npr. "Plati 5000 RSD Stefanu". ' +
      'Asistent priprema akciju i pita te za potvrdu pre izvrsenja.',
  },
  {
    icon: Volume2,
    title: 'Glas asistenta',
    description:
      'U Settings-u ukljuci "Glas asistenta" — odgovori se citaju kroz Kokoro TTS (lokalno). ' +
      'Mozes izabrati glas (US/UK, M/F).',
  },
  {
    icon: History,
    title: 'Istorija razgovora',
    description:
      'Klikni history ikonicu u headeru da vidis prethodne razgovore. ' +
      'Konverzacije su sacuvane 7 dana.',
  },
];

interface ArbitroTutorialProps {
  /** Force-show ignorise localStorage flag (npr. iz Settings → "Pokazi tutorijal opet"). */
  forceShow?: boolean;
  onClose?: () => void;
}

export function ArbitroTutorial({ forceShow, onClose }: ArbitroTutorialProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    // Sav setState ide kroz async callback (setTimeout/microtask) da
    // izbegnemo `react-hooks/set-state-in-effect` strict pravilo —
    // sinhroni setIsOpen direktno u effect body kr...
    if (forceShow) {
      const t = window.setTimeout(() => setIsOpen(true), 0);
      return () => window.clearTimeout(t);
    }
    const done = localStorage.getItem(STORAGE_KEY) === 'true';
    if (!done) {
      // Pokreni posle malo delay-a da se panel prvo otvori
      const t = window.setTimeout(() => setIsOpen(true), 600);
      return () => window.clearTimeout(t);
    }
  }, [forceShow]);

  const close = () => {
    localStorage.setItem(STORAGE_KEY, 'true');
    setIsOpen(false);
    if (onClose) onClose();
  };

  if (!isOpen) return null;

  const currentStep = STEPS[stepIndex];
  const Icon = currentStep.icon;
  const isLast = stepIndex === STEPS.length - 1;

  return (
    <div
      className="arbitro-tutorial absolute inset-0 z-30 flex flex-col items-center justify-center px-6"
      data-testid="arbitro-tutorial"
    >
      <button
        type="button"
        onClick={close}
        className="absolute top-4 right-4 text-white/70 hover:text-white"
        aria-label="Preskoci tutorijal"
        title="Preskoci tutorijal"
      >
        <X className="h-4 w-4" />
      </button>

      <div className="arbitro-tutorial-card w-full max-w-sm flex flex-col items-center text-center gap-4 p-6 rounded-3xl">
        <div className="arbitro-tutorial-icon flex h-14 w-14 items-center justify-center rounded-2xl">
          <Icon className="h-7 w-7 text-white" />
        </div>

        <div className="space-y-2">
          <div className="text-xs font-semibold uppercase tracking-wider text-white/60">
            Korak {stepIndex + 1} od {STEPS.length}
          </div>
          <div className="arbitro-empty-title text-xl">{currentStep.title}</div>
          <p className="text-sm text-white/85 leading-relaxed">
            {currentStep.description}
          </p>
        </div>

        <div className="flex gap-1.5 mt-2">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all ${
                i === stepIndex
                  ? 'w-6 bg-white'
                  : i < stepIndex
                    ? 'w-1.5 bg-white/60'
                    : 'w-1.5 bg-white/20'
              }`}
            />
          ))}
        </div>

        <div className="flex justify-between gap-3 w-full mt-2">
          <button
            type="button"
            onClick={close}
            className="text-xs text-white/70 hover:text-white px-3 py-2"
          >
            Preskoci
          </button>
          <button
            type="button"
            onClick={() => {
              if (isLast) close();
              else setStepIndex((i) => i + 1);
            }}
            className="arbitro-tutorial-next flex items-center gap-2 px-4 py-2 rounded-2xl text-sm font-semibold"
          >
            {isLast ? (
              <>
                Zavrsi <CheckCircle2 className="h-4 w-4" />
              </>
            ) : (
              <>
                Sledece <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </div>
      </div>

      {/* Hint footer — kad korisnik bude u stvari hteo da koristi feature */}
      <div className="mt-3 text-[10px] text-white/40 flex items-center gap-1.5">
        <Settings className="h-3 w-3" />
        Tutorijal mozes ponovo otvoriti iz Settings dropdown-a
      </div>
    </div>
  );
}
