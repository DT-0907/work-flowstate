"use client";

import React, { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface TimelineItem {
  id: number;
  title: string;
  content: string;
  icon: React.ElementType;
  relatedIds: number[];
  status: "completed" | "in-progress" | "pending";
  energy: number;
}

interface RadialOrbitalTimelineProps {
  timelineData: TimelineItem[];
  onItemClick?: (id: number) => void;
}

function getStatusColor(status: TimelineItem["status"]) {
  switch (status) {
    case "completed":
      return "bg-white/10 text-white border-white/30";
    case "in-progress":
      return "bg-white/5 text-white/80 border-white/20";
    case "pending":
      return "bg-transparent text-white/40 border-white/10";
  }
}

function getStatusLabel(status: TimelineItem["status"]) {
  switch (status) {
    case "completed":
      return "Completed";
    case "in-progress":
      return "In Progress";
    case "pending":
      return "Pending";
  }
}

export default function RadialOrbitalTimeline({
  timelineData,
  onItemClick,
}: RadialOrbitalTimelineProps) {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [hoveredId, setHoveredId] = useState<number | null>(null);
  const [paused, setPaused] = useState(false);
  const orbitRef = useRef<HTMLDivElement>(null);

  const selectedItem = timelineData.find((d) => d.id === selectedId);
  const relatedIds = selectedItem?.relatedIds ?? [];

  const handleNodeClick = (item: TimelineItem) => {
    if (selectedId === item.id) {
      setSelectedId(null);
      setPaused(false);
      return;
    }
    setPaused(true);
    setSelectedId(item.id);
    onItemClick?.(item.id);
  };

  const handleBackgroundClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      setSelectedId(null);
      setPaused(false);
    }
  };

  // Nodes are placed at fixed angles, the whole container rotates via CSS
  const nodeCount = timelineData.length;

  return (
    <div
      className="relative flex w-full flex-col items-center justify-center bg-transparent py-16 min-h-[80vh]"
      onClick={handleBackgroundClick}
    >
      {/* Orbital container */}
      <div className="relative h-[min(80vw,28rem)] w-[min(80vw,28rem)]" suppressHydrationWarning>
        {/* Center dot */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
          <div className="h-2 w-2 rounded-full bg-white/30" />
        </div>

        {/* Rotating orbit group — pure CSS animation, no React re-renders */}
        <div
          ref={orbitRef}
          className="absolute inset-0"
          style={{
            animation: "orbit-spin 30s linear infinite",
            animationPlayState: paused ? "paused" : "running",
          }}
        >
          {/* Lines from center to each node */}
          <svg className="absolute inset-0 w-full h-full" style={{ zIndex: 1 }}>
            {timelineData.map((item, index) => {
              const angleDeg = (index / nodeCount) * 360 - 90;
              const angleRad = (angleDeg * Math.PI) / 180;
              const r = 36;
              return (
                <line
                  key={`line-${item.id}`}
                  x1="50%"
                  y1="50%"
                  x2={`${50 + Math.cos(angleRad) * r}%`}
                  y2={`${50 + Math.sin(angleRad) * r}%`}
                  stroke="white"
                  strokeOpacity={selectedId === item.id || hoveredId === item.id ? 0.8 : 0.15}
                  strokeWidth="1"
                  strokeDasharray="4 4"
                  style={{ transition: "stroke-opacity 0.3s ease" }}
                />
              );
            })}
          </svg>

          {timelineData.map((item, index) => {
            const angleDeg = (index / nodeCount) * 360 - 90; // start from top
            const angleRad = (angleDeg * Math.PI) / 180;
            const radius = 36; // % from center (reduced for bigger boxes)

            const left = 50 + Math.cos(angleRad) * radius;
            const top = 50 + Math.sin(angleRad) * radius;

            const isActive = selectedId === item.id;
            const isRelated = relatedIds.includes(item.id);
            const Icon = item.icon;

            return (
              <div
                key={item.id}
                className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center"
                style={{ left: `${left}%`, top: `${top}%`, zIndex: isActive ? 100 : 10 }}
              >
                {/* Counter-rotate so icons stay upright — uses same class as parent for perfect sync */}
                <div className="flex flex-col items-center orbit-counter-spin">

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleNodeClick(item);
                    }}
                    onMouseEnter={() => setHoveredId(item.id)}
                    onMouseLeave={() => setHoveredId(null)}
                    className={[
                      "flex flex-col items-center justify-center gap-1.5 h-20 w-20 rounded-full border-2 transition-all duration-300 p-2",
                      isActive
                        ? "border-white bg-white text-black scale-110"
                        : isRelated
                          ? "border-white/40 bg-white/10 text-white"
                          : "border-white/30 bg-black text-white hover:border-white/60 hover:bg-white/5",
                    ].join(" ")}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="text-[9px] font-medium leading-tight">{item.title}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Expanded card */}
      {selectedItem && (
        <div
          className="mt-8 w-full max-w-md px-4"
          style={{ zIndex: 200 }}
          onClick={(e) => e.stopPropagation()}
        >
          <Card className="border-2 border-white/40 bg-black text-white">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base text-white">
                  {React.createElement(selectedItem.icon, { className: "h-4 w-4" })}
                  {selectedItem.title}
                </CardTitle>
                <Badge className={getStatusColor(selectedItem.status)}>
                  {getStatusLabel(selectedItem.status)}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-white/70">
              <p>{selectedItem.content}</p>
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-white/50">Energy</span>
                  <span className="text-xs font-medium text-white/80">{selectedItem.energy}%</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-white transition-all duration-500"
                    style={{ width: `${selectedItem.energy}%` }}
                  />
                </div>
              </div>
              {selectedItem.relatedIds.length > 0 && (
                <div className="space-y-2">
                  <span className="text-xs text-white/40">Connected</span>
                  <div className="flex flex-wrap gap-1">
                    {selectedItem.relatedIds.map((relId) => {
                      const related = timelineData.find((d) => d.id === relId);
                      if (!related) return null;
                      return (
                        <Button
                          key={relId}
                          variant="outline"
                          size="sm"
                          className="border-white/20 bg-transparent text-white/70 hover:bg-white hover:text-black h-7 text-xs"
                          onClick={() => {
                            setPaused(true);
                            setSelectedId(relId);
                          }}
                        >
                          {related.title}
                        </Button>
                      );
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
