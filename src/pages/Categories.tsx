import { useState } from "react";
import { useFinance } from "@/contexts/FinanceContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
    setOpen(true);
  }

  function openEdit(id: string, n: string) {
    setEditId(id);
    setName(n);
    setOpen(true);
  }

  function handleSave() {
    if (!name.trim()) { toast.error("Nome é obrigatório"); return; }
    if (editId) {
      updateCategory(editId, { name: name.trim() });
      toast.success("Categoria atualizada!");
    } else {
      addCategory({ name: name.trim(), icon: "Tag", color: COLORS[categories.length % COLORS.length] });
      toast.success("Categoria criada!");
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
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold">Categorias</h1>
        <div className="flex gap-2">
          <Dialog open={restoreOpen} onOpenChange={setRestoreOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" onClick={() => setSelectedToRestore(missingDefaults.map(c => c.name))}>
                <RefreshCw className="mr-2 h-4 w-4" />Restaurar Padrões
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Restaurar Categorias Padrão</DialogTitle>
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
                        <Label htmlFor={`restore-${c.name}`} className="cursor-pointer">{c.name}</Label>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm font-medium py-4 text-center">Todas as categorias padrão já estão presentes!</p>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setRestoreOpen(false)}>Cancelar</Button>
                <Button onClick={handleRestore} disabled={missingDefaults.length === 0}>Restaurar Selecionadas</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button onClick={openNew}><Plus className="mr-2 h-4 w-4" />Nova Categoria</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>{editId ? "Editar" : "Nova"} Categoria</DialogTitle></DialogHeader>
              <div className="py-4">
                <Label>Nome</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Assinaturas" />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                <Button onClick={handleSave}>Salvar</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((c) => {
          const count = transactions.filter((t) => t.category === c.id).length;
          return (
            <Card key={c.id} className="finance-card">
              <CardContent className="flex items-center justify-between pt-5">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-accent flex items-center justify-center">
                    <Tag className="h-5 w-5 text-accent-foreground" />
                  </div>
                  <div>
                    <p className="font-medium">{c.name}</p>
                    <p className="text-xs text-muted-foreground">{count} transação(ões)</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => openEdit(c.id, c.name)}><Pencil className="h-4 w-4" /></Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Esta ação não pode ser desfeita. Isso excluirá permanentemente a categoria
                          <strong> {c.name}</strong>.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(c.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Excluir
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
