"use client";

interface QuickAccessRowProps {
  nsScore: number;
}

interface QuickItem {
  label: string;
  colour: string;
}

const LOW_ITEMS: QuickItem[] = [
  { label: "3-min restore", colour: "#7F77DD" },
  { label: "5-min sleep", colour: "#1D9E75" },
  { label: "Breathe now", colour: "#D85A30" },
];

const HIGH_ITEMS: QuickItem[] = [
  { label: "3-min stress relief", colour: "#D85A30" },
  { label: "5-min sleep prep", colour: "#1D9E75" },
  { label: "8-min morning", colour: "#7F77DD" },
];

export default function QuickAccessRow({ nsScore }: QuickAccessRowProps) {
  const items = nsScore < 45 ? LOW_ITEMS : HIGH_ITEMS;

  function handleClick(label: string) {
    alert(`${label} — Coming in Phase 5`);
  }

  return (
    <div className="flex gap-3 flex-wrap">
      {items.map((item) => (
        <button
          key={item.label}
          onClick={() => handleClick(item.label)}
          className="flex-1 min-w-[140px] py-3 px-4 rounded-full border text-sm font-medium transition-all hover:opacity-80 active:scale-95"
          style={{
            borderColor: item.colour,
            color: item.colour,
            backgroundColor: `${item.colour}15`,
          }}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
