import { Info } from 'lucide-react';
import { useI18n } from '@/i18n/I18nContext';

const copy = {
  pt: {
    label: 'O que significa benchmark?',
    title: 'O que é um benchmark?',
    text: 'No HybridTracker, benchmark é um teste de referência do seu desempenho atual, como o tempo em uma corrida ou estação. Ele cria um ponto de partida para acompanhar sua evolução e ajudar a ajustar as sugestões de treino.',
    note: 'Não é uma competição obrigatória com outros atletas: a principal comparação é com seus próprios resultados anteriores.',
  },
  en: {
    label: 'What does benchmark mean?',
    title: 'What is a benchmark?',
    text: 'In HybridTracker, a benchmark is a reference test of your current performance, such as your time in a run or station. It creates a starting point to track progress and help adjust workout suggestions.',
    note: 'It is not a required competition with other athletes: the main comparison is with your own previous results.',
  },
  de: {
    label: 'Was bedeutet Benchmark?',
    title: 'Was ist ein Benchmark?',
    text: 'Im HybridTracker ist ein Benchmark ein Referenztest deiner aktuellen Leistung, zum Beispiel deine Zeit beim Laufen oder an einer Station. Er dient als Ausgangspunkt, um Fortschritte zu verfolgen und Trainingsvorschläge anzupassen.',
    note: 'Es ist kein verpflichtender Vergleich mit anderen: Entscheidend ist vor allem der Vergleich mit deinen eigenen früheren Ergebnissen.',
  },
};

export function BenchmarkHelp() {
  const { lang } = useI18n();
  const content = copy[lang];

  return (
    <details className="group relative inline-block align-middle">
      <summary
        aria-label={content.label}
        className="grid h-6 w-6 cursor-pointer list-none place-items-center rounded-full border border-white/15 text-zinc-500 transition hover:border-orange-500/50 hover:text-orange-400"
      >
        <Info className="h-3.5 w-3.5" />
      </summary>
      <div className="absolute left-0 top-8 z-40 w-[min(20rem,calc(100vw-2rem))] rounded-2xl border border-orange-500/20 bg-[#171717] p-4 text-left text-sm font-normal leading-relaxed text-zinc-300 shadow-2xl">
        <strong className="block text-base text-white">{content.title}</strong>
        <p className="mt-2">{content.text}</p>
        <p className="mt-2 text-xs text-zinc-500">{content.note}</p>
      </div>
    </details>
  );
}
