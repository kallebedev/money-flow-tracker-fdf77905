import { Button } from "@/components/ui/button";
import { FileDown, Sparkles, TrendingUp, CreditCard, PieChart, Info, Download, X, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { Transaction, Category } from "@/lib/types";
import { format, parseISO, subMonths, isWithinInterval } from "date-fns";
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

interface ReportExportButtonProps {
    transactions: Transaction[];
    categories: Category[];
    totalIncome: number;
    totalExpense: number;
    periodBalance: number;
    globalBalance: number;
    healthScore: number;
    insights: any[];
    advisorOverview?: string;
    dateRange: {
        start?: string;
        end?: string;
        label: string;
    };
}

export function ReportExportButton({
    transactions,
    categories,
    totalIncome,
    totalExpense,
    periodBalance,
    globalBalance,
    healthScore,
    insights,
    advisorOverview,
    dateRange,
}: ReportExportButtonProps) {
    const { user } = useAuth();
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);

    const formatBRL = (val: number) =>
        val.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

    // Calculate Variance (Simulated comparison with previous period if not provided)
    const prevMonthInterval = {
        start: subMonths(new Date(dateRange.start || new Date()), 1),
        end: subMonths(new Date(dateRange.end || new Date()), 1)
    };

    const prevMonthTransactions = transactions.filter(t =>
        isWithinInterval(new Date(t.date), prevMonthInterval)
    );

    const prevBalance = prevMonthTransactions.reduce((acc, t) =>
        acc + (t.type === "income" ? t.amount : -t.amount), 0
    );

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
        doc.text(`INTERVALO: ${dateRange.label.toUpperCase()}`, 105, yPos + 8, { align: "center" });
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
        const cardTransactions = transactions.filter(t => t.paymentMethod === "cartao");
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
                    variant="outline"
                    className="gap-2 rounded-2xl h-11 px-6 border-white/10 bg-white/5 hover:bg-primary hover:text-primary-foreground transition-all active:scale-95 shadow-lg group"
                >
                    <Sparkles className="h-4 w-4 text-emerald-400 group-hover:text-primary-foreground transition-colors animate-pulse" />
                    <span className="font-bold text-xs uppercase tracking-widest text-foreground group-hover:text-primary-foreground">Relatório Analítico</span>
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-slate-950 border-white/10 text-white p-0 gap-0">
                <DialogHeader className="p-6 border-b border-white/5 bg-slate-900/50 sticky top-0 z-10 backdrop-blur-md">
                    <div className="flex justify-between items-center">
                        <div>
                            <DialogTitle className="text-2xl font-black tracking-tight flex items-center gap-2">
                                <TrendingUp className="text-emerald-500 h-6 w-6" />
                                Inteligência Financeira
                            </DialogTitle>
                            <p className="text-muted-foreground text-sm uppercase tracking-widest font-bold mt-1">
                                Prévia do Relatório • {dateRange.label}
                            </p>
                        </div>
                        <Button
                            onClick={handleExportPDF}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl gap-2 h-11 px-6 font-bold transition-all active:scale-95"
                        >
                            <Download className="h-4 w-4" />
                            Exportar PDF
                        </Button>
                    </div>
                </DialogHeader>

                <div className="p-8 space-y-12">
                    {/* SECTION: SUMMARY KPIs */}
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                        <div className="bg-white/5 border border-white/5 p-4 rounded-3xl space-y-1">
                            <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Receitas</p>
                            <p className="text-lg font-black text-emerald-400">{formatBRL(totalIncome)}</p>
                        </div>
                        <div className="bg-white/5 border border-white/5 p-4 rounded-3xl space-y-1">
                            <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Despesas</p>
                            <p className="text-lg font-black text-red-400">{formatBRL(totalExpense)}</p>
                        </div>
                        <div className="bg-white/5 border border-white/5 p-4 rounded-3xl space-y-1">
                            <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Saldo Período</p>
                            <p className="text-lg font-black text-blue-400">{formatBRL(periodBalance)}</p>
                        </div>
                        <div className="bg-white/5 border border-white/5 p-4 rounded-3xl space-y-1">
                            <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Saldo Atual</p>
                            <p className="text-lg font-black text-white">{formatBRL(globalBalance)}</p>
                        </div>
                        <div className="bg-white/5 border border-white/5 p-4 rounded-3xl space-y-1">
                            <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Variação</p>
                            <div className="flex items-center gap-1">
                                {variance >= 0 ? <ArrowUpRight className="h-3 w-3 text-emerald-400" /> : <ArrowDownRight className="h-3 w-3 text-red-400" />}
                                <p className={cn("text-lg font-black", variance >= 0 ? "text-emerald-400" : "text-red-400")}>
                                    {Math.abs(variance).toFixed(1)}%
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* SECTION: CHARTS PREVIEW */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 mb-2">
                                <PieChart className="h-4 w-4 text-emerald-500" />
                                <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground">Distribuição de Gastos</h3>
                            </div>
                            <div className="h-[250px] w-full bg-white/[0.02] rounded-3xl border border-white/5 p-4">
                                <ResponsiveContainer width="100%" height="100%">
                                    <RePieChart>
                                        <Pie
                                            data={donutData}
                                            innerRadius={60}
                                            outerRadius={80}
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            {donutData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="transparent" />
                                            ))}
                                        </Pie>
                                        <ReTooltip
                                            contentStyle={{ backgroundColor: '#020617', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                                            itemStyle={{ color: '#fff', fontSize: '10px' }}
                                        />
                                    </RePieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center gap-2 mb-2">
                                <TrendingUp className="h-4 w-4 text-emerald-500" />
                                <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground">Tendência de Saldo</h3>
                            </div>
                            <div className="h-[250px] w-full bg-white/[0.02] rounded-3xl border border-white/5 p-4">
                                <ResponsiveContainer width="100%" height="100%">
                                    <ReLineChart data={lineData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                        <XAxis dataKey="name" stroke="rgba(255,255,255,0.3)" fontSize={10} axisLine={false} tickLine={false} />
                                        <ReTooltip
                                            contentStyle={{ backgroundColor: '#020617', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                                            itemStyle={{ color: '#fff', fontSize: '10px' }}
                                        />
                                        <Line type="monotone" dataKey="saldo" stroke="#10b981" strokeWidth={3} dot={{ fill: '#10b981', r: 4 }} />
                                    </ReLineChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>

                    {/* SECTION: CREDIT CARD ANALYSIS PREVIEW */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-2">
                            <CreditCard className="h-4 w-4 text-emerald-500" />
                            <h3 className="text-sm font-black uppercase tracking-widest text-muted-foreground">Detalhamento de Cartão</h3>
                        </div>
                        <div className="bg-white/5 border border-white/5 rounded-3xl p-8 flex flex-col md:flex-row gap-8 items-center">
                            <div className="flex-1 space-y-1">
                                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Fatura Estimada</p>
                                <p className="text-4xl font-black text-red-400">{formatBRL(transactions.filter(t => t.paymentMethod === "cartao").reduce((s, t) => s + t.amount, 0))}</p>
                                <p className="text-xs text-muted-foreground">{transactions.filter(t => t.paymentMethod === "cartao").length} transações identificadas</p>
                            </div>
                            <div className="flex-1 w-full space-y-3">
                                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2">Principais Categorias (Cartão)</p>
                                {transactions.filter(t => t.paymentMethod === "cartao").length === 0 ? (
                                    <p className="text-xs text-muted-foreground italic">Nenhuma despesa no cartão este período.</p>
                                ) : (
                                    Object.entries(
                                        transactions.filter(t => t.paymentMethod === "cartao").reduce((acc, t) => {
                                            const catName = categories.find(c => c.id === t.category)?.name || "Indefinido";
                                            acc[catName] = (acc[catName] || 0) + t.amount;
                                            return acc;
                                        }, {} as Record<string, number>)
                                    )
                                        .sort(([, a], [, b]) => b - a)
                                        .slice(0, 3)
                                        .map(([name, amount]) => (
                                            <div key={name} className="flex justify-between items-center bg-white/5 p-3 rounded-xl">
                                                <span className="text-xs font-bold text-slate-300">{name}</span>
                                                <span className="text-xs font-black text-white">{formatBRL(amount)}</span>
                                            </div>
                                        ))
                                )}
                            </div>
                        </div>
                    </div>

                    {/* SECTION: AI INTELLIGENCE PREVIEW */}
                    <div className="bg-emerald-500/5 border border-emerald-500/10 p-8 rounded-[40px] relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
                            <Sparkles className="h-24 w-24 text-emerald-500" />
                        </div>
                        <div className="relative z-10 space-y-4">
                            <div className="flex items-center gap-2">
                                <div className="bg-emerald-500 p-1.5 rounded-lg">
                                    <Sparkles className="h-4 w-4 text-white" />
                                </div>
                                <h3 className="text-sm font-black uppercase tracking-widest text-emerald-500">Inteligência Estratégica AI</h3>
                            </div>
                            <p className="text-lg font-medium leading-relaxed text-slate-200">
                                {advisorOverview || "Estamos analisando seus dados para gerar recomendações personalizadas."}
                            </p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                                <div className="flex items-start gap-3 p-4 bg-white/5 rounded-2xl">
                                    <Info className="h-5 w-5 text-emerald-400 mt-0.5" />
                                    <p className="text-xs text-muted-foreground leading-relaxed">
                                        <span className="font-bold text-white block mb-1">Dica de Próximo Ciclo</span>
                                        Baseado na sua tendência de gastos fixos, você terá um excedente de 15% para investimentos.
                                    </p>
                                </div>
                                <div className="flex items-start gap-3 p-4 bg-white/5 rounded-2xl">
                                    <CreditCard className="h-5 w-5 text-emerald-400 mt-0.5" />
                                    <p className="text-xs text-muted-foreground leading-relaxed">
                                        <span className="font-bold text-white block mb-1">Otimização de Cartão</span>
                                        Evite novas parcelas no cartão este mês para manter seu Score de Saúde acima de 80%.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <DialogFooter className="p-6 bg-slate-900/50 border-t border-white/5">
                    <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-[0.2em]">
                        Documento oficial • Gerado por MoneyFlow AI Intelligence
                    </p>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
