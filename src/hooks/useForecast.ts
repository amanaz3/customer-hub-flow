import { useMemo } from "react";
import { forecastService, ForecastData } from "@/services/forecastService";

export const useForecast = (
  currentApplications: number,
  currentCompleted: number,
  currentRevenue: number,
  targetApplications: number,
  targetCompleted: number,
  targetRevenue: number
): ForecastData | null => {
  return useMemo(() => {
    if (!targetApplications && !targetCompleted && !targetRevenue) {
      return null;
    }

    const currentDate = new Date();
    const currentDay = currentDate.getDate();
    const totalDaysInMonth = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() + 1,
      0
    ).getDate();

    return forecastService.calculateForecast(
      currentApplications,
      currentCompleted,
      currentRevenue,
      targetApplications,
      targetCompleted,
      targetRevenue,
      currentDay,
      totalDaysInMonth
    );
  }, [
    currentApplications,
    currentCompleted,
    currentRevenue,
    targetApplications,
    targetCompleted,
    targetRevenue,
  ]);
};
