import mongoose, { isValidObjectId, ObjectId } from "mongoose"
import { Tweet } from "../model/tweet.model.js"
import { User } from "../model/user.model.js"
import { ApiError } from "../utils/ApiError.js"
import {ApiResponce} from "../utils/ApiResponce.js"
import { asyncHandler } from "../utils/asyncHandler.js"

const createTweet = asyncHandler(async (req, res) => {
    const { content } = req.body;

    if (!content) {
        throw new ApiError(400, "Content is required")
    }

    const tweet = await Tweet.create({
        content: req.body.content,
        owner: req.user
    })

    if (!tweet) throw new ApiError(500, "Can't find tweet database")

    res
        .status(200)
        .json(new ApiResponce(200, tweet, "Tweet Created"))
})

const getUserTweets = asyncHandler(async (req, res) => {
    // TODO: get user tweets

    // ?page=1&limit=10&sortType=new

    const { userId } = req.params;
    const { page = 1, limit = 10, sortType } = req.query

    const parsedLimit = parseInt(limit)
    const pageSkip = (page - 1) * parsedLimit;
    const sortBy = sortType === 'new' ? 1 : -1;

    if (!userId) {
        throw new ApiError(400, "Invalid/Something messied")
    }

    const tweets = await Tweet
        .find({ owner: new mongoose.Types.ObjectId(userId) })
        .sort({ createdAt: sortBy })
        .skip(pageSkip)
        .limit(parsedLimit)

    if (!tweets) throw new ApiError(500, "Can't find tweets")

    res
        .status(200)
        .json(new ApiResponce(200, tweets, "Success"))
})

const updateTweet = asyncHandler(async (req, res) => {
    //TODO: update tweet
    const { updateTweetContent } = req.body;
    const { tweetId } = req.params;

    if (!(updateTweetContent || tweetId)) {
        throw new ApiError(400, "Invalid/Something messied");
    }

    const tweet = Tweet.findByIdAndUpdate(
        tweetId,
        {
            $set:{
                content: updateTweetContent,
            }
        },
        {new:true}
    )

    if(!tweet){
        throw new ApiError(500,"Can't find tweet")
    }

    res
    .status(200)
    .json(new ApiResponce(200,tweet,"Updated"))
})

const deleteTweet = asyncHandler(async (req, res) => {
    //TODO: delete tweet
    const {tweetId} = req.params;
    if(!tweetId){
        throw new ApiError(400,"tweetId is required");
    }

    const tweet = await Tweet.findByIdAndDelete(tweetId);

    if(!tweet) throw new ApiError(500,"can't find tweet")
    
    res
    .status(200)
    .json(new ApiResponse(200,"Deleted Succesfully"))
})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}