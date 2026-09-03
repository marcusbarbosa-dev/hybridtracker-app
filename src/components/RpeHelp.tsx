import { Info } from 'lucide-react';
import { useI18n } from '@/i18n/I18nContext';

const copy = {
  pt: {
    label: 'O que significa RPE?',
    title: 'O que é RPE?',
    text: 'RPE é a percepção de esforço: uma nota pessoal de 1 a 10 para indicar o quanto a sessão pareceu exigente para você.',
    scale: '1–2 muito leve · 3–4 leve · 5–6 moderado · 7–8 intenso · 9–10 máximo.',
    note: 'RPE não é frequência cardíaca. Considere respiração, fadiga muscular e dificuldade para manter o ritmo.',
  },
  en: {
    label: 'What does RPE mean?',
    title: 'What is RPE?',
    text: 'RPE is your rating of perceived exertion: a personal score from 1 to 10 showing how demanding the session felt to you.',
    scale: '1–2 very easy · 3–4 easy · 5–6 moderate · 7–8 hard · 9–10 maximal.',
    note: 'RPE is not heart rate. Consider breathing, muscular fatigue and how difficult it was to maintain pace.',
  },
  de: {
    label: 'Was bedeutet RPE?',
    title: 'Was ist RPE?',
    text: 'RPE beschreibt dein subjektives Belastungsempfinden: eine persönliche Bewertung von 1 bis 10, wie anstrengend sich die Einheit angefühlt hat.',
    scale: '1–2 sehr leicht · 3–4 leicht · 5–6 moderat · 7–8 intensiv · 9–10 maximal.',
    note: 'RPE ist nicht die Herzfrequenz. Berücksichtige Atmung, Muskelermüdung und die Schwierigkeit, das Tempo zu halten.',
  },
};

export function RpeHelp() {
  const { lang } = useI18n();
  const content = copy[lang];

  return (
    <details className="group relative inline-block normal-case tracking-normal">
      <summary
        aria-label={content.label}
        className="grid h-5 w-5 cursor-pointer list-none place-items-center rounded-full border border-white/15 text-zinc-500 transition hover:border-orange-500/50 hover:text-orange-400"
      >
        <Info className="h-3 w-3" />
      </summary>
      <div className="absolute left-0 top-7 z-50 w-[min(20rem,calc(100vw-2rem))] rounded-2xl border border-orange-500/20 bg-[#171717] p-4 text-left text-xs font-normal leading-relaxed text-zinc-300 shadow-2xl">
        <strong className="block text-sm text-white">{content.title}</strong>
        <p className="mt-2">{content.text}</p>
        <p className="mt-2 font-semibold text-orange-300">{content.scale}</p>
        <p className="mt-2 text-[11px] text-zinc-500">{content.note}</p>
      </div>
    </details>
  );
}
