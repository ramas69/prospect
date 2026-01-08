import { CheckCircle, ExternalLink, X } from 'lucide-react';

interface SuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  sheetName: string;
  sheetLink: string;
  status: string;
}

export default function SuccessModal({ isOpen, onClose, sheetName, sheetLink, status }: SuccessModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-white border border-gray-200 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-300">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 bg-green-500 rounded-full blur-lg opacity-50"></div>
              <div className="relative p-2 bg-green-100 rounded-full">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <h3 className="text-xl font-bold text-gray-800">Scraping terminé</h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-gray-400 hover:text-gray-800 transition-colors" />
          </button>
        </div>

        <div className="p-8 space-y-6">
          <div className="flex items-center justify-center">
            <div className="relative">
              <div className="absolute inset-0 bg-green-500 rounded-full blur-2xl opacity-40 animate-pulse"></div>
              <div className="relative p-6 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full border border-green-300">
                <CheckCircle className="w-20 h-20 text-green-600" />
              </div>
            </div>
          </div>

          <div className="text-center space-y-3">
            <h4 className="text-3xl font-bold text-gray-800">Félicitations!</h4>
            <p className="text-gray-600 leading-relaxed">
              Votre scraping a été effectué avec succès et les données ont été exportées vers Google Sheets.
            </p>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-600">Statut:</span>
              <span className="inline-flex items-center px-4 py-1.5 rounded-full text-sm font-bold bg-green-100 text-green-700 border border-green-300">
                {status}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-600">Nom de la feuille:</span>
              <span className="text-sm font-bold text-gray-800">{sheetName}</span>
            </div>
          </div>

          <a
            href={sheetLink}
            target="_blank"
            rel="noopener noreferrer"
            className="relative w-full group overflow-hidden rounded-xl transition-all block"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-red-500 transition-transform group-hover:scale-105"></div>
            <div className="absolute inset-0 bg-gradient-to-r from-orange-400 to-red-400 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative flex items-center justify-center gap-3 px-6 py-4 text-white font-bold text-lg">
              <ExternalLink className="w-6 h-6" />
              Ouvrir Google Sheets
            </div>
          </a>

          <button
            onClick={onClose}
            className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-3 rounded-xl font-semibold transition-all"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}
