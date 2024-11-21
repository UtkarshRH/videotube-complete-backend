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
        $match:{
            _id: new mongoose.Types.ObjectId(req.user._id,)
        }
     },
     {
        $lookup:{
            from:"subscriptions",
            localField:"_id",
            foreignField:"channel",
            as:"subscriber"
        }
     },
     {
        $lookup:{
          from:"videos",
          localField:"_id",
          foreignField:"owner",
          as:"videos",
          pipeline:[
            {
                $lookup:{
                    from:"likes",
                    localField:"_id",
                    foreignField:"likeBy",
                    as:"likes",
                    pipeline:[
                        {
                            $addFields:{
                                videoLikes:{
                                    $size:"$likes"
                                }
                            }
                        }
                    ]
                }
            }
          ]
        }
     },
     {
        $addFields:{
            totalView:{
                $sum:"$videos.view"
            },
            totalLikes:{
                $sum:"$videos.videoLikes"
            },
            totalVideo:{
                $sum:"$videos"
            }
        }
     }
    ])
    if (!channelState) {
        throw new ApiError(400,"no data available")
    }
    
    res
    .status(200)
    .json(new ApiResponce(200,channelState,"Success"))
})

const getChannelVideos = asyncHandler(async(req,res)=>{
    // TODO: Get all the videos uploaded by the channel
    const totalVideos = await Video.find({owner:req.user._id})
    if (!totalVideos) {
        throw new ApiError(400,"no video available")
    }

    res
    .status(200)
    .json(new ApiResponce(200,totalVideos,"Success"))
})

export {
    getChannelStats,
    getChannelVideos
}