import React from 'react';

const LoadingSkeleton = ({ count = 3, type = 'card' }) => {
  if (type === 'card') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
        {Array.from({ length: count }).map((_, idx) => (
          <div
            key={idx}
            className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4"
          >
            <div className="flex items-center justify-between">
              <div className="h-6 w-16 bg-slate-200 rounded-md"></div>
              <div className="h-4 w-20 bg-slate-200 rounded-md"></div>
            </div>
            <div className="h-5 w-3/4 bg-slate-200 rounded-md"></div>
            <div className="h-4 w-full bg-slate-100 rounded-md"></div>
            <div className="h-4 w-2/3 bg-slate-100 rounded-md"></div>
            <div className="pt-2 flex items-center justify-between border-t border-slate-100">
              <div className="h-4 w-24 bg-slate-200 rounded-md"></div>
              <div className="h-8 w-8 bg-slate-200 rounded-full"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (type === 'table') {
    return (
      <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-xs animate-pulse">
        <div className="h-12 bg-slate-100 border-b border-slate-200"></div>
        <div className="divide-y divide-slate-100">
          {Array.from({ length: count }).map((_, idx) => (
            <div key={idx} className="h-16 p-4 flex items-center justify-between space-x-4">
              <div className="h-5 w-1/4 bg-slate-200 rounded-md"></div>
              <div className="h-5 w-1/6 bg-slate-100 rounded-md"></div>
              <div className="h-5 w-1/8 bg-slate-200 rounded-md"></div>
              <div className="h-8 w-20 bg-slate-100 rounded-md"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3 animate-pulse">
      {Array.from({ length: count }).map((_, idx) => (
        <div key={idx} className="h-6 bg-slate-200 rounded-md w-full"></div>
      ))}
    </div>
  );
};

export default LoadingSkeleton;

