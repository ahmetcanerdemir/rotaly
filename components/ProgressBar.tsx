type ProgressBarProps = {
  step: number;
  totalSteps: number;
};

export default function ProgressBar({
  step,
  totalSteps,
}: ProgressBarProps) {
  const percentage = (step / totalSteps) * 100;

  return (
    <div className="mt-10">
      <div className="flex justify-between text-sm text-gray-400 mb-2">
        <span>İlerleme</span>
        <span>%{Math.round(percentage)}</span>
      </div>

      <div className="w-full h-3 rounded-full bg-slate-800">
        <div
          className="h-3 rounded-full bg-blue-500 transition-all duration-300"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}