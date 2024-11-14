import mongoose, {isValidObjectId} from "mongoose"
import {User} from "../model/user.model.js"
import { Subscription } from "../model/subscription.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponce} from "../utils/ApiResponce.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const toggleSubscription = asyncHandler(async (req, res) => {
    const {channelId} = req.params
    
    if(!channelId){
        throw new ApiError(400,"Invalid/Something messied");
    }

    // this will check if the user is already subscribed to the channel or not 
    const existingSubscription = await Subscription.findOne({
        subscriber : req.user._id,
        channel : channelId
    })

    //declared the subscribed variable 
    let subscribed;

    if (existingSubscription) {
        // if user is already subscribed to the channel then delete the subscription
        await Subscription.deleteOne({_id : existingSubscription._id})

        return res.status(200).json(new ApiResponce(200, "Unsubscribe Succesfully"))
    }else{
        //if the user is not subscribed to the channel then add the subscription 
        subscribed = await Subscription.create({
            subscriber : req.user._id,
            channel : channelId
        })
    }

    if (!subscribed) {
        throw new ApiError(400,"Subscribed faild")
    }

    res
    .status(200)
    .json(new ApiResponce(200,subscribed,"Subscribed succesfully"))
})

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const {channelId} = req.params

    if (!channelId) {
        throw new ApiError(400,"Invalid/Something messie")
    }

    const userSubscribedChannel = await Subscription.aggregate([
        {
            $match:{
                channel: new mongoose.Types.ObjectId(channelId)
            }
        },
        {
            $lookup:{
                from: "users",
                localField:"subscriber",
                foreignField: "_id",
                as: "subscribers",
                pipeline:[
                    {
                        $project:{
                            userName : 1,
                            email : 1,
                            avatar : 1,
                        }
                    }
                ]
            },
        },
        {
            $addFields:{
                subscriberDetails : {
                    $arrayElemAt:["$subscribers",0],
                }
            }
        },
        {
            $project:{
                subscriberDetails:1
            }
        }
    ])

    if (!userSubscribedChannel) {
        throw new ApiError(400,"No subscriber found for this channel")
    }
    // console.log("length of userSubscribedChannel : ",userSubscribedChannel.length)

    res
    .status(200)
    .json(new ApiResponce(200,userSubscribedChannel,"you are subscribed to this channel"))
})

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params

    if (!subscriberId) {
        throw new ApiError(400,"Invalid/Something messie")
    }
    
    const userSubcribedChannel = await Subscription.aggregate([
        {
            $match:{
                subscriber :subscriberId,
            }
        },
        {
            $lookup:{
                from:"users",
                localField:"channel",
                foreignField:"_id",
                as:"channels",
                pipeline:[
                    {
                        $project:{
                            userName:1,
                            email:1,
                            avatar:1,
                        }
                    }
                ]
            },
        },

        {
            $addFields:{
                channelDetails:{
                    $arrayElemAt:["$ownerResult",0]
                }
            }
        }
    ])

    if (!userSubcribedChannel) {
        throw new ApiError(400,"finding faild")
    }

    res
    .status(200)
    .json(new ApiResponce(200,userSubcribedChannel,"you are subscribed to this channel"))
})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}