import { v2 as cloudinary} from "cloudinary";
import fs from "fs";
// fs is a file system and its default module in node.js and it is used to read and write files.

cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});
// config is done now we can use cloudinary to upload images.
const uploadonCloudinary = async (localFilePath) => {
    try {
        if(!localFilePath) throw new Error("Please provide a file path")
            //upload file on cloudinary
      const response = await cloudinary.uploader.upload(localFilePath,{
            resource_type: "auto"
        })
        //file uploaded successfully
        console.log("File uploaded successfully on cloudinary",response.url);
        return response.url;
    } catch (error) {
        // if file gets failed to upload and its on server chances are there for malcious activity so we should delete the file.
        fs.unlinkSync(localFilePath);
        return null;
    }
}
export {uploadonCloudinary}