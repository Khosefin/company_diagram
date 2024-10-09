"use client";
import React, { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import * as d3 from "d3";
import { OrgChart } from "d3-org-chart";
import { Toaster } from "@/components/ui/toaster";

// Dynamically import OrgChartComponent with no SSR
const OrgChartComponent = dynamic(
  () => import("@/components/orgChart").then((m) => m.OrgChartComponent),
  { ssr: false },
);

export default function App() {
  const [data, setData] = useState<d3.DSVRowArray<string> | null>(null);
  const chartRef = useRef<OrgChart<never> | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      d3.csv(
        "https://raw.githubusercontent.com/bumbeishvili/sample-data/main/data-oracle.csv",
      ).then((csvData) => {
        setData(csvData);
      });
      chartRef.current = new OrgChart();
    }
  }, []);

  return (
    <div id="container">
      <OrgChartComponent data={data} chartRef={chartRef} />
      <Toaster />
    </div>
  );
}
