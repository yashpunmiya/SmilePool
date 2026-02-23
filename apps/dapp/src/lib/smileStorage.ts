import { supabase } from "./supabase";

const BUCKET = "smiles";

/* ------------------------------------------------------------------ */
/*  Profile photo (one per address — used for avatars / leaderboard)  */
/* ------------------------------------------------------------------ */

/**
 * Upload a smile selfie (base64 data URL) to Supabase Storage
 * and upsert URL + score in the `smiles` table.
 */
export async function uploadSmilePhoto(
  evmAddress: string,
  dataUrl: string,
  score: number
): Promise<string | null> {
  try {
    const addr = evmAddress.toLowerCase();
    const blob = dataUrlToBlob(dataUrl);
    const path = `public/${addr}.jpg`;

    const { error: uploadErr } = await supabase.storage
      .from(BUCKET)
      .upload(path, blob, { contentType: "image/jpeg", upsert: true });
    if (uploadErr) throw uploadErr;

    const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(path);
    const photoUrl = urlData.publicUrl;

    const { error: dbErr } = await supabase.from("smiles").upsert(
      { evm_address: addr, photo_url: photoUrl, best_score: score, updated_at: new Date().toISOString() },
      { onConflict: "evm_address" }
    );
    if (dbErr) throw dbErr;

    return photoUrl;
  } catch (err) {
    console.error("Failed to upload smile photo:", err);
    return null;
  }
}

/**
 * Get the avatar photo URL for a given EVM address.
 */
export async function getSmilePhoto(
  evmAddress: string
): Promise<string | null> {
  try {
    const { data } = await supabase
      .from("smiles")
      .select("photo_url")
      .eq("evm_address", evmAddress.toLowerCase())
      .single();
    return data?.photo_url ?? null;
  } catch {
    return null;
  }
}

/* ------------------------------------------------------------------ */
/*  Feed entries  (one per successful claim — history timeline)       */
/* ------------------------------------------------------------------ */

export interface FeedEntry {
  id: string;
  evmAddress: string;
  photoUrl: string;
  score: number;
  message: string;
  txHash: string;
  explorerUrl: string;
  createdAt: string | null;
}

/**
 * Save a new feed entry after a successful claim.
 * Uploads the photo with a unique name so every smile is preserved.
 */
export async function saveFeedEntry(opts: {
  evmAddress: string;
  dataUrl: string;
  score: number;
  message: string;
  txHash: string;
  explorerUrl: string;
}): Promise<FeedEntry | null> {
  try {
    const addr = opts.evmAddress.toLowerCase();
    const ts = Date.now();
    const blob = dataUrlToBlob(opts.dataUrl);
    const path = `public/feed_${addr}_${ts}.jpg`;

    const { error: uploadErr } = await supabase.storage
      .from(BUCKET)
      .upload(path, blob, { contentType: "image/jpeg", upsert: false });
    if (uploadErr) throw uploadErr;

    const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(path);
    const photoUrl = urlData.publicUrl;

    const row = {
      evm_address: addr,
      photo_url: photoUrl,
      score: opts.score,
      message: opts.message,
      tx_hash: opts.txHash,
      explorer_url: opts.explorerUrl,
      created_at: new Date().toISOString(),
    };

    const { data, error: dbErr } = await supabase
      .from("feed")
      .insert(row)
      .select()
      .single();
    if (dbErr) throw dbErr;

    // Also update the profile avatar
    await uploadSmilePhoto(opts.evmAddress, opts.dataUrl, opts.score);

    return dbRowToFeedEntry(data);
  } catch (err) {
    console.error("Failed to save feed entry:", err);
    return null;
  }
}

/**
 * Fetch the most recent feed entries.
 */
export async function getRecentFeedEntries(count = 30): Promise<FeedEntry[]> {
  try {
    const { data, error } = await supabase
      .from("feed")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(count);
    if (error) throw error;
    return (data ?? []).map(dbRowToFeedEntry);
  } catch (err) {
    console.error("Failed to fetch feed:", err);
    return [];
  }
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function dataUrlToBlob(dataUrl: string): Blob {
  try {
    // Split the data URL
    const arr = dataUrl.split(",");
    const mime = arr[0].match(/:(.*?);/)?.[1] || "image/jpeg";
    const bstr = atob(arr[1]);
    const n = bstr.length;
    const u8arr = new Uint8Array(n);
    for (let i = 0; i < n; i++) {
      u8arr[i] = bstr.charCodeAt(i);
    }
    return new Blob([u8arr], { type: mime });
  } catch (e) {
    console.error("Error converting data URL to blob:", e);
    throw e;
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function dbRowToFeedEntry(row: any): FeedEntry {
  return {
    id: row.id,
    evmAddress: row.evm_address,
    photoUrl: row.photo_url,
    score: row.score,
    message: row.message ?? "",
    txHash: row.tx_hash,
    explorerUrl: row.explorer_url,
    createdAt: row.created_at ?? null,
  };
}
