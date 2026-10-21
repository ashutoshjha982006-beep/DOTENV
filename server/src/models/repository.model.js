import mongoose,{Schema} from "mongoose";

const fileNodeSchema=new Schema(
    {
        path:{
            type:String,
            required:true
        },
        name:{
            type:String,
            required:true
        },
        extension:{
            type:String,
        },
        linesOfCode: { type: Number, default: 0 },
        cyclomaticComplexity: { type: Number, default: 1 },
        fanIn: { type: Number, default: 0 },
        fanOut: { type: Number, default: 0 },
        riskScore: { type: Number, default: 0 },
        riskLevel: {
            type: String,
            enum: ["LOW", "MODERATE", "HIGH", "CRITICAL"],
            default: "LOW"
        },
        isGodFile: { type: Boolean, default: false }
    },
    { _id: false }
);

const dependencyLinkSchema = new Schema(
    {
        source: { type: String, required: true },
        target: { type: String, required: true }
    },
    { _id: false }
);

const repositorySchema = new Schema(
    {
        repoUrl: { type: String, required: true, trim: true },
        owner: { type: String, required: true, trim: true },
        name: { type: String, required: true, trim: true },
        overallHealthScore: { type: Number, default: 100 },
        nodes: [fileNodeSchema],
        links: [dependencyLinkSchema]
    },
    { timestamps: true }
);

export const Repository = mongoose.model("Repository", repositorySchema);