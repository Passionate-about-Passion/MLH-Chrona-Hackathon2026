import type { Entry } from "@/types";
import { LockIcon, PinIcon, RepeatIcon } from "./Icons";
import { range } from "./logic";

interface EntryCardProps {
  entry: Entry;
  col?: number;
  cols?: number;
  conflict?: boolean;
  onTap?: () => void;
  style?: React.CSSProperties;
}

export function EntryCard({ entry, col = 0, cols = 1, conflict = false, onTap, style }: EntryCardProps) {
  const Tag = onTap ? "button" : "div";
  return (
    <Tag
      className="tt-card"
      data-type={entry.type}
      data-conflict={conflict || undefined}
      data-narrow={cols > 1 || undefined}
      type={onTap ? "button" : undefined}
      onClick={onTap}
      aria-label={
        onTap ? `${entry.title}, ${range(entry)}, Konflikt. Tippen zeigt Alternativen.` : undefined
      }
      style={{
        left: `calc(${col} * 100% / ${cols})`,
        width: `calc(100% / ${cols} - 4px)`,
        ...style,
      }}
    >
      <span className="tt-card-title">{entry.title}</span>
      <span className="tt-card-time">{range(entry)}</span>
      <span className="tt-card-meta">
        {entry.location && (
          <span className="tt-card-loc">
            <PinIcon size={12} />
            <span>{entry.location}</span>
          </span>
        )}
        <span className="tt-card-badges">
          {entry.recurring && (
            <span role="img" aria-label="wiederkehrend" title="wiederkehrend">
              <RepeatIcon size={13} />
            </span>
          )}
          {entry.fixed && (
            <span role="img" aria-label="nicht verschiebbar" title="nicht verschiebbar">
              <LockIcon size={13} />
            </span>
          )}
          <span className="tt-weight" aria-label={`Wichtigkeit ${entry.weight}`}>
            {entry.weight}
          </span>
        </span>
      </span>
    </Tag>
  );
}
