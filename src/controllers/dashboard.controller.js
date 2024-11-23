import mongoose, { sanitizeFilter } from "mongoose"
import {Video} from "../model/video.model.js"
import {Subscription} from "../model/subscription.model.js"
import {Like} from "../model/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponce} from "../utils/ApiResponce.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { User } from "../model/user.model.js"

const getChannelStats = asyncHandler(async(req,res)=>{
     // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.
     
     const channelState = await User.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers"
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "_id",
                foreignField: "owner",
                as: "videos"
            }
        },
        {
            $unwind: "$videos" // Unwind videos for individual processing
        },
        {
            $lookup: {
                from: "likes",
                localField: "videos._id",
                foreignField: "video",
                as: "videos.likes"
            }
        },
        {
            $addFields: {
                "videos.videoLikes": { $size: "$videos.likes" }
            }
        },
        {
            $group: {
                _id: "$_id",
                totalLikes: { $sum: "$videos.videoLikes" },
                totalViews: { $sum: "$videos.views" },
                totalVideos: { $sum: 1 },
                subscribers: { $first: "$subscribers" } // Get subscribers array
            }
        },
        {
            $project: {
                _id: 0,
                totalLikes: 1,
                totalViews: 1,
                totalVideos: 1,
                totalSubscribers: { $size: "$subscribers" } // Count of subscribers
            }
        }
    ]);
    
    if (!channelState) {
        throw new ApiError(400,"no data available")
    }
    
    res
    .status(200)
    .json(new ApiResponce(200,channelState,"Success"))
})


const getChannelVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10 } = req.query;

    const skip = (page - 1) * limit;
    const totalVideos = await Video.find({ owner: req.user._id })
                                   .skip(skip)
                                   .limit(limit);

    const totalVideoCount = await Video.countDocuments({ owner: req.user._id });

    if (!totalVideos.length) {
        return res.status(200).json(new ApiResponce(200, [], "No videos available"));
    }

    const videos = totalVideos.map(video => ({
        id: video._id,
        title: video.title,
        thumbnail: video.thumbnail,
        videoFile: video.videoFile, // Include the video file URL
        duration: `${video.duration.toFixed(2)}s`,
        views: video.view,
        isPublished: video.isPublish,
        uploadedOn: video.createdAt.toDateString()
    }));

    const response = {
        videos,
        pagination: {
            currentPage: Number(page),
            pageSize: Number(limit),
            totalPages: Math.ceil(totalVideoCount / limit),
            totalVideos: totalVideoCount
        }
    };

    res.status(200).json(new ApiResponce(200, response, "Success"));
});


// Below commented code give you more information

// const getChannelVideos = asyncHandler(async(req,res)=>{
//     // TODO: Get all the videos uploaded by the channel
//     const totalVideos = await Video.find({owner:req.user._id})
//     if (!totalVideos) {
//         throw new ApiError(400,"no video available")
//     }

//     res
//     .status(200)
//     .json(new ApiResponce(200,totalVideos,"Success"))
// })

export {
    getChannelStats,
    getChannelVideos
}