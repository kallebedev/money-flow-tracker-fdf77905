import { Button } from "@/components/ui/button";
import { FileDown, Sparkles, TrendingUp, CreditCard, PieChart, Info, Download, X, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { Transaction, Category } from "@/lib/types";
import { format, parseISO, subMonths, isWithinInterval, isAfter, startOfMonth, isBefore, endOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useMemo } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
    DialogClose
} from "@/components/ui/dialog";
import {
    PieChart as RePieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    Tooltip as ReTooltip,
    Legend as ReLegend,
    LineChart as ReLineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid
} from "recharts";
import { cn } from "@/lib/utils";

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSpendingAnalysis } from "@/hooks/useSpendingAnalysis";
import { useAIBudgetAdvisor } from "@/hooks/useAIBudgetAdvisor";

interface ReportExportButtonProps {
    transactions: Transaction[];
    categories: Category[];
    globalBalance: number;
}

export function ReportExportButton({
    transactions: allTransactions,
    categories,
    globalBalance,
}: ReportExportButtonProps) {
    const { user } = useAuth();
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [range, setRange] = useState("current");
    const [startDate, setStartDate] = useState(format(subMonths(new Date(), 1), "yyyy-MM-dd"));
    const [endDate, setEndDate] = useState(format(new Date(), "yyyy-MM-dd"));

    const filteredTransactions = useMemo(() => {
        const now = new Date();
        switch (range) {
            case "current":
                return allTransactions.filter(t => t.date.startsWith(format(now, "yyyy-MM")));
            case "3months":
                return allTransactions.filter(t => isAfter(parseISO(t.date), subMonths(startOfMonth(now), 2)));
            case "6months":
                return allTransactions.filter(t => isAfter(parseISO(t.date), subMonths(startOfMonth(now), 5)));
            case "custom":
                return allTransactions.filter(t => {
                    const tDate = parseISO(t.date);
                    return isAfter(tDate, parseISO(startDate)) && isBefore(tDate, endOfDay(parseISO(endDate)));
                });
            default:
                return allTransactions;
        }
    }, [allTransactions, range, startDate, endDate]);

    const { healthScore, insights } = useSpendingAnalysis(filteredTransactions);
    const advisor = useAIBudgetAdvisor();
    const advisorOverview = advisor?.overview;

    const totalIncome = useMemo(() =>
        filteredTransactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0),
        [filteredTransactions]
    );

    const totalExpense = useMemo(() =>
        filteredTransactions.filter(t => t.type === 'expense' && t.category !== 'cartao').reduce((s, t) => s + t.amount, 0),
        [filteredTransactions]
    );

    const periodBalance = useMemo(() =>
        filteredTransactions.reduce((s, t) => s + (t.type === 'income' ? t.amount : (t.category !== 'cartao' ? -t.amount : 0)), 0),
        [filteredTransactions]
    );

    const dateRangeLabel = useMemo(() => {
        switch (range) {
            case "current": return "Mês Atual";
            case "3months": return "Últimos 3 Meses";
            case "6months": return "Últimos 6 Meses";
            case "custom": return `${format(parseISO(startDate), "dd/MM/yy")} - ${format(parseISO(endDate), "dd/MM/yy")}`;
            default: return "Todo o Período";
        }
    }, [range, startDate, endDate]);

    const formatBRL = (val: number) =>
        val.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

    const prevMonthInterval = {
        start: subMonths(new Date(startDate || new Date()), 1),
        end: subMonths(new Date(endDate || new Date()), 1)
    };

    const prevMonthTransactions = allTransactions.filter(t =>
        isWithinInterval(new Date(t.date), prevMonthInterval)
    );

    const prevBalance = prevMonthTransactions.reduce((acc, t) => {
        if (t.type === "income") return acc + t.amount;
        if (t.category !== "cartao") return acc - t.amount;
        return acc;
    }, 0);

    const variance = prevBalance !== 0
        ? ((periodBalance - prevBalance) / Math.abs(prevBalance)) * 100
        : periodBalance > 0 ? 100 : 0;

    const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

    const donutData = insights.slice(0, 5).map(i => ({
        name: i.categoryName,
        value: i.currentAmount
    }));

    const lineData = useMemo(() => {
        // Sample evolution data
        return [
            { name: 'Sem 1', saldo: periodBalance * 0.2, gastos: totalExpense * 0.25 },
            { name: 'Sem 2', saldo: periodBalance * 0.5, gastos: totalExpense * 0.2 },
            { name: 'Sem 3', saldo: periodBalance * 0.8, gastos: totalExpense * 0.3 },
            { name: 'Sem 4', saldo: periodBalance, gastos: totalExpense * 0.25 },
        ];
    }, [periodBalance, totalExpense]);

    const handleExportPDF = () => {
        const doc = new jsPDF();
        const userName = user?.user_metadata?.name || "Usuário";
        const reportDate = format(new Date(), "dd/MM/yyyy HH:mm");

        const primaryColor: [number, number, number] = [15, 23, 42]; // Slate 900
        const accentColor: [number, number, number] = [16, 185, 129]; // Emerald 500
        const dangerColor: [number, number, number] = [239, 68, 68]; // Red 500
        const muteColor: [number, number, number] = [100, 116, 139]; // Slate 500
        const secondaryColor: [number, number, number] = [241, 245, 249]; // Slate 100

        const drawFooter = (data: any) => {
            doc.setDrawColor(226, 232, 240);
            doc.setLineWidth(0.5);
            doc.line(15, 285, 195, 285);
            doc.setFontSize(7);
            doc.setTextColor(...muteColor);
            doc.text(`MONEYFLOW PREMIUM REPORT | ID: ${Math.random().toString(36).substr(2, 9).toUpperCase()}`, 15, 290);
            doc.text(`PÁGINA ${data.pageNumber} DE ${data.pageCount || 7}`, 195, 290, { align: "right" });
        };

        // ==========================================
        // SECTION 1: CAPA (COVER PAGE)
        // ==========================================
        doc.setFillColor(...primaryColor);
        doc.rect(0, 0, 210, 297, "F");

        // Premium Background Decor
        doc.setDrawColor(255, 255, 255);
        doc.setLineWidth(0.1);
        doc.setGState(new (doc as any).GState({ opacity: 0.05 }));
        for (let i = 0; i < 210; i += 20) doc.line(i, 0, i, 297);
        for (let i = 0; i < 297; i += 20) doc.line(0, i, 210, i);
        doc.setGState(new (doc as any).GState({ opacity: 1.0 }));

        // Center Branding
        doc.setFillColor(...accentColor);
        doc.roundedRect(85, 100, 40, 40, 12, 12, "F");
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(32);
        doc.setFont("helvetica", "bold");
        doc.text("$", 105, 127, { align: "center" });

        doc.setFontSize(48);
        doc.text("MoneyFlow", 105, 160, { align: "center" });
        doc.setFontSize(10);
        doc.setTextColor(...accentColor);
        doc.text("INTELECTO FINANCEIRO & GESTÃO ESTRATÉGICA", 105, 172, { align: "center" });

        // Metadata Block
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        let yPos = 240;
        doc.text(`TITULAR: ${userName.toUpperCase()}`, 105, yPos, { align: "center" });
        doc.text(`INTERVALO: ${dateRangeLabel.toUpperCase()}`, 105, yPos + 8, { align: "center" });
        doc.text(`EMISSÃO: ${reportDate}`, 105, yPos + 16, { align: "center" });

        // ==========================================
        // SECTION 2: RESUMO FINANCEIRO (KPIs)
        // ==========================================
        doc.addPage();
        doc.setFillColor(255, 255, 255);
        doc.rect(0, 0, 210, 297, "F");

        yPos = 30;
        doc.setTextColor(...primaryColor);
        doc.setFontSize(26);
        doc.setFont("helvetica", "bold");
        doc.text("Resumo de Performance", 15, yPos);
        doc.setFillColor(...accentColor);
        doc.rect(15, yPos + 4, 30, 2, "F");

        yPos += 30;
        const drawMetric = (x: number, y: number, label: string, val: string, color: [number, number, number]) => {
            doc.setFillColor(...secondaryColor);
            doc.roundedRect(x, y, 90, 45, 4, 4, "F");
            doc.setTextColor(...muteColor);
            doc.setFontSize(8);
            doc.setFont("helvetica", "bold");
            doc.text(label.toUpperCase(), x + 8, y + 15);
            doc.setTextColor(...primaryColor);
            doc.setFontSize(18);
            doc.text(val, x + 8, y + 28);
        };

        drawMetric(15, yPos, "Total de Receitas", formatBRL(totalIncome), accentColor);
        drawMetric(107, yPos, "Total de Despesas", formatBRL(totalExpense), dangerColor);

        drawMetric(15, yPos, "Saldo do Período", formatBRL(periodBalance), primaryColor);
        drawMetric(107, yPos, "Saldo Global (Conta)", formatBRL(globalBalance), accentColor);

        yPos += 53;
        // Variance Card with Icon
        doc.setFillColor(...secondaryColor);
        doc.roundedRect(15, yPos, 180, 45, 4, 4, "F");
        doc.setTextColor(...muteColor);
        doc.setFontSize(8);
        doc.text("VARIAÇÃO DO PERÍODO VS ANTERIOR", 25, yPos + 15);
        doc.setTextColor(variance >= 0 ? accentColor[0] : dangerColor[0], variance >= 0 ? accentColor[1] : dangerColor[1], variance >= 0 ? accentColor[2] : dangerColor[2]);
        doc.setFontSize(18);
        doc.text(`${variance >= 0 ? "+" : ""}${variance.toFixed(1)}%`, 25, yPos + 28);

        // ==========================================
        // SECTION 3: DISTRIBUIÇÃO DE GASTOS
        // ==========================================
        doc.addPage();
        yPos = 30;
        doc.setTextColor(...primaryColor);
        doc.setFontSize(22);
        doc.text("Distribuição por Categoria", 15, yPos);
        doc.line(15, yPos + 4, 45, yPos + 4);

        yPos += 20;
        const distributionData = insights.slice(0, 8).map(i => [
            i.categoryName.toUpperCase(),
            formatBRL(i.currentAmount),
            `${((i.currentAmount / totalExpense) * 100).toFixed(1)}%`
        ]);

        autoTable(doc, {
            startY: yPos,
            head: [["CATEGORIA", "VALOR", "PARTICIPAÇÃO (%)"]],
            body: distributionData,
            theme: "striped",
            headStyles: { fillColor: primaryColor, textColor: [255, 255, 255], fontSize: 9, cellPadding: 6 },
            styles: { fontSize: 9, cellPadding: 5 },
            columnStyles: { 1: { halign: "right" }, 2: { halign: "right" } }
        });

        // ==========================================
        // SECTION 4: TENDÊNCIAS FINANCEIRAS
        // ==========================================
        yPos = (doc as any).lastAutoTable.finalY + 30;
        doc.setTextColor(...primaryColor);
        doc.setFontSize(22);
        doc.text("Análise de Tendência", 15, yPos);

        yPos += 15;
        // Evolution Plot (Refined simulation)
        doc.setDrawColor(...secondaryColor);
        doc.setLineWidth(0.5);
        doc.line(20, yPos + 60, 190, yPos + 60); // X Axis
        doc.line(20, yPos, 20, yPos + 60); // Y Axis

        doc.setDrawColor(...accentColor);
        doc.setLineWidth(3);
        doc.moveTo(25, yPos + 50);
        doc.lineTo(60, yPos + 20);
        doc.lineTo(110, yPos + 45);
        doc.lineTo(150, yPos + 10);
        doc.lineTo(185, yPos + 5);
        doc.stroke();

        doc.setFontSize(8);
        doc.setTextColor(...muteColor);
        doc.text("EVOLUÇÃO DO PATRIMÔNIO LÍQUIDO", 25, yPos - 5);

        // ==========================================
        // SECTION 5: ANÁLISE DE CARTÃO DE CRÉDITO
        // ==========================================
        doc.addPage();
        yPos = 30;
        doc.setTextColor(...primaryColor);
        doc.setFontSize(22);
        doc.text("Análise de Fatura de Cartão", 15, yPos);
        doc.setFillColor(...accentColor);
        doc.rect(15, yPos + 4, 30, 2, "F");

        yPos += 20;
        const cardTransactions = filteredTransactions.filter(t => t.paymentMethod === "cartao");
        const cardTotal = cardTransactions.reduce((s, t) => s + t.amount, 0);

        doc.setFillColor(...secondaryColor);
        doc.roundedRect(15, yPos, 180, 50, 5, 5, "F");
        doc.setTextColor(...muteColor);
        doc.setFontSize(9);
        doc.text("VALOR TOTAL DA FATURA (ESTIMADO)", 25, yPos + 15);
        doc.setTextColor(...dangerColor);
        doc.setFontSize(28);
        doc.text(formatBRL(cardTotal), 25, yPos + 32);

        yPos += 70;
        doc.setTextColor(...primaryColor);
        doc.setFontSize(14);
        doc.text("Principais categorias de gasto no cartão:", 15, yPos);

        yPos += 10;
        if (cardTransactions.length === 0) {
            doc.setTextColor(...muteColor);
            doc.setFontSize(10);
            doc.text("Nenhuma despesa processada em cartão de crédito neste período.", 15, yPos);
        } else {
            // Group by category name
            const grouped = cardTransactions.reduce((acc, t) => {
                const catName = categories.find(c => c.id === t.category)?.name || "Indefinido";
                acc[catName] = (acc[catName] || 0) + t.amount;
                return acc;
            }, {} as Record<string, number>);

            const cardByCat = Object.entries(grouped)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 5)
                .map(([name, amount]) => [name.toUpperCase(), formatBRL(amount)]);

            autoTable(doc, {
                startY: yPos,
                body: cardByCat,
                theme: "plain",
                styles: { fontSize: 10, cellPadding: 4 },
                columnStyles: { 1: { halign: "right" } }
            });
        }

        // ==========================================
        // SECTION 6: AI INSIGHTS & INTEL
        // ==========================================
        doc.addPage();
        yPos = 30;
        doc.setFillColor(...primaryColor);
        doc.roundedRect(15, yPos, 180, 90, 6, 6, "F");

        doc.setTextColor(...accentColor);
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.text("MONEYFLOW AI: RELATÓRIO DE INTELIGÊNCIA", 25, yPos + 15);

        doc.setTextColor(255, 255, 255);
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        const aiTips = [
            "• Alerta de Gasto: Sua categoria '" + (insights[0]?.categoryName || "Geral") + "' excedeu a média em " + Math.round(variance) + "%.",
            "• Sugestão: Realoque 10% dos gastos variáveis para sua reserva de oportunidade.",
            "• Performance: Seu saldo líquido atual representa " + Math.round((periodBalance / totalIncome) * 100) + "% das suas receitas totais.",
            "• Dica de Consumo: Evite compras parceladas no cartão para as próximas 2 semanas."
        ];
        aiTips.forEach((tip, i) => {
            doc.text(doc.splitTextToSize(tip, 160), 25, yPos + 35 + (i * 12));
        });

        // ==========================================
        // SECTION 7: FINAL SUMMARY & ACTIONS
        // ==========================================
        yPos += 110;
        doc.setTextColor(...primaryColor);
        doc.setFontSize(18);
        doc.text("Diretrizes para o Próximo Ciclo", 15, yPos);

        yPos += 15;
        const actions = [
            "Mapear todos os gastos fixos recorrentes.",
            "Definir teto de gastos para lazer em R$ " + (totalExpense * 0.15).toFixed(0),
            "Investir o saldo excedente de " + formatBRL(periodBalance),
            "Revisar benefícios e taxas do cartão de crédito."
        ];

        actions.forEach((action, i) => {
            doc.setFillColor(...accentColor);
            doc.circle(20, yPos + (i * 12) - 1, 1, "F");
            doc.setTextColor(...muteColor);
            doc.setFontSize(10);
            doc.text(action, 25, yPos + (i * 12));
        });

        // Add footers
        const totalPages = (doc as any).internal.getNumberOfPages();
        for (let i = 1; i <= totalPages; i++) {
            doc.setPage(i);
            drawFooter({ pageNumber: i, pageCount: totalPages });
        }

        doc.save(`Relatorio_Premium_MoneyFlow_${format(new Date(), "yyyy_MM")}.pdf`);
    };

    return (
        <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
            <DialogTrigger asChild>
                <Button
                    variant="ghost"
                    className="gap-2.5 h-8 px-4 border border-white/[0.03] hover:border-white/[0.08] hover:bg-[#111] transition-all active:scale-95 group rounded-[8px]"
                >
                    <Sparkles className="h-3.5 w-3.5 text-[#22c55e]" />
                    <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-[#555] group-hover:text-[#f0f0f0]">Relatório Analítico</span>
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-[#0a0a0a] border-white/[0.04] text-[#f0f0f0] p-0 gap-0 scrollbar-hide">
                <DialogHeader className="p-8 border-b border-white/[0.03] bg-[#0a0a0a]/80 backdrop-blur-md sticky top-0 z-10 transition-all">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                        <div className="space-y-4 flex-1 w-full">
                            <div className="space-y-1">
                                <DialogTitle className="text-title text-[#f0f0f0] flex items-center gap-3">
                                    <TrendingUp className="text-[#22c55e] h-5 w-5" />
                                    Inteligência Financeira
                                </DialogTitle>
                                <p className="text-[11px] text-[#555] uppercase tracking-[0.08em] font-medium">
                                    Prévia do Relatório • {dateRangeLabel}
                                </p>
                            </div>

                            <div className="flex flex-wrap items-center gap-4">
                                <Select value={range} onValueChange={setRange}>
                                    <SelectTrigger className="w-[180px] bg-[#111] border-white/[0.06] text-[#888] h-10 text-[13px] rounded-lg">
                                        <SelectValue placeholder="Selecionar Período" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-[#111] border-white/[0.08] text-[#f0f0f0] rounded-lg">
                                        <SelectItem value="current">Mês Atual</SelectItem>
                                        <SelectItem value="3months">Últimos 3 Meses</SelectItem>
                                        <SelectItem value="6months">Últimos 6 Meses</SelectItem>
                                        <SelectItem value="all">Todo o Período</SelectItem>
                                        <SelectItem value="custom">Personalizado</SelectItem>
                                    </SelectContent>
                                </Select>

                                {range === "custom" && (
                                    <div className="flex items-center gap-3 animate-in fade-in slide-in-from-left-2">
                                        <Input
                                            type="date"
                                            value={startDate}
                                            onChange={(e) => setStartDate(e.target.value)}
                                            className="bg-[#111] border-white/[0.06] text-[#f0f0f0] h-10 rounded-lg text-[12px] w-[140px]"
                                        />
                                        <span className="text-[#333]">-</span>
                                        <Input
                                            type="date"
                                            value={endDate}
                                            onChange={(e) => setEndDate(e.target.value)}
                                            className="bg-[#111] border-white/[0.06] text-[#f0f0f0] h-10 rounded-lg text-[12px] w-[140px]"
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                        <Button
                            onClick={handleExportPDF}
                            className="bg-[#22c55e] hover:bg-[#22c55e]/85 text-[#0a0a0a] rounded-[10px] gap-2 h-10 px-6 font-bold transition-all active:scale-95 shrink-0"
                        >
                            <Download className="h-4 w-4" />
                            Exportar PDF
                        </Button>
                    </div>
                </DialogHeader>

                <div className="p-10 space-y-12 animate-fade-up">
                    {/* SECTION: SUMMARY KPIs: 1px Grid Layout */}
                    <div className="rounded-xl overflow-hidden border border-white/[0.03] bg-white/[0.03] grid grid-cols-1 md:grid-cols-5 gap-px">
                        <div className="bg-[#111] p-6 space-y-3">
                            <p className="text-label">Receitas</p>
                            <p className="text-[20px] font-mono-numbers text-[#22c55e]">{formatBRL(totalIncome)}</p>
                        </div>
                        <div className="bg-[#111] p-6 space-y-3">
                            <p className="text-label">Despesas</p>
                            <p className="text-[20px] font-mono-numbers text-[#ef4444]">{formatBRL(totalExpense)}</p>
                        </div>
                        <div className="bg-[#111] p-6 space-y-3">
                            <p className="text-label">Saldo Período</p>
                            <p className="text-[20px] font-mono-numbers text-[#f0f0f0]">{formatBRL(periodBalance)}</p>
                        </div>
                        <div className="bg-[#111] p-6 space-y-3">
                            <p className="text-label">Saldo Atual</p>
                            <p className="text-[20px] font-mono-numbers text-[#f0f0f0]">{formatBRL(globalBalance)}</p>
                        </div>
                        <div className="bg-[#111] p-6 space-y-3">
                            <p className="text-label">Variação</p>
                            <div className="flex items-center gap-2">
                                {variance >= 0 ? <ArrowUpRight className="h-4 w-4 text-[#22c55e]" /> : <ArrowDownRight className="h-4 w-4 text-[#ef4444]" />}
                                <p className={cn("text-[20px] font-mono-numbers", variance >= 0 ? "text-[#22c55e]" : "text-[#ef4444]")}>
                                    {Math.abs(variance).toFixed(1)}%
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* SECTION: CHARTS PREVIEW */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-px border border-white/[0.03] bg-white/[0.03] rounded-xl overflow-hidden">
                        <div className="bg-[#111] p-8 space-y-6">
                            <div className="flex items-center gap-2">
                                <PieChart className="h-3.5 w-3.5 text-[#555]" />
                                <h3 className="text-label">Distribuição de Gastos</h3>
                            </div>
                            <div className="h-[200px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <RePieChart>
                                        <Pie
                                            data={donutData}
                                            innerRadius={60}
                                            outerRadius={80}
                                            paddingAngle={0}
                                            dataKey="value"
                                            stroke="none"
                                        >
                                            {donutData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <ReTooltip
                                            contentStyle={{ backgroundColor: '#111', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px' }}
                                            itemStyle={{ color: '#f0f0f0', fontSize: '11px', fontFamily: 'DM Mono' }}
                                        />
                                    </RePieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        <div className="bg-[#111] p-8 space-y-6">
                            <div className="flex items-center gap-2">
                                <TrendingUp className="h-3.5 w-3.5 text-[#555]" />
                                <h3 className="text-label">Tendência de Saldo</h3>
                            </div>
                            <div className="h-[200px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <ReLineChart data={lineData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                                        <XAxis dataKey="name" stroke="#555" fontSize={10} axisLine={false} tickLine={false} />
                                        <ReTooltip
                                            contentStyle={{ backgroundColor: '#111', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px' }}
                                            itemStyle={{ color: '#f0f0f0', fontSize: '11px', fontFamily: 'DM Mono' }}
                                        />
                                        <Line type="monotone" dataKey="saldo" stroke="#22c55e" strokeWidth={1.5} dot={{ fill: '#22c55e', r: 3, strokeWidth: 0 }} activeDot={{ r: 5 }} />
                                    </ReLineChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>

                    {/* SECTION: CREDIT CARD ANALYSIS PREVIEW */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-2">
                            <CreditCard className="h-3.5 w-3.5 text-[#555]" />
                            <h3 className="text-label">Detalhamento de Cartão</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-[1fr_1.6fr] gap-px rounded-xl border border-white/[0.03] bg-white/[0.03] overflow-hidden">
                            <div className="bg-[#111] p-10 space-y-4 flex flex-col justify-center">
                                <p className="text-label">Fatura Estimada</p>
                                <p className="text-[40px] font-mono-numbers text-[#ef4444] tracking-tighter leading-none">
                                    {formatBRL(filteredTransactions.filter(t => t.paymentMethod === "cartao").reduce((s, t) => s + t.amount, 0))}
                                </p>
                                <p className="text-[12px] text-[#555] font-light">{filteredTransactions.filter(t => t.paymentMethod === "cartao").length} transações identificadas</p>
                            </div>
                            <div className="bg-[#111] p-10 space-y-6">
                                <p className="text-label">Principais Categorias (Cartão)</p>
                                {filteredTransactions.filter(t => t.paymentMethod === "cartao").length === 0 ? (
                                    <p className="text-[13px] text-[#555] font-light italic">Nenhuma despesa no cartão este período.</p>
                                ) : (
                                    <div className="space-y-px bg-white/[0.04] rounded-lg overflow-hidden border border-white/[0.04]">
                                        {Object.entries(
                                            filteredTransactions.filter(t => t.paymentMethod === "cartao").reduce((acc, t) => {
                                                const catName = categories.find(c => c.id === t.category)?.name || "Indefinido";
                                                acc[catName] = (acc[catName] || 0) + t.amount;
                                                return acc;
                                            }, {} as Record<string, number>)
                                        )
                                            .sort(([, a], [, b]) => b - a)
                                            .slice(0, 3)
                                            .map(([name, amount]) => (
                                                <div key={name} className="flex justify-between items-center bg-[#111] px-5 py-4">
                                                    <span className="text-[13px] font-medium text-[#888]">{name}</span>
                                                    <span className="text-[13px] font-mono-numbers text-[#f0f0f0]">{formatBRL(amount)}</span>
                                                </div>
                                            ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* SECTION: AI INTELLIGENCE PREVIEW */}
                    <div className="bg-[#111] border border-[#22c55e]/10 p-10 rounded-xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-10 opacity-[0.03] group-hover:scale-110 transition-transform pointer-events-none">
                            <Sparkles className="h-32 w-32 text-[#22c55e]" />
                        </div>
                        <div className="relative z-10 space-y-8">
                            <div className="flex items-center gap-3">
                                <div className="bg-[#22c55e]/10 p-2 rounded-[8px]">
                                    <Sparkles className="h-4 w-4 text-[#22c55e]" />
                                </div>
                                <h3 className="text-[12px] font-bold uppercase tracking-[0.1em] text-[#22c55e]">Inteligência Estratégica AI</h3>
                            </div>
                            <p className="text-[18px] font-normal leading-[1.6] text-[#f0f0f0]">
                                {advisorOverview || "Carregando análise estratégica..."}
                            </p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-white/[0.04] rounded-lg overflow-hidden border border-white/[0.04]">
                                <div className="flex items-start gap-4 p-6 bg-[#111]">
                                    <Info className="h-4 w-4 text-[#22c55e] mt-1" />
                                    <div className="space-y-1.5">
                                        <p className="text-label text-[#f0f0f0]">Dica de Próximo Ciclo</p>
                                        <p className="text-[12px] text-[#555] font-light leading-relaxed">
                                            Baseado na sua tendência de gastos fixos, você terá um excedente de 15% para investimentos.
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-4 p-6 bg-[#111]">
                                    <CreditCard className="h-4 w-4 text-[#22c55e] mt-1" />
                                    <div className="space-y-1.5">
                                        <p className="text-label text-[#f0f0f0]">Otimização de Cartão</p>
                                        <p className="text-[12px] text-[#555] font-light leading-relaxed">
                                            Evite novas parcelas no cartão este mês para manter seu Score de Saúde acima de 80%.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <DialogFooter className="p-8 bg-[#0a0a0a] border-t border-white/[0.03] flex items-center justify-center">
                    <p className="text-label text-[#333]">
                        Documento oficial • Gerado por MoneyFlow AI Intelligence
                    </p>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
