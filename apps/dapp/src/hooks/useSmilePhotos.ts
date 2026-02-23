import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

/**
 * Fetches smile avatar URLs for a batch of EVM addresses from Supabase.
 * Returns a map of lowercased address → photoUrl.
 */
export function useSmilePhotos(addresses: string[]): Record<string, string> {
  const [photos, setPhotos] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!addresses.length) return;
    const lower = addresses.map((a) => a.toLowerCase());

    supabase
      .from("smiles")
      .select("evm_address, photo_url")
      .in("evm_address", lower)
      .then(({ data }) => {
        const map: Record<string, string> = {};
        for (const row of data ?? []) {
          if (row.photo_url) map[row.evm_address] = row.photo_url;
        }
        setPhotos(map);
      });
  }, [addresses.join(",")]);

  return photos;
}
