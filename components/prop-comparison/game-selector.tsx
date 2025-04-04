"use client";

import { useState, useEffect } from "react";
import type { Event } from "@/lib/odds-api";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Calendar, Clock, RefreshCw, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format, isToday, isTomorrow } from "date-fns";
import { cn } from "@/lib/utils";
import { useMediaQuery } from "@/hooks/use-media-query";

interface GameSelectorProps {
  onGameSelect: (eventId: string) => void;
  sport?: string;
}

export function GameSelector({
  onGameSelect,
  sport = "basketball_nba",
}: GameSelectorProps) {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const isMobile = useMediaQuery("(max-width: 640px)");

  // Reset selection when sport changes
  useEffect(() => {
    setSelectedEventId(null);
    onGameSelect("");
    setError(null);
  }, [sport, onGameSelect]);

  useEffect(() => {
    const fetchEvents = async () => {
      if (loading === false) setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/events?sport=${sport}`);
        if (!response.ok) {
          throw new Error("Failed to fetch events");
        }

        const data = await response.json();
        if (!Array.isArray(data)) {
          throw new Error("Invalid response format");
        }

        // Sort events by commence time
        const sortedEvents = data.sort(
          (a: Event, b: Event) =>
            new Date(a.commence_time).getTime() -
            new Date(b.commence_time).getTime()
        );
        setEvents(sortedEvents);

        // Auto-select first game if none selected
        if (sortedEvents.length > 0 && !selectedEventId) {
          const firstEvent = sortedEvents[0];
          setSelectedEventId(firstEvent.id);
          onGameSelect(firstEvent.id);
        }
      } catch (err) {
        console.error("Error fetching events:", err);
        setError(err instanceof Error ? err.message : "Failed to load events");
        setEvents([]);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, [sport, onGameSelect]);

  const handleGameSelect = (eventId: string) => {
    setSelectedEventId(eventId);
    onGameSelect(eventId);
  };

  // Group events by date
  const groupedEvents = events.reduce((groups, event) => {
    const date = new Date(event.commence_time).toDateString();
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(event);
    return groups;
  }, {} as Record<string, Event[]>);

  // Format date for display
  const formatDateLabel = (dateStr: string) => {
    const date = new Date(dateStr);
    if (isToday(date)) return "Today";
    if (isTomorrow(date)) return "Tomorrow";
    return format(date, "EEEE, MMMM d");
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground bg-muted/30 rounded-md px-3 py-2">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>Loading games...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 text-destructive bg-destructive/10 rounded-md px-3 py-2">
        <AlertCircle className="h-4 w-4" />
        <span className="flex-1">{error}</span>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setError(null);
            setLoading(true);
          }}
          className="h-7 gap-1"
        >
          <RefreshCw className="h-3 w-3" />
          Retry
        </Button>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="text-muted-foreground bg-muted/30 rounded-md px-3 py-2 flex items-center gap-2">
        <Calendar className="h-4 w-4" />
        <span>No games available for this sport</span>
      </div>
    );
  }

  const selectedEvent = events.find((e) => e.id === selectedEventId);

  return (
    <div className="flex flex-col gap-2 w-full">
      <Select value={selectedEventId || ""} onValueChange={handleGameSelect}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select a game">
            {selectedEvent && (
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-1">
                  <span className="font-medium">{selectedEvent.away_team}</span>
                  <span className="text-muted-foreground">@</span>
                  <span className="font-medium">{selectedEvent.home_team}</span>
                </div>
                <div className="text-xs text-muted-foreground flex items-center gap-1 ml-4">
                  <Clock className="h-3 w-3" />
                  {format(
                    new Date(selectedEvent.commence_time),
                    "MMM d, h:mm a"
                  )}
                </div>
              </div>
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent className="max-h-[60vh]">
          {Object.entries(groupedEvents).map(([date, dateEvents]) => (
            <SelectGroup key={date}>
              <SelectLabel className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide py-1.5">
                <Calendar className="h-3 w-3" />
                {formatDateLabel(date)}
              </SelectLabel>
              {dateEvents.map((event) => {
                const gameTime = new Date(event.commence_time);
                const isUpcoming = gameTime > new Date();

                return (
                  <SelectItem
                    key={event.id}
                    value={event.id}
                    className={cn(
                      "py-3 px-2",
                      isMobile ? "flex flex-col items-start gap-1" : ""
                    )}
                  >
                    <div
                      className={cn(
                        "flex w-full",
                        isMobile
                          ? "flex-col gap-1"
                          : "items-center justify-between"
                      )}
                    >
                      <div className="flex flex-col">
                        <div className="font-medium">{event.away_team}</div>
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-muted-foreground">
                            @
                          </span>
                          <span className="font-medium">{event.home_team}</span>
                        </div>
                      </div>

                      <div
                        className={cn(
                          "text-sm text-muted-foreground",
                          isMobile ? "mt-1" : "ml-8 text-right"
                        )}
                      >
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>{format(gameTime, "h:mm a")}</span>
                        </div>
                        <div className="text-xs">
                          {format(gameTime, "MMM d, yyyy")}
                        </div>
                        {isUpcoming && !isMobile && (
                          <div className="mt-1">
                            <span className="px-1.5 py-0.5 bg-primary/10 text-primary rounded-full text-[10px]">
                              Upcoming
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {isUpcoming && isMobile && (
                      <div className="mt-1">
                        <span className="px-1.5 py-0.5 bg-primary/10 text-primary rounded-full text-[10px]">
                          Upcoming
                        </span>
                      </div>
                    )}
                  </SelectItem>
                );
              })}
            </SelectGroup>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
