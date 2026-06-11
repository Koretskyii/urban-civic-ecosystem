'use client';

export default function SurveyDetailError() {
  return (
    <p className="mt-4 rounded-lg border border-[var(--danger)]/20 bg-[var(--danger)]/5 px-3 py-4 text-sm text-[var(--danger-dark)]">
      Failed to load survey.
    </p>
  );
}
