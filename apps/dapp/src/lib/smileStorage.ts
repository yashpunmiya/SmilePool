import { ref, uploadString, getDownloadURL } from "firebase/storage";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { storage, db } from "./firebase";

/**
 * Upload a smile selfie (base64 data URL) to Firebase Storage
 * and save its URL + score in Firestore keyed by EVM address.
 */
export async function uploadSmilePhoto(
  evmAddress: string,
  dataUrl: string,
  score: number
): Promise<string | null> {
  try {
    // Store one photo per address (overwrite on new smile)
    const storageRef = ref(storage, `smiles/${evmAddress.toLowerCase()}.jpg`);
    await uploadString(storageRef, dataUrl, "data_url");
    const url = await getDownloadURL(storageRef);

    // Save metadata to Firestore
    await setDoc(doc(db, "smiles", evmAddress.toLowerCase()), {
      evmAddress: evmAddress.toLowerCase(),
      photoUrl: url,
      bestScore: score,
      updatedAt: serverTimestamp(),
    }, { merge: true });

    return url;
  } catch (err) {
    console.error("Failed to upload smile photo:", err);
    return null;
  }
}

/**
 * Get a smile photo URL for a given EVM address.
 */
export async function getSmilePhoto(evmAddress: string): Promise<string | null> {
  try {
    const snap = await getDoc(doc(db, "smiles", evmAddress.toLowerCase()));
    if (snap.exists()) return snap.data().photoUrl ?? null;
    return null;
  } catch {
    return null;
  }
}
