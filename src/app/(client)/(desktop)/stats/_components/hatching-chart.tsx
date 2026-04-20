"use client";

import { MonthlyHatchingStats } from "@/services/stats-service";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";

interface HatchingChartProps {
  data: MonthlyHatchingStats[];
}

const chartConfig = {
  count: {
    label: "해칭 건수",
    color: "hsl(142, 76%, 36%)", // 녹색 계열
  },
};

export function HatchingChart({ data }: HatchingChartProps) {
  return (
    <ChartContainer config={chartConfig} className="w-full h-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="month"
          />
          <YAxis />
          <ChartTooltip content={<ChartTooltipContent />} />
          <ChartLegend content={<ChartLegendContent />} />
          <Bar
            dataKey="count"
            fill="var(--color-count)"
            name="해칭 건수"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}
