import { Router } from "express";
import {
    analyzeRepository,
    getAllRepositories,
    getRepositoryById
} from "../controllers/repository.controller.js";

const router = Router();

router.route("/analyze").post(analyzeRepository);
router.route("/").get(getAllRepositories);
router.route("/:id").get(getRepositoryById);

export default router;