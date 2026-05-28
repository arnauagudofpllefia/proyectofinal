import { getProfileIconDefinition } from "@/lib/profileIcon";

export default function ProfileGlyph({ iconId, className = "h-5 w-5" }) {
  const icon = getProfileIconDefinition(iconId);

  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8">
      {icon.paths.map((pathValue) => (
        <path key={pathValue} d={pathValue} />
      ))}
    </svg>
  );
}