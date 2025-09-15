import { useQuery } from "@tanstack/react-query";

const fetchGeoJSON = async (geoJSONFile: string): Promise<unknown> => {
  const response = await fetch(`${import.meta.env.VITE_API_URL_BASE}${geoJSONFile}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch GeoJSON file: ${response.status} ${response.statusText}`);
  }
  return response.json();
};

export const useGeoJSON = (geoJSONFile: string | undefined) => {
  return useQuery({
    queryKey: ["geoJSON", geoJSONFile],
    queryFn: () => (geoJSONFile ? fetchGeoJSON(geoJSONFile) : null),
    enabled: !!geoJSONFile,
    staleTime: 30 * 60 * 1000, // 30 minutes - GeoJSON files don't change often
    gcTime: 60 * 60 * 1000, // 1 hour
    retry: 3,
    retryDelay: (attemptIndex: number): number => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
};
