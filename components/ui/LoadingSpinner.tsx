export function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center w-full h-full">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-sky-500/20 border-t-sky-500 rounded-full animate-spin"></div>
        <p className="text-gray-400 text-sm">Loading balloon data...</p>
      </div>
    </div>
  );
}
