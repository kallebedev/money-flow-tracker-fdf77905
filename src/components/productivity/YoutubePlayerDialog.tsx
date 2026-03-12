import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import ReactPlayer from 'react-player';
import { Goal, DocItem, PlaylistVideo } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import {
    Youtube, Folder, FileText, ChevronRight, Save,
    ArrowLeft, Plus, Trash2, X, Maximize2, Minimize2,
    Search, Pencil, List, Brain
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { RichTextEditor } from './RichTextEditor';
import { useFocusTracker } from '@/hooks/useFocusTracker';

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
    const playlistBootstrapTimerRef = useRef<NodeJS.Timeout | null>(null);
    const playlistBootstrapAttemptsRef = useRef(0);
    const fetchedVideoTitlesRef = useRef<Set<string>>(new Set());

    // Playlist state
    const [playlistVideos, setPlaylistVideos] = useState<PlaylistVideo[]>([]);
    const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
    const [showPlaylist, setShowPlaylist] = useState(true);
    const [isPlaying, setIsPlaying] = useState(false);

    // Focus tracking
    const { focusScore, totalFocusSeconds, totalAwaySeconds, distractions, pauses, recordPause } = useFocusTracker(isOpen && isPlaying);

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

    // Track the goal ID to reset state only when a different goal opens
    const prevGoalIdRef = useRef<string | null>(null);

    useEffect(() => {
        if (isOpen && goal) {
            const goalChanged = prevGoalIdRef.current !== goal.id;
            prevGoalIdRef.current = goal.id;

            if (goalChanged) {
                if (docItems && docItems.length > 0) {
                    setLocalFileSystem(docItems);
                } else {
                    setLocalFileSystem([]);
                }
                setPlaylistVideos([]);
                setCurrentVideoIndex(0);
                setShowPlaylist(true);
                setCurrentFolderId(null);
                setActiveFileId(null);
                setNoteDraft('');
                setSearchTerm('');
                setVideoError(null);
                fetchedVideoTitlesRef.current.clear();
                playlistBootstrapAttemptsRef.current = 0;
                if (playlistBootstrapTimerRef.current) {
                    clearTimeout(playlistBootstrapTimerRef.current);
                    playlistBootstrapTimerRef.current = null;
                }
            }
        } else if (!isOpen) {
            prevGoalIdRef.current = null;
            playlistBootstrapAttemptsRef.current = 0;
            if (playlistBootstrapTimerRef.current) {
                clearTimeout(playlistBootstrapTimerRef.current);
                playlistBootstrapTimerRef.current = null;
            }
        }
    }, [isOpen, goal?.id, docItems]);

    // URL processing
    const extractUrl = (text: string) => {
        if (!text) return '';
        const match = text.match(/https?:\/\/[^\s]+/);
        return match ? match[0] : text;
    };

    const cleanUrl = (() => {
        const extracted = extractUrl(goal?.youtubeLink || '');
        if (!extracted) return '';
        if (extracted.includes('youtube.com') || extracted.includes('youtu.be')) {
            if (!/^https?:\/\//i.test(extracted)) return `https://${extracted}`;
            return extracted;
        }
        return extracted;
    })();

    const isYouTube = cleanUrl.includes('youtube.com') || cleanUrl.includes('youtu.be');
    const isPlaylist = cleanUrl.includes('list=');

    const fetchVideoTitle = useCallback((videoId: string) => {
        if (fetchedVideoTitlesRef.current.has(videoId)) return;
        fetchedVideoTitlesRef.current.add(videoId);

        fetch(`https://noembed.com/embed?url=https://www.youtube.com/watch?v=${videoId}`)
            .then(r => r.json())
            .then(data => {
                if (data?.title) {
                    setPlaylistVideos(prev => prev.map(v => v.videoId === videoId ? { ...v, title: data.title } : v));
                }
            })
            .catch(() => { });
    }, []);

    const hydratePlaylistFromPlayer = useCallback(() => {
        if (!isPlaylist) return false;

        try {
            const internal = playerRef.current?.getInternalPlayer();
            const videoIds: string[] = internal?.getPlaylist?.() || [];
            if (videoIds.length === 0) return false;

            setShowPlaylist(true);
            setPlaylistVideos(prev => {
                const prevById = new Map(prev.map(v => [v.videoId, v]));
                return videoIds.map((videoId, index) => {
                    const previous = prevById.get(videoId);
                    if (!previous) fetchVideoTitle(videoId);

                    return {
                        videoId,
                        title: previous?.title || `Vídeo ${index + 1}`,
                        index,
                        watchedPercent: previous?.watchedPercent ?? 0,
                        status: previous?.status ?? 'not-started',
                    } as PlaylistVideo;
                });
            });

            const idx = internal?.getPlaylistIndex?.();
            if (typeof idx === 'number' && idx >= 0) {
                setCurrentVideoIndex(idx);
            }

            return true;
        } catch {
            return false;
        }
    }, [fetchVideoTitle, isPlaylist]);

    const startPlaylistBootstrap = useCallback(() => {
        if (!isPlaylist) return;

        if (playlistBootstrapTimerRef.current) {
            clearTimeout(playlistBootstrapTimerRef.current);
            playlistBootstrapTimerRef.current = null;
        }

        playlistBootstrapAttemptsRef.current = 0;

        const run = () => {
            const loaded = hydratePlaylistFromPlayer();
            if (loaded || playlistBootstrapAttemptsRef.current >= 8) return;

            playlistBootstrapAttemptsRef.current += 1;
            playlistBootstrapTimerRef.current = setTimeout(run, 600);
        };

        run();
    }, [hydratePlaylistFromPlayer, isPlaylist]);

    // Progress handlers
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
                    if (duration > 0) progress = Math.round((currentTime / duration) * 100);
                }
            } catch (e) { }
        }
        if (onSaveProgress && (progress > 0 || timestamp > 0)) {
            onSaveProgress(goal.id, progress, timestamp);
        }
    }, [goal, onSaveProgress]);

    const handleProgress = useCallback((state: any) => {
        if (!goal || state.seeking) return;
        const globalProgress = Math.round((state.played || 0) * 100);
        lastKnownProgressRef.current = globalProgress;
        if (state.playedSeconds > 0) lastKnownTimestampRef.current = state.playedSeconds;
        if (lastKnownProgress !== globalProgress) setLastKnownProgress(globalProgress);
        if (onLiveProgress && goal) onLiveProgress(goal.id, globalProgress);

        if (isPlaylist && playlistVideos.length === 0) {
            hydratePlaylistFromPlayer();
            return;
        }

        // Update playlist video progress
        if (isPlaylist && playlistVideos.length > 0) {
            try {
                const internal = playerRef.current?.getInternalPlayer();
                const idx = internal?.getPlaylistIndex?.() ?? currentVideoIndex;
                if (idx !== currentVideoIndex) setCurrentVideoIndex(idx);
                const percent = Math.round((state.played || 0) * 100);
                setPlaylistVideos(prev => prev.map((v, i) => {
                    if (i === idx) {
                        const newPercent = Math.max(v.watchedPercent, percent);
                        const status = newPercent < 20 ? 'not-started' : newPercent >= 90 ? 'completed' : 'in-progress';
                        return { ...v, watchedPercent: newPercent, status };
                    }
                    return v;
                }));
            } catch { }
        }
    }, [goal, onLiveProgress, lastKnownProgress, isPlaylist, currentVideoIndex, playlistVideos.length, hydratePlaylistFromPlayer]);

    const handlePlay = useCallback(() => {
        setIsPlaying(true);
        if (isPlaylist && playlistVideos.length === 0) {
            startPlaylistBootstrap();
        }
        if (saveIntervalRef.current) clearInterval(saveIntervalRef.current);
        saveIntervalRef.current = setInterval(() => saveCurrentProgress(), 5000);
    }, [isPlaylist, playlistVideos.length, saveCurrentProgress, startPlaylistBootstrap]);

    const handlePauseOrEnd = useCallback(() => {
        setIsPlaying(false);
        recordPause();
        if (saveIntervalRef.current) { clearInterval(saveIntervalRef.current); saveIntervalRef.current = null; }
        saveCurrentProgress();
    }, [saveCurrentProgress, recordPause]);

    const handleReady = useCallback(() => {
        if (!isPlaylist) return;
        startPlaylistBootstrap();
    }, [isPlaylist, startPlaylistBootstrap]);

    useEffect(() => {
        return () => {
            if (saveIntervalRef.current) {
                clearInterval(saveIntervalRef.current);
                saveIntervalRef.current = null;
            }
            if (playlistBootstrapTimerRef.current) {
                clearTimeout(playlistBootstrapTimerRef.current);
                playlistBootstrapTimerRef.current = null;
            }
        };
    }, []);

    const playVideoAt = (idx: number) => {
        try {
            const internal = playerRef.current?.getInternalPlayer();
            internal?.playVideoAt?.(idx);
            setCurrentVideoIndex(idx);
        } catch { }
    };

    // Doc system handlers (with recursive delete fix)
    const handleSaveLocalFile = () => {
        if (!activeFileId) return;
        const updated = localFileSystem.map(item => item.id === activeFileId ? { ...item, content: noteDraft } : item);
        setLocalFileSystem(updated);
        if (onSaveNotes) onSaveNotes(updated);
        toast.success('Nota salva!');
    };

    const handleCreateLocalItem = (type: 'file' | 'folder') => {
        const newItem: DocItem = {
            id: Math.random().toString(36).substr(2, 9),
            name: type === 'file' ? 'Nota de Estudo' : 'Nova Pasta',
            type, content: '', parentId: currentFolderId, createdAt: Date.now()
        };
        const updated = [...localFileSystem, newItem];
        setLocalFileSystem(updated);
        if (onSaveNotes) onSaveNotes(updated);
        if (type === 'file') { setActiveFileId(newItem.id); setNoteDraft(''); }
    };

    // Recursive delete fix
    const handleDeleteLocalItem = (id: string) => {
        const getIdsToDelete = (parentId: string): string[] => {
            const children = localFileSystem.filter(i => i.parentId === parentId);
            let ids = [parentId];
            children.forEach(c => {
                if (c.type === 'folder') ids = [...ids, ...getIdsToDelete(c.id)];
                else ids.push(c.id);
            });
            return ids;
        };
        const idsToDelete = new Set(getIdsToDelete(id));
        const updated = localFileSystem.filter(item => !idsToDelete.has(item.id));
        setLocalFileSystem(updated);
        if (onSaveNotes) onSaveNotes(updated);
        if (activeFileId && idsToDelete.has(activeFileId)) setActiveFileId(null);
        toast.success('Item removido');
    };

    const handleRenameLocalDoc = (id: string, newName?: string) => {
        const name = newName || editNameValue.trim();
        if (!name) return;
        const updated = localFileSystem.map(item => item.id === id ? { ...item, name } : item);
        setLocalFileSystem(updated);
        if (onSaveNotes) onSaveNotes(updated);
        setEditingDocId(null);
        toast.success('Renomeado com sucesso');
    };

    const filteredDocItems = (() => {
        if (searchTerm) {
            return localFileSystem.filter(item => item.name.toLowerCase().includes(searchTerm.toLowerCase()));
        }
        return localFileSystem.filter(item => item.parentId === currentFolderId);
    })();

    const breadcrumbs: DocItem[] = [];
    let tempId = currentFolderId;
    while (tempId) {
        const folder = localFileSystem.find(i => i.id === tempId);
        if (folder) { breadcrumbs.unshift(folder); tempId = folder.parentId; } else break;
    }

    const completedCount = playlistVideos.filter(v => v.status === 'completed').length;

    if (!goal || !goal.youtubeLink) {
        if (isOpen) {
            return (
                <Dialog open={isOpen} onOpenChange={onClose}>
                    <DialogContent className="sm:max-w-[600px] bg-[#0a0a0a] border-white/[0.05]">
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <Youtube className="w-12 h-12 text-red-500/40 mb-4" />
                            <p className="text-sm font-bold text-muted-foreground">Nenhum vídeo ou playlist vinculado</p>
                            <p className="text-xs text-muted-foreground/60 mt-2">Adicione um link do YouTube para esta meta estratégica</p>
                        </div>
                    </DialogContent>
                </Dialog>
            );
        }
        return null;
    }

    return (
        <Dialog open={isOpen} onOpenChange={(open) => {
            if (!open) {
                if (saveIntervalRef.current) clearInterval(saveIntervalRef.current);
                saveCurrentProgress();
                onClose();
            }
        }}>
            <DialogContent className={cn(
                "p-0 overflow-hidden bg-[#0a0a0a] border-white/[0.05] shadow-2xl transition-all duration-500 rounded-[32px] z-[50]",
                isFullScreen ? "sm:max-w-[95vw] h-[90vh]" : isPlaylist && playlistVideos.length > 0 ? "sm:max-w-[1400px] h-[80vh]" : "sm:max-w-[1200px] h-[80vh]"
            )}>
                <div className="flex h-full flex-col md:flex-row md:divide-x divide-y md:divide-y-0 divide-white/[0.05] overflow-y-auto md:overflow-hidden">
                    {/* Left: Video Player */}
                    <div className={cn("flex-1 bg-[#050505] flex flex-col relative min-h-[260px] md:min-h-0",
                        isPlaylist && playlistVideos.length > 0 ? "md:flex-[5]" : "md:flex-[7]"
                    )}>
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
                                    width="100%" height="100%"
                                    controls playing={isOpen && !videoError}
                                    onPlay={handlePlay}
                                    onProgress={handleProgress}
                                    onPause={handlePauseOrEnd}
                                    onEnded={handlePauseOrEnd}
                                    onReady={handleReady}
                                    onError={(e) => { console.error("Video Error:", e); setVideoError("Erro ao carregar o vídeo."); }}
                                    config={{ youtube: { playerVars: { start: Math.floor(goal.youtubeTimestamp || 0), modestbranding: 1, rel: 0 } } }}
                                />
                            )}
                            {videoError && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 text-red-400 bg-black/80 backdrop-blur-sm z-10">
                                    <X className="w-8 h-8 mb-4 border-2 border-red-400 rounded-full p-1" />
                                    <p className="text-sm font-bold">{videoError}</p>
                                    <Button variant="outline" size="sm" onClick={() => setVideoError(null)} className="mt-4 border-red-400/20 text-red-300">Tentar Novamente</Button>
                                </div>
                            )}
                            {/* Focus Score Overlay */}
                            <div className="absolute bottom-4 left-4 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/70 backdrop-blur-md border border-white/10">
                                    <Brain className="w-3 h-3 text-primary" />
                                    <span className="text-[10px] font-black text-white/90 tabular-nums">{focusScore}%</span>
                                </div>
                                {distractions > 0 && (
                                    <div className="px-2 py-1 rounded-full bg-red-500/20 backdrop-blur-md border border-red-500/20">
                                        <span className="text-[9px] font-bold text-red-400">{distractions} distrações</span>
                                    </div>
                                )}
                            </div>
                            {/* Player Tools */}
                            <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                {isPlaylist && (
                                    <Button size="icon" variant="secondary" className="h-8 w-8 rounded-full bg-black/60 hover:bg-black/80 border border-white/10 backdrop-blur-md" onClick={() => setShowPlaylist(!showPlaylist)}>
                                        <List className="w-3.5 h-3.5" />
                                    </Button>
                                )}
                                <Button size="icon" variant="secondary" className="h-8 w-8 rounded-full bg-black/60 hover:bg-black/80 border border-white/10 backdrop-blur-md" onClick={() => setIsFullScreen(!isFullScreen)}>
                                    {isFullScreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                                </Button>
                                <Button size="icon" variant="secondary" className="h-8 w-8 rounded-full bg-black/60 hover:bg-black/80 border border-white/10 backdrop-blur-md" onClick={onClose}>
                                    <X className="w-3.5 h-3.5" />
                                </Button>
                            </div>
                        </div>
                        {/* Video Info Bar */}
                        <div className="p-4 border-t border-white/[0.05] bg-white/[0.02]">
                            <h3 className="text-sm font-bold text-white/90 line-clamp-1">{goal.title}</h3>
                            <div className="flex items-center gap-2 mt-1">
                                <Badge variant="outline" className="text-[10px] bg-red-500/10 text-red-500 border-none px-1.5 py-0 h-4 uppercase tracking-widest font-black">Estudo Ativo</Badge>
                                {isPlaylist && playlistVideos.length > 0 && (
                                    <span className="text-[10px] text-muted-foreground font-bold">{completedCount}/{playlistVideos.length} concluídos</span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Playlist Sidebar */}
                    {isPlaylist && playlistVideos.length > 0 && showPlaylist && (
                        <div className="md:flex-[2] flex flex-col bg-[#080808] overflow-hidden min-w-0 h-[220px] md:h-full md:min-h-0">
                            <div className="p-3 border-b border-white/[0.05] flex items-center justify-between shrink-0">
                                <div className="flex items-center gap-2">
                                    <List className="w-3.5 h-3.5 text-red-500" />
                                    <span className="text-[9px] font-black uppercase tracking-widest text-white/40">Playlist</span>
                                </div>
                                <span className="text-[9px] font-black text-primary tabular-nums">{completedCount}/{playlistVideos.length}</span>
                            </div>
                            <div className="flex-1 overflow-y-auto custom-scrollbar">
                                <div className="p-2 space-y-0.5">
                                    {playlistVideos.map((video, idx) => (
                                        <div key={video.videoId}
                                            className={cn(
                                                "flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-all text-[11px]",
                                                idx === currentVideoIndex ? "bg-primary/10 border border-primary/20" : "hover:bg-white/[0.03]"
                                            )}
                                            onClick={() => playVideoAt(idx)}
                                        >
                                            <span className="text-[9px] font-black text-muted-foreground w-5 text-right shrink-0">{idx + 1}</span>
                                            <span className="shrink-0">{video.status === 'completed' ? '✅' : video.status === 'in-progress' ? '🟨' : '⬜'}</span>
                                            <span className={cn("flex-1 truncate text-[10px]", idx === currentVideoIndex && "text-primary font-bold")}>{video.title}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="p-3 border-t border-white/[0.05] shrink-0">
                                <div className="flex justify-between text-[9px] font-black text-muted-foreground mb-1">
                                    <span>Progresso</span>
                                    <span>{completedCount}/{playlistVideos.length}</span>
                                </div>
                                <Progress value={playlistVideos.length > 0 ? (completedCount / playlistVideos.length) * 100 : 0} className="h-1 bg-white/[0.05]" />
                            </div>
                        </div>
                    )}

                    {/* Right: Study Docs */}
                    <div className={cn("flex-1 bg-[#0a0a0a] flex flex-col min-h-[300px] md:min-h-0 overflow-hidden relative z-10",
                        isPlaylist && playlistVideos.length > 0 ? "md:flex-[3]" : "md:flex-[5]"
                    )}>
                        <div className="p-4 border-b border-white/[0.05] bg-white/[0.01] flex items-center justify-between shrink-0">
                            <div className="flex flex-col min-w-0">
                                <div className="flex items-center gap-2">
                                    <div className="p-2 bg-blue-500/10 rounded-lg"><Folder className="w-3.5 h-3.5 text-blue-500" /></div>
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
                                        <Input placeholder="Buscar..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-6 h-7 text-[10px] bg-white/[0.02] border-white/[0.05] rounded-lg" />
                                    </div>
                                )}
                                <div className="flex gap-1">
                                    {!activeFileId ? (
                                        <>
                                            <Button size="icon" variant="ghost" className="h-8 w-8 rounded-lg" onClick={() => handleCreateLocalItem('folder')}><Folder className="w-3.5 h-3.5 text-blue-500" /></Button>
                                            <Button size="icon" variant="ghost" className="h-8 w-8 rounded-lg" onClick={() => handleCreateLocalItem('file')}><Plus className="w-3.5 h-3.5 text-blue-500" /></Button>
                                        </>
                                    ) : (
                                        <Button size="icon" variant="ghost" className="h-8 w-8 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20" onClick={handleSaveLocalFile}><Save className="w-3.5 h-3.5 text-emerald-500" /></Button>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar relative z-20">
                            {activeFileId ? (
                                <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                                    <Button variant="ghost" size="sm" onClick={() => setActiveFileId(null)} className="h-7 text-[9px] font-black uppercase tracking-widest gap-2 -ml-2">
                                        <ArrowLeft className="w-3 h-3" /> Arquivos
                                    </Button>
                                    <RichTextEditor content={noteDraft} onChange={setNoteDraft} placeholder="Tome nota de algo importante..." />
                                    <div className="mt-3 flex items-center gap-3">
                                        <Button onClick={handleSaveLocalFile} className="h-8 px-5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-[9px] font-black uppercase tracking-widest gap-2">
                                            <Save className="w-3 h-3" /> Salvar
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 gap-2">
                                    {filteredDocItems.map(item => (
                                        <div key={item.id}
                                            className="group flex items-center gap-3 p-3 rounded-2xl bg-white/[0.02] border border-white/[0.03] hover:bg-white/[0.05] hover:border-white/[0.1] transition-all cursor-pointer relative z-30"
                                            onClick={() => item.type === 'folder' ? (setCurrentFolderId(item.id), setSearchTerm('')) : (setActiveFileId(item.id), setNoteDraft(item.content || ''))}
                                        >
                                            <div className={cn("p-2 rounded-lg", item.type === 'folder' ? "bg-blue-500/10 text-blue-500" : "bg-emerald-500/10 text-emerald-500")}>
                                                {item.type === 'folder' ? <Folder className="w-3.5 h-3.5" /> : <FileText className="w-3.5 h-3.5" />}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                {editingDocId === item.id ? (
                                                    <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                                                        <Input value={editNameValue} onChange={e => setEditNameValue(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') handleRenameLocalDoc(item.id); if (e.key === 'Escape') setEditingDocId(null); }} className="h-6 text-[10px] px-1" autoFocus />
                                                        <Button size="icon" variant="ghost" className="h-6 w-6 text-emerald-500" onClick={() => handleRenameLocalDoc(item.id)}><Save className="w-3 h-3" /></Button>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <p className="text-[11px] font-bold text-white/80 truncate leading-none">{item.name}</p>
                                                        <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mt-1">{item.type === 'folder' ? 'Pasta' : 'Documento'}</p>
                                                    </>
                                                )}
                                            </div>
                                            <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity relative z-40" onClick={e => e.stopPropagation()}>
                                                <Button size="sm" variant="ghost" className="h-7 px-2 rounded-lg hover:bg-white/10 text-[9px] font-bold uppercase tracking-wider gap-1"
                                                    onClick={() => { setEditingDocId(item.id); setEditNameValue(item.name); }}>
                                                    <Pencil className="w-3 h-3" /> Renomear
                                                </Button>
                                                <Button size="icon" variant="ghost" className="h-7 w-7 rounded-full hover:bg-red-500/20 hover:text-red-500"
                                                    onClick={() => handleDeleteLocalItem(item.id)}>
                                                    <Trash2 className="w-3 h-3" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                    {filteredDocItems.length === 0 && (
                                        <div className="py-20 flex flex-col items-center justify-center opacity-10">
                                            <Plus className="w-8 h-8 mb-2" /><p className="text-[10px] font-black uppercase tracking-widest">Sem notas</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {!activeFileId && currentFolderId && (
                            <div className="p-3 border-t border-white/[0.05] bg-black/40 shrink-0">
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
