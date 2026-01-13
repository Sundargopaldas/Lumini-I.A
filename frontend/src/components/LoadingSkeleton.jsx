/**
 * 💀 Loading Skeleton Component
 * Skeleton loader para melhor UX durante carregamento
 */

const LoadingSkeleton = ({ type = 'card', count = 1 }) => {
  const renderSkeleton = () => {
    switch (type) {
      case 'card':
        return (
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm p-6 animate-pulse">
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4 mb-4"></div>
            <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/2 mb-2"></div>
            <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-2/3"></div>
          </div>
        );
      
      case 'table-row':
        return (
          <tr className="animate-pulse">
            <td className="px-6 py-4">
              <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-24"></div>
            </td>
            <td className="px-6 py-4">
              <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-32"></div>
            </td>
            <td className="px-6 py-4">
              <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-20"></div>
            </td>
            <td className="px-6 py-4">
              <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-16"></div>
            </td>
          </tr>
        );
      
      case 'text':
        return (
          <div className="space-y-2 animate-pulse">
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-full"></div>
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-5/6"></div>
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-4/6"></div>
          </div>
        );
      
      case 'stats':
        return (
          <div className="bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl p-6 animate-pulse">
            <div className="h-6 bg-white/20 rounded w-32 mb-4"></div>
            <div className="h-10 bg-white/30 rounded w-24"></div>
          </div>
        );
      
      default:
        return (
          <div className="h-20 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
        );
    }
  };

  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index}>{renderSkeleton()}</div>
      ))}
    </>
  );
};

export default LoadingSkeleton;
