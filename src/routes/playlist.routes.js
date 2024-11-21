import { Router } from "express";
import {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
} from "../controllers/playlist.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js"

const router = Router();

router.use(verifyJWT);

router.route("/").post(createPlaylist);

router.route("/:playListId")
            .get(getPlaylistById)
            .patch(updatePlaylist)
            .delete(deletePlaylist);

router.route("/add/:videoId/:playListId").patch(addVideoToPlaylist);
router.route("/remove/:playListId/:videoId").patch(removeVideoFromPlaylist);

router.route("/user/:userId").get(getUserPlaylists);

export default router;