import mongoose, {isValidObjectId} from "mongoose"
import {Playlist} from "../model/playlist.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const createPlaylist = asyncHandler(async(req,res)=>{
    const {name,discription} = req.body

    //TODO: create playlist

    if (!name || !discription) {
        throw new ApiError(400,"name and discription required!")
    }

    const playlist = await Playlist.create({
        name,
        discription,
        owner: req.user
    })

    if (!playlist) {
        throw new ApiError(404,"playlist not found")
    }

    res
    .status(200)
    .json(new ApiResponse(200,playlist,"playlist created succesfully"))
})

const getUserPlaylists = asyncHandler(async(req,res)=>{
    const {userId} = req.params
    //TODO: get user playlists

    if (!userId) {
        throw new ApiError(400,"userID required!")
    }

    const getUserPlaylists = await Playlist.find({ owner: userId })

    if(!getUserPlaylists){
        throw new ApiError(500,"playlist not found!")
    } 

    res
    .status(200)
    .json(new ApiResponse(200,getUserPlaylists,"playlist found succesfully"))
})

const getPlaylistById  = asyncHandler(async(req,res)=>{
    const {playlistId} = req.params
    //TODO : get Playlist by ID

    if (!playlistId) {
        throw new ApiError(400,"playlistId not found!")
    }

    const getUserPlaylists = await Playlist.findById(playlistId)

    if (!getUserPlaylists) {
        throw new ApiError(404,"playlist not found!")
    }

    res
    .status(200)
    .json(new ApiResponse(200,getUserPlaylists,"Success"))
})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params;

    if (!playlistId || !videoId) {
        throw new ApiError(400,"playlistID and videoId required!")
    }

    const videoAdded = await Playlist.findById(playlistId);

    //find you are right owner or not 
    if (videoAdded.owner !== req.user) {
        throw new ApiError(400,"you are not allowed!")
    }

    videoAdded.videos.push(videoId)

    try {
        await videoAdded.save({ validateBeforeSave: false })
    } catch (error) {
        console.log(error)
        throw new ApiError(500,"something went worng while saving video ")
    }

    res
    .status(200)
    .json(new ApiResponse(200,videoAdded,"video added"))
})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params
    // TODO: remove video from playlist

    if (!playlistId || !videoId) {
        throw new ApiError(400,"playlistId and videoId reqiired!")
    }

    const playlist = await Playlist.findById(playlistId)

    if (!playlist) {
        throw new ApiError(404,"playlist not found!")
    }

    //check if the user is owner of the playlist
    if(playlist.owner !== req.user){
        throw new ApiError(500,"you are not allowed to remove the video")
    }

    //remove the video from the playlist video array 
    playlist.videos = playlist.videos.filter((vid) => vid !== videoId)

    try {
        await playlist.save();
    } catch (error) {
        console.log(error)
        throw new ApiError(500,"Something went wrong!")
    }

    res
    .status(200)
    .json(new ApiResponse(200,playlist,"video removed from playlist"))

})


const deletePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    // TODO: delete playlist
    if (!playlistId) {
        throw new ApiError(400,"plalylistId required!")
    }

    const playlist = await Playlist.findById(playlistId)

    if (playlist) {
        throw new ApiError(400,"playlist not found!")
    }

    //check it the user is owner of the playlist
    if (playlist.owner !== req.user) {
        throw new ApiError(500,"you are not allowed to delete the playlist")
    }

    await playlist.remove();

    res
    .status(200)
    .json(new ApiResponse(200,playlist,"playlist removed form database!"))
})


const updatePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    const {name, description} = req.body
    //TODO: update playlist

    if (!playlistId || name || description) {
        throw new ApiError(400,"playlistId,name and description required!")
    }

    const playlist = await Playlist.findById(playlistId)

    if (playlist) {
        throw new ApiError(404,"playlist not found")
    }

    //check if the user is owner or not 
    if (playlist.owner !== req.user) {
        throw new ApiError(500,"you are not allowed to update")
    }

    //update the playlist property

    if (name) {
        playlist.name = name
    }

    if (description) {
        playlist.description = description
    }

    try {
        await playlist.save();
    } catch (error) {
        console.log(error)
        throw new ApiError(500,"Something went wrong during save!")
    }

    res
    .status(200)
    .json(new ApiResponse(200,playlist,"playlist updated succesfully"))
})

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}