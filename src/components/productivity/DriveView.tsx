import React, { useState, useEffect } from 'react';
import { DocItem, Goal } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
    Folder, FileText, Plus, Search, Trash2, Pencil,
    Save, ArrowLeft, ChevronRight, HardDrive, Filter
} from 'lucide-react';
import { useProductivity } from '@/hooks/useProductivity';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export const DriveView: React.FC = () => {
    const { goals, updateGoal } = useProductivity();

    // We'll use a specific "Global" goal to store drive items, or create one if not found
    const globalGoal = goals.find(g => g.title === 'MONEYFLOW_GLOBAL_DRIVE') ||
        goals.find(g => g.notes?.includes('MONEYFLOW_GLOBAL_DRIVE'));

    const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
    const [activeFileId, setActiveFileId] = useState<string | null>(null);
    const [fileSystem, setFileSystem] = useState<DocItem[]>([]);
    const [noteDraft, setNoteDraft] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editNameValue, setEditNameValue] = useState('');

    useEffect(() => {
        if (globalGoal) {
            try {
                if (globalGoal.notes && globalGoal.notes.startsWith('{')) {
                    const parsed = JSON.parse(globalGoal.notes);
                    setFileSystem(parsed.items || []);
                }
            } catch (e) {
                console.error("Error parsing global drive:", e);
            }
        }
    }, [globalGoal]);

    const persistFileSystem = (items: DocItem[]) => {
        if (!globalGoal) {
            // If no global drive goal exists, skip or handle (usually should be handled by useProductivity)
            return;
        }
        updateGoal(globalGoal.id, { notes: JSON.stringify({ items, type: 'MONEYFLOW_GLOBAL_DRIVE' }) });
    };

    const handleCreateItem = (type: 'file' | 'folder') => {
        const name = type === 'file' ? 'Novo Documento' : 'Nova Pasta';
        const newItem: DocItem = {
            id: Math.random().toString(36).substr(2, 9),
            name,
            type,
            content: '',
            parentId: currentFolderId,
            createdAt: Date.now()
        };
        const updated = [...fileSystem, newItem];
        setFileSystem(updated);
        persistFileSystem(updated);
        if (type === 'file') {
            setActiveFileId(newItem.id);
            setNoteDraft('');
        }
    };

    const handleDeleteItem = (id: string) => {
        // Recursive delete for folders
        const getIdsToDelete = (parentId: string): string[] => {
            const children = fileSystem.filter(i => i.parentId === parentId);
            let ids = [parentId];
            children.forEach(c => {
                if (c.type === 'folder') ids = [...ids, ...getIdsToDelete(c.id)];
                else ids.push(c.id);
            });
            return ids;
        };

        const idsToDelete = new Set(getIdsToDelete(id));
        const updated = fileSystem.filter(item => !idsToDelete.has(item.id));
        setFileSystem(updated);
        persistFileSystem(updated);
        if (activeFileId && idsToDelete.has(activeFileId)) setActiveFileId(null);
        toast.success('Item removido!');
    };

    const handleRename = (id: string) => {
        if (!editNameValue.trim()) return;
        const updated = fileSystem.map(item =>
            item.id === id ? { ...item, name: editNameValue.trim() } : item
        );
        setFileSystem(updated);
        persistFileSystem(updated);
        setEditingId(null);
        toast.success('Renomeado com sucesso');
    };

    const handleSaveFileContent = () => {
        if (!activeFileId) return;
        const updated = fileSystem.map(item =>
            item.id === activeFileId ? { ...item, content: noteDraft } : item
        );
        setFileSystem(updated);
        persistFileSystem(updated);
        toast.success('Documento salvo!');
    };

    const filteredItems = searchTerm.trim()
        ? fileSystem.filter(item => item.name.toLowerCase().includes(searchTerm.toLowerCase()))
        : fileSystem.filter(item => item.parentId === currentFolderId);

    const breadcrumbs = [];
    let tempId = currentFolderId;
    while (tempId) {
        const folder = fileSystem.find(i => i.id === tempId);
        if (folder) {
            breadcrumbs.unshift(folder);
            tempId = folder.parentId;
        } else break;
    }

    if (!globalGoal) {
        return (
            <Card className="bg-card/20 border-white/[0.03] rounded-[32px] p-12 text-center">
                <div className="flex flex-col items-center gap-4">
                    <HardDrive className="w-12 h-12 text-muted-foreground opacity-20" />
                    <h3 className="text-lg font-black uppercase tracking-widest text-[#f0f0f0]">Drive não inicializado</h3>
                    <p className="text-sm text-muted-foreground max-w-sm">Crie uma meta estratégica chamada "MONEYFLOW_GLOBAL_DRIVE" para ativar o seu Drive pessoal.</p>
                </div>
            </Card>
        );
    }

    return (
        <Card className="bg-card/20 border-white/[0.03] rounded-[32px] overflow-hidden shadow-2xl ring-1 ring-white/[0.03]">
            <CardHeader className="p-8 border-b border-white/[0.05] bg-black/20">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-500 rounded-2xl shadow-xl shadow-blue-500/20">
                            <HardDrive className="w-6 h-6 text-white" />
                        </div>
                        <div className="space-y-1">
                            <CardTitle className="text-xl font-black tracking-tight text-[#f0f0f0]">Meu Drive Global</CardTitle>
                            <div className="flex items-center gap-2 text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">
                                <span className="hover:text-primary cursor-pointer" onClick={() => { setCurrentFolderId(null); setActiveFileId(null); setSearchTerm(''); }}>Raiz</span>
                                {breadcrumbs.map(b => (
                                    <React.Fragment key={b.id}>
                                        <ChevronRight className="w-3 h-3 opacity-30" />
                                        <span className="hover:text-blue-400 cursor-pointer" onClick={() => setCurrentFolderId(b.id)}>{b.name}</span>
                                    </React.Fragment>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <div className="relative flex-1 md:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                                placeholder="Buscar no Drive..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 h-10 bg-white/[0.02] border-white/[0.05] rounded-xl text-xs"
                            />
                        </div>
                        {!activeFileId && (
                            <div className="flex gap-2">
                                <Button size="icon" onClick={() => handleCreateItem('folder')} variant="outline" className="h-10 w-10 rounded-xl border-white/[0.05] hover:bg-white/[0.05]">
                                    <Folder className="w-4 h-4" />
                                </Button>
                                <Button size="icon" onClick={() => handleCreateItem('file')} className="h-10 w-10 rounded-xl bg-blue-500 hover:bg-blue-600 text-white shadow-lg shadow-blue-500/20">
                                    <Plus className="w-4 h-4" />
                                </Button>
                            </div>
                        )}
                        {activeFileId && (
                            <Button onClick={handleSaveFileContent} className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl gap-2 h-10 px-6 font-black uppercase text-[10px] tracking-widest">
                                <Save className="w-4 h-4" /> Salvar
                            </Button>
                        )}
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-0 min-h-[500px]">
                {activeFileId ? (
                    <div className="p-8 space-y-6 animate-in fade-in slide-in-from-bottom-4">
                        <Button variant="ghost" onClick={() => setActiveFileId(null)} className="h-8 -ml-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-[#f0f0f0]">
                            <ArrowLeft className="w-4 h-4 mr-2" /> Voltar ao Drive
                        </Button>
                        <div className="bg-white/[0.01] border border-white/[0.05] rounded-[32px] p-8 shadow-inner">
                            <Textarea
                                value={noteDraft}
                                onChange={(e) => setNoteDraft(e.target.value)}
                                placeholder="Comece a escrever seus documentos..."
                                className="min-h-[400px] bg-transparent border-none text-base focus-visible:ring-0 resize-none p-0 text-white/80 leading-relaxed"
                            />
                        </div>
                    </div>
                ) : (
                    <div className="p-8 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                        {filteredItems.map(item => (
                            <div
                                key={item.id}
                                className="group relative bg-white/[0.02] border border-white/[0.05] rounded-[28px] p-6 hover:bg-white/[0.05] hover:border-white/[0.1] transition-all cursor-pointer overflow-hidden"
                                onClick={() => item.type === 'folder' ? (setCurrentFolderId(item.id), setSearchTerm('')) : (setActiveFileId(item.id), setNoteDraft(item.content || ''))}
                            >
                                <div className="flex flex-col gap-4">
                                    <div className={cn(
                                        "w-14 h-14 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110",
                                        item.type === 'folder' ? "bg-blue-500/10 text-blue-500" : "bg-emerald-500/10 text-emerald-500"
                                    )}>
                                        {item.type === 'folder' ? <Folder size={28} /> : <FileText size={28} />}
                                    </div>
                                    <div className="space-y-1">
                                        {editingId === item.id ? (
                                            <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                                                <Input
                                                    value={editNameValue}
                                                    onChange={e => setEditNameValue(e.target.value)}
                                                    onKeyDown={e => e.key === 'Enter' && handleRename(item.id)}
                                                    className="h-7 text-xs px-2"
                                                    autoFocus
                                                />
                                                <Button size="icon" variant="ghost" className="h-7 w-7 text-emerald-500" onClick={() => handleRename(item.id)}>
                                                    <Save className="w-3 h-3" />
                                                </Button>
                                            </div>
                                        ) : (
                                            <p className="text-sm font-bold text-white/90 truncate group-hover:text-white transition-colors">
                                                {item.name}
                                            </p>
                                        )}
                                        <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest opacity-50">
                                            {item.type === 'folder' ? 'Pasta' : 'Documento'}
                                        </p>
                                    </div>
                                </div>

                                <div className="absolute top-3 right-3 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-8 px-2 rounded-lg hover:bg-white/10 text-[9px] font-bold uppercase tracking-wider gap-1"
                                        title={item.type === 'folder' ? 'Renomear pasta' : 'Renomear documento'}
                                        onClick={(e) => { e.stopPropagation(); setEditingId(item.id); setEditNameValue(item.name); }}
                                    >
                                        <Pencil className="w-3.5 h-3.5" />
                                        Renomear
                                    </Button>
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        className="h-8 w-8 rounded-full hover:bg-red-500/20 hover:text-red-500"
                                        title="Excluir"
                                        onClick={(e) => { e.stopPropagation(); handleDeleteItem(item.id); }}
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </Button>
                                </div>
                            </div>
                        ))}

                        {filteredItems.length === 0 && (
                            <div className="col-span-full py-32 flex flex-col items-center justify-center text-center opacity-20 border-2 border-dashed border-white/[0.05] rounded-[40px]">
                                <Filter className="w-12 h-12 mb-4" />
                                <h4 className="text-xs font-black uppercase tracking-[0.4em]">Nenhum item encontrado</h4>
                                <p className="text-[10px] mt-2">Crie novos arquivos para começar sua biblioteca.</p>
                            </div>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
};
