import { useState, useEffect, useRef, useCallback } from 'react';
import { useI18n } from '@/i18n/I18nContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckCircle2, Play, Pause, RotateCcw, SkipForward, Timer as TimerIcon } from 'lucide-react';
import { useNavigate } from 'react-router';

const STATIONS = [
  { name: 'SkiErg', distance: '1000m' },
  { name: 'Sled Push', distance: '50m' },
  { name: 'Sled Pull', distance: '50m' },
  { name: 'Burpee Broad Jumps', distance: '80m' },
  { name: 'Rowing', distance: '1000m' },
  { name: "Farmer's Carry", distance: '200m' },
  { name: 'Sandbag Lunges', distance: '100m' },
  { name: 'Wall Balls', distance: '75 reps' },
];

function formatTime(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = Math.floor(totalSeconds % 60);
  const ms = Math.floor((totalSeconds % 1) * 100);
  if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
}

export default function TimerPage() {
  const navigate = useNavigate();
  const { t } = useI18n();
  const [mode, setMode] = useState<'full' | 'station'>('full');
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [currentStation, setCurrentStation] = useState(0);
  const [stationTime, setStationTime] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef(0);
  const stationStartRef = useRef(0);

  const startTimer = useCallback(() => {
    if (!running) {
      startTimeRef.current = Date.now() - elapsed * 1000;
      stationStartRef.current = Date.now() - stationTime * 1000;
      intervalRef.current = setInterval(() => {
        const now = Date.now();
        setElapsed((now - startTimeRef.current) / 1000);
        setStationTime((now - stationStartRef.current) / 1000);
      }, 100);
      setRunning(true);
    }
  }, [running, elapsed, stationTime]);

  const pauseTimer = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setRunning(false);
  };

  const resetTimer = () => {
    pauseTimer();
    setElapsed(0);
    setStationTime(0);
    setCurrentStation(0);
  };

  const nextStation = () => {
    if (mode === 'full' && currentStation < STATIONS.length - 1) {
      setCurrentStation((prev) => prev + 1);
      setStationTime(0);
      stationStartRef.current = Date.now();
    }
  };

  const finishWorkout = () => {
    pauseTimer();
    localStorage.setItem('hybridtracker-last-timer', JSON.stringify({ elapsedSeconds: Math.round(elapsed), finishedAt: new Date().toISOString() }));
    navigate('/treino#concluir');
  };

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  return (
    <div className="container px-4 py-8 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold flex items-center gap-2 mb-6">
        <TimerIcon className="h-7 w-7 text-orange-500" />
        {t.timer.title}
      </h1>

      <Tabs value={mode} onValueChange={(v) => { setMode(v as 'full' | 'station'); resetTimer(); }}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="full">{t.timer.fullRace}</TabsTrigger>
          <TabsTrigger value="station">{t.timer.stationOnly}</TabsTrigger>
        </TabsList>

        <TabsContent value="full">
          <Card>
            <CardHeader className="text-center pb-2">
              <Badge variant="outline" className="mx-auto mb-2">
                {t.timer.currentStation}: {currentStation + 1}/8
              </Badge>
              <CardTitle className="text-2xl">
                {STATIONS[currentStation].name} — {STATIONS[currentStation].distance}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center">
                <div className="text-6xl font-mono font-bold tracking-tighter">
                  {formatTime(elapsed)}
                </div>
                <p className="text-sm text-muted-foreground mt-1">{t.timer.elapsed}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-muted rounded-lg">
                  <div className="text-2xl font-mono">{formatTime(stationTime)}</div>
                  <p className="text-xs text-muted-foreground">{t.timer.currentStation}</p>
                </div>
                <div className="text-center p-3 bg-muted rounded-lg">
                  <div className="text-2xl font-mono">
                    {currentStation > 0 ? formatTime(elapsed - stationTime) : '—'}
                  </div>
                  <p className="text-xs text-muted-foreground">{t.timer.previousAccumulated}</p>
                </div>
              </div>

              <div className="flex flex-wrap justify-center gap-2">
                {!running ? (
                  <Button onClick={startTimer} size="lg" className="gap-2 bg-green-600 hover:bg-green-700">
                    <Play className="h-5 w-5" /> {t.timer.start}
                  </Button>
                ) : (
                  <Button onClick={pauseTimer} size="lg" variant="outline" className="gap-2">
                    <Pause className="h-5 w-5" /> {t.timer.pause}
                  </Button>
                )}
                <Button onClick={resetTimer} variant="outline" size="lg" className="gap-2">
                  <RotateCcw className="h-5 w-5" /> {t.timer.reset}
                </Button>
                <Button onClick={nextStation} variant="secondary" size="lg" className="gap-2">
                  <SkipForward className="h-5 w-5" /> {t.timer.nextStation}
                </Button>
                {elapsed > 0 && <Button onClick={finishWorkout} size="lg" className="gap-2 bg-orange-500 font-black text-black hover:bg-orange-400"><CheckCircle2 className="h-5 w-5" /> {t.timer.finishAndLog}</Button>}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="station">
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">{t.timer.stationOnly}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center">
                <div className="text-6xl font-mono font-bold tracking-tighter">
                  {formatTime(elapsed)}
                </div>
              </div>
              <div className="flex justify-center gap-2">
                {!running ? (
                  <Button onClick={startTimer} size="lg" className="gap-2 bg-green-600 hover:bg-green-700">
                    <Play className="h-5 w-5" /> {t.timer.start}
                  </Button>
                ) : (
                  <Button onClick={pauseTimer} size="lg" variant="outline" className="gap-2">
                    <Pause className="h-5 w-5" /> {t.timer.pause}
                  </Button>
                )}
                <Button onClick={resetTimer} variant="outline" size="lg" className="gap-2">
                  <RotateCcw className="h-5 w-5" /> {t.timer.reset}
                </Button>
                {elapsed > 0 && <Button onClick={finishWorkout} size="lg" className="gap-2 bg-orange-500 font-black text-black hover:bg-orange-400"><CheckCircle2 className="h-5 w-5" /> {t.timer.finishAndLog}</Button>}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
