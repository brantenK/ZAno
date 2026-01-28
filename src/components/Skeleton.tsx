import React from 'react';

interface SkeletonProps {
    className?: string;
    variant?: 'text' | 'circular' | 'rectangular';
    width?: string | number;
    height?: string | number;
}

const Skeleton: React.FC<SkeletonProps> = ({
    className = '',
    variant = 'rectangular',
    width,
    height
}) => {
    const baseClasses = 'animate-pulse bg-slate-200';

    const variantClasses = {
        text: 'rounded',
        circular: 'rounded-full',
        rectangular: 'rounded-lg',
    };

    const style: React.CSSProperties = {};
    if (width) style.width = typeof width === 'number' ? `${width}px` : width;
    if (height) style.height = typeof height === 'number' ? `${height}px` : height;

    return (
        <div
            className={`${baseClasses} ${variantClasses[variant]} ${className}`}
            style={style}
        />
    );
};

// Pre-built skeleton components for common patterns

export const SkeletonCard: React.FC<{ className?: string }> = ({ className = '' }) => (
    <div className={`bg-white rounded-2xl p-6 shadow-sm ${className}`}>
        <div className="flex items-center gap-4 mb-4">
            <Skeleton variant="circular" width={48} height={48} />
            <div className="flex-1">
                <Skeleton height={20} width="60%" className="mb-2" />
                <Skeleton height={14} width="40%" />
            </div>
        </div>
        <Skeleton height={16} className="mb-2" />
        <Skeleton height={16} width="80%" />
    </div>
);

export const SkeletonTable: React.FC<{ rows?: number }> = ({ rows = 5 }) => (
    <div className="bg-white rounded-2xl p-6 shadow-sm">
        {/* Header */}
        <div className="flex gap-4 mb-4 pb-4 border-b border-slate-100">
            <Skeleton height={16} width="20%" />
            <Skeleton height={16} width="30%" />
            <Skeleton height={16} width="25%" />
            <Skeleton height={16} width="15%" />
        </div>
        {/* Rows */}
        {Array.from({ length: rows }).map((_, i) => (
            <div key={i} className="flex gap-4 py-3">
                <Skeleton height={14} width="20%" />
                <Skeleton height={14} width="30%" />
                <Skeleton height={14} width="25%" />
                <Skeleton height={14} width="15%" />
            </div>
        ))}
    </div>
);

export const SkeletonDashboard: React.FC = () => (
    <div className="space-y-6">
        {/* Stats row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-2xl p-6 shadow-sm">
                    <Skeleton height={14} width="50%" className="mb-3" />
                    <Skeleton height={32} width="40%" className="mb-2" />
                    <Skeleton height={12} width="70%" />
                </div>
            ))}
        </div>

        {/* Main content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <SkeletonCard />
            <SkeletonCard />
        </div>

        {/* Table */}
        <SkeletonTable rows={4} />
    </div>
);

export const SkeletonList: React.FC<{ items?: number }> = ({ items = 5 }) => (
    <div className="space-y-3">
        {Array.from({ length: items }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl p-4 shadow-sm flex items-center gap-4">
                <Skeleton variant="circular" width={40} height={40} />
                <div className="flex-1">
                    <Skeleton height={16} width="60%" className="mb-2" />
                    <Skeleton height={12} width="40%" />
                </div>
                <Skeleton height={24} width={80} />
            </div>
        ))}
    </div>
);

export default Skeleton;
