import mongoose from "mongoose";
import {Comment} from "../model/comment.model.js";
import {ApiError} from "../utils/ApiError.js";
import {ApiResponce} from "../utils/ApiResponce.js";
import {asyncHandler} from "../utils/asyncHandler.js";

const getVideoComments = asyncHandler(async(req,res)=>{
    //TODO: get all comment for video
    const {videoId} = req.params;
    const {page = 1, limit = 10} = req.query;

})

const addComment = asyncHandler(async(req,res)=>{
    //TODO: add comment for a video
})

const updateComment = asyncHandler(async(req,res)={
    //TODO: update comment for video
})

const deleteComment = asyncHandler(async(req,res)=>{
    //TODO: delete comment for video
})

export{
    getVideoComments,
    addComment,
    updateComment,
    deleteComment
}