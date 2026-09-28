type Props = {
  coachName: string;
  totalSessions: number;
  remainingSessions: number;
};

export function PackageProgressCard({ coachName, totalSessions, remainingSessions }: Props) {
  const completed = totalSessions - remainingSessions;
  const pct = Math.round((completed / totalSessions) * 100);

  return (
    <div className="rounded-xl bg-neutral-900 p-4">
      <div className="mb-2 flex items-center justify-between text-sm">
        <span className="font-semibold">باقة مع {coachName}</span>
        <span className="text-neutral-400">
          {completed} من {totalSessions} مكتملة · {remainingSessions} متبقية
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-800">
        <div
          className="h-full rounded-full bg-emerald-500 transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
