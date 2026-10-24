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
      aria-label={onTap ? conflict ? `${entry.title}, ${range(entry)}, Konflikt. Tippen zeigt Alternativen.` : `${entry.title}, ${range(entry)}. Tippen zeigt den Lageplan.` : undefined}
      style={{
        left: `calc(${col} * 100% / ${cols})`,
        width: `calc(100% / ${cols} - 6px)`,
        ...style,
      }}
    >
      <span className="tt-card-head">
        <span className="tt-card-title">{entry.title}</span>
        <span className="tt-card-badges">
          {entry.recurring && (
            <span className="tt-card-repeat" role="img" aria-label="wiederkehrend" title="wiederkehrend">
              <RepeatIcon size={14} />
            </span>
          )}
          {entry.fixed && (
            <span role="img" aria-label="nicht verschiebbar" title="nicht verschiebbar">
              <LockIcon size={14} />
            </span>
          )}
          <span className="tt-weight" aria-label={`Wichtigkeit ${entry.weight}`}>
            {entry.weight}
          </span>
        </span>
      </span>
      <span className="tt-card-meta">
        <span className="tt-card-time">{range(entry)}</span>
        {entry.location && (
          <span className="tt-card-loc">
            <PinIcon size={13} />
            <span>{entry.location}</span>
          </span>
        )}
      </span>
    </Tag>
  );
}
