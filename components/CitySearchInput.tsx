type Props = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
};

export default function CitySearchInput({
  value,
  onChange,
  placeholder = "Şehir ara...",
}: Props) {
  return (
    <div className="relative mb-4">
      <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
        🔍
      </span>

      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-slate-700 bg-slate-800 py-3 pl-11 pr-10 text-white placeholder-gray-500 outline-none transition focus:border-blue-500"
      />

      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label="Aramayı temizle"
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 transition hover:text-white"
        >
          ✕
        </button>
      )}
    </div>
  );
}
