import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_SECRETE_KEY,
});

export const cloudinaryUploadHandler = async (localFileUrl) => {
  try {
    if (!localFileUrl) return null;
    const response = await cloudinary.uploader.upload(localFileUrl, {
      resource_type: "auto",
    });
    fs.unlinkSync(localFileUrl);
    return response;
  } catch (error) {
    fs.unlink(localFileUrl);
    return null;
  }
};
