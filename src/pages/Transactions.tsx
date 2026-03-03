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
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold">Transações</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={openNew}><Plus className="mr-2 h-4 w-4" />Nova Transação</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editId ? "Editar" : "Nova"} Transação</DialogTitle></DialogHeader>
            <div className="space-y-4 py-2">
              <div>
                <Label>Tipo</Label>
                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v as TransactionType })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="income">Receita</SelectItem>
                    <SelectItem value="expense">Despesa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Valor (R$)</Label>
                <Input type="number" min="0" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="0,00" />
              </div>
              <div>
                <Label>Categoria</Label>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Data</Label>
                <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
              </div>
              <div>
                <Label>Descrição</Label>
                <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Ex: Supermercado" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button onClick={handleSave}>Salvar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card className="finance-card">
        <CardContent className="pt-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input className="pl-9" placeholder="Buscar..." value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <Select value={filterMonth} onValueChange={setFilterMonth}>
              <SelectTrigger><SelectValue placeholder="Mês" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {months.map((m) => (
                  <SelectItem key={m} value={m}>{format(parseISO(m + "-01"), "MMM yyyy")}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger><SelectValue placeholder="Categoria" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger><SelectValue placeholder="Tipo" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="income">Receita</SelectItem>
                <SelectItem value="expense">Despesa</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* List */}
      <Card className="finance-card">
        <CardHeader><CardTitle className="text-base">Transações ({filtered.length})</CardTitle></CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-8">Nenhuma transação encontrada</p>
          ) : (
            <div className="space-y-2">
              {filtered.map((t) => {
                const cat = categories.find((c) => c.id === t.category);
                const isIncome = t.type === "income";
                return (
                  <div key={t.id} className="flex items-center justify-between py-3 px-3 rounded-lg border bg-background hover:bg-muted/40 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`h-9 w-9 rounded-lg flex items-center justify-center ${isIncome ? "bg-accent" : "bg-destructive/10"}`}>
                        {isIncome ? <ArrowUpRight className="h-4 w-4 text-primary" /> : <ArrowDownRight className="h-4 w-4 text-destructive" />}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{t.description}</p>
                        <p className="text-xs text-muted-foreground">{cat?.name} • {format(parseISO(t.date), "dd/MM/yyyy")}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`font-semibold text-sm ${isIncome ? "text-primary" : "text-destructive"}`}>
                        {isIncome ? "+" : "-"}{formatCurrency(t.amount)}
                      </span>
                      <Button variant="ghost" size="icon" onClick={() => openEdit(t)}><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(t.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
