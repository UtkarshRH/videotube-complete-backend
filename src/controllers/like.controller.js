import mongoose, {isValidObjectId} from "mongoose"
import {Like} from "../model/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const toggleVideoLike = asyncHandler(async(req,res)=>{
    const {videoId} = req.params
    //TODO: toggle like on video
    if (!videoId) {
        throw new ApiError(400, "video id required!")
    }
    const like = await Like.create({
        video: videoId,
        owner: req.user,
    })

    if (!like) {
        throw new ApiError(504,"couldn't create like")
    }
    res
    .status(200)
    .json(new ApiResponse(200,like,"success"))
})

const toggleCommentLike = asyncHandler(async(req,res)=>{
    const {commentId} = req.params
     //TODO: toggle like on comment

     
})

const toggleTweetLike = asyncHandler(async(req,res)=>{
    const {tweetId} = req.params
     //TODO: toggle like on tweet
})

const getLikedVideos = asyncHandler(async(req,res)=>{
    //TODO: get all liked videos
})

export{
    toggleVideoLike,
    toggleCommentLike,
    toggleTweetLike,
    getLikedVideos
}