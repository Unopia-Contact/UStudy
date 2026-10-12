// QuickStatsCard.tsx
import { TrendingUp, TrendingDown } from 'lucide-react';
import { Card, CardContent } from '../../../components/ui/display/card';

interface QuickStatsCardProps {
    icon: React.ElementType;
    title: string;
    value: string;
    subtitle: string;
    tone: 'blue' | 'green' | 'orange';
    trend?: { direction: 'up' | 'down'; value: string };
}

const toneStyles = {
    blue: {
        icon: 'text-[#0058B2]',
        accent: 'bg-[#0058B2]',
        hover: 'hover:border-blue-300',
    },
    green: {
        icon: 'text-emerald-600',
        accent: 'bg-emerald-500',
        hover: 'hover:border-emerald-300',
    },
    orange: {
        icon: 'text-orange-600',
        accent: 'bg-orange-500',
        hover: 'hover:border-orange-300',
    },
} as const;

export function QuickStatsCard({ icon: Icon, title, value, subtitle, tone, trend }: QuickStatsCardProps) {
    const styles = toneStyles[tone];

    return (
        <Card className={`group relative min-h-[108px] gap-0 overflow-hidden border-gray-200 bg-white shadow-sm transition-[border-color,box-shadow] duration-200 hover:shadow-md md:min-h-[132px] ${styles.hover}`}>
            <span aria-hidden="true" className={`absolute inset-y-3 left-0 w-1 rounded-r-full ${styles.accent}`} />

            <CardContent className="flex h-full min-w-0 flex-1 flex-col px-3 py-3 pl-4 [&:last-child]:pb-3 md:px-5 md:py-4 md:pl-6 md:[&:last-child]:pb-4">
                <div className="flex min-w-0 items-center gap-1.5 md:gap-2">
                    <Icon className={`h-4 w-4 shrink-0 md:h-5 md:w-5 ${styles.icon}`} />
                    <p className="truncate text-[10px] font-semibold uppercase tracking-wide text-slate-500 md:text-xs">
                        {title}
                    </p>
                </div>

                <p className="mt-2 truncate text-xl font-bold leading-none tabular-nums text-slate-950 md:mt-3 md:text-3xl">
                    {value}
                </p>

                <div className="mt-auto flex min-w-0 items-center gap-1.5 pt-2 md:gap-2 md:pt-3">
                    <p className="min-w-0 flex-1 truncate text-[10px] font-medium text-slate-500 md:text-xs" title={subtitle}>
                        {subtitle}
                    </p>
                    {trend && (
                        <span className={`inline-flex shrink-0 items-center gap-0.5 text-[9px] font-semibold md:text-[11px] ${trend.direction === 'up' ? 'text-emerald-600' : 'text-orange-600'}`}>
                            {trend.direction === 'up'
                                ? <TrendingUp className="h-3 w-3" />
                                : <TrendingDown className="h-3 w-3" />}
                            <span className="hidden sm:inline">{trend.value}</span>
                        </span>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
