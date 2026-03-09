import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import ReactPlayer from 'react-player';
import { Goal, DocItem } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import {
    Youtube, Folder, FileText, ChevronRight, Save,
    ArrowLeft, Plus, Trash2, X, Maximize2, Minimize2,
    Search, Pencil
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { ObsidianDocEditor } from './ObsidianDocEditor';
import type { DocItemForEditor } from './ObsidianDocEditor';

interface YoutubePlayerDialogProps {
    goal: Goal | null;
    isOpen: boolean;
    onClose: () => void;
    docItems?: DocItem[];
    onProgressUpdate?: (goalId: string, globalProgress: number) => void;
    onLiveProgress?: (goalId: string, globalProgress: number) => void;
    onSaveTimestamp?: (goalId: string, timestamp: number) => void;
    onSaveProgress?: (goalId: string, progress: number, timestamp: number) => void;
    onSaveNotes?: (items: DocItem[]) => void;
}

export const YoutubePlayerDialog: React.FC<YoutubePlayerDialogProps> = ({
    goal, isOpen, onClose, docItems = [],
    onProgressUpdate, onLiveProgress, onSaveTimestamp, onSaveProgress, onSaveNotes
}) => {
    const playerRef = useRef<any>(null);
    const [lastKnownProgress, setLastKnownProgress] = useState(0);
    const lastKnownProgressRef = useRef(0);
    const lastKnownTimestampRef = useRef(0);
    const saveIntervalRef = useRef<NodeJS.Timeout | null>(null);

    // Documentation States
    const [localFileSystem, setLocalFileSystem] = useState<DocItem[]>(docItems);
    const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
    const [activeFileId, setActiveFileId] = useState<string | null>(null);
    const [noteDraft, setNoteDraft] = useState<string>('');
    const [isFullScreen, setIsFullScreen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [editingDocId, setEditingDocId] = useState<string | null>(null);
    const [editNameValue, setEditNameValue] = useState('');
    const [videoError, setVideoError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            setLocalFileSystem(docItems);
        }
    }, [docItems, isOpen]);

    const saveCurrentProgress = useCallback(() => {
        if (!goal) return;

        let progress = lastKnownProgressRef.current;
        let timestamp = Math.floor(lastKnownTimestampRef.current);

        if (playerRef.current) {
            try {
                const currentTime = playerRef.current.getCurrentTime();
                if (currentTime > 0) {
                    timestamp = Math.floor(currentTime);
                    const duration = playerRef.current.getDuration();
                    if (duration > 0) {
                        progress = Math.round((currentTime / duration) * 100);
                    }
                }
            } catch (e) { }
        }

        if (onSaveProgress && (progress > 0 || timestamp > 0)) {
            onSaveProgress(goal.id, progress, timestamp);
        }
    }, [goal, onSaveProgress]);

    const handleProgress = useCallback((state: any) => {
        if (!goal || state.seeking) return;
        let globalProgress = Math.round((state.played || 0) * 100);
        lastKnownProgressRef.current = globalProgress;
        if (state.playedSeconds > 0) lastKnownTimestampRef.current = state.playedSeconds;
        if (lastKnownProgress !== globalProgress) setLastKnownProgress(globalProgress);
        if (onLiveProgress && goal) onLiveProgress(goal.id, globalProgress);
    }, [goal, onLiveProgress, lastKnownProgress]);

    const handlePlay = useCallback(() => {
        if (saveIntervalRef.current) clearInterval(saveIntervalRef.current);
        saveIntervalRef.current = setInterval(() => saveCurrentProgress(), 5000);
    }, [saveCurrentProgress]);

    const handlePauseOrEnd = useCallback(() => {
        if (saveIntervalRef.current) {
            clearInterval(saveIntervalRef.current);
            saveIntervalRef.current = null;
        }
        saveCurrentProgress();
    }, [saveCurrentProgress]);

    // Documentation Helpers
    const handleSaveLocalFile = () => {
        if (!activeFileId) return;
        const updated = localFileSystem.map(item =>
            item.id === activeFileId ? { ...item, content: noteDraft } : item
        );
        setLocalFileSystem(updated);
        if (onSaveNotes) onSaveNotes(updated);
        toast.success('Nota salva!');
    };

    const handleCreateLocalItem = (type: 'file' | 'folder') => {
        const newItem: DocItem = {
            id: Math.random().toString(36).substr(2, 9),
            name: type === 'file' ? 'Nota de Estudo' : 'Nova Pasta',
            type,
            content: '',
            parentId: currentFolderId,
            createdAt: Date.now()
        };
        const updated = [...localFileSystem, newItem];
        setLocalFileSystem(updated);
        if (onSaveNotes) onSaveNotes(updated);
        if (type === 'file') {
            setActiveFileId(newItem.id);
            setNoteDraft('');
        }
    };

    const handleDeleteLocalItem = (id: string) => {
        const updated = localFileSystem.filter(item => item.id !== id);
        setLocalFileSystem(updated);
        if (onSaveNotes) onSaveNotes(updated);
        toast.success('Nota removida');
    };

    const handleRenameLocalDoc = (id: string) => {
        if (!editNameValue.trim()) return;
        const updated = localFileSystem.map(item =>
            item.id === id ? { ...item, name: editNameValue.trim() } : item
        );
        setLocalFileSystem(updated);
        if (onSaveNotes) onSaveNotes(updated);
        setEditingDocId(null);
        toast.success('Renomeado com sucesso');
    };

    const filteredDocItems = localFileSystem.filter(item => {
        const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFolder = item.parentId === (searchTerm ? item.parentId : currentFolderId);
        return searchTerm ? matchesSearch : matchesFolder;
    });

    const breadcrumbs = [];
    let tempId = currentFolderId;
    while (tempId) {
        const folder = localFileSystem.find(i => i.id === tempId);
        if (folder) {
            breadcrumbs.unshift(folder);
            tempId = folder.parentId;
        } else break;
    }

    if (!goal || !goal.youtubeLink) return null;

    const extractUrl = (text: string) => {
        if (!text) return '';
        const match = text.match(/https?:\/\/[^\s]+/);
        return match ? match[0] : text;
    };

    const cleanUrl = (() => {
        const extracted = extractUrl(goal.youtubeLink || '');
        if (!extracted) return '';
        // Basic check to see if it looks like a URL
        if (extracted.includes('youtube.com') || extracted.includes('youtu.be')) {
            if (!/^https?:\/\//i.test(extracted)) return `https://${extracted}`;
            return extracted;
        }
        // If it's not a youtube link but we are in a youtube player dialog, we might want to flag it
        return extracted;
    })();

    const isYouTube = cleanUrl.includes('youtube.com') || cleanUrl.includes('youtu.be') || cleanUrl.includes('vimeo.com') || cleanUrl.includes('facebook.com');

    return (
        <Dialog open={isOpen} onOpenChange={(open) => {
            if (!open) {
                if (saveIntervalRef.current) clearInterval(saveIntervalRef.current);
                saveCurrentProgress();
                onClose();
            }
        }}>
            <DialogContent className={cn(
                "p-0 overflow-hidden bg-[#0a0a0a] border-white/[0.05] shadow-2xl transition-all duration-500 rounded-[32px]",
                isFullScreen ? "sm:max-w-[95vw] h-[90vh]" : "sm:max-w-[1200px] h-[80vh]"
            )}>
                <div className="flex h-full flex-col lg:flex-row divide-x divide-white/[0.05]">
                    {/* Left: Video Player (Col 7/12) */}
                    <div className="flex-1 lg:flex-[7] bg-[#050505] flex flex-col relative min-h-[300px]">
                        <div className="flex-1 relative group bg-black">
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
                                <Youtube className="w-12 h-12 text-white" />
                            </div>
                            {!isYouTube ? (
                                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 text-muted-foreground bg-black/50">
                                    <p className="text-sm font-medium">Link inválido.</p>
                                </div>
                            ) : (
                                <ReactPlayer
                                    ref={playerRef}
                                    url={cleanUrl}
                                    width="100%"
                                    height="100%"
                                    controls={true}
                                    playing={isOpen && !videoError}
                                    onPlay={handlePlay}
                                    onProgress={handleProgress}
                                    onPause={handlePauseOrEnd}
                                    onEnded={handlePauseOrEnd}
                                    onError={(e) => {
                                        console.error("Video Error:", e);
                                        setVideoError("Erro ao carregar o vídeo. Verifique se o link está correto ou se o vídeo é privado.");
                                    }}
                                    // @ts-ignore
                                    config={{ youtube: { playerVars: { start: Math.floor(goal.youtubeTimestamp || 0), modestbranding: 1, rel: 0 } } }}
                                />
                            )}

                            {videoError && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 text-red-400 bg-black/80 backdrop-blur-sm z-10">
                                    <X className="w-8 h-8 mb-4 border-2 border-red-400 rounded-full p-1" />
                                    <p className="text-sm font-bold uppercase tracking-widest">{videoError}</p>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setVideoError(null)}
                                        className="mt-4 border-red-400/20 text-red-300 hover:bg-red-400/10"
                                    >
                                        Tentar Novamente
                                    </Button>
                                </div>
                            )}

                            {/* Player Tools Overlay */}
                            <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button
                                    size="icon"
                                    variant="secondary"
                                    className="h-8 w-8 rounded-full bg-black/60 hover:bg-black/80 border border-white/10 backdrop-blur-md"
                                    onClick={() => setIsFullScreen(!isFullScreen)}
                                >
                                    {isFullScreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                                </Button>
                                <Button
                                    size="icon"
                                    variant="secondary"
                                    className="h-8 w-8 rounded-full bg-black/60 hover:bg-black/80 border border-white/10 backdrop-blur-md"
                                    onClick={onClose}
                                >
                                    <X className="w-3.5 h-3.5" />
                                </Button>
                            </div>
                        </div>

                        {/* Video Info Bar */}
                        <div className="p-4 border-t border-white/[0.05] bg-white/[0.02]">
                            <h3 className="text-sm font-bold text-white/90 line-clamp-1">{goal.title}</h3>
                            <div className="flex items-center gap-2 mt-1">
                                <Badge variant="outline" className="text-[10px] bg-red-500/10 text-red-500 border-none px-1.5 py-0 h-4 uppercase tracking-widest font-black">Estudo Ativo</Badge>
                                <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest">Sincronizado com Drive</span>
                            </div>
                        </div>
                    </div>

                    {/* Right: Study Docs (Col 5/12) */}
                    <div className="flex-1 lg:flex-[5] bg-[#0a0a0a] flex flex-col h-full overflow-hidden">
                        <div className="p-4 border-b border-white/[0.05] bg-white/[0.01] flex items-center justify-between">
                            <div className="flex flex-col min-w-0">
                                <div className="flex items-center gap-2">
                                    <div className="p-2 bg-blue-500/10 rounded-lg">
                                        <Folder className="w-3.5 h-3.5 text-blue-500" />
                                    </div>
                                    <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white/40">Notas de Estudo</span>
                                </div>
                                <div className="flex items-center gap-1.5 mt-1 text-[8px] font-black text-muted-foreground uppercase tracking-widest overflow-hidden">
                                    <span className="hover:text-primary cursor-pointer transition-colors" onClick={() => { setCurrentFolderId(null); setActiveFileId(null); setSearchTerm(''); }}>Drive</span>
                                    {breadcrumbs.map(b => (
                                        <React.Fragment key={b.id}>
                                            <ChevronRight className="w-2.5 h-2.5 opacity-30" />
                                            <span className="hover:text-blue-400 cursor-pointer truncate max-w-[60px]" onClick={() => { setCurrentFolderId(b.id); setActiveFileId(null); setSearchTerm(''); }}>{b.name}</span>
                                        </React.Fragment>
                                    ))}
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                {!activeFileId && (
                                    <div className="relative w-24 md:w-32">
                                        <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
                                        <Input
                                            placeholder="Buscar..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="pl-6 h-7 text-[10px] bg-white/[0.02] border-white/[0.05] rounded-lg"
                                        />
                                    </div>
                                )}
                                <div className="flex gap-1">
                                    {!activeFileId ? (
                                        <Button size="icon" variant="ghost" className="h-8 w-8 rounded-lg" onClick={() => handleCreateLocalItem('file')}>
                                            <Plus className="w-3.5 h-3.5 text-blue-500" />
                                        </Button>
                                    ) : (
                                        <Button size="icon" variant="ghost" className="h-8 w-8 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20" onClick={handleSaveLocalFile}>
                                            <Save className="w-3.5 h-3.5 text-emerald-500" />
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                            {activeFileId ? (
                                <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                                    <Button variant="ghost" size="sm" onClick={() => setActiveFileId(null)} className="h-7 text-[9px] font-black uppercase tracking-widest gap-2 -ml-2">
                                        <ArrowLeft className="w-3 h-3" /> Arquivos
                                    </Button>
                                    <ObsidianDocEditor
                                        value={noteDraft}
                                        onChange={setNoteDraft}
                                        onSave={handleSaveLocalFile}
                                        onOpenWikiLink={(docId) => {
                                            const doc = localFileSystem.find((i) => i.id === docId);
                                            if (doc && doc.type === 'file') {
                                                setActiveFileId(doc.id);
                                                setNoteDraft(doc.content || '');
                                            }
                                        }}
                                        onRequestCreateDoc={(docName) => {
                                            const newItem: DocItem = {
                                                id: Math.random().toString(36).substr(2, 9),
                                                name: docName.trim() || 'Nota de Estudo',
                                                type: 'file',
                                                content: '',
                                                parentId: currentFolderId,
                                                createdAt: Date.now(),
                                            };
                                            const updated = [...localFileSystem, newItem];
                                            setLocalFileSystem(updated);
                                            if (onSaveNotes) onSaveNotes(updated);
                                            setActiveFileId(newItem.id);
                                            setNoteDraft('');
                                            toast.success(`Documento "${newItem.name}" criado.`);
                                        }}
                                        allItems={localFileSystem as unknown as DocItemForEditor[]}
                                        currentDocName={localFileSystem.find((i) => i.id === activeFileId)?.name ?? ''}
                                        currentDocId={activeFileId}
                                        placeholder="Tome nota de algo importante... Use os botões para negrito, itálico, título, listas e links entre documentos."
                                    />
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 gap-2">
                                    {filteredDocItems.map(item => (
                                        <div
                                            key={item.id}
                                            className="group flex items-center gap-3 p-3 rounded-2xl bg-white/[0.02] border border-white/[0.03] hover:bg-white/[0.05] hover:border-white/[0.1] transition-all cursor-pointer relative"
                                            onClick={() => item.type === 'folder' ? (setCurrentFolderId(item.id), setSearchTerm('')) : (setActiveFileId(item.id), setNoteDraft(item.content || ''))}
                                        >
                                            <div className={cn("p-2 rounded-lg", item.type === 'folder' ? "bg-blue-500/10 text-blue-500" : "bg-emerald-500/10 text-emerald-500")}>
                                                {item.type === 'folder' ? <Folder className="w-3.5 h-3.5" /> : <FileText className="w-3.5 h-3.5" />}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                {editingDocId === item.id ? (
                                                    <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                                                        <Input
                                                            value={editNameValue}
                                                            onChange={e => setEditNameValue(e.target.value)}
                                                            onKeyDown={e => e.key === 'Enter' && handleRenameLocalDoc(item.id)}
                                                            className="h-6 text-[10px] px-1"
                                                            autoFocus
                                                        />
                                                        <Button size="icon" variant="ghost" className="h-6 w-6 text-emerald-500" onClick={() => handleRenameLocalDoc(item.id)}>
                                                            <Save className="w-3 h-3" />
                                                        </Button>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <p className="text-[11px] font-bold text-white/80 truncate leading-none">{item.name}</p>
                                                        <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mt-1">{item.type === 'folder' ? 'Pasta' : 'Documento'}</p>
                                                    </>
                                                )}
                                            </div>
                                            <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className="h-7 px-2 rounded-lg hover:bg-white/10 text-[9px] font-bold uppercase tracking-wider gap-1"
                                                    title={item.type === 'folder' ? 'Renomear pasta' : 'Renomear documento'}
                                                    onClick={(e) => { e.stopPropagation(); setEditingDocId(item.id); setEditNameValue(item.name); }}
                                                >
                                                    <Pencil className="w-3 h-3" />
                                                    Renomear
                                                </Button>
                                                <Button size="icon" variant="ghost" className="h-7 w-7 rounded-full hover:bg-red-500/20 hover:text-red-500" title="Excluir" onClick={(e) => { e.stopPropagation(); handleDeleteLocalItem(item.id); }}>
                                                    <Trash2 className="w-3 h-3" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                    {filteredDocItems.length === 0 && (
                                        <div className="py-20 flex flex-col items-center justify-center opacity-10">
                                            <Plus className="w-8 h-8 mb-2" />
                                            <p className="text-[10px] font-black uppercase tracking-widest">Sem notas</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Breadcrumbs for Side Panel */}
                        {!activeFileId && currentFolderId && (
                            <div className="p-3 border-t border-white/[0.05] bg-black/40">
                                <Button variant="ghost" size="sm" onClick={() => setCurrentFolderId(null)} className="h-6 text-[9px] font-black uppercase tracking-widest">
                                    <ArrowLeft className="w-3 h-3 mr-2" /> Voltar ao Início
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};
