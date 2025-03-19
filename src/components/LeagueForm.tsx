import React from 'react';
import { Search } from 'lucide-react';

interface LeagueFormProps {
  onSubmit: (leagueId: number) => void;
  isLoading: boolean;
}

export function LeagueForm({ onSubmit, isLoading }: LeagueFormProps) {
  const FIXED_LEAGUE_ID = 1831210;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(FIXED_LEAGUE_ID);
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-md">
      <div className="relative">
        <input
          type="text"
          value={FIXED_LEAGUE_ID}
          disabled={true}
          className="w-full px-4 py-2 text-gray-900 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed"
        />
        <button
          type="submit"
          disabled={isLoading}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-gray-500 hover:text-gray-700 disabled:opacity-50"
        >
          <Search className="w-5 h-5" />
        </button>
      </div>
    </form>
  );
}