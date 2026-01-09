import { useEffect, useState, useRef } from 'react';
import { supabase, ScrapingSession } from '../lib/supabase';
import {
  CheckCircle,
  Loader2,
  MapPin,
  Search,
  Mail,
  FileSpreadsheet,
  Sparkles,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Clock,
} from 'lucide-react';
import ScrapingResults from './ScrapingResults';

interface ScrapingProgressProps {
  sessionId: string;
  onComplete: () => void;
  onCancel?: () => void;
  minimal?: boolean;
}

export default function ScrapingProgress({ sessionId, onComplete, onCancel, minimal = false }: ScrapingProgressProps) {
  const [session, setSession] = useState<ScrapingSession | null>(null);
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number }>>([]);
  const [showResults, setShowResults] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [, setTick] = useState(0); // Force update for timer
  const hasCompletedRef = useRef(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setTick(t => t + 1);
    }, 1000);

    // Backup polling every 3s in case Realtime disconnects
    const poller = setInterval(() => {
      loadSession();
    }, 3000);

    return () => {
      clearInterval(timer);
      clearInterval(poller);
    };
  }, []);

  useEffect(() => {
    loadSession();

    const channel = supabase
      .channel(`scraping_${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'scraping_sessions',
          filter: `id=eq.${sessionId}`,
        },
        (payload) => {
          setSession(payload.new as ScrapingSession);
          if (payload.new.status === 'completed' && !hasCompletedRef.current) {
            hasCompletedRef.current = true;
            createParticles();
            setTimeout(onComplete, 3000);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId]);

  const loadSession = async () => {
    try {
      const { data, error } = await supabase
        .from('scraping_sessions')
        .select('*')
        .eq('id', sessionId)
        .single();

      if (error) throw error;

      if (data) {
        setSession(data);
        if (data.status === 'completed' && !hasCompletedRef.current) {
          hasCompletedRef.current = true;
          createParticles();
          setTimeout(onComplete, 3000);
        }
      }
    } catch (err: any) {
      console.error('Error loading session:', err);
      setError(err.message);
    }
  };

  const createParticles = () => {
    const newParticles = Array.from({ length: 20 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
    }));
    setParticles(newParticles);
    setTimeout(() => setParticles([]), 2000);
  };

  const steps = [
    { name: 'Connexion à Google Maps', icon: MapPin, key: 'maps' },
    { name: 'Extraction des données', icon: Search, key: 'extract' },
    { name: 'Recherche des emails', icon: Mail, key: 'emails' },
    { name: 'Finalisation', icon: Sparkles, key: 'final' },
  ];

  // Simulation Logic based on Time
  const limit = session?.limit_results || 10;
  const secondsPerLead = 16;
  const totalEstSeconds = limit * secondsPerLead;
  const startTime = session?.started_at ? new Date(session.started_at).getTime() : Date.now();
  const elapsed = (Date.now() - startTime) / 1000;

  // Calculate simulated percentage based on time (capped at 98% until completed)
  const isSessionCompleted = session?.status === 'completed';
  const simulatedProgress = isSessionCompleted ? 100 : Math.min(99, Math.round((elapsed / totalEstSeconds) * 100));

  // Use the higher value between real backend progress and simulation
  const displayProgress = isSessionCompleted ? 100 : Math.max(session?.progress_percentage || 0, simulatedProgress);
  const isCompleted = displayProgress >= 100;

  const getCurrentStepIndex = () => {
    if (displayProgress >= 90) return 3;
    if (displayProgress >= 60) return 2;
    if (displayProgress >= 20) return 1;
    return 0;
  };

  const currentStepIndex = getCurrentStepIndex();

  if (error) {
    return (
      <div className="p-8 text-center">
        <div className="text-red-500 mb-2">Une erreur est survenue</div>
        <div className="text-sm text-gray-500">{error}</div>
        <button
          onClick={onComplete}
          className="mt-4 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors"
        >
          Retour (Annuler)
        </button>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
      </div>
    );
  }

  const handleCancel = async () => {
    try {
      // 1. Cancel the specific session
      await supabase
        .from('scraping_sessions')
        .update({ status: 'failed', error_message: 'Arrêté par l\'utilisateur' })
        .eq('id', sessionId);

      // 2. Safety check: Cancel ALL other "in_progress" sessions for this user to prevent "Zombie" loops on refresh
      if (session?.user_id) {
        await supabase
          .from('scraping_sessions')
          .update({ status: 'failed', error_message: 'Nettoyage des sessions bloquées' })
          .eq('user_id', session.user_id)
          .eq('status', 'in_progress');
      }

    } catch (err) {
      console.error('Error cancelling session:', err);
    }

    // Logic: If onCancel is provided, use it (Reset form behavior). Otherwise use onComplete (Redirect behavior, legacy).
    if (onCancel) {
      onCancel();
    } else {
      onComplete();
    }
  };

  return (
    <div className={`${minimal ? '' : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-3xl p-8'} relative overflow-hidden`}>
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute w-2 h-2 bg-orange-500 rounded-full animate-ping"
          style={{ left: `${particle.x}%`, top: `${particle.y}%` }}
        />
      ))}

      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center mb-4">
          <div className="relative">
            {isCompleted ? (
              <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center shadow-lg">
                <CheckCircle className="w-10 h-10 text-white" />
              </div>
            ) : (
              <>
                <div className="w-20 h-20 border-4 border-orange-200 dark:border-orange-900/50 rounded-full"></div>
                <div className="absolute inset-0 w-20 h-20 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
              </>
            )}
          </div>
        </div>
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
          {isCompleted ? 'Scraping Terminé !' : 'Scraping en cours...'}
        </h2>
        <p className="text-gray-600 dark:text-gray-400 font-medium">
          {steps[currentStepIndex]?.name || 'Initialisation'}
        </p>
        {!isCompleted && (
          <button
            onClick={handleCancel}
            className="mt-2 text-sm text-red-500 hover:text-red-600 hover:underline font-medium transition-colors"
          >
            Arrêter / Revenir au formulaire
          </button>
        )}
      </div>

      <div className="mb-8">
        <>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Progression</span>
            <div className="text-right">
              <span className="text-sm font-bold text-orange-600 dark:text-orange-400 block">
                {displayProgress}%
              </span>
            </div>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden mb-2">
            <div
              className="bg-gradient-to-r from-orange-500 to-red-500 h-full rounded-full transition-all duration-500 ease-out"
              style={{ width: `${displayProgress}%` }}
            />
          </div>
        </>

        {/* Time Estimation */}
        {!isCompleted && session.started_at && (
          <div className="flex items-center justify-center gap-2 text-xs font-medium text-gray-500 dark:text-gray-400">
            <Clock className="w-3.5 h-3.5" />
            <span>
              Temps restant estimé : {(() => {
                const limit = session.limit_results || 10;
                const secondsPerLead = 16; // Based on 16s/lead
                const totalEstSeconds = Math.ceil(limit * secondsPerLead);

                const startTime = new Date(session.started_at).getTime();
                const now = new Date().getTime();
                const elapsedSeconds = (now - startTime) / 1000;

                const remainingSeconds = Math.max(0, Math.ceil(totalEstSeconds - elapsedSeconds));

                const minutes = Math.floor(remainingSeconds / 60);
                const seconds = remainingSeconds % 60;

                if (remainingSeconds <= 0) return "Quelques secondes...";
                return `${minutes} min ${seconds} sec`;
              })()}
            </span>
          </div>
        )}
      </div>

      <div className="space-y-3 mb-8">
        {steps.map((step, index) => {
          // Hide future steps for "appear one by one" effect
          if (index > currentStepIndex) return null;

          const Icon = step.icon;
          const isActive = index === currentStepIndex && !isCompleted;
          const isDone = index < currentStepIndex || isCompleted;

          return (
            <div
              key={step.key}
              className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all animate-in fade-in slide-in-from-left-8 duration-[2000ms] ease-out ${isActive
                ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20'
                : isDone
                  ? 'border-green-500 bg-green-50 dark:bg-green-900/20 shadow-sm'
                  : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50'
                }`}
            >
              <div
                className={`p-2 rounded-lg ${isActive
                  ? 'bg-orange-500'
                  : isDone
                    ? 'bg-green-500'
                    : 'bg-gray-300 dark:bg-gray-700'
                  }`}
              >
                {isDone ? (
                  <CheckCircle className="w-5 h-5 text-white" />
                ) : (
                  <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-gray-500'}`} />
                )}
              </div>
              <span
                className={`font-medium transition-colors duration-500 ${isActive
                  ? 'text-gray-800 dark:text-white'
                  : isDone
                    ? 'text-green-700 dark:text-green-400 font-bold'
                    : 'text-gray-500 dark:text-gray-400'
                  }`}
              >
                {step.name}
              </span>
              {isActive && (
                <Loader2 className="w-4 h-4 text-orange-500 animate-spin ml-auto" />
              )}
            </div>
          );
        })}
      </div>

      {/* Results block hidden as per request
      {isCompleted && (
        <div className="space-y-4">
           ...
        </div>
      )} 
      */}
    </div>
  );
}
