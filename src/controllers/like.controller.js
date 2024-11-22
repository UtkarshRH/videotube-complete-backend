import mongoose, {isValidObjectId} from "mongoose"
import {Like} from "../model/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponce} from "../utils/ApiResponce.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const toggleVideoLike = asyncHandler(async(req,res)=>{
    const {videoId} = req.params
    //TODO: toggle like on video
    if (!videoId) {
        throw new ApiError(400, "video id required!")
    }

    //check if the user has already like the video 
    const userExtingLike = await Like.findOne({
        video: videoId,
        likedBy: req.user._id  //check if the user has already like the video
    })

    if (userExtingLike) {
        await userExtingLike.deleteOne();
        res.status(200).json(new ApiResponce(200, "Video unlike succesfully"))
    }else{
        const like = await Like.create({
            video: videoId,
            likedBy: req.user._id,
        })
        
        if (!like) {
            throw new ApiError(504,"couldn't create like")
        }
        res
        .status(200)
        .json(new ApiResponce(200,like,"success"))
    }
})

const toggleCommentLike = asyncHandler(async(req,res)=>{
    const {commentId} = req.params
     //TODO: toggle like on comment
    if (!commentId) {
        throw new ApiError(400,"commentId required!")
    }

    const like = await Like.create({
        comment:commentId,
        likeBy:req.user
    })
    if (!like) {
        throw new ApiError(404,"like not found!")
    }

    res
    .status(200)
    .json(new ApiResponce(200,like,"you like the comment"))
})

const toggleTweetLike = asyncHandler(async(req,res)=>{
    const {tweetId} = req.params
     //TODO: toggle like on tweet
     if (!tweetId) {
        throw new ApiError(400,"tweetId required!")
     }

     const like = await Like.create({
        tweet:tweetId,
        likeBy:req.user
    })

    if (!like) {
        throw new ApiError(404,"like not added")
    }
    res
    .status(200)
    .json(new ApiResponce(200,like,"Success"))
})

const getLikedVideos = asyncHandler(async(req,res)=>{
    //TODO: get all liked videos
    const { page = 1, limit = 10 } = req.query;
    const parsedLimit = parseInt(limit)
    const pageSkip = (page - 1) * parsedLimit;
    const allLikedVideo = await Like.find({likedBy: req.user._id})
                                    .skip(pageSkip)
                                    .limit(parsedLimit)
                                    .populate('video');

    if (allLikedVideo.length === 0) {
        return res.status(200).json(new ApiResponce(200, [], "No liked videos found"));
    }

    res
    .status(200)
    .json(new ApiResponce(200,allLikedVideo,"Success"))
})

export{
    toggleVideoLike,
    toggleCommentLike,
    toggleTweetLike,
    getLikedVideos
}