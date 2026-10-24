"use client";
import { useState, type ReactNode } from "react";
import type { Course, Entry, Group } from "@/types";

interface LearnplanProps {
  /** e.g. "BWL (B.Sc.) · 1. Semester" */
  title: string;
  courses: Course[];
  groups: Group[];
  entries: Entry[];
  onExport: () => void;
  /** Google calendar connect button / sync status, shown between title and .ics */
  google?: ReactNode;
  /** content of the plan, e.g. the study-time table */
  summary?: ReactNode;
}

/**
 * The plan is the study-time table (`summary`); the per-course list of sessions was removed on purpose.
 * Content scrolls under a floating glass header whose large title shrinks on scroll, like iOS.
 */
export function Learnplan({ title, onExport, google, summary }: LearnplanProps) {
  const [collapsed, setCollapsed] = useState(false);
  return (
    <section className="tt-plan" aria-label="Lernplan">
      <div className="tt-plan-scroll" onScroll={(e) => setCollapsed(e.currentTarget.scrollTop > 24)}>
        {summary}
      </div>
      <header className="tt-plan-top glass" data-collapsed={collapsed || undefined}>
        <div className="tt-plan-titles">
          <h1 className="tt-plan-title">Lernplan</h1>
          <p className="tt-plan-program">{title}</p>
        </div>
        <div className="tt-plan-actions">
          {google}
          <button type="button" className="tt-gcal glass" onClick={onExport}>
            .ics
          </button>
        </div>
      </header>
    </section>
  );
}
