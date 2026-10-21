import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { Repository } from "../models/repository.model.js"
import { fetchRepoTreeAndNodes } from "../utils/github.services.js"

const analyzeRepository = asyncHandler(async (req,res) => {
    const {repoUrl}=req.body

    if (!repoUrl || repoUrl.trim() === "") {
        throw new ApiError(400, "repoUrl is required");
    }

    const cleanUrl=repoUrl.replace(/\.git$/,"").replace(/\/$/,"")
    const parts=cleanUrl.split("/")
    const repo=parts.pop()
    const owner=parts.pop()

    if(!owner || !repo){
        throw new ApiError(400,"Invalid GitHub repository URL format")
    }

    const { nodes,links }=await fetchRepoTreeAndNodes(owner,repo)

    if(!nodes || nodes.length==0){
        throw new ApiError(404,"No supported JS/TS files found in this repository")
    }

    const enrichedNodes=nodes.map((node) => {
        const score=Math.min(
            100,
            Math.round(node.linesOfCode*0.3+node.fanIn*4+node.fanOut*3)
        )

        let level="LOW";

        if(score>75)level="CRITICAL";
        else if(score>50)level="HIGH";
        else if(score>25)level="MODERATE"

        return {
            ...node,
            riskScore:score,
            riskLevel:level,
            isGodFile:score>75
        }

    })

    const totalRisk=enrichedNodes.reduce((acc,curr)=>acc+curr.riskScore,0);
    const overallHealthScore=Math.max(0,Math.round(100-totalRisk/enrichedNodes.length));

    const savedRepo = await Repository.create({
        repoUrl,
        owner,
        name: repo,
        overallHealthScore,
        nodes: enrichedNodes,
        links
    });

    return res
           .status(201)
           .json(new ApiResponse(201,savedRepo,"Repository analyzed successfully"));

})


const getRepositoryById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const repo = await Repository.findById(id);

    if (!repo) {
        throw new ApiError(404, "Repository not found");
    }

    return res.status(200).json(new ApiResponse(200, repo, "Repository fetched successfully"));
});

const getAllRepositories = asyncHandler(async (req, res) => {
    const repos = await Repository.find().select("-nodes -links").sort({ createdAt: -1 });
    return res.status(200).json(new ApiResponse(200, repos, "History fetched successfully"));
});

export { analyzeRepository, getRepositoryById, getAllRepositories };