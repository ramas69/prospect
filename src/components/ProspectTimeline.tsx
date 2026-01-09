import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Send, User, Clock } from 'lucide-react';

interface Note {
    id: string;
    content: string;
    created_at: string;
    user_id: string;
    profiles: {
        full_name: string;
    };
}

interface ProspectTimelineProps {
    prospectId: string;
}

export default function ProspectTimeline({ prospectId }: ProspectTimelineProps) {
    const { profile } = useAuth();
    const [notes, setNotes] = useState<Note[]>([]);
    const [newNote, setNewNote] = useState('');
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editContent, setEditContent] = useState('');

    useEffect(() => {
        loadNotes();

        // Subscribe to new notes
        const channel = supabase
            .channel(`notes_${prospectId}`)
            .on(
                'postgres_changes',
                {
                    event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
                    schema: 'public',
                    table: 'prospect_notes',
                    filter: `prospect_id=eq.${prospectId}`,
                },
                () => {
                    loadNotes();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [prospectId]);

    const loadNotes = async () => {
        try {
            const { data, error } = await supabase
                .from('prospect_notes')
                .select(`
          *,
          profiles (
            full_name
          )
        `)
                .eq('prospect_id', prospectId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setNotes(data || []);
        } catch (err) {
            console.error('Error loading notes:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!newNote.trim() || !profile) return;

        setSubmitting(true);
        try {
            const { error } = await supabase
                .from('prospect_notes')
                .insert({
                    prospect_id: prospectId,
                    user_id: profile.id,
                    content: newNote.trim()
                });

            if (error) throw error;
            setNewNote('');
            loadNotes();
        } catch (err) {
            console.error('Error adding note:', err);
        } finally {
            setSubmitting(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
        }
    };

    const startEditing = (note: Note) => {
        setEditingId(note.id);
        setEditContent(note.content);
    };

    const saveEdit = async (id: string) => {
        if (!editContent.trim()) return;

        try {
            const { error } = await supabase
                .from('prospect_notes')
                .update({ content: editContent.trim() })
                .eq('id', id);

            if (error) throw error;
            setEditingId(null);
            setEditContent('');
            loadNotes();
        } catch (err) {
            console.error('Error updating note:', err);
        }
    };

    const deleteNote = async (id: string) => {
        if (!confirm('Voulez-vous vraiment supprimer cette note ?')) return;

        try {
            const { error } = await supabase
                .from('prospect_notes')
                .delete()
                .eq('id', id);

            if (error) throw error;
            loadNotes();
        } catch (err) {
            console.error('Error deleting note:', err);
        }
    };

    if (loading) {
        return <div className="p-4 text-center text-gray-500">Chargement de la timeline...</div>;
    }

    return (
        <div className="bg-gray-50 dark:bg-gray-900/30 rounded-xl border border-gray-100 dark:border-gray-800 p-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                <Clock className="w-5 h-5 text-orange-500" />
                Timeline & Notes
            </h3>

            <div className="space-y-6 mb-6 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
                {notes.length === 0 ? (
                    <p className="text-center text-gray-400 text-sm py-4">
                        Aucune note pour le moment. Soyez le premier à écrire !
                    </p>
                ) : (
                    notes.map((note) => (
                        <div key={note.id} className="flex gap-4 group">
                            <div className="flex flex-col items-center">
                                <div className="w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-900/40 flex items-center justify-center text-orange-600 dark:text-orange-400 font-bold text-xs">
                                    {note.profiles?.full_name ? note.profiles.full_name.charAt(0).toUpperCase() : <User className="w-4 h-4" />}
                                </div>
                                <div className="w-0.5 h-full bg-gray-200 dark:bg-gray-700 my-2 group-last:hidden"></div>
                            </div>
                            <div className="flex-1 pb-4">
                                <div className="flex items-center justify-between mb-1">
                                    <div className="flex items-center gap-2">
                                        <span className="font-semibold text-gray-800 dark:text-gray-200 text-sm">
                                            {note.profiles?.full_name || 'Utilisateur inconnu'}
                                        </span>
                                        <span className="text-xs text-gray-400">
                                            {new Date(note.created_at).toLocaleDateString('fr-FR', {
                                                day: 'numeric',
                                                month: 'short',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </span>
                                    </div>

                                    {/* Action buttons only for author */}
                                    {profile && profile.id === note.user_id && editingId !== note.id && (
                                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => startEditing(note)}
                                                className="text-xs text-blue-500 hover:text-blue-700 font-medium"
                                            >
                                                Modifier
                                            </button>
                                            <button
                                                onClick={() => deleteNote(note.id)}
                                                className="text-xs text-red-500 hover:text-red-700 font-medium"
                                            >
                                                Supprimer
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {editingId === note.id ? (
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={editContent}
                                            onChange={(e) => setEditContent(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') saveEdit(note.id);
                                                if (e.key === 'Escape') setEditingId(null);
                                            }}
                                            className="flex-1 px-3 py-2 bg-white dark:bg-gray-800 border border-orange-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                                            autoFocus
                                        />
                                        <button
                                            onClick={() => saveEdit(note.id)}
                                            className="px-3 py-1 bg-orange-500 text-white text-xs rounded-lg hover:bg-orange-600"
                                        >
                                            OK
                                        </button>
                                        <button
                                            onClick={() => setEditingId(null)}
                                            className="px-3 py-1 bg-gray-200 text-gray-700 text-xs rounded-lg hover:bg-gray-300"
                                        >
                                            Annuler
                                        </button>
                                    </div>
                                ) : (
                                    <div className="text-sm text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-100 dark:border-gray-700 shadow-sm relative group-hover:border-orange-200 transition-colors">
                                        {note.content}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>

            <form onSubmit={handleSubmit} className="relative">
                <textarea
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ajouter une note de suivi... (Entrée pour envoyer)"
                    className="w-full pl-4 pr-12 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all resize-none text-sm"
                    rows={2}
                />
                <button
                    type="submit"
                    disabled={submitting || !newNote.trim()}
                    className="absolute right-2 bottom-2 p-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    {submitting ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                        <Send className="w-4 h-4" />
                    )}
                </button>
            </form>
        </div>
    );
}
