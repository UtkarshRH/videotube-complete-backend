import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../model/video.model.js"
import {User} from "../model/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponce} from "../utils/ApiResponce.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {deleteOnCloudinary, uploadOnCloudinary} from "../utils/cloudinary.js"


// This function is for to delete the video from database 
const findCloudinaryPublicId = (url)=>{
    const videoLinkSplit = url.split('/')
    const videoPublicId = videoLinkSplit[videoLinkSplit.length - 1].split('.')[0]
    return videoPublicId
}

const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query
    //TODO: get all videos based on query, sort, pagination

    // ?page=1&sortBy=views&sortType=asc&limit=4
    const parsedLimit = parseInt(limit);
    const pageSkip = (page - 1) * parsedLimit;
    const sortStage = {};
    sortStage[sortBy] = sortType === 'asc' ? 1 : -1;

    const allVideo = await Video.aggregate([
        {
            $match : {
                isPublish : true
            },
            
        },
        {
            $lookup :{
                from : "users",
                localField : "owner",
                foreignField : "_id",
                as : "ownerResult",
                pipeline : [
                    {
                        $project : {
                            username : 1,
                            avatar : 1
                        }
                    }
                ]
            },
        },
        {
            $addFields : {
                owner_details : {
                    $arrayElemAt: ["$ownerResult", 0],
                },
            },
        },
        {
            $sort : sortStage
        },
        {
            $skip: pageSkip,
        },
        {
            $limit: parsedLimit,
        },
        {
            $project  : {
                ownerResult: 0,
            }
        }

    ])

    console.log(allVideo)
    res
    .status(200)
    .json(new ApiResponce(200, allVideo, "Video Retrieve Succesfully"))

})

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description} = req.body
    // TODO: get video, upload to cloudinary, create video

    if (!(title && description)) {
        throw new ApiError(400, "title and discription must be provided")
    }

    // collect localpath of file 
    const videoLocalPath = req.files?.videoFile[0]?.path;
    const thumbnailLocalPath = req.files?.thumbnail[0]?.path;

    if (!(videoLocalPath || thumbnailLocalPath)) {
        throw new ApiError(400, "File not found")
    }

    // upload on cloudinary 
    const videoUploadOnCloudinaryResponce = await uploadOnCloudinary(videoLocalPath);
    const thumbnailUploadOnCloudinaryResponce = await uploadOnCloudinary(thumbnailLocalPath);

    if (!(videoUploadOnCloudinaryResponce || thumbnailUploadOnCloudinaryResponce)) {
        throw new ApiError(400, "Something went wrong while uploding")
    }

    const video = await Video.create({
        videoFile : videoUploadOnCloudinaryResponce?.url || "",
        thumbnail : thumbnailUploadOnCloudinaryResponce?.url || "",
        duration : videoUploadOnCloudinaryResponce?.duration || 0,

        // videoFile : "camera",
        // thumbnail : "random",
        // duration : 0,
        owner : req.user,
        title,
        description,
    })

    if (!video) {
        throw new ApiError(400, "Something went wrong while uploading")
    }
    res 
    .status(200)
    .json(new ApiResponce(200, {video}, "Video Uploaded Succesfully"))

})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: get video by id
    if (!(videoId)) {
        throw new ApiError(400, "video id must be provided")
    } 

    const video = await Video.findById(videoId).populate("owner")

    if(!(video)){
        throw new ApiError(400,"something went wrong while getting video")
    }

    res
    .status(200)
    .json(new ApiResponce(200, {video}, "video got succesfully"))
})


const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    const {title, discription} = req.body
    const thumbnailLocalPath = req.file?.path
    //TODO: update video details like title, description, thumbnail
    if (!(videoId)){
        throw new ApiError(400, "video id must be provided")
    }

    const video = await Video.findById(videoId)
    if(!(video)){
        throw new ApiError(400, "something went wrong while fetching video")
    }

    //check you are the owner of this video or not 
    if(!req.user._id.equals(video.owner._id)){
        throw new ApiError(400, "You are not owner of this video");
    }

    //upload if data is available 

    if(title) video.title = title;
    if(discription) video.discription = discription;
    if(thumbnailLocalPath) {
        const newThumbnailURL = await uploadOnCloudinary(thumbnailLocalPath);
        if (!(newThumbnailURL)) {
            throw new ApiError(400,"Failed to upload thumbnail")
        }
        await deleteOnCloudinary(video.thumbnail, "image")
        video.thumbnail = newThumbnailURL
    }

    await video.save({validateBeforeSave : false})

    res
    .status(200)
    .json(new ApiResponce(200, {video}, "video updated succesfully"))

})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: delete video
    if(!(videoId)){
        throw new ApiError(400,"Video id required!")
    }

    const video = await Video.findByIdAndDelete(videoId)

    if(!(video)){
        throw new ApiError(400,"Something went wrong while deleting video")
    }

    //check you are the owner of this video or not 
    if(!req.user._id.equals(video.owner._id)){
        throw new ApiError(400, "You are not the owner of this video")
    }

    const videoFile = findCloudinaryPublicId(video.videoFile)
    const thumbnail = findCloudinaryPublicId(video.thumbnail)

    try {
        var deleteVideo = await deleteOnCloudinary(videoFile,"video");
        var deleteThumbnail = await deleteOnCloudinary(thumbnail, "image");
    } catch (error) {
        throw new ApiError(400, "while deleting the data on cloudinary")
    }

    res
    .status(200)
    .json(new ApiResponce(200,{deleteVideo, deleteThumbnail},"video deleted succesfully"))
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    if (!(videoId)) {
        throw new ApiError(400,"video id required")
    }
    const video = await Video.findById(videoId)
    console.log(video)
    if(!(video)){
        throw new ApiError(400, "Something went worng while fetching the video")
    }

    //check you are the owner of this video or not 
    if (!req.user._id.equals(video.owner._id)) {
        throw new ApiError(400,"You are not the owner of this video")
    }

    video.isPublished = !video.isPublished
    await video.save({validateBeforeSave : true})

    res
    .status(200)
    .json(new ApiResponce(200,{},"toggle publish status succesfully"))
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}