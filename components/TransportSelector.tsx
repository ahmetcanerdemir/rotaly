type Props = {
  selected: string;
  onSelect: (value: string) => void;
};

const transports = [
  {
    id: "car",
    emoji: "🚗",
    label: "Kendi Aracım",
  },
  {
    id: "plane",
    emoji: "✈️",
    label: "Uçak",
  },
  {
    id: "bus",
    emoji: "🚌",
    label: "Otobüs",
  },
  {
    id: "train",
    emoji: "🚆",
    label: "Tren",
  },
];

export default function TransportSelector({
  selected,
  onSelect,
}: Props) {
  return (
    <div className="grid grid-cols-2 gap-4">
      {transports.map((transport) => (
        <button
          key={transport.id}
          onClick={() => onSelect(transport.id)}
          className={`rounded-2xl border p-6 transition ${
            selected === transport.id
              ? "bg-blue-600 border-blue-600"
              : "bg-slate-800 border-slate-700 hover:border-blue-500"
          }`}
        >
          <div className="text-4xl mb-3">
            {transport.emoji}
          </div>

          <div className="font-semibold">
            {transport.label}
          </div>
        </button>
      ))}
    </div>
  );
}