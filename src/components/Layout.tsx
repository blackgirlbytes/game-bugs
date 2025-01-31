import { Worm, ClipboardList, Grid, Grid2x2, Dice3 } from 'lucide-react';
import Link from 'next/link';

type LayoutProps = {
  children: React.ReactNode;
};

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between h-16">
            <div className="flex space-x-8">
              <Link
                href="/"
                className="flex items-center px-3 py-2 text-gray-700 hover:text-gray-900"
              >
                <Worm className="w-5 h-5 mr-2" />
                Snake Game
              </Link>
              <Link
                href="/tetris"
                className="flex items-center px-3 py-2 text-gray-700 hover:text-gray-900"
              >
                <Grid className="w-5 h-5 mr-2" />
                Tetris
              </Link>
              <Link
                href="/checkers"
                className="flex items-center px-3 py-2 text-gray-700 hover:text-gray-900"
              >
                <Grid2x2 className="w-5 h-5 mr-2" />
                Checkers
              </Link>
              <Link
                href="/dominoes"
                className="flex items-center px-3 py-2 text-gray-700 hover:text-gray-900"
              >
                <Dice3 className="w-5 h-5 mr-2" />
                Dominoes
              </Link>
              <Link
                href="/logs"
                className="flex items-center px-3 py-2 text-gray-700 hover:text-gray-900"
              >
                <ClipboardList className="w-5 h-5 mr-2" />
                Logs
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
}