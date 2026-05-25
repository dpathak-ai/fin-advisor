import { ExplanationResult } from "@/types";

interface ExplanationCardProps {
  result: ExplanationResult;
}

export default function ExplanationCard({ result }: ExplanationCardProps) {
  return (
    <div className="w-full rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
      <h2 className="mb-4 text-xl font-semibold text-gray-900 capitalize">{result.term}</h2>

      <div className="mb-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1">Explanation</p>
        <p className="text-sm leading-relaxed text-gray-700">{result.explanation}</p>
      </div>

      <div className="rounded-lg bg-blue-50 px-4 py-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-blue-400 mb-1">Example</p>
        <p className="text-sm leading-relaxed text-blue-800">{result.example}</p>
      </div>
    </div>
  );
}
