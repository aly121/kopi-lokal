import { ArrowUpRight } from "lucide-react";

export default function AnnouncementBar() {
  return (
    <div className="announcement">
      <span>GOOD COFFEE, GOOD MOOD. EVERY SINGLE DAY.</span>
      <span className="announcement-extra">Locally inspired <ArrowUpRight size={13} aria-hidden="true" /></span>
    </div>
  );
}