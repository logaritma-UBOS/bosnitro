import crypto from "crypto";

let dynamicSecret = "";
let dynamicPreset = "";

export function setDynamicCloudinaryConfig(secret?: string, preset?: string) {
  if (secret !== undefined) dynamicSecret = secret;
  if (preset !== undefined) dynamicPreset = preset;
}

export function getCloudinaryConfig() {
  const cloudName =
    process.env.CLOUDINARY_CLOUD_NAME ||
    process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ||
    "eiwfpdb2";
  const apiKey =
    process.env.CLOUDINARY_API_KEY ||
    process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY ||
    "296696875898832";
  const apiSecret =
    dynamicSecret ||
    process.env.CLOUDINARY_API_SECRET ||
    process.env.CLOUDINARY_API_SECRET_UBOS ||
    "laIk9ELwb1GGxPod5bH2AnCl2i8";
  const uploadPreset =
    dynamicPreset ||
    process.env.CLOUDINARY_UPLOAD_PRESET ||
    process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET ||
    "";

  return {
    cloudName,
    apiKey,
    apiSecret,
    uploadPreset,
    isConfigured: !!cloudName && !!(apiSecret || uploadPreset),
  };
}

export async function uploadImage(file: File): Promise<{ secure_url: string; public_id: string } | null> {
  const { cloudName, apiKey, apiSecret, uploadPreset } = getCloudinaryConfig();

  if (!cloudName) {
    console.warn("[Cloudinary] Cloud name missing. Skipping upload.");
    return null;
  }

  // Check upload mode: Signed (with apiSecret) or Unsigned (with uploadPreset)
  const canSigned = !!(apiKey && apiSecret);
  const canUnsigned = !canSigned && !!uploadPreset;

  if (!canSigned && !canUnsigned) {
    console.warn(
      `[Cloudinary] Cloud Name (${cloudName}) dan API Key (${apiKey}) aktif, namun API Secret / Upload Preset belum disetel. Melewati upload cloud langsung.`
    );
    return null;
  }

  const formData = new FormData();
  formData.append("file", file);

  if (canSigned) {
    const timestamp = Math.round(new Date().getTime() / 1000);
    const signature = crypto
      .createHash("sha1")
      .update(`timestamp=${timestamp}${apiSecret}`)
      .digest("hex");

    formData.append("api_key", apiKey);
    formData.append("timestamp", timestamp.toString());
    formData.append("signature", signature);
  } else if (canUnsigned) {
    formData.append("upload_preset", uploadPreset);
    if (apiKey) {
      formData.append("api_key", apiKey);
    }
  }

  try {
    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      const err = await res.text();
      console.warn("[Cloudinary] Upload failed with status " + res.status + ":", err);
      return null;
    }

    const data = await res.json();
    return { secure_url: data.secure_url, public_id: data.public_id };
  } catch (error) {
    console.warn("[Cloudinary] Network error during upload:", error);
    return null;
  }
}

export async function destroyImage(publicId: string) {
  const { cloudName, apiKey, apiSecret } = getCloudinaryConfig();

  if (!cloudName || !apiKey || !apiSecret) return;

  const timestamp = Math.round(new Date().getTime() / 1000);
  const signature = crypto
    .createHash("sha1")
    .update(`public_id=${publicId}&timestamp=${timestamp}${apiSecret}`)
    .digest("hex");

  const formData = new FormData();
  formData.append("public_id", publicId);
  formData.append("api_key", apiKey);
  formData.append("timestamp", timestamp.toString());
  formData.append("signature", signature);

  try {
    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`, {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      console.warn("[Cloudinary] Failed to destroy image:", await res.text());
    }
  } catch (err) {
    console.warn("[Cloudinary] Network error during destroy:", err);
  }
}
