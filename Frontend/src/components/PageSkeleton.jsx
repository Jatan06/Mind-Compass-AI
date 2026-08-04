import React from 'react';

export const PageSkeleton = () => {
    return (
        <div className="flex-grow flex flex-col gap-6 text-left max-w-4xl mx-auto w-full animate-pulse">
            {/* Header Skeleton */}
            <div className="space-y-2">
                <div className="h-8 w-48 bg-secondary/15 dark:bg-secondary/10 rounded-xl" />
                <div className="h-4 w-96 max-w-full bg-secondary/10 dark:bg-secondary/5 rounded-lg" />
            </div>

            {/* Stats Row Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                    <div
                        key={i}
                        className="bg-card-light dark:bg-card-dark border border-secondary/15 dark:border-secondary/5 rounded-2xl p-5 flex items-center gap-3"
                    >
                        <div className="w-10 h-10 rounded-xl bg-secondary/15 dark:bg-secondary/10 shrink-0" />
                        <div className="space-y-2 flex-1">
                            <div className="h-5 w-20 bg-secondary/15 dark:bg-secondary/10 rounded-md" />
                            <div className="h-3 w-14 bg-secondary/10 dark:bg-secondary/5 rounded-md" />
                        </div>
                    </div>
                ))}
            </div>

            {/* Card 1 Skeleton */}
            <div className="bg-card-light dark:bg-card-dark border border-secondary/15 dark:border-secondary/5 rounded-3xl p-6 md:p-8 space-y-5">
                <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-md bg-secondary/20 dark:bg-secondary/10" />
                    <div className="h-5 w-36 bg-secondary/20 dark:bg-secondary/10 rounded-lg" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="space-y-2">
                            <div className="h-3 w-20 bg-secondary/15 dark:bg-secondary/10 rounded-md" />
                            <div className="h-10 w-full bg-bg-light dark:bg-bg-dark rounded-xl border border-secondary/10 dark:border-secondary/5" />
                        </div>
                    ))}
                </div>
            </div>

            {/* Card 2 Skeleton */}
            <div className="bg-card-light dark:bg-card-dark border border-secondary/15 dark:border-secondary/5 rounded-3xl p-6 md:p-8 space-y-5">
                <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-md bg-secondary/20 dark:bg-secondary/10" />
                    <div className="h-5 w-40 bg-secondary/20 dark:bg-secondary/10 rounded-lg" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="h-24 bg-bg-light dark:bg-bg-dark rounded-2xl border border-secondary/10 dark:border-secondary/5 p-4 space-y-2">
                            <div className="h-4 w-28 bg-secondary/15 dark:bg-secondary/10 rounded-md" />
                            <div className="h-3 w-36 bg-secondary/10 dark:bg-secondary/5 rounded-md" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
