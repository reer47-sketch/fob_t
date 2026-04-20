"use client";

import { useState, useTransition, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AdoptionChart } from "./adoption-chart";
import { HatchingChart } from "./hatching-chart";
import { DeathChart } from "./death-chart";
import { HatchingByPairTable } from "./hatching-by-pair-table";
import { getAdoptionStatsAction } from "@/actions/stats/get-adoption-stats";
import { getHatchingStatsAction } from "@/actions/stats/get-hatching-stats";
import { getDeathStatsAction } from "@/actions/stats/get-death-stats";
import { getHatchingByPairStatsAction } from "@/actions/stats/get-hatching-by-pair-stats";
import type { MonthlyAdoptionStats, MonthlyHatchingStats, MonthlyDeathStats, HatchingByPairStats } from "@/services/stats-service";
import { StatsFilters } from "./stats-filters";

export function StatsTabs() {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  const [yearFrom, setYearFrom] = useState(currentYear);
  const [monthFrom, setMonthFrom] = useState(1);
  const [yearTo, setYearTo] = useState(currentYear);
  const [monthTo, setMonthTo] = useState(currentMonth);

  const [adoptionData, setAdoptionData] = useState<MonthlyAdoptionStats[] | null>(null);
  const [hatchingData, setHatchingData] = useState<MonthlyHatchingStats[] | null>(null);
  const [deathData, setDeathData] = useState<MonthlyDeathStats[] | null>(null);
  const [hatchingByPairData, setHatchingByPairData] = useState<HatchingByPairStats[] | null>(null);
  const [isPending, startTransition] = useTransition();
  const [activeTab, setActiveTab] = useState("adoption");

  const activeTabRef = useRef(activeTab);
  useEffect(() => {
    activeTabRef.current = activeTab;
  }, [activeTab]);

  // 기간 변경 시 캐시 무효화 + 현재 탭 자동 조회 (마운트 시에도 동작)
  useEffect(() => {
    const fromDate = new Date(yearFrom, monthFrom - 1);
    const toDate = new Date(yearTo, monthTo - 1);
    if (fromDate > toDate) return;

    setAdoptionData(null);
    setHatchingData(null);
    setDeathData(null);
    setHatchingByPairData(null);

    const tab = activeTabRef.current;
    startTransition(async () => {
      if (tab === "adoption") {
        const result = await getAdoptionStatsAction({ yearFrom, monthFrom, yearTo, monthTo });
        if (result.success) setAdoptionData(result.data || []);
      } else if (tab === "hatching") {
        const result = await getHatchingStatsAction({ yearFrom, monthFrom, yearTo, monthTo });
        if (result.success) setHatchingData(result.data || []);
      } else if (tab === "death") {
        const result = await getDeathStatsAction({ yearFrom, monthFrom, yearTo, monthTo });
        if (result.success) setDeathData(result.data || []);
      } else if (tab === "hatching-by-pair") {
        const result = await getHatchingByPairStatsAction({ yearFrom, monthFrom, yearTo, monthTo });
        if (result.success) setHatchingByPairData(result.data || []);
      }
    });
  }, [yearFrom, monthFrom, yearTo, monthTo]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);

    // 해당 탭의 데이터가 없으면 조회
    if (value === "adoption" && adoptionData === null) {
      startTransition(async () => {
        const result = await getAdoptionStatsAction({ yearFrom, monthFrom, yearTo, monthTo });
        if (result.success) {
          setAdoptionData(result.data || []);
        }
      });
    } else if (value === "hatching" && hatchingData === null) {
      startTransition(async () => {
        const result = await getHatchingStatsAction({ yearFrom, monthFrom, yearTo, monthTo });
        if (result.success) {
          setHatchingData(result.data || []);
        }
      });
    } else if (value === "death" && deathData === null) {
      startTransition(async () => {
        const result = await getDeathStatsAction({ yearFrom, monthFrom, yearTo, monthTo });
        if (result.success) {
          setDeathData(result.data || []);
        }
      });
    } else if (value === "hatching-by-pair" && hatchingByPairData === null) {
      startTransition(async () => {
        const result = await getHatchingByPairStatsAction({ yearFrom, monthFrom, yearTo, monthTo });
        if (result.success) {
          setHatchingByPairData(result.data || []);
        }
      });
    }
  };

  return (
    <Tabs value={activeTab} onValueChange={handleTabChange} className="flex flex-col gap-4 h-[calc(100dvh-5rem)] overflow-hidden w-full">
      <div className="shrink-0 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <TabsList className="w-full max-w-full overflow-x-auto justify-start lg:w-auto">
          <TabsTrigger value="adoption">성별 분양</TabsTrigger>
          <TabsTrigger value="hatching">해칭</TabsTrigger>
          <TabsTrigger value="death">폐사</TabsTrigger>
          <TabsTrigger value="hatching-by-pair">페어별 해칭 내역</TabsTrigger>
        </TabsList>
        <StatsFilters
          yearFrom={yearFrom}
          monthFrom={monthFrom}
          yearTo={yearTo}
          monthTo={monthTo}
          onYearFromChange={setYearFrom}
          onMonthFromChange={setMonthFrom}
          onYearToChange={setYearTo}
          onMonthToChange={setMonthTo}
        />
      </div>

      <TabsContent value="adoption" className="flex-1 mt-0 min-h-0">
        <Card className="h-full flex flex-col gap-3 border-0 rounded-none shadow-none py-0 lg:gap-6 lg:border lg:rounded-xl lg:shadow-sm lg:py-6">
          <CardHeader className="shrink-0 hidden lg:grid">
            <CardTitle>성별 분양</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 min-h-0 px-0 lg:px-6">
            {isPending && adoptionData === null ? (
              <div className="flex items-center justify-center h-full">
                <p className="text-muted-foreground">데이터를 불러오는 중...</p>
              </div>
            ) : adoptionData !== null ? (
              <AdoptionChart data={adoptionData} />
            ) : null}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="hatching" className="flex-1 mt-0 min-h-0">
        <Card className="h-full flex flex-col gap-3 border-0 rounded-none shadow-none py-0 lg:gap-6 lg:border lg:rounded-xl lg:shadow-sm lg:py-6">
          <CardHeader className="shrink-0 hidden lg:grid">
            <CardTitle>해칭</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 min-h-0 px-0 lg:px-6">
            {isPending && hatchingData === null ? (
              <div className="flex items-center justify-center h-full">
                <p className="text-muted-foreground">데이터를 불러오는 중...</p>
              </div>
            ) : hatchingData !== null ? (
              <HatchingChart data={hatchingData} />
            ) : null}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="death" className="flex-1 mt-0 min-h-0">
        <Card className="h-full flex flex-col gap-3 border-0 rounded-none shadow-none py-0 lg:gap-6 lg:border lg:rounded-xl lg:shadow-sm lg:py-6">
          <CardHeader className="shrink-0 hidden lg:grid">
            <CardTitle>폐사</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 min-h-0 px-0 lg:px-6">
            {isPending && deathData === null ? (
              <div className="flex items-center justify-center h-full">
                <p className="text-muted-foreground">데이터를 불러오는 중...</p>
              </div>
            ) : deathData !== null ? (
              <DeathChart data={deathData} />
            ) : null}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="hatching-by-pair" className="flex-1 mt-0 min-h-0">
        <Card className="h-full flex flex-col gap-3 border-0 rounded-none shadow-none py-0 lg:gap-6 lg:border lg:rounded-xl lg:shadow-sm lg:py-6">
          <CardHeader className="shrink-0 hidden lg:grid">
            <CardTitle>페어별 해칭 내역</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 min-h-0 px-0 lg:px-6">
            {isPending && hatchingByPairData === null ? (
              <div className="flex items-center justify-center h-full">
                <p className="text-muted-foreground">데이터를 불러오는 중...</p>
              </div>
            ) : hatchingByPairData !== null ? (
              <HatchingByPairTable data={hatchingByPairData} />
            ) : null}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
