import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

// Dashboard Stats Card Skeleton
export const StatsCardSkeleton = () => (
  <Card className="relative overflow-hidden border-0 shadow-sm">
    <CardHeader className="pb-3">
      <div className="flex items-start justify-between">
        <div className="space-y-2 flex-1">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-32" />
        </div>
        <Skeleton className="h-10 w-10 rounded-lg" />
      </div>
    </CardHeader>
    <CardContent className="pb-4">
      <Skeleton className="h-3 w-full mb-2" />
      <Skeleton className="h-3 w-2/3" />
    </CardContent>
  </Card>
);

// Table Skeleton
export const TableSkeleton = ({ rows = 5 }: { rows?: number }) => (
  <div className="space-y-3 p-4">
    {/* Table header */}
    <div className="flex gap-4 pb-3 border-b">
      <Skeleton className="h-4 w-8" />
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-4 w-40" />
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-4 flex-1" />
    </div>
    
    {/* Table rows */}
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="flex gap-4 py-3 items-center border-b border-border/50">
        <Skeleton className="h-4 w-8" />
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-6 w-24 rounded-full" />
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-8 w-20 rounded-md" />
      </div>
    ))}
  </div>
);

// Form Skeleton
export const FormSkeleton = () => (
  <div className="space-y-6 p-6">
    <div className="space-y-2">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-10 w-full" />
    </div>
    <div className="space-y-2">
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-10 w-full" />
    </div>
    <div className="space-y-2">
      <Skeleton className="h-4 w-28" />
      <Skeleton className="h-24 w-full" />
    </div>
    <div className="flex gap-3 justify-end">
      <Skeleton className="h-10 w-24" />
      <Skeleton className="h-10 w-24" />
    </div>
  </div>
);

// Page Loading Skeleton
export const PageLoadingSkeleton = ({ message = "Loading content..." }: { message?: string }) => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="text-center space-y-6 max-w-md px-6">
      <div className="space-y-4">
        <Skeleton className="h-12 w-12 rounded-full mx-auto" />
        <Skeleton className="h-6 w-48 mx-auto" />
        <Skeleton className="h-4 w-64 mx-auto" />
      </div>
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  </div>
);

// Dashboard Loading Skeleton
export const DashboardLoadingSkeleton = () => (
  <div className="space-y-6 p-4">
    {/* Header skeleton */}
    <div className="flex items-center justify-between">
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-64" />
      </div>
      <Skeleton className="h-10 w-32" />
    </div>

    {/* Stats grid */}
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <StatsCardSkeleton key={i} />
      ))}
    </div>

    {/* Filters skeleton */}
    <Card>
      <CardHeader>
        <div className="flex gap-4">
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-32" />
        </div>
      </CardHeader>
    </Card>

    {/* Table skeleton */}
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-48" />
      </CardHeader>
      <CardContent className="p-0">
        <TableSkeleton rows={8} />
      </CardContent>
    </Card>
  </div>
);

// Compact Loading State (for inline use)
export const LoadingState = ({ 
  message = "Loading...",
  className 
}: { 
  message?: string;
  className?: string;
}) => (
  <div className={cn("flex items-center justify-center p-8", className)}>
    <div className="text-center space-y-3">
      <Skeleton className="h-8 w-8 rounded-full mx-auto animate-pulse" />
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  </div>
);
