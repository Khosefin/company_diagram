"use client";
import React, { useState, useEffect, useRef } from "react";
const OrgChartComponent = dynamic(
  () => import("@/components/orgChart").then((m) => m.OrgChartComponent),
  { ssr: false },
);
import * as d3 from "d3";
import dynamic from "next/dynamic";
import { OrgChart } from "d3-org-chart";

export default function App() {
  const [data, setData] = useState<d3.DSVRowArray<string> | null>(null);
  const chartRef = useRef(new OrgChart());

  useEffect(() => {
    d3.csv(
      "https://raw.githubusercontent.com/bumbeishvili/sample-data/main/data-oracle.csv",
    ).then((data) => {
      setData(data);
    });
  }, []);

  return (
    <div id="container">
      <OrgChartComponent data={data} chartRef={chartRef} />
    </div>
  );
}
