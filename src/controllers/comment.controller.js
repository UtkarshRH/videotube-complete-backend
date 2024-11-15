import mongoose, { startSession } from "mongoose";
import { Comment } from "../model/comment.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponce } from "../utils/ApiResponce.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../model/user.model.js";
import { json } from "express";

const getVideoComments = asyncHandler(async (req, res) => {
    //TODO: get all comment for video
    const { videoId } = req.params;
    if (!videoId) {
        throw new ApiError(400, "videoId Required!")
    }
    const { page = 1, limit = 10 } = req.query;
    const parsedLimit = parseInt(limit)
    const pageSkip = (page - 1) * parsedLimit;

    const allComments = await User.aggregate([
        {
            $match: {
                video: videoId
            }
        },
        {
            $lookup:{
                from:"user",
                localField:"owner",
                foreignField:"_id",
                as:"owner",
                pipeline:[
                    {
                        $project:{
                            userName:1,
                            avatar:1
                        }
                    }
                ]
            }
        },
        {
            $skip:pageSkip,
        },
        {
            $limit:parsedLimit,
        }
    ])
    if (!allComments) {
        throw new ApiError(400,"not created!")
    }

    res
    .status(200)
    .json(new ApiResponce(200,allComments,"Success"))
})

const addComment = asyncHandler(async (req, res) => {
    //TODO: add comment for a video
    const { videoId } = req.params;
    const { content } = res.body;

    if (!videoId || content) {
        throw new ApiError(400,"id or content not found!")
    }

    const comment = await User.create({
        content:content,
        owner:req.user,
        video:videoId
    })

    if (!content) {
        throw new ApiError(404,"Something went wrong while adding comment!")
    }

    res
    .status(200)
    .json(new ApiResponce(200,comment,"Commented Succefully"))
})

const updateComment = asyncHandler(async(req, res) => {
    //TODO: update comment for video
    const { videoId } = req.params
    const { content } = req.body

    if (!videoId || !content) {
        throw new ApiError(400,"videoId and content required!")
    }

    const comment = await Comment.findById(videoId)

    if (!comment) {
        throw new ApiError(404,"comment not found!")
    }

    //check if the user is the owner of the playlist
    if (comment.owner !== req.user) {
        throw new ApiError(500,"you are not allowed!")
    }

    comment.content = content;

    try {
        await comment.save()
    } catch (error) {
        console.log(error)
        throw new ApiError(503,"not able to update comment!")
    }

    res
    .status(200)
    json(new ApiResponce(200,comment,"Updated Succesfully!"))
})

const deleteComment = asyncHandler(async (req, res) => {
    //TODO: delete comment for video
    const { videoId } = req.params;

    if (!videoId) {
        throw new ApiError(400,"videoId required!")
    }

    const comment = await Comment.findById(videoId);

    if (!comment) {
        throw new ApiError(404,"comment not found")
    }

    //check if the user is the owner of the playlist
    if (comment.owner !== req.user) {
        throw new ApiError(500,"you are not allowed!")
    }
    
    try {
        await comment.remove()
    } catch (error) {
        console.log(error)
        throw new ApiError(503,"something went wrong while removing comment!")
    }

    res
    .status(200)
    .json(new ApiResponce(200,comment,"comment deleted successfully"))
})

export {
    getVideoComments,
    addComment,
    updateComment,
    deleteComment
}