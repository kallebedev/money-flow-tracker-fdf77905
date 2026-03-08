import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Slider } from '@/components/ui/slider';
import { X, Play, Pause, RotateCcw, Volume2, CloudRain, Trees, Coffee, Waves } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useProductivity } from '@/hooks/useProductivity';
import { toast } from 'sonner';

const AMBIENT_SOUNDS = [
    { id: 'rain', icon: CloudRain, label: 'Chuva', url: 'https://cdn.pixabay.com/audio/2024/10/30/audio_42e6870f29.mp3' },
    { id: 'forest', icon: Trees, label: 'Floresta', url: 'https://cdn.pixabay.com/audio/2025/02/03/audio_7599bcb342.mp3' },
    { id: 'cafe', icon: Coffee, label: 'Café', url: 'https://cdn.pixabay.com/audio/2022/02/07/audio_6872fe6dc2.mp3' },
    { id: 'waves', icon: Waves, label: 'Ondas', url: 'https://cdn.pixabay.com/audio/2025/07/09/audio_56227295c2.mp3' },
];

interface FocusModeProps {
    onClose: () => void;
    activeTaskId?: string;
    /** Chamado quando uma sessão de foco é concluída (bloco completo ou parcial ao fechar) */
    onSessionComplete?: (durationMinutes: number) => void;
}

const FocusMode: React.FC<FocusModeProps> = ({ onClose, activeTaskId, onSessionComplete }) => {
    const { tasks } = useProductivity();
    const activeTask = tasks.find(t => t.id === activeTaskId);

    // Timer State
    const [timeLeft, setTimeLeft] = useState(25 * 60);
    const [isActive, setIsActive] = useState(false);
    const [mode, setMode] = useState<'work' | 'break'>('work');

    // Audio State
    const [selectedSound, setSelectedSound] = useState<string | null>(null);
    const [volume, setVolume] = useState([50]);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        let interval: any;
        if (isActive && timeLeft > 0) {
            interval = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
        } else if (timeLeft === 0) {
            const nextMode = mode === 'work' ? 'break' : 'work';
            if (mode === 'work') {
                onSessionComplete?.(25);
            }
            setMode(nextMode);
            setTimeLeft(nextMode === 'work' ? 25 * 60 : 5 * 60);
            setIsActive(false);
            toast.info(nextMode === 'work' ? "Hora de focar!" : "Hora do intervalo!");
        }
        return () => clearInterval(interval);
    }, [isActive, timeLeft, mode]);

    // Fullscreen effect
    useEffect(() => {
        const enterFullscreen = async () => {
            try {
                if (!document.fullscreenElement) {
                    await document.documentElement.requestFullscreen();
                }
            } catch (err) {
                console.error(`Error attempting to enable fullscreen: ${err}`);
            }
        };

        enterFullscreen();

        return () => {
            if (document.fullscreenElement) {
                document.exitFullscreen().catch(err => {
                    console.error(`Error attempting to exit fullscreen: ${err}`);
                });
            }
        };
    }, []);

    const handleClose = async () => {
        if (mode === 'work') {
            const workMinutesElapsed = Math.floor((25 * 60 - timeLeft) / 60);
            if (workMinutesElapsed > 0) onSessionComplete?.(workMinutesElapsed);
        }
        if (document.fullscreenElement) {
            try {
                await document.exitFullscreen();
            } catch (err) {
                console.error(`Error exiting fullscreen: ${err}`);
            }
        }
        onClose();
    };

    useEffect(() => {
        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current = null;
            }
        };
    }, []);

    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.volume = volume[0] / 100;
        }
    }, [volume]);

    const toggleSound = (soundId: string) => {
        if (selectedSound === soundId) {
            audioRef.current?.pause();
            setSelectedSound(null);
        } else {
            setSelectedSound(soundId);
            const sound = AMBIENT_SOUNDS.find(s => s.id === soundId);
            if (sound) {
                if (!audioRef.current) {
                    audioRef.current = new Audio();
                    audioRef.current.crossOrigin = "anonymous";
                }
                audioRef.current.src = sound.url;
                audioRef.current.loop = true;
                audioRef.current.volume = volume[0] / 100;
                audioRef.current.play().catch(e => {
                    console.error("Audio play blocked", e);
                    toast.error("Clique em qualquer lugar da tela para liberar o som");
                });
            }
        }
    };

    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    const progress = (timeLeft / (mode === 'work' ? 25 * 60 : 5 * 60)) * 100;

    return (
        <div className="fixed inset-0 z-[100] bg-background/98 backdrop-blur-3xl flex flex-col items-center justify-center animate-in fade-in duration-700 overflow-hidden px-4">
            <Button
                variant="ghost"
                size="icon"
                className="fixed top-6 right-6 text-muted-foreground hover:text-foreground hover:bg-transparent z-[110]"
                onClick={handleClose}
            >
                <X className="w-8 h-8" />
            </Button>

            <div className="max-w-4xl w-full flex flex-col items-center gap-4 sm:gap-10 text-center h-full max-h-[620px] justify-between py-4">
                {/* Active Task Info */}
                <div className="space-y-1">
                    <span className="text-primary font-black uppercase tracking-[0.4em] text-[10px] opacity-60">
                        {mode === 'work' ? 'Foco Profundo' : 'Descanso'}
                    </span>
                    <h2 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tighter text-foreground leading-tight">
                        {activeTask?.title || 'Hora de Focar'}
                    </h2>
                    <p className="text-muted-foreground max-w-md mx-auto text-xs sm:text-sm opacity-80">
                        Distrações bloqueadas. Mantenha o fluxo.
                    </p>
                </div>

                {/* Big Timer */}
                <div className="relative inline-flex flex-col items-center group">
                    <div className="text-7xl sm:text-[9rem] md:text-[11rem] font-black tracking-tighter tabular-nums select-none opacity-95 leading-[0.7] py-2">
                        {minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}
                    </div>

                    <div className="w-full max-w-[240px] sm:max-w-sm mt-4">
                        <Progress value={100 - progress} className="h-1 bg-primary/5" />
                    </div>

                    <div className="flex gap-4 sm:gap-6 mt-6">
                        <Button
                            size="lg"
                            className="h-14 w-14 sm:h-16 sm:w-16 rounded-full shadow-2xl shadow-primary/20 hover:scale-105 transition-all text-primary-foreground p-0"
                            onClick={() => setIsActive(!isActive)}
                        >
                            {isActive ? <Pause className="w-5 h-5 sm:w-6 sm:h-6" /> : <Play className="w-5 h-5 sm:w-6 sm:h-6 ml-1" />}
                        </Button>
                        <Button
                            variant="outline"
                            size="lg"
                            className="h-14 w-14 sm:h-16 sm:w-16 rounded-full border-primary/10 bg-background/50 hover:bg-primary/5 hover:border-primary/20 transition-all text-muted-foreground p-0"
                            onClick={() => {
                                setTimeLeft(mode === 'work' ? 25 * 60 : 5 * 60);
                                setIsActive(false);
                            }}
                        >
                            <RotateCcw className="w-5 h-5 sm:w-6 sm:h-6" />
                        </Button>
                    </div>
                </div>

                {/* Ambient Sounds Section */}
                <div className="border-t border-white/[0.03] max-w-xl mx-auto w-full pt-6">
                    <div className="flex flex-col items-center gap-4 sm:gap-6">
                        <div className="grid grid-cols-4 gap-3 sm:gap-5">
                            {AMBIENT_SOUNDS.map((sound) => (
                                <div key={sound.id} className="flex flex-col items-center gap-1.5">
                                    <Button
                                        variant={selectedSound === sound.id ? 'default' : 'outline'}
                                        className={cn(
                                            "rounded-2xl h-12 w-12 sm:h-16 sm:w-16 border-white/[0.03] bg-background/40 hover:bg-primary/5 transition-all duration-300 p-0",
                                            selectedSound === sound.id && "shadow-xl shadow-primary/20 ring-2 ring-primary/20 text-primary-foreground"
                                        )}
                                        onClick={() => toggleSound(sound.id)}
                                    >
                                        <sound.icon className={cn("w-4 h-4 sm:w-5 sm:h-5", selectedSound === sound.id ? "animate-pulse" : "opacity-40 hover:opacity-100")} />
                                    </Button>
                                    <span className="text-[7px] sm:text-[9px] uppercase font-black tracking-widest text-muted-foreground opacity-50">
                                        {sound.label}
                                    </span>
                                </div>
                            ))}
                        </div>

                        {/* Volume Control */}
                        {selectedSound && (
                            <div className="flex items-center gap-4 w-full max-w-[200px] animate-in slide-in-from-bottom-2 duration-500 bg-card/40 px-4 py-2 rounded-xl border border-white/[0.03]">
                                <Volume2 className="w-3.5 h-3.5 text-muted-foreground opacity-60 shrink-0" />
                                <Slider
                                    value={volume}
                                    onValueChange={setVolume}
                                    max={100}
                                    step={1}
                                    className="w-full"
                                />
                            </div>
                        )}
                    </div>
                </div>

                {/* Focus Mode Footer Tag */}
                <div className="flex items-center gap-3 px-5 py-1.5 bg-primary/2 rounded-xl border border-primary/5 backdrop-blur-md">
                    <div className="w-1 h-1 rounded-full bg-red-500 animate-ping" />
                    <span className="text-[8px] font-black uppercase tracking-[0.3em] text-primary/80">
                        Estado de Fluxo Ativo
                    </span>
                </div>
            </div>
        </div>
    );
};

export default FocusMode;
