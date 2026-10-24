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

/**
 * The card is a plain box with a full-size button underneath the content that opens the edit sheet.
 * The location is plain text here; the map links live in the edit sheet.
 */
export function EntryCard({ entry, col = 0, cols = 1, conflict = false, onTap, style }: EntryCardProps) {
  return (
    <div
      className="tt-card"
      data-type={entry.type}
      data-conflict={conflict || undefined}
      data-narrow={cols > 1 || undefined}
      style={{
        left: `calc(${col} * 100% / ${cols})`,
        width: `calc(100% / ${cols} - 6px)`,
        ...style,
      }}
    >
      {onTap && (
        <button
          type="button"
          className="tt-card-hit"
          onClick={onTap}
          aria-label={`${entry.title}, ${range(entry)}${conflict ? ", Überschneidung" : ""}. Bearbeiten.`}
        />
      )}
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
    </div>
  );
}
