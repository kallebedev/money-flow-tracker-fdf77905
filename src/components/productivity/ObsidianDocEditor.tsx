import React, { useRef, useCallback, useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkWikiLink from 'remark-wiki-link';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { Save, FileText, Eye, Link2, Bold, Italic, Heading1, List, ListOrdered, Quote, Code, Strikethrough, Columns2, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export type DocItemForEditor = {
    id: string;
    name: string;
    type: 'file' | 'folder';
    content?: string;
    parentId: string | null;
};

function toPermalink(name: string): string {
    return name.replace(/\s+/g, '_').toLowerCase();
}

function findDocByPermalink(items: DocItemForEditor[], permalink: string): DocItemForEditor | undefined {
    return items.find(
        (i) => i.type === 'file' && toPermalink(i.name) === permalink
    );
}

export interface ObsidianDocEditorProps {
    value: string;
    onChange: (value: string) => void;
    onSave: () => void;
    onOpenWikiLink: (docId: string) => void;
    /** Chamado quando o usuário clica em um link para um documento que ainda não existe (opção de criar) */
    onRequestCreateDoc?: (docName: string) => void;
    /** Todos os itens do drive (para resolver [[nome]] e backlinks) */
    allItems: DocItemForEditor[];
    /** Nome do documento atual (para exibir backlinks) */
    currentDocName: string;
    /** ID do documento atual */
    currentDocId: string;
    placeholder?: string;
    className?: string;
}

export function ObsidianDocEditor({
    value,
    onChange,
    onSave,
    onOpenWikiLink,
    onRequestCreateDoc,
    allItems,
    currentDocName,
    currentDocId,
    placeholder = 'Digite aqui... Use os botões acima para negrito, itálico, título e listas.',
    className,
}: ObsidianDocEditorProps) {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const [savedAt, setSavedAt] = useState<number | null>(null);
    const [linkDocSearch, setLinkDocSearch] = useState('');
    const [viewMode, setViewMode] = useState<'edit' | 'preview' | 'split'>('edit');
    const files = allItems.filter((i) => i.type === 'file') as DocItemForEditor[];
    const otherDocs = files.filter((f) => f.id !== currentDocId);
    const filteredOtherDocs = linkDocSearch.trim()
        ? otherDocs.filter((d) => d.name.toLowerCase().includes(linkDocSearch.toLowerCase()))
        : otherDocs;

    const insertOrWrap = useCallback(
        (before: string, after: string, placeholder = 'texto') => {
            const ta = textareaRef.current;
            if (!ta) return;
            const start = ta.selectionStart;
            const end = ta.selectionEnd;
            const text = value;
            const selected = text.slice(start, end);
            const newText = text.slice(0, start) + before + (selected || placeholder) + after + text.slice(end);
            onChange(newText);
            setTimeout(() => {
                ta.focus();
                const pos = start + before.length + (selected || placeholder).length;
                ta.setSelectionRange(pos, pos);
            }, 0);
        },
        [value, onChange]
    );

    const applyLineFormat = useCallback(
        (prefix: string) => {
            const ta = textareaRef.current;
            if (!ta) return;
            const start = ta.selectionStart;
            const end = ta.selectionEnd;
            const text = value;
            const lineStart = text.lastIndexOf('\n', start - 1) + 1;
            const lineEnd = text.indexOf('\n', end) === -1 ? text.length : text.indexOf('\n', end);
            const line = text.slice(lineStart, lineEnd);
            const newLine = line ? prefix + line : prefix;
            const newText = text.slice(0, lineStart) + newLine + text.slice(lineEnd);
            onChange(newText);
            setTimeout(() => ta.focus(), 0);
        },
        [value, onChange]
    );

    const insertWikiLink = useCallback(
        (docName: string) => {
            const ta = textareaRef.current;
            if (!ta) return;
            const start = ta.selectionStart;
            const insert = `[[${docName}]]`;
            const newText = value.slice(0, start) + insert + value.slice(start);
            onChange(newText);
            setTimeout(() => {
                ta.focus();
                ta.setSelectionRange(start + insert.length, start + insert.length);
            }, 0);
        },
        [value, onChange]
    );

    const handleSave = useCallback(() => {
        onSave();
        setSavedAt(Date.now());
    }, [onSave]);

    useEffect(() => {
        if (savedAt !== null) setSavedAt(null);
    }, [value]);

    useEffect(() => {
        const ta = textareaRef.current;
        if (!ta) return;
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.ctrlKey || e.metaKey) {
                if (e.key === 'b') {
                    e.preventDefault();
                    insertOrWrap('**', '**', 'negrito');
                } else if (e.key === 'i') {
                    e.preventDefault();
                    insertOrWrap('*', '*', 'itálico');
                }
            }
        };
        ta.addEventListener('keydown', onKeyDown);
        return () => ta.removeEventListener('keydown', onKeyDown);
    }, [insertOrWrap, viewMode]);

    const permalinks = files.map((f) => toPermalink(f.name));

    const currentPermalink = toPermalink(currentDocName);
    const wikiLinkRegex = /\[\[([^\]]+)\]\]/g;
    const backlinks = files.filter((f) => {
        if (f.id === currentDocId) return false;
        const content = f.content || '';
        let match: RegExpExecArray | null;
        wikiLinkRegex.lastIndex = 0;
        while ((match = wikiLinkRegex.exec(content)) !== null) {
            if (toPermalink(match[1]) === currentPermalink) return true;
        }
        return false;
    });

    const remarkWikiLinkOptions = {
        permalinks,
        pageResolver: (name: string) => [toPermalink(name)],
        hrefTemplate: (permalink: string) => `wiki://${permalink}`,
        wikiLinkClassName: 'wiki-link',
        newClassName: 'wiki-link-new',
    };

    const markdownComponents = {
        a: ({ href, className: linkClass, children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => {
            if (href?.startsWith('wiki://')) {
                const permalink = href.replace('wiki://', '');
                const doc = findDocByPermalink(files, permalink);
                const displayName = String(children);
                return (
                    <button
                        type="button"
                        className={cn(
                            'inline-flex items-center gap-1 rounded px-1 -mx-0.5 font-medium transition-colors cursor-pointer border-0 bg-transparent',
                            doc
                                ? 'text-blue-400 hover:text-blue-300 hover:bg-blue-500/20'
                                : 'text-amber-400 hover:text-amber-300 hover:bg-amber-500/20',
                            linkClass
                        )}
                        onClick={() => {
                            if (doc) onOpenWikiLink(doc.id);
                            else if (onRequestCreateDoc) onRequestCreateDoc(displayName);
                        }}
                        title={doc ? `Abrir: ${displayName}` : onRequestCreateDoc ? `Criar documento "${displayName}"` : undefined}
                    >
                        <Link2 className="w-3 h-3 shrink-0" />
                        {children}
                        {!doc && onRequestCreateDoc && <span className="text-[9px] opacity-80"> (criar)</span>}
                    </button>
                );
            }
            return (
                <a href={href} className={linkClass} {...props}>
                    {children}
                </a>
            );
        },
    };

    const toolbar = (
        <div className="sticky top-0 z-10 flex flex-wrap items-center gap-1 p-2 rounded-xl bg-white/[0.06] border border-white/[0.08] mb-3 backdrop-blur-sm">
            <Button type="button" variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-white/10" onClick={() => insertOrWrap('**', '**', 'negrito')} title="Negrito (Ctrl+B)">
                <Bold className="w-4 h-4" />
            </Button>
            <Button type="button" variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-white/10" onClick={() => insertOrWrap('*', '*', 'itálico')} title="Itálico (Ctrl+I)">
                <Italic className="w-4 h-4" />
            </Button>
            <Button type="button" variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-white/10" onClick={() => insertOrWrap('~~', '~~', 'riscado')} title="Riscado">
                <Strikethrough className="w-4 h-4" />
            </Button>
            <div className="w-px h-5 bg-white/10 mx-0.5" />
            <Button type="button" variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-white/10" onClick={() => applyLineFormat('# ')} title="Título">
                <Heading1 className="w-4 h-4" />
            </Button>
            <Button type="button" variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-white/10" onClick={() => applyLineFormat('> ')} title="Citação">
                <Quote className="w-4 h-4" />
            </Button>
            <Button type="button" variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-white/10" onClick={() => insertOrWrap('`', '`', 'código')} title="Código">
                <Code className="w-4 h-4" />
            </Button>
            <Button type="button" variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-white/10" onClick={() => applyLineFormat('- ')} title="Lista com marcadores">
                <List className="w-4 h-4" />
            </Button>
            <Button type="button" variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-white/10" onClick={() => applyLineFormat('1. ')} title="Lista numerada">
                <ListOrdered className="w-4 h-4" />
            </Button>
            <div className="w-px h-5 bg-white/10 mx-0.5" />
            {otherDocs.length > 0 && (
                <DropdownMenu onOpenChange={(open) => !open && setLinkDocSearch('')}>
                    <DropdownMenuTrigger asChild>
                        <Button type="button" variant="ghost" size="sm" className="h-8 gap-1.5 rounded-lg hover:bg-white/10 text-xs" title="Link para outro documento">
                            <Link2 className="w-4 h-4" />
                            Link para doc
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="min-w-[220px] max-h-[280px] overflow-hidden flex flex-col">
                        {otherDocs.length >= 5 && (
                            <div className="p-2 border-b border-white/10">
                                <Input
                                    placeholder="Buscar documento..."
                                    value={linkDocSearch}
                                    onChange={(e) => setLinkDocSearch(e.target.value)}
                                    className="h-8 text-xs bg-white/5 border-white/10"
                                    autoFocus
                                />
                            </div>
                        )}
                        <div className="overflow-y-auto max-h-[220px]">
                            <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-muted-foreground px-2 pt-2">
                                Escolha o documento
                            </DropdownMenuLabel>
                            {filteredOtherDocs.length ? (
                                filteredOtherDocs.map((doc) => (
                                    <DropdownMenuItem key={doc.id} onClick={() => insertWikiLink(doc.name)}>
                                        {doc.name}
                                    </DropdownMenuItem>
                                ))
                            ) : (
                                <p className="px-2 py-4 text-xs text-muted-foreground">Nenhum documento encontrado</p>
                            )}
                        </div>
                    </DropdownMenuContent>
                </DropdownMenu>
            )}
        </div>
    );

    const previewBlock = (
        <div className="min-h-[320px] rounded-xl bg-white/[0.02] border border-white/[0.06] p-5 prose prose-invert prose-sm max-w-none prose-p:text-white/80 prose-headings:text-white/90 prose-a:text-blue-400 prose-strong:text-white prose-blockquote:border-l-blue-500 prose-blockquote:bg-white/[0.03] prose-pre:bg-white/[0.06]">
            <ReactMarkdown remarkPlugins={[remarkGfm, [remarkWikiLink, remarkWikiLinkOptions]]} components={markdownComponents}>
                {value || 'Nada para visualizar. Use a aba Editar e escreva seu texto.'}
            </ReactMarkdown>
        </div>
    );

    const saveButtonRow = (
        <div className="mt-4 flex items-center gap-4 flex-wrap">
            <Button onClick={handleSave} className="h-9 px-6 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-[10px] font-black uppercase tracking-widest gap-2">
                <Save className="w-3.5 h-3.5" />
                Salvar
            </Button>
            {savedAt !== null && (
                <span className="inline-flex items-center gap-1.5 text-xs text-emerald-400">
                    <Check className="w-3.5 h-3.5" />
                    Salvo
                </span>
            )}
        </div>
    );

    return (
        <div className={cn('space-y-4', className)}>
            <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'edit' | 'preview' | 'split')} className="w-full">
                <TabsList className="grid w-full max-w-[360px] grid-cols-3 rounded-xl bg-white/[0.04] p-1 border border-white/[0.06]">
                    <TabsTrigger value="edit" className="rounded-lg gap-1.5 text-xs font-bold uppercase tracking-wider">
                        <FileText className="w-3.5 h-3.5" />
                        Editar
                    </TabsTrigger>
                    <TabsTrigger value="preview" className="rounded-lg gap-1.5 text-xs font-bold uppercase tracking-wider">
                        <Eye className="w-3.5 h-3.5" />
                        Visualizar
                    </TabsTrigger>
                    <TabsTrigger value="split" className="rounded-lg gap-1.5 text-xs font-bold uppercase tracking-wider">
                        <Columns2 className="w-3.5 h-3.5" />
                        Lado a lado
                    </TabsTrigger>
                </TabsList>
                <TabsContent value="edit" className="mt-4">
                    {toolbar}
                    <Textarea
                        ref={textareaRef}
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        placeholder={placeholder}
                        className="min-h-[320px] bg-white/[0.02] border border-white/[0.06] rounded-xl text-base focus-visible:ring-2 focus-visible:ring-blue-500/30 resize-none text-sm leading-relaxed"
                        spellCheck="true"
                    />
                    {saveButtonRow}
                </TabsContent>
                <TabsContent value="preview" className="mt-4">
                    {previewBlock}
                    {saveButtonRow}
                </TabsContent>
                <TabsContent value="split" className="mt-4">
                    {toolbar}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <div className="min-w-0">
                            <Textarea
                                ref={textareaRef}
                                value={value}
                                onChange={(e) => onChange(e.target.value)}
                                placeholder={placeholder}
                                className="min-h-[380px] bg-white/[0.02] border border-white/[0.06] rounded-xl text-sm focus-visible:ring-2 focus-visible:ring-blue-500/30 resize-none leading-relaxed"
                                spellCheck="true"
                            />
                        </div>
                        <div className="min-w-0 overflow-auto">{previewBlock}</div>
                    </div>
                    {saveButtonRow}
                </TabsContent>
            </Tabs>

            {backlinks.length > 0 && (
                <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-4">
                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-3 flex items-center gap-2">
                        <Link2 className="w-3.5 h-3.5" />
                        Referenciado em ({backlinks.length})
                    </h4>
                    <ul className="flex flex-wrap gap-2">
                        {backlinks.map((doc) => (
                            <li key={doc.id}>
                                <button
                                    type="button"
                                    onClick={() => onOpenWikiLink(doc.id)}
                                    className="text-xs font-medium text-blue-400 hover:text-blue-300 hover:underline"
                                >
                                    {doc.name}
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}
