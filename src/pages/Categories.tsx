import { useState } from "react";
import { useFinance } from "@/contexts/FinanceContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Tag } from "lucide-react";
import { toast } from "sonner";

const COLORS = ["chart-1", "chart-2", "chart-3", "chart-4", "chart-5", "chart-6", "chart-7", "chart-8"];

export default function Categories() {
  const { categories, addCategory, updateCategory, deleteCategory, transactions } = useFinance();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [name, setName] = useState("");

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
    if (used) { toast.error("Categoria em uso, não pode ser excluída"); return; }
    deleteCategory(id);
    toast.success("Categoria excluída!");
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold">Categorias</h1>
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
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(c.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
