import { useState } from "react";
import { useFinance } from "@/contexts/FinanceContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Tag, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import { DEFAULT_CATEGORIES } from "@/lib/types";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const COLORS = ["chart-1", "chart-2", "chart-3", "chart-4", "chart-5", "chart-6", "chart-7", "chart-8"];

export default function Categories() {
  const { categories, addCategory, updateCategory, deleteCategory, transactions, restoreDefaultCategories } = useFinance();
  const [open, setOpen] = useState(false);
  const [restoreOpen, setRestoreOpen] = useState(false);
  const [selectedToRestore, setSelectedToRestore] = useState<string[]>([]);
  const [editId, setEditId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [budget, setBudget] = useState("");

  const missingDefaults = DEFAULT_CATEGORIES.filter(
    (df) => !categories.some((c) => c.name === df.name)
  );

  function toggleCategorySelection(categoryName: string) {
    setSelectedToRestore((prev) =>
      prev.includes(categoryName)
        ? prev.filter((n) => n !== categoryName)
        : [...prev, categoryName]
    );
  }

  function handleRestore() {
    if (selectedToRestore.length === 0) {
      toast.error("Selecione pelo menos uma categoria");
      return;
    }
    restoreDefaultCategories(selectedToRestore);
    setRestoreOpen(false);
    setSelectedToRestore([]);
  }

  function openNew() {
    setEditId(null);
    setName("");
    setBudget("");
    setOpen(true);
  }

  function openEdit(id: string, n: string, b?: number) {
    setEditId(id);
    setName(n);
    setBudget(b?.toString() || "");
    setOpen(true);
  }

  function handleSave() {
    if (!name.trim()) { toast.error("Nome é obrigatório"); return; }
    const budgetNum = budget ? parseFloat(budget) : undefined;
    if (editId) {
      updateCategory(editId, { name: name.trim(), monthlyBudget: budgetNum });
      toast.success("Categoria atualizada!");
    } else {
      addCategory({
        name: name.trim(),
        icon: "Tag",
        color: COLORS[categories.length % COLORS.length],
        monthlyBudget: budgetNum
      });
    }
    setOpen(false);
  }

  function handleDelete(id: string) {
    const used = transactions.some((t) => t.category === id);
    if (used) {
      toast.error("Esta categoria está sendo usada em transações e não pode ser excluída.");
      return;
    }

    deleteCategory(id);
    toast.success("Categoria excluída!");
  }

  return (
    <div className="w-full space-y-10 animate-fade-in pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-foreground tracking-tight mb-2">Categorias</h1>
          <p className="text-muted-foreground text-sm font-medium opacity-80">Gerencie suas categorias de gastos e receitas.</p>
        </div>
        <div className="flex gap-3">
          <Dialog open={restoreOpen} onOpenChange={setRestoreOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" onClick={() => setSelectedToRestore(missingDefaults.map(c => c.name))} className="text-[11px] font-bold text-muted-foreground hover:text-foreground hover:bg-white/5 border border-white/5 rounded-xl h-10 px-5">
                <RefreshCw className="mr-2 h-3.5 w-3.5" />Restaurar Padrões
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md bg-popover/95 border-white/[0.05] text-popover-foreground backdrop-blur-xl rounded-3xl">
              <DialogHeader>
                <DialogTitle className="text-foreground font-black text-xl">Restaurar Padrões</DialogTitle>
              </DialogHeader>
              <div className="py-4 space-y-4">
                <p className="text-sm text-muted-foreground">
                  Selecione as categorias que deseja trazer de volta:
                </p>
                {missingDefaults.length > 0 ? (
                  <div className="grid grid-cols-2 gap-4">
                    {missingDefaults.map((c) => (
                      <div key={c.name} className="flex items-center space-x-2">
                        <Checkbox
                          id={`restore-${c.name}`}
                          checked={selectedToRestore.includes(c.name)}
                          onCheckedChange={() => toggleCategorySelection(c.name)}
                        />
                        <Label htmlFor={`restore-${c.name}`} className="cursor-pointer font-bold text-sm tracking-tight">{c.name}</Label>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm font-medium py-4 text-center">Todas as categorias padrão já estão presentes!</p>
                )}
              </div>
              <DialogFooter>
                <Button variant="ghost" onClick={() => setRestoreOpen(false)} className="rounded-xl font-bold">Cancelar</Button>
                <Button onClick={handleRestore} disabled={missingDefaults.length === 0} className="bg-primary hover:bg-primary/90 text-primary-foreground font-black rounded-xl px-6">Restaurar</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button onClick={openNew} className="bg-primary hover:bg-primary/90 text-primary-foreground text-[11px] font-black px-6 rounded-xl h-10 shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]">
                <Plus className="mr-2 h-5 w-5" />Nova Categoria
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-popover/95 border-white/10 text-popover-foreground backdrop-blur-xl rounded-3xl">
              <DialogHeader><DialogTitle className="text-foreground font-black text-xl">{editId ? "Editar" : "Nova"} Categoria</DialogTitle></DialogHeader>
              <div className="py-6 space-y-6">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest opacity-50 px-1">Nome</Label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: Assinaturas"
                    className="bg-white/5 border-white/5 text-foreground h-12 rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest opacity-50 px-1">Orçamento Mensal (R$)</Label>
                  <Input
                    type="number"
                    value={budget}
                    onChange={(e) => setBudget(e.target.value)}
                    placeholder="Ex: 1000"
                    className="bg-white/5 border-white/5 text-foreground h-12 rounded-xl"
                  />
                  <p className="text-[10px] text-muted-foreground italic px-1 opacity-60">
                    Este valor será usado pela IA para analisar seus gastos.
                  </p>
                </div>
              </div>
              <DialogFooter className="gap-2">
                <Button variant="ghost" onClick={() => setOpen(false)} className="rounded-xl font-bold">Cancelar</Button>
                <Button onClick={handleSave} className="bg-primary hover:bg-primary/90 text-primary-foreground font-black px-8 rounded-xl h-12">Salvar</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((c) => {
          const transCount = transactions.filter((t) => t.category === c.id).length;
          return (
            <Card key={c.id} className="bg-card/40 border border-white/[0.03] rounded-[32px] p-2 transition-all hover:bg-white/[0.03] group shadow-2xl ring-1 ring-white/[0.03]">
              <div className="flex items-center justify-between p-4 pl-6 pr-4">
                <div className="flex items-center gap-5">
                  <div className="h-14 w-14 rounded-[22px] bg-primary/10 flex items-center justify-center transition-transform group-hover:scale-110 shadow-inner">
                    <Tag className="h-6 w-6 text-primary" />
                  </div>
                  <div className="space-y-0.5">
                    <p className="font-black text-foreground text-xl tracking-tight leading-none mb-1">{c.name}</p>
                    <div className="flex flex-col">
                      <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest opacity-50">{transCount} transação(ões)</p>
                      {c.monthlyBudget && (
                        <p className="text-[11px] text-emerald-500 font-black uppercase tracking-widest mt-1">
                          Ref: R$ {c.monthlyBudget.toFixed(0)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <Button variant="ghost" size="icon" onClick={() => openEdit(c.id, c.name, c.monthlyBudget)} className="h-10 w-10 text-muted-foreground hover:text-foreground hover:bg-white/5 rounded-xl transition-colors"><Pencil className="h-5 w-5" /></Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-10 w-10 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-colors"><Trash2 className="h-5 w-5" /></Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="bg-popover/95 border-white/10 text-popover-foreground backdrop-blur-xl rounded-3xl">
                      <AlertDialogHeader>
                        <AlertDialogTitle className="font-black text-xl">Excluir Categoria?</AlertDialogTitle>
                        <AlertDialogDescription className="text-muted-foreground font-medium">
                          Isso excluirá permanentemente a categoria
                          <strong className="text-foreground"> {c.name}</strong>.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel className="rounded-xl font-bold">Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(c.id)}
                          className="bg-red-500 hover:bg-red-600 text-white font-black rounded-xl"
                        >
                          Excluir
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
