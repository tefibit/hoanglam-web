"use client";

import { keepPreviousData, useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { apiClient, type ApiResponse } from "./client";

// A number on sale (hoanglam-api /web/sims*).
export interface WebSim {
  id: number;
  phoneNumber: string;
  price: number | null;
  store: { id: number; name: string };
  // Picked by the shop as "Sim đề xuất".
  featured: boolean;
  simTypes: { code: string; name: string; slug: string }[];
}

export interface WebSimType {
  id: number;
  code: string;
  name: string;
  slug: string;
  description: string | null;
  // Numbers of this type currently on sale.
  count: number;
}

export interface SimFilters {
  // Loại sim slugs — a number must have all of them.
  types: string[];
  // Digits with optional "x" / "*" wildcards.
  search: string;
  // Digits the number must contain (birth year).
  contains: string;
  // Digits the number must end with ("Sim năm sinh").
  suffix?: string;
  prefix: string;
  minPrice?: number;
  maxPrice?: number;
  // Only these numbers (favourites).
  ids?: number[];
}

export type SimSort = "suggested" | "price_asc" | "price_desc";

interface Paginated<T> extends ApiResponse<T[]> {
  pagination: { page: number; limit: number; total: number; total_pages: number };
}

const PAGE_SIZE = 24;

function filterParams(filters: SimFilters) {
  return {
    type: filters.types.join(",") || undefined,
    contains: filters.contains || undefined,
    suffix: filters.suffix || undefined,
    prefix: filters.prefix || undefined,
    min_price: filters.minPrice,
    max_price: filters.maxPrice,
    ids: filters.ids?.join(","),
  };
}

export function useWebSimTypes() {
  return useQuery({
    queryKey: ["web-sim-types"],
    queryFn: async () => (await apiClient.get<ApiResponse<WebSimType[]>>("/web/sim-types")).data.data,
    staleTime: 5 * 60 * 1000,
  });
}

// Paged list; "Xem thêm" loads the next page.
export function useSimSearch(filters: SimFilters, sort: SimSort, enabled = true) {
  return useInfiniteQuery({
    queryKey: ["web-sims", filters, sort],
    queryFn: async ({ pageParam }) =>
      (
        await apiClient.get<Paginated<WebSim>>("/web/sims", {
          params: {
            ...filterParams(filters),
            search: filters.search || undefined,
            sort,
            page: pageParam,
            limit: PAGE_SIZE,
          },
        })
      ).data,
    initialPageParam: 1,
    getNextPageParam: (last) =>
      last.pagination.page < last.pagination.total_pages ? last.pagination.page + 1 : undefined,
    placeholderData: keepPreviousData,
    enabled,
  });
}

export function useFeaturedSims() {
  return useQuery({
    queryKey: ["web-sims", "featured"],
    queryFn: async () => (await apiClient.get<ApiResponse<WebSim[]>>("/web/sims/featured")).data.data,
  });
}

// "Số tham khảo thêm" — close to the typed pattern but not matching it.
export function useSimilarSims(filters: SimFilters) {
  return useQuery({
    queryKey: ["web-sims", "similar", filters],
    queryFn: async () =>
      (
        await apiClient.get<ApiResponse<WebSim[]>>("/web/sims/similar", {
          params: { ...filterParams(filters), search: filters.search },
        })
      ).data.data,
    enabled: /\d/.test(filters.search),
  });
}

// Always re-checked from the server (still in stock? current price?)
// before a visitor goes on to order.
export function useSimStatus(id: number) {
  return useQuery({
    queryKey: ["web-sims", "status", id],
    queryFn: async () => (await apiClient.get<ApiResponse<WebSim>>(`/web/sims/${id}`)).data.data,
    staleTime: 0,
    retry: false,
  });
}

export type Gender = "male" | "female";

// /web/menh — mệnh (ngũ hành nạp âm) of a birth date, by its lunar year.
export interface WebMenh {
  birth_date: string;
  gender: Gender;
  lunar_date: { day: number; month: number; year: number };
  can_chi: string;
  // null when the lunar year is outside the shop's table (1950–2020).
  element: "KIM" | "MOC" | "THUY" | "HOA" | "THO" | null;
  sim_type: { id: number; code: string; name: string; slug: string } | null;
}

export function useMenh(birthDate: string | undefined, gender: Gender | undefined) {
  return useQuery({
    queryKey: ["web-menh", birthDate, gender],
    queryFn: async () =>
      (
        await apiClient.get<ApiResponse<WebMenh>>("/web/menh", {
          params: { birth_date: birthDate, gender },
        })
      ).data.data,
    enabled: Boolean(birthDate && gender),
    staleTime: Infinity,
  });
}
