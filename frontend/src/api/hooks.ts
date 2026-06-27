// TanStack Query hooks. Query keys are namespaced by resource and parameterized
// by date so that mutations can invalidate exactly what changed.

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { api } from "./client";
import type {
  DaySummary,
  DayType,
  Food,
  FoodCreate,
  LogEntryCreate,
  Profile,
  RangeDay,
  SuggestResponse,
  WeightEntry,
} from "./types";

const keys = {
  profile: ["profile"] as const,
  foods: (q: string) => ["foods", q] as const,
  summary: (date: string) => ["summary", date] as const,
  range: (start: string, end: string) => ["range", start, end] as const,
  weights: ["weights"] as const,
};

// ----- Profile ------------------------------------------------------------

export function useProfile() {
  return useQuery({
    queryKey: keys.profile,
    queryFn: () => api.get<Profile>("/api/profile"),
  });
}

export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (p: Profile) => api.put<Profile>("/api/profile", p),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.profile });
      qc.invalidateQueries({ queryKey: ["summary"] });
      qc.invalidateQueries({ queryKey: ["range"] });
    },
  });
}

export function useSuggestTargets() {
  return useMutation({
    mutationFn: (body: {
      sex: string;
      age: number;
      height_cm: number;
      weight_kg: number;
      activity_level: string;
      goal: string;
    }) => api.post<SuggestResponse>("/api/profile/suggest", body),
  });
}

// ----- Foods --------------------------------------------------------------

export function useFoods(query: string) {
  return useQuery({
    queryKey: keys.foods(query),
    queryFn: () =>
      api.get<Food[]>(`/api/foods${query ? `?query=${encodeURIComponent(query)}` : ""}`),
  });
}

export function useCreateFood() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (f: FoodCreate) => api.post<Food>("/api/foods", f),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["foods"] }),
  });
}

export function useDeleteFood() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.del(`/api/foods/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["foods"] }),
  });
}

// ----- Daily summary + log ------------------------------------------------

export function useSummary(date: string) {
  return useQuery({
    queryKey: keys.summary(date),
    queryFn: () => api.get<DaySummary>(`/api/summary?date=${date}`),
  });
}

export function useAddLog(date: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (entry: LogEntryCreate) => api.post("/api/log", entry),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.summary(date) });
      qc.invalidateQueries({ queryKey: ["range"] });
    },
  });
}

export function useDeleteLog(date: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.del(`/api/log/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.summary(date) });
      qc.invalidateQueries({ queryKey: ["range"] });
    },
  });
}

export function useSetDayType(date: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (day_type: DayType) =>
      api.put(`/api/day?date=${date}`, { day_type }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.summary(date) });
      qc.invalidateQueries({ queryKey: ["range"] });
    },
  });
}

// ----- Trends -------------------------------------------------------------

export function useRange(start: string, end: string) {
  return useQuery({
    queryKey: keys.range(start, end),
    queryFn: () =>
      api.get<RangeDay[]>(`/api/summary/range?start=${start}&end=${end}`),
  });
}

export function useWeights() {
  return useQuery({
    queryKey: keys.weights,
    queryFn: () => api.get<WeightEntry[]>("/api/weights"),
  });
}

export function useAddWeight() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { date: string; weight_kg: number }) =>
      api.post<WeightEntry>("/api/weights", body),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.weights }),
  });
}
