"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient, type ApiResponse } from "@/lib/api/client";

// Public links from the "MEDIALINK" setting of the admin (e.g. LOGO).
export function useMediaLinks() {
  return useQuery({
    queryKey: ["media-links"],
    queryFn: async () => {
      const { data } = await apiClient.get<ApiResponse<Record<string, string>>>(
        "/settings/public/media-links",
      );
      return data.data;
    },
    staleTime: 5 * 60 * 1000,
  });
}
