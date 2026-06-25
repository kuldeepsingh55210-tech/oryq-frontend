import Link from 'next/link';

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border-color bg-card/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center space-x-2">
            {/* Custom SVG logo */}
            <svg
              className="h-8 w-8 text-accent-blue transition-transform duration-300 hover:rotate-12"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
              />
            </svg>
            <span className="bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-xl font-bold tracking-tight text-transparent">
              ORYQ
            </span>
          </Link>
          <span className="hidden rounded-full bg-card-light px-2.5 py-0.5 text-xs font-semibold text-secondary sm:inline-block border border-border-color">
            AI Visibility Engine
          </span>
        </div>

        <nav className="flex items-center space-x-6">
          <Link
            href="/"
            className="text-sm font-medium text-secondary transition-colors hover:text-white"
          >
            New Scan
          </Link>
          <Link
            href="/history"
            className="text-sm font-medium text-secondary transition-colors hover:text-white"
          >
            History
          </Link>
          <a
            href="https://github.com"
            target="_blank"
            rel="noreferrer"
            className="rounded-lg bg-card border border-border-color px-4 py-2 text-xs font-medium text-secondary transition-colors hover:bg-card-light hover:text-white"
          >
            Documentation
          </a>
        </nav>
      </div>
    </header>
  );
}
