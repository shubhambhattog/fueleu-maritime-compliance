import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function TableSkeleton({ rows = 5, columns = 8 }: { rows?: number; columns?: number }) {
  return (
    <div className="w-full space-y-4">
      {/* Header skeleton */}
      <div className="flex gap-4 pb-2 border-b">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={`header-${i}`} className="h-4 flex-1" />
        ))}
      </div>

      {/* Rows skeleton */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={`row-${rowIndex}`} className="flex gap-4 items-center">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton key={`cell-${rowIndex}-${colIndex}`} className="h-8 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}

export function KPICardsSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      {Array.from({ length: count }).map((_, i) => (
        <Card key={`kpi-${i}`}>
          <CardHeader className="pb-3">
            <Skeleton className="h-4 w-24" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-32 mb-2" />
            <Skeleton className="h-3 w-20" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function ChartSkeleton() {
  return (
    <div className="w-full h-[400px] flex items-end justify-between gap-2 p-6 bg-muted/20 rounded-lg">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={`bar-${i}`} className="flex-1 flex flex-col justify-end">
          <Skeleton 
            className="w-full" 
            style={{ height: `${Math.random() * 60 + 40}%` }}
          />
        </div>
      ))}
    </div>
  );
}

export function FormSkeleton() {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-10 w-full" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-10 w-full" />
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-10 w-32" />
      </div>
    </div>
  );
}

export function RoutesTabSkeleton() {
  return (
    <div className="space-y-6">
      {/* Filters skeleton */}
      <div className="flex gap-4 items-center">
        <Skeleton className="h-10 w-[200px]" />
        <Skeleton className="h-10 w-[150px]" />
        <Skeleton className="h-10 w-[150px]" />
        <Skeleton className="h-10 w-[150px]" />
      </div>

      {/* Table skeleton */}
      <TableSkeleton rows={10} columns={8} />
    </div>
  );
}

export function CompareTabSkeleton() {
  return (
    <div className="space-y-6">
      {/* Info banner skeleton */}
      <Skeleton className="h-16 w-full" />

      {/* Filters skeleton */}
      <div className="flex gap-4 items-center">
        <Skeleton className="h-10 w-[200px]" />
        <Skeleton className="h-10 w-32" />
      </div>

      {/* Chart skeleton */}
      <ChartSkeleton />

      {/* Table skeleton */}
      <TableSkeleton rows={5} columns={5} />
    </div>
  );
}

export function BankingTabSkeleton() {
  return (
    <div className="space-y-6">
      {/* Form skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-10 w-full" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>

      <Skeleton className="h-10 w-32" />

      {/* KPI Cards skeleton */}
      <KPICardsSkeleton count={4} />

      {/* Actions skeleton */}
      <div className="flex gap-4">
        <Skeleton className="h-10 w-[300px]" />
        <Skeleton className="h-10 w-[300px]" />
      </div>

      {/* History table skeleton */}
      <div className="space-y-4">
        <Skeleton className="h-6 w-40" />
        <TableSkeleton rows={5} columns={5} />
      </div>
    </div>
  );
}

export function PoolingTabSkeleton() {
  return (
    <div className="space-y-6">
      {/* Year selector skeleton */}
      <div className="space-y-2">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-10 w-[300px]" />
      </div>

      {/* Info skeleton */}
      <Skeleton className="h-12 w-full" />

      {/* Members table skeleton */}
      <div className="space-y-4">
        <Skeleton className="h-6 w-40" />
        <TableSkeleton rows={6} columns={6} />
      </div>

      {/* Create pool button skeleton */}
      <Skeleton className="h-10 w-[300px]" />
    </div>
  );
}
