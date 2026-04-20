"use client";

import { MonthlyAdoptionStats } from "@/services/stats-service";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";

interface AdoptionChartProps {
  data: MonthlyAdoptionStats[];
}

const chartConfig = {
  male: {
    label: "수컷",
    color: "#8DCF92", // 파랑
  },
  female: {
    label: "암컷",
    color: "#FCB609", // 핑크
  },
  unknown: {
    label: "미확인",
    color: "hsl(215, 16%, 47%)", // 회색
  },
  total: {
    label: "총계",
    color: "hsl(25, 95%, 53%)", // 주황
  },
};

export function AdoptionChart({ data }: AdoptionChartProps) {
  return (
    <ChartContainer config={chartConfig} className="w-full h-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="month"
          />
          <YAxis yAxisId="left" />
          <YAxis yAxisId="right" orientation="right" />
          <ChartTooltip content={<ChartTooltipContent />} />
          <ChartLegend content={<ChartLegendContent />} />

          {/* 스택형 막대 - 성별 */}
          <Bar
            yAxisId="left"
            dataKey="male"
            stackId="gender"
            fill="var(--color-male)"
            radius={4}
            name="수컷"
          />
          <Bar
            yAxisId="left"
            dataKey="female"
            stackId="gender"
            fill="var(--color-female)"
            radius={4}
            name="암컷"
          />
          <Bar
            yAxisId="left"
            dataKey="unknown"
            stackId="gender"
            fill="var(--color-unknown)"
            radius={4}
            name="미확인"
          />

          {/* 라인 - 총계 */}
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="total"
            stroke="var(--color-total)"
            strokeWidth={2}
            dot={{ fill: "var(--color-total)" }}
            name="총계"
          />
        </ComposedChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}
