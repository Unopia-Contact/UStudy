import type { ReactNode } from 'react';

interface PageHeaderProps {
    title: ReactNode;
    titleAction?: ReactNode;
    description?: ReactNode;
    actions?: ReactNode;
    className?: string;
}

export function PageHeader({ title, titleAction, description, actions, className = '' }: PageHeaderProps) {
    return (
        <header className={`ustudy-page-header ${className}`.trim()}>
            <div className="min-w-0">
                {titleAction ? (
                    <div className="mb-2 flex items-center gap-1 sm:gap-2">
                        <h1 className="ustudy-page-title mb-0">{title}</h1>
                        {titleAction}
                    </div>
                ) : (
                    <h1 className="ustudy-page-title">{title}</h1>
                )}
                {description && <p className="ustudy-page-description">{description}</p>}
            </div>

            {actions && <div className="flex shrink-0 items-start gap-2">{actions}</div>}
        </header>
    );
}
