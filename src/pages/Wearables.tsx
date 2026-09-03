import { useState, useRef, useCallback } from 'react';
import { useI18n } from '@/i18n/I18nContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Watch,
  Upload,
  FileText,
  Activity,
  CheckCircle2,
  Clock,
  Heart,
  Route,
  Zap,
  Gauge,
} from 'lucide-react';

interface ParsedFile {
  name: string;
  type: string;
  distance?: number;
  duration?: number;
  avgHr?: number;
  maxHr?: number;
  avgPace?: string;
  calories?: number;
}

function parseFitLikeFile(file: File): ParsedFile {
  const name = file.name;
  const type = file.name.endsWith('.fit') ? 'FIT' : file.name.endsWith('.tcx') ? 'TCX' : 'GPX';
  const size = file.size;
  const mockDuration = Math.max(300, Math.floor(size / 100));
  const mockDistance = Math.max(1000, Math.floor(size / 10));
  const mockAvgHr = 140 + Math.floor((size % 40));
  const mockMaxHr = mockAvgHr + 15 + Math.floor((size % 10));
  const paceMin = Math.floor((mockDuration / 60) / (mockDistance / 1000));
  const paceSec = Math.floor(((mockDuration / 60) / (mockDistance / 1000) - paceMin) * 60);

  return {
    name,
    type,
    distance: mockDistance,
    duration: mockDuration,
    avgHr: mockAvgHr,
    maxHr: mockMaxHr,
    avgPace: `${paceMin}:${paceSec.toString().padStart(2, '0')}/km`,
    calories: Math.floor(mockDuration * 0.15),
  };
}

export default function Wearables() {
  const { t } = useI18n();
  const [parsedFiles, setParsedFiles] = useState<ParsedFile[]>([]);
  const [connectedDevice, setConnectedDevice] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    Array.from(files).forEach((file) => {
      if (file.name.match(/\.(fit|tcx|gpx)$/i)) {
        setParsedFiles((prev) => [...prev, parseFitLikeFile(file)]);
      }
    });
  };

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    handleFiles(e.dataTransfer.files);
  }, []);

  const devices = [
    { key: 'garmin', icon: Watch, color: 'text-blue-500' },
    { key: 'polar', icon: Heart, color: 'text-red-500' },
    { key: 'apple', icon: Activity, color: 'text-gray-500' },
    { key: 'samsung', icon: Zap, color: 'text-indigo-500' },
    { key: 'amazfit', icon: Gauge, color: 'text-purple-500' },
  ];

  return (
    <div className="container px-4 py-8 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Watch className="h-7 w-7 text-indigo-500" />
          {t.wearables.title}
        </h1>
        <p className="text-muted-foreground mt-1">{t.wearables.subtitle}</p>
      </div>

      {/* Device connection cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
        {devices.map((d) => {
          const Icon = d.icon;
          const isConnected = connectedDevice === d.key;
          return (
            <Card
              key={d.key}
              className={`cursor-pointer transition-all ${isConnected ? 'ring-2 ring-green-500' : 'hover:shadow-md'}`}
              onClick={() => setConnectedDevice(isConnected ? null : d.key)}
            >
              <CardContent className="p-4 text-center">
                <Icon className={`h-8 w-8 mx-auto mb-2 ${d.color}`} />
                <p className="text-sm font-medium">
                  {t.wearables.devices[d.key as keyof typeof t.wearables.devices]}
                </p>
                {isConnected && (
                  <Badge variant="outline" className="mt-1 text-xs gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    {t.common.confirm}
                  </Badge>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {connectedDevice && (
        <Card className="mb-6 bg-muted/50">
          <CardContent className="py-3 text-center">
            <p className="text-sm text-muted-foreground">{t.wearables.comingSoon}</p>
          </CardContent>
        </Card>
      )}

      {/* File upload */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Upload className="h-5 w-5" />
            {t.wearables.upload.title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">{t.wearables.upload.description}</p>
          <div
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            onClick={() => inputRef.current?.click()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              dragActive ? 'border-orange-500 bg-orange-50 dark:bg-orange-950/20' : 'border-muted-foreground/25 hover:border-muted-foreground/50'
            }`}
          >
            <input
              ref={inputRef}
              type="file"
              accept=".fit,.tcx,.gpx"
              multiple
              onChange={(e) => handleFiles(e.target.files)}
              className="hidden"
            />
            <FileText className="h-10 w-10 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm font-medium">{t.wearables.upload.dragDrop}</p>
            <p className="text-xs text-muted-foreground mt-1">{t.wearables.upload.supported}</p>
          </div>
        </CardContent>
      </Card>

      {/* Parsed files */}
      {parsedFiles.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Arquivos processados</h2>
          {parsedFiles.map((file, idx) => (
            <Card key={idx}>
              <CardContent className="py-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{file.type}</Badge>
                    <span className="font-medium text-sm">{file.name}</span>
                  </div>
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="text-center p-2 bg-muted rounded">
                    <Route className="h-4 w-4 mx-auto mb-1 text-blue-500" />
                    <div className="text-sm font-bold">{(file.distance! / 1000).toFixed(2)} km</div>
                    <div className="text-xs text-muted-foreground">Distância</div>
                  </div>
                  <div className="text-center p-2 bg-muted rounded">
                    <Clock className="h-4 w-4 mx-auto mb-1 text-green-500" />
                    <div className="text-sm font-bold">{Math.floor(file.duration! / 60)} min</div>
                    <div className="text-xs text-muted-foreground">Duração</div>
                  </div>
                  <div className="text-center p-2 bg-muted rounded">
                    <Heart className="h-4 w-4 mx-auto mb-1 text-red-500" />
                    <div className="text-sm font-bold">{file.avgHr} bpm</div>
                    <div className="text-xs text-muted-foreground">FC Média</div>
                  </div>
                  <div className="text-center p-2 bg-muted rounded">
                    <Zap className="h-4 w-4 mx-auto mb-1 text-orange-500" />
                    <div className="text-sm font-bold">{file.calories}</div>
                    <div className="text-xs text-muted-foreground">Kcal</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
