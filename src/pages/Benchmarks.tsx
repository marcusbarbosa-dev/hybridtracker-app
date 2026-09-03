import { useState } from 'react';
import { useI18n } from '@/i18n/I18nContext';
import { useApp } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BenchmarkHelp } from '@/components/BenchmarkHelp';
import { Activity, Calculator, Save } from 'lucide-react';

const stationKeys = [
  'skiErg1000m',
  'sledPush50m',
  'sledPull50m',
  'burpeeBroadJumps80m',
  'row1000m',
  'farmersCarry200m',
  'sandbagLunges100m',
  'wallBalls75reps',
  'run1000m',
  'test1600m',
] as const;

function parseTime(val: string): number {
  const parts = val.split(':');
  if (parts.length === 2) {
    return parseInt(parts[0]) * 60 + parseFloat(parts[1]);
  }
  return parseFloat(val) || 0;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function Benchmarks() {
  const { t } = useI18n();
  const { state, setBenchmarks, calculateMetrics, generatePlan } = useApp();
  const [times, setTimes] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    stationKeys.forEach((k) => {
      const val = state.benchmarks?.[k as keyof typeof state.benchmarks];
      initial[k] = val ? formatTime(val) : '';
    });
    return initial;
  });
  const [results, setResults] = useState<{ vo2max: number; threshold: number; predictedTime: number } | null>(null);

  const handleCalculate = () => {
    const benchmarks = {
      skiErg1000m: parseTime(times.skiErg1000m),
      sledPush50m: parseTime(times.sledPush50m),
      sledPull50m: parseTime(times.sledPull50m),
      burpeeBroadJumps80m: parseTime(times.burpeeBroadJumps80m),
      row1000m: parseTime(times.row1000m),
      farmersCarry200m: parseTime(times.farmersCarry200m),
      sandbagLunges100m: parseTime(times.sandbagLunges100m),
      wallBalls75reps: parseTime(times.wallBalls75reps),
      run1000m: parseTime(times.run1000m),
      test1600m: parseTime(times.test1600m),
    };

    if (benchmarks.test1600m <= 0) return;

    const metrics = calculateMetrics(benchmarks);
    setResults(metrics);
    setBenchmarks(benchmarks);
  };

  const handleSaveAndGenerate = () => {
    handleCalculate();
    generatePlan();
  };

  return (
    <div className="container px-4 py-8 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Activity className="h-7 w-7 text-orange-500" />
          {t.benchmarks.title}
          <BenchmarkHelp />
        </h1>
        <p className="text-muted-foreground mt-1">{t.benchmarks.subtitle}</p>
      </div>

      <div className="grid gap-4">
        {stationKeys.map((key) => (
          <Card key={key}>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between gap-4">
                <label className="text-sm font-medium flex-1">
                  {t.benchmarks.stations[key as keyof typeof t.benchmarks.stations]}
                </label>
                <Input
                  type="text"
                  placeholder={t.benchmarks.enterTime}
                  value={times[key]}
                  onChange={(e) => setTimes({ ...times, [key]: e.target.value })}
                  className="w-32"
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-6 flex flex-col sm:flex-row gap-3">
        <Button onClick={handleCalculate} className="gap-2 bg-orange-500 hover:bg-orange-600">
          <Calculator className="h-4 w-4" />
          {t.benchmarks.calculate}
        </Button>
        <Button onClick={handleSaveAndGenerate} variant="outline" className="gap-2">
          <Save className="h-4 w-4" />
          {t.common.save} & {t.dashboard.title}
        </Button>
      </div>

      {results && (
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950/30 dark:to-orange-900/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">{t.benchmarks.vo2max}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{results.vo2max.toFixed(1)}</div>
              <Badge variant="secondary" className="mt-1">ml·kg⁻¹·min⁻¹</Badge>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">{t.benchmarks.threshold}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{results.threshold.toFixed(1)}</div>
              <Badge variant="secondary" className="mt-1">m/min</Badge>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/30 dark:to-green-900/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">{t.benchmarks.predictedTime}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{formatTime(results.predictedTime)}</div>
              <Badge variant="secondary" className="mt-1">hh:mm:ss</Badge>
            </CardContent>
          </Card>
          <p className="text-xs text-muted-foreground col-span-full">{t.benchmarks.formulaNote}</p>
        </div>
      )}
    </div>
  );
}
