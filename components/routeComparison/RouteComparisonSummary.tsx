type Props = {
  comment: string;
};

export default function RouteComparisonSummary({ comment }: Props) {
  return (
    <div className="rounded-xl bg-slate-800/60 border border-slate-700 px-4 py-3 text-sm text-gray-300">
      <span className="font-semibold text-blue-400">💬 Rotaly Yorumu — </span>
      {comment}
    </div>
  );
}
