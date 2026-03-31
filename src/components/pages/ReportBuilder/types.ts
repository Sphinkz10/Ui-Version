export interface MetricData {
  value: number;
  target?: number;
  [key: string]: unknown;
}

export interface LineData {
  name: string;
  value: number;
  target?: number;
  [key: string]: unknown;
}

export interface BarData {
  name: string;
  força: number;
  velocidade: number;
  resistência: number;
  potência?: number;
  [key: string]: unknown;
}

export interface AreaData {
  name: string;
  carga: number;
  ideal?: number;
  critico?: number;
  [key: string]: unknown;
}

export interface RadarData {
  subject: string;
  A: number;
  B: number;
  fullMark?: number;
  [key: string]: unknown;
}

export type ChartData = MetricData | LineData | BarData | AreaData | RadarData;

export interface ChartConfig {
  id: string;
  type: "line" | "bar" | "area" | "pie" | "metric" | "radar";
  title: string;
  data: ChartData[];
  insight?: string;
  suggestion?: string;
  alert?: string;
  confidence?: number;
}
