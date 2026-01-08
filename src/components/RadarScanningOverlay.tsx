import { useEffect, useState } from 'react';
import { Target, Wifi } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface RadarProps {
    sessionId?: string | null;
}

export default function RadarScanningOverlay({ sessionId }: RadarProps) {
    const [foundTargets, setFoundTargets] = useState(0);
    const [limit, setLimit] = useState(0);
    const [startedAt, setStartedAt] = useState<string | null>(null);
    const [logs, setLogs] = useState<string[]>([]);
    const [, setTick] = useState(0); // Forcing re-render for simulation

    const messages = [
        "Initialisation du scan...",
        "Triangulation de la zone...",
        "Analyse des points d'intérêt...",
        "Filtrage des résultats pertinents...",
        "Extraction des métadonnées...",
        "Vérification des doublons...",
    ];

    useEffect(() => {
        // Timer for simulation updates
        const timer = setInterval(() => setTick(t => t + 1), 1000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        if (!sessionId) {
            // Fallback mock mode if no session
            const interval = setInterval(() => {
                setFoundTargets(prev => prev + Math.floor(Math.random() * 3) + 1);
            }, 800);
            return () => clearInterval(interval);
        }

        // Real data fetch + simulation init
        const loadSession = async () => {
            const { data } = await supabase.from('scraping_sessions').select('*').eq('id', sessionId).single();
            if (data) {
                setFoundTargets(data.actual_results || 0);
                setLimit(data.limit_results || 0);
                setStartedAt(data.started_at);
            }
        };
        loadSession();

        const channel = supabase.channel(`radar_${sessionId}`)
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'scraping_sessions', filter: `id=eq.${sessionId}` }, (payload: any) => {
                setFoundTargets(payload.new.actual_results || 0);
                setLimit(payload.new.limit_results || 0);
                setStartedAt(payload.new.started_at);
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [sessionId]);

    // Keep logs interval separately
    useEffect(() => {
        let logIndex = 0;
        const logInterval = setInterval(() => {
            if (logIndex < messages.length) {
                setLogs(prev => [...prev.slice(-3), messages[logIndex]]);
                logIndex++;
            } else {
                // Restart logs loop for continuous effect
                logIndex = 0;
            }
        }, 1500);
        return () => clearInterval(logInterval);
    }, []);

    return (
        <div className="absolute inset-0 z-50 bg-gray-900/90 backdrop-blur-sm flex flex-col items-center justify-center overflow-hidden">

            {/* Grid Background Effect */}
            <div className="absolute inset-0 opacity-10"
                style={{
                    backgroundImage: 'linear-gradient(#22c55e 1px, transparent 1px), linear-gradient(90deg, #22c55e 1px, transparent 1px)',
                    backgroundSize: '40px 40px'
                }}
            />

            <div className="relative">
                {/* Outer Ring */}
                <div className="w-64 h-64 rounded-full border border-orange-500/30 flex items-center justify-center relative">

                    {/* Rotating Radar Sweep */}
                    <div className="absolute inset-0 rounded-full border-t border-orange-500 bg-gradient-to-b from-orange-500/20 to-transparent animate-spin duration-3000 origin-center"
                        style={{
                            clipPath: 'polygon(50% 50%, 100% 0, 100% 0, 0 0, 0 0)',
                            animationDuration: '2s',
                            animationTimingFunction: 'linear',
                            animationIterationCount: 'infinite'
                        }}
                    />

                    {/* Inner Pulse */}
                    <div className="w-48 h-48 rounded-full border border-orange-500/50 animate-ping absolute opacity-20" />

                    {/* Center Icon */}
                    <div className="z-10 bg-gray-900 p-3 rounded-full border border-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.5)]">
                        <Target className="w-8 h-8 text-orange-500" />
                    </div>

                    {/* Random Blip Dots (Purely decorative) */}
                    <div className="absolute top-1/2 left-1/2 w-2 h-2 bg-green-400 rounded-full animate-pulse" style={{ transform: 'translate(40px, -60px)' }}></div>
                    <div className="absolute top-1/2 left-1/2 w-2 h-2 bg-green-400 rounded-full animate-pulse delay-75" style={{ transform: 'translate(-50px, 30px)' }}></div>
                    <div className="absolute top-1/2 left-1/2 w-2 h-2 bg-green-400 rounded-full animate-pulse delay-150" style={{ transform: 'translate(20px, 60px)' }}></div>
                </div>
            </div>

            {/* Target Counter */}
            <div className="mt-8 text-center z-10">
                <div className="flex items-center gap-2 justify-center text-orange-400 mb-2">
                    <Wifi className="w-4 h-4 animate-pulse" />
                    <span className="text-xs uppercase tracking-widest font-semibold">Scanning Network</span>
                </div>
                <h2 className="text-4xl font-black text-white tracking-tight tabular-nums">
                    {(() => {
                        // Simulation Logic
                        let displayCount = foundTargets;

                        if (startedAt && limit > 0) {
                            const startTime = new Date(startedAt).getTime();
                            const elapsedSeconds = (Date.now() - startTime) / 1000;
                            const simulated = Math.floor(elapsedSeconds / 15.5);
                            displayCount = Math.max(foundTargets, simulated);
                            // Cap at limit-1 until completed
                            if (displayCount >= limit) displayCount = limit - 1;
                        }

                        // If simulated is negative (weird clock), fallback
                        if (displayCount < 0) displayCount = 0;
                        // If foundTargets is actually higher (real data), use that
                        if (foundTargets > displayCount) displayCount = foundTargets;

                        return (
                            <>
                                {displayCount} <span className="text-2xl text-gray-500 font-bold">/ {limit > 0 ? limit : '...'}</span>
                            </>
                        );
                    })()}
                </h2>
                <p className="text-gray-400 text-sm">Prospects identifiés</p>
            </div>

            {/* Scrolling Logs */}
            <div className="mt-6 font-mono text-xs text-green-500/80 h-16 overflow-hidden flex flex-col items-center gap-1 z-10">
                {logs.map((log, i) => (
                    <span key={i} className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                        {`> ${log}`}
                    </span>
                ))}
            </div>

            {/* Status Footer */}
            <div className="absolute bottom-6 flex items-center gap-4 text-xs font-mono text-gray-500">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
                    PROXY: ROTATING
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    GPS: LOCKED
                </div>
            </div>

            {/* Custom Scan Animation Style injection */}
            <style>{`
                @keyframes radar-spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
}
