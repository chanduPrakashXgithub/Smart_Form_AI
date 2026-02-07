export function FormSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
          {/* Field label skeleton */}
          <div className="h-4 bg-slate-200 rounded-lg w-32 mb-3"></div>
          {/* Input skeleton */}
          <div className="h-12 bg-slate-100 rounded-xl w-full mb-4"></div>
          
          <div className="h-4 bg-slate-200 rounded-lg w-40 mb-3"></div>
          <div className="h-12 bg-slate-100 rounded-xl w-full"></div>
        </div>
      ))}
    </div>
  );
}

export function SectionSkeleton() {
  return (
    <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 mb-6 animate-pulse">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="h-8 bg-slate-200 rounded-lg w-48 mb-2"></div>
          <div className="h-4 bg-slate-100 rounded-lg w-64"></div>
        </div>
      </div>
      
      <div className="space-y-5">
        {[1, 2, 3, 4].map((i) => (
          <div key={i}>
            <div className="h-4 bg-slate-200 rounded-lg w-32 mb-2"></div>
            <div className="h-12 bg-slate-100 rounded-xl w-full"></div>
          </div>
        ))}
      </div>
    </div>
  );
}
