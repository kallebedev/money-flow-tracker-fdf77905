import { useState } from "react";
import { useFinance } from "@/contexts/FinanceContext";
import { Transaction, TransactionType } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Plus, Search, Pencil, Trash2, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

function formatCurrency(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

const emptyForm = { type: "expense" as TransactionType, amount: "", category: "", date: new Date().toISOString().slice(0, 10), description: "" };

export default function Transactions() {
  const { transactions, categories, addTransaction, updateTransaction, deleteTransaction } = useFinance();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [filterMonth, setFilterMonth] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterType, setFilterType] = useState("");
  const [search, setSearch] = useState("");

  const filtered = transactions.filter((t) => {
    if (filterMonth && filterMonth !== "all" && !t.date.startsWith(filterMonth)) return false;
    if (filterCategory && filterCategory !== "all" && t.category !== filterCategory) return false;
    if (filterType && filterType !== "all" && t.type !== filterType) return false;
    if (search && !t.description.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  function openNew() {
    setEditId(null);
    setForm(emptyForm);
    setOpen(true);
  }

  function openEdit(t: Transaction) {
    setEditId(t.id);
    setForm({ type: t.type, amount: String(t.amount), category: t.category, date: t.date.slice(0, 10), description: t.description });
    setOpen(true);
  }

  function handleSave() {
    const amount = parseFloat(form.amount);
    if (!amount || !form.category || !form.description) {
      toast.error("Preencha todos os campos");
      return;
    }
    if (editId) {
      updateTransaction(editId, { type: form.type, amount, category: form.category, date: form.date, description: form.description });
      toast.success("Transação atualizada!");
    } else {
      addTransaction({ type: form.type, amount, category: form.category, date: form.date, description: form.description });
      toast.success("Transação adicionada!");
    }
    setOpen(false);
  }

  function handleDelete(id: string) {
    deleteTransaction(id);
    toast.success("Transação excluída!");
  }

  // unique months
  const months = [...new Set(transactions.map((t) => t.date.slice(0, 7)))].sort().reverse();

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">Transações</h1>
          <p className="text-muted-foreground mt-1">Gerencie seu histórico financeiro aqui.</p>
        </div>
        <div className="flex items-center gap-3">
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button onClick={openNew} className="rounded-xl px-5 h-11 transition-all hover:scale-105 active:scale-95 bg-primary text-primary-foreground font-bold shadow-lg shadow-primary/20">
                <Plus className="mr-2 h-5 w-5" />Nova Transação
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-popover border-border text-popover-foreground">
              <DialogHeader><DialogTitle className="text-foreground">{editId ? "Editar" : "Nova"} Transação</DialogTitle></DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label className="text-muted-foreground font-medium">Tipo</Label>
                  <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v as TransactionType })}>
                    <SelectTrigger className="bg-background border-border text-foreground h-11"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-popover border-border text-popover-foreground">
                      <SelectItem value="income">Receita</SelectItem>
                      <SelectItem value="expense">Despesa</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-muted-foreground font-medium">Valor (R$)</Label>
                  <Input type="number" min="0" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="0,00" className="bg-background border-border text-foreground h-11" />
                </div>
                <div className="space-y-2">
                  <Label className="text-muted-foreground font-medium">Categoria</Label>
                  <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                    <SelectTrigger className="bg-background border-border text-foreground h-11">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border text-popover-foreground">
                      {categories.map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-muted-foreground font-medium">Data</Label>
                    <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="bg-background border-border text-foreground h-11" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-muted-foreground font-medium">Descrição</Label>
                    <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Ex: Mercado" className="bg-background border-border text-foreground h-11" />
                  </div>
                </div>
              </div>
              <DialogFooter className="gap-2 sm:gap-0">
                <Button variant="ghost" onClick={() => setOpen(false)} className="hover:bg-accent text-foreground">Cancelar</Button>
                <Button onClick={handleSave} className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 font-bold">Salvar</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card className="bg-card border-none rounded-3xl mb-8 p-1 shadow-sm overflow-hidden">
        <CardContent className="pt-6">
          <div className="grid gap-6 md:grid-cols-4 items-end">
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground uppercase font-bold tracking-widest pl-1">Busca</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Filtrar por nome..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 bg-background border-border h-11 text-foreground" />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground uppercase font-bold tracking-widest pl-1">Categoria</Label>
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="bg-background border-border h-11 text-foreground">
                  <SelectValue placeholder="Todas as categorias" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border text-popover-foreground">
                  <SelectItem value="all">Todas as categorias</SelectItem>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground uppercase font-bold tracking-widest pl-1">Tipo</Label>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="bg-background border-border h-11 text-foreground">
                  <SelectValue placeholder="Todos os tipos" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border text-popover-foreground">
                  <SelectItem value="all">Todos os tipos</SelectItem>
                  <SelectItem value="income">Receitas</SelectItem>
                  <SelectItem value="expense">Despesas</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground uppercase font-bold tracking-widest pl-1">Período</Label>
              <Input type="month" value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)} className="bg-background border-border h-11 text-foreground" />
            </div>
          </div>
        </CardContent>
      </Card>
      <Card className="bg-card border-none rounded-3xl overflow-hidden shadow-sm">
        <CardContent className="p-0">
          <div className="divide-y divide-border/30">
            {filtered.map((t) => {
              const cat = categories.find((c) => c.id === t.category);
              const isIncome = t.type === "income";
              return (
                <div key={t.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-6 hover:bg-accent/30 transition-colors group">
                  <div className="flex items-center gap-5 flex-1">
                    <div className={`h-14 w-14 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 shadow-sm ${isIncome ? "bg-primary/10" : "bg-destructive/10"}`}>
                      {isIncome ? <ArrowUpRight className="h-7 w-7 text-primary" /> : <ArrowDownRight className="h-7 w-7 text-destructive" />}
                    </div>
                    <div>
                      <p className="font-bold text-foreground text-lg">{t.description}</p>
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-md uppercase tracking-tighter">{cat?.name || t.category}</span>
                        <span className="text-xs text-muted-foreground font-medium">{format(parseISO(t.date), "dd MMM yyyy", { locale: ptBR })}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-8 mt-4 sm:mt-0">
                    <div className="text-right">
                      <p className={`font-bold text-xl ${isIncome ? "text-primary" : "text-destructive"}`}>
                        {isIncome ? "+" : "-"}{formatCurrency(t.amount)}
                      </p>
                      <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider opacity-70">Confirmado</p>
                    </div>
                    <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(t)} className="h-9 w-9 rounded-lg hover:bg-primary/10 hover:text-primary"><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => deleteTransaction(t.id)} className="h-9 w-9 rounded-lg hover:bg-destructive/10 hover:text-destructive"><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          {filtered.length === 0 && (
            <div className="py-20 text-center text-muted-foreground">
              <p>Nenhuma transação encontrada para este filtro.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
