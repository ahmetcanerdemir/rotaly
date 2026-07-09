type Props = {
  label: string;
  value: string;
  icon?: string;
};

export default function InfoCard({ label, value, icon }: Props) {
  return (
    <div className="rounded-2xl bg-slate-800 border border-slate-700 p-5">
      <p className="text-sm text-gray-400 mb-1">
        {icon ? `${icon} ` : ""}
        {label}
      </p>
      <p className="text-lg font-semibold text-white break-words">{value}</p>
    </div>
  );
}
