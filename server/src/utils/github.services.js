import path from "path";
import {Octokit} from "@octokit/rest"
import {ApiError} from "./ApiError.js"

const octokit=new Octokit({
    auth:process.env.GITHUB_TOKEN || undefined
});

const ALLOWED_EXTENSIONS=[".js",".jsx",".ts",".tsx"]

function findImports(code){
    const dependencies=[];
    const lines=code.split("\n")
    
    for(const line of lines){
        const trimmed=line.trim();

        if((trimmed.startsWith("import") || trimmed.includes("require(")) && (trimmed.includes("'./") || trimmed.includes('"./') || trimmed.includes("'../") || trimmed.includes('"../'))){
            const match = trimmed.match(/['"](.+?)['"]/);
            if (match && match[1]) {
                dependencies.push(match[1]);
            }
        }
    }

    return dependencies;
}

function resolveImportPath(importerPath, targetImport) {
    const currentDir = path.posix.dirname(importerPath);
    let resolved = path.posix.normalize(path.posix.join(currentDir, targetImport));
    if (resolved.startsWith("/")) resolved = resolved.slice(1);
    return resolved;
}


export async function fetchRepoTreeAndNodes(owner,repo){
    try{
        const {data:repoData}=await octokit.rest.repos.get({owner,repo});
        const defaultBranch=repoData.default_branch
        
        const { data:treeData }=await octokit.rest.git.getTree({
            owner,
            repo,
            tree_sha:defaultBranch,
            recursive:"1"
        });

        const codeFiles=treeData.tree.filter((item)=>{
            const isFile=item.type==="blob"
            const isCode=ALLOWED_EXTENSIONS.some((ext)=>item.path.endsWith(ext));
            const isIgnored=item.path.includes("node_modules") || item.path.includes(".test.");
            return isFile && isCode && !isIgnored
        });

        const nodes=[]
        const links=[]

        const filesToProcess=codeFiles.slice(0,25)

        for(const file of filesToProcess){
            try{
                const {data:fileData}=await octokit.rest.repos.getContent({
                    owner,
                    repo,
                    path:file.path
                })

                const rawCode=Buffer.from(fileData.content,"base64").toString("utf-8")

                const loc=rawCode.split("\n").length
                const imports=findImports(rawCode)

                for(const target of imports){
                    links.push({
                        source:file.path,
                        target:target
                    })
                }

                nodes.push({
                    path:file.path,
                    name:file.path.split("/").pop(),
                    extension:"."+file.path.split(".").pop(),
                    linesOfCode:loc,
                    cyclomaticComplexity:Math.max(1,Math.floor(loc/20)),
                    fanIn:0,
                    fanOut:imports.length,
                    riskScore:0,
                    riskLevel:"LOW",
                    isGodFile:false
                })
            }catch(fileErr){
                continue;
            }
        }

        const validLinks = [];

        for (const link of links) {
            const resolvedPath = resolveImportPath(link.source, link.target);

            const matchedNode = nodes.find((node) => {
                if (node.path === resolvedPath) return true;
                const noExt = node.path.substring(0, node.path.lastIndexOf('.')) || node.path;
                if (noExt === resolvedPath) return true;
                if (node.path === `${resolvedPath}/index.js` || node.path === `${resolvedPath}/index.ts`) return true;
                return false;
            });

            if (matchedNode) {
                matchedNode.fanIn += 1;
                validLinks.push({
                    source: link.source,
                    target: matchedNode.path
                });
            }
        }

        return { nodes , links:validLinks }

    }catch(error){
        throw new ApiError(
            error.status || 500,
            error.message || "GitHub repository access karne me problem aayi"
        )
    }

}