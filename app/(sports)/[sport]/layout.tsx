import type React from "react";
import { notFound } from "next/navigation";

// Define valid sports
const validSports = ["nba", "nfl", "mlb", "nhl", "ncaab"];

export default function SportLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { sport: string };
}) {
  const { sport } = params;

  // Validate the sport parameter
  if (!sport || !validSports.includes(sport.toLowerCase())) {
    notFound();
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* SportsSubNav is now moved to the page components */}
      <main className="flex-1">{children}</main>
    </div>
  );
}
