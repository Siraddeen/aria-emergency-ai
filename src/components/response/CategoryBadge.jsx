const CATEGORY_COLORS = {
  health: "bg-red-400",
  fire: "bg-orange-500",
  electricity: "bg-yellow-400",
  water: "bg-sky-400",
  general: "bg-slate-500",
};

export default function CategoryBadge({ category }) {
  const bg = CATEGORY_COLORS[category] || "bg-slate-500";
  return (
    <span
      className={`${bg} text-[#0a0c0f] text-[9px] font-bold font-mono tracking-widest px-2 py-0.5 rounded`}
    >
      {category?.toUpperCase()}
    </span>
  );
}
