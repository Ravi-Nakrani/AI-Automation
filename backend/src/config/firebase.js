import { cert, initializeApp, getApps } from "firebase-admin/app";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function getCredentials() {
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    const raw = process.env.FIREBASE_SERVICE_ACCOUNT.trim().replace(/^["']|["']$/g, "").trim();
    const decoded = Buffer.from(raw, "base64").toString("utf-8");
    return JSON.parse(decoded);
  }

  // Fallback to local file for local development
  const localPath = path.join(__dirname, "serviceAccountKey.json");
  if (fs.existsSync(localPath)) {
    return JSON.parse(fs.readFileSync(localPath, "utf-8"));
  }

  throw new Error(
    "FIREBASE_SERVICE_ACCOUNT environment variable is missing (base64-encoded service account key required)."
  );
}

const credentials = getCredentials();

const app =
  getApps().length === 0
    ? initializeApp({
        credential: cert(credentials),
      })
    : getApps()[0];

export default app;
