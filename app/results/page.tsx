'use client';

export default function ResultsPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Results & Rankings</h2>
          <p className="mt-1 text-sm text-gray-600">
            View match results and current league rankings
          </p>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-600">
            Results and rankings will be displayed here once matches are created and results are entered.
          </p>
        </div>
      </div>
    </div>
  );
}

