import { useEffect, useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../lib/firebase";

/**
 * Fetches smile photo URLs for a batch of EVM addresses from Firestore.
 * Returns a map of lowercased address → photoUrl.
 */
export function useSmilePhotos(addresses: string[]): Record<string, string> {
  const [photos, setPhotos] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!addresses.length) return;

    const lower = addresses.map((a) => a.toLowerCase());

    // Firestore `in` supports up to 30 items; chunk if needed
    const chunks: string[][] = [];
    for (let i = 0; i < lower.length; i += 30) {
      chunks.push(lower.slice(i, i + 30));
    }

    Promise.all(
      chunks.map((chunk) =>
        getDocs(query(collection(db, "smiles"), where("evmAddress", "in", chunk)))
      )
    ).then((results) => {
      const map: Record<string, string> = {};
      for (const snap of results) {
        snap.forEach((doc) => {
          const d = doc.data();
          if (d.photoUrl) map[d.evmAddress] = d.photoUrl;
        });
      }
      setPhotos(map);
    });
  }, [addresses.join(",")]);

  return photos;
}
