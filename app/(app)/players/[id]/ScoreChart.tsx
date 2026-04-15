"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { format } from "date-fns";

interface ScoreChartProps {
  data: { date: string; score: number; position: number }[];
  playerColor: string;
}

export function ScoreChart({ data, playerColor }: ScoreChartProps) {
  const formatted = data.map((d) => ({
    ...d,
    label: (() => {
      try {
        return format(new Date(d.date + "T12:00:00"), "d MMM");
      } catch {
        return d.date;
      }
    })(),
  }));

  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={formatted} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#8B8878" strokeOpacity={0.2} />
        <XAxis
          dataKey="label"
          tick={{ fontFamily: "var(--font-garamond)", fontSize: 11, fill: "#8B8878" }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fontFamily: "var(--font-garamond)", fontSize: 11, fill: "#8B8878" }}
          axisLine={false}
          tickLine={false}
          width={35}
        />
        <Tooltip
          contentStyle={{
            background: "#F5E6C8",
            border: "2px solid #D4AF37",
            borderRadius: "6px",
            fontFamily: "var(--font-cinzel)",
            fontSize: 12,
          }}
          labelStyle={{ color: "#2C1810", fontWeight: "bold" }}
          formatter={(value: number) => [`${value} pts`, "Score"]}
        />
        <Line
          type="monotone"
          dataKey="score"
          stroke={playerColor}
          strokeWidth={2.5}
          dot={{
            fill: playerColor,
            strokeWidth: 2,
            r: 4,
            stroke: "#F5E6C8",
          }}
          activeDot={{ r: 6, stroke: "#D4AF37", strokeWidth: 2 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
