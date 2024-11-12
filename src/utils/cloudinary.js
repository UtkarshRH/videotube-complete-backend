import { v2 as cloudinary } from 'cloudinary';
import fs from "fs"
// Configuration
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRETE // Click 'View Credentials' below to copy your API secret
});

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) return null
        // upload the file on cloudinary 
        const responce = await cloudinary.uploader.upload(localFilePath, {
            resource_type: 'auto'
        })
        //file has been uploaded succesfully
        console.log("File is uploaded on cloudinary", responce.url)
        return responce;
    } catch (error) {
        fs.unlinkSync(localFilePath)// it removes the locally saved temporary file as the upload operation got failed
        return null;
    }
}

// This function is for the delete the uploaded Images or video by there type 
const deleteOnCloudinary = async (url,resource_type) => {
    try {
       const publicId = url.split('/').pop().split('.').shift();    
        console.log("extracted Public Id: ",publicId)
        await cloudinary.api.delete_resources(
            [publicId],
            {
                type:"upload",
                resource_type:resource_type
            }
        )
        .then((result) => console.log("Delete result:", result))
    } catch (error) {
        console.error("Error deleting previous avatar:", error);
    }
};


export { uploadOnCloudinary , deleteOnCloudinary }