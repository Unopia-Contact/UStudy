import { CheckCircle2, BarChart3, AlertTriangle } from "lucide-react";
import type { TuitionSummary } from "../types";
import type { JSX } from "react";

export default function TuitionStatus({ currentSemesterSummary, getStatusBadge }: { currentSemesterSummary: TuitionSummary, getStatusBadge: (status: string) => JSX.Element | null }) {
    return (
        <div className="bg-white rounded-lg p-3 md:p-4 shadow-sm border border-gray-200">
            <div className="flex items-start gap-3">
                <div className={`flex shrink-0 items-center justify-center ${currentSemesterSummary.status === 'paid' ? 'text-green-600' :
                    currentSemesterSummary.status === 'partial' ? 'text-amber-600' :
                        'text-red-600'
                    } ${currentSemesterSummary.status === 'unpaid' ? 'animate-pulse' : ''
                    }`}>
                    {currentSemesterSummary.status === 'paid' ? (
                        <CheckCircle2 className="h-6 w-6" />
                    ) : currentSemesterSummary.status === 'partial' ? (
                        <BarChart3 className="h-6 w-6" />
                    ) : (
                        <AlertTriangle className="h-6 w-6" />
                    )}
                </div>
                <div>
                    <p className="text-xs md:text-sm font-medium text-gray-700 mb-1 md:mb-2">Trạng thái thanh toán</p>
                    <div className="transform scale-90 origin-left md:scale-100">
                        {getStatusBadge(currentSemesterSummary.status)}
                    </div>
                </div>
            </div>
        </div>
    )
}
