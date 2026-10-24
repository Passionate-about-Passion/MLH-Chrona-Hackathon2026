import type { Metadata, Viewport } from "next";
import { TimetableApp } from "@/components/timetable/TimetableApp";

export const metadata: Metadata = { title: "Stundenplan" };
export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover" };

export default function MockupPage() {
  return <TimetableApp />;
}
