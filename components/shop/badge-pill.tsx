interface BadgePillProps {
  text: string;
}

export function BadgePill({ text }: BadgePillProps) {
  return (
    <span
      className="absolute top-2 left-2 z-10 bg-brand-orange text-white
                 text-xs font-semibold px-2.5 py-1 rounded-full
                 max-w-[85%] truncate leading-snug"
    >
      {text}
    </span>
  );
}
