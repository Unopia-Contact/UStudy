// QuickStatsCard.tsx
import { TrendingUp, TrendingDown } from 'lucide-react';
import { Card, CardContent } from '../../../components/ui/display/card';

interface QuickStatsCardProps {
    icon: React.ElementType;
    title: string;
    value: string;
    subtitle: string;
    bgColor: string;
    trend?: { direction: 'up' | 'down'; value: string };
}

export function QuickStatsCard({ icon: Icon, title, value, subtitle, bgColor, trend }: QuickStatsCardProps) {
    return (
        <Card className="min-w-0 border-gray-200 shadow-sm">
            <CardContent className="min-w-0 p-2.5 sm:p-3 lg:p-4">
                <div className="flex min-w-0 flex-col gap-2 lg:flex-row lg:items-start lg:gap-3">
                    <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md ${bgColor} lg:h-9 lg:w-9`}>
                        <Icon className="h-4 w-4 text-white lg:h-5 lg:w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="truncate text-[11px] font-medium text-gray-600 lg:text-sm">{title}</p>
                        <p className="mt-1 text-base font-semibold tabular-nums leading-tight text-gray-900 lg:text-xl">{value}</p>
                        <div className="mt-1 flex min-w-0 flex-wrap items-center gap-x-1 gap-y-0.5">
                            <p className="min-w-0 truncate text-[10px] text-gray-500 lg:text-xs" title={subtitle}>{subtitle}</p>
                            {trend && (
                                <div className={`hidden items-center gap-0.5 text-xs font-medium lg:flex ${trend.direction === 'up' ? 'text-green-700' : 'text-amber-700'
                                    }`}>
                                    {trend.direction === 'up' ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                                    <span>{trend.value}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
