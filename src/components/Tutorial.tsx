import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import {
  X,
  ArrowRight,
  ArrowLeft,
  Search,
  History,
  BarChart3,
  Sparkles,
} from 'lucide-react';

interface TutorialProps {
  onComplete: () => void;
}

export default function Tutorial({ onComplete }: TutorialProps) {
  const { profile } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [showTutorial, setShowTutorial] = useState(false);

  useEffect(() => {
    checkIfShouldShow();
  }, [profile]);

  const checkIfShouldShow = async () => {
    if (!profile) return;

    const { data } = await supabase
      .from('user_settings')
      .select('show_tutorial')
      .eq('user_id', profile.id)
      .maybeSingle();

    if (data?.show_tutorial && profile.total_scraping_count === 0) {
      setShowTutorial(true);
    }
  };

  const handleComplete = async () => {
    if (!profile) return;

    await supabase
      .from('user_settings')
      .update({ show_tutorial: false })
      .eq('user_id', profile.id);

    setShowTutorial(false);
    onComplete();
  };

  const steps = [
    {
      title: 'Bienvenue sur Hall Prospects !',
      description:
        'Trouvez des prospects qualifiés automatiquement grâce à Google Maps. Dessinez une zone, choisissez un secteur, et laissez l\'outil travailler pour vous.',
      icon: Sparkles,
      color: 'orange',
    },
    {
      title: 'Lancez une recherche',
      description:
        'Allez dans "Nouvelle Recherche", dessinez votre zone sur la carte, choisissez le secteur d\'activité et le nombre de prospects souhaités.',
      icon: Search,
      color: 'blue',
    },
    {
      title: 'Gérez vos prospects',
      description:
        'Retrouvez tous vos prospects dans "Mes Prospects". Filtrez, qualifiez, ajoutez des notes et exportez vers Brevo ou Lemlist pour vos campagnes email.',
      icon: History,
      color: 'green',
    },
    {
      title: 'Suivez votre performance',
      description:
        'Visualisez vos résultats dans l\'onglet Performance : prospects trouvés, emails collectés, taux de réussite et retour sur investissement.',
      icon: BarChart3,
      color: 'purple',
    },
  ];

  const currentStepData = steps[currentStep];
  const Icon = currentStepData.icon;

  const colorClasses = {
    orange: {
      bg: 'bg-orange-100 dark:bg-orange-900/30',
      text: 'text-orange-600 dark:text-orange-400',
      gradient: 'from-orange-500 to-red-500',
    },
    blue: {
      bg: 'bg-blue-100 dark:bg-blue-900/30',
      text: 'text-blue-600 dark:text-blue-400',
      gradient: 'from-blue-500 to-indigo-500',
    },
    green: {
      bg: 'bg-green-100 dark:bg-green-900/30',
      text: 'text-green-600 dark:text-green-400',
      gradient: 'from-green-500 to-emerald-500',
    },
    purple: {
      bg: 'bg-purple-100 dark:bg-purple-900/30',
      text: 'text-purple-600 dark:text-purple-400',
      gradient: 'from-purple-500 to-pink-500',
    },
  };

  const colors = colorClasses[currentStepData.color as keyof typeof colorClasses];

  if (!showTutorial) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden">
        <div className="relative p-8">
          <button
            onClick={handleComplete}
            className="absolute top-4 right-4 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>

          <div className="text-center mb-8">
            <div className={`inline-flex p-6 ${colors.bg} rounded-2xl mb-4`}>
              <Icon className={`w-16 h-16 ${colors.text}`} />
            </div>
            <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-3">
              {currentStepData.title}
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 leading-relaxed">
              {currentStepData.description}
            </p>
          </div>

          <div className="flex items-center justify-center gap-2 mb-8">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`h-2 rounded-full transition-all ${
                  index === currentStep
                    ? `w-8 bg-gradient-to-r ${colors.gradient}`
                    : index < currentStep
                    ? 'w-2 bg-gray-400 dark:bg-gray-600'
                    : 'w-2 bg-gray-200 dark:bg-gray-700'
                }`}
              />
            ))}
          </div>

          <div className="flex items-center gap-3">
            {currentStep > 0 && (
              <button
                onClick={() => setCurrentStep(currentStep - 1)}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-semibold hover:bg-gray-200 dark:hover:bg-gray-600 transition-all"
              >
                <ArrowLeft className="w-5 h-5" />
                Précédent
              </button>
            )}

            {currentStep < steps.length - 1 ? (
              <button
                onClick={() => setCurrentStep(currentStep + 1)}
                className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r ${colors.gradient} text-white rounded-xl font-semibold hover:shadow-lg transition-all`}
              >
                Suivant
                <ArrowRight className="w-5 h-5" />
              </button>
            ) : (
              <button
                onClick={handleComplete}
                className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r ${colors.gradient} text-white rounded-xl font-semibold hover:shadow-lg transition-all`}
              >
                Commencer
                <Sparkles className="w-5 h-5" />
              </button>
            )}
          </div>

          <button
            onClick={handleComplete}
            className="w-full mt-4 text-sm text-gray-500 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-400 transition-colors"
          >
            Passer le tutoriel
          </button>
        </div>
      </div>
    </div>
  );
}
