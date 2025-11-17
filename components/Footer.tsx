export function Footer() {
  return (
    <footer className="border-t border-zinc-800 bg-zinc-950/50 backdrop-blur-sm">
      <div className="mx-auto max-w-7xl px-4 py-4">
        <p className="text-center text-xs text-zinc-500">
          Made with{' '}
          <span className="font-semibold text-zinc-400">Next.js</span>
          {' '}•{' '}
          <span className="text-zinc-400">TypeScript</span>
          {' '}•{' '}
          <span className="text-zinc-400">Tailwind CSS</span>
        </p>
      </div>
    </footer>
  );
}