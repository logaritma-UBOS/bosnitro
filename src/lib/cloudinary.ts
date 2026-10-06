import crypto from "crypto";

export async function uploadImage(file: File): Promise<{ secure_url: string; public_id: string } | null> {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET_UBOS;

  if (!cloudName || !apiKey || !apiSecret) {
    console.warn("Cloudinary environment variables missing. Skipping upload.");
    return null;
  }

  const timestamp = Math.round(new Date().getTime() / 1000);
  const signature = crypto
    .createHash("sha1")
    .update(`timestamp=${timestamp}${apiSecret}`)
    .digest("hex");

  const formData = new FormData();
  formData.append("file", file);
  formData.append("api_key", apiKey);
  formData.append("timestamp", timestamp.toString());
  formData.append("signature", signature);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const err = await res.text();
    console.error("Cloudinary upload error:", err);
    throw new Error("Failed to upload image");
  }

  const data = await res.json();
  return { secure_url: data.secure_url, public_id: data.public_id };
}

export async function destroyImage(publicId: string) {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET_UBOS;

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

  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`, {
    method: "POST",
    body: formData,
  });
  
  if (!res.ok) {
     console.error("Failed to destroy image", await res.text());
  }
}
