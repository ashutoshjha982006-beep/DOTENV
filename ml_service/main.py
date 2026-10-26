from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List
import pickle
import os
import uvicorn

app = FastAPI(title="The Astral Cartographer - ML Risk Engine")

MODEL_PATH = os.path.join(os.path.dirname(__file__), "ast_risk_model.pkl")

try:
    with open(MODEL_PATH, "rb") as f:
        artifact = pickle.load(f)
        regressor = artifact['regressor']
        classifier = artifact['classifier']
        tier_mapping = artifact['tier_mapping']
        features = artifact['features']
    print("[AST ML] Model pipeline successfully loaded into memory.")
except Exception as e:
    print(f"[AST ML ERROR] Failed to load model artifact: {e}")
    regressor = None
    classifier = None

class NodeMetrics(BaseModel):
    path: str
    linesOfCode: int
    fanIn: int
    fanOut: int

class PredictionResponse(BaseModel):
    path: str
    riskScore: float
    riskLevel: str
    isGodFile: bool

@app.get("/health")
def health_check():
    return {"status": "operational", "modelLoaded": regressor is not None}

@app.post("/predict/batch", response_model=List[PredictionResponse])
def predict_batch(nodes: List[NodeMetrics]):
    if not regressor or not classifier:
        raise HTTPException(status_code=500, detail="Model pipeline is uninitialized")
    
    if not nodes:
        return []

    # Features order: ['linesOfCode', 'fanIn', 'fanOut']
    feature_matrix = [[node.linesOfCode, node.fanIn, node.fanOut] for node in nodes]

    scores = regressor.predict(feature_matrix)
    tiers = classifier.predict(feature_matrix)

    results = []
    for idx, node in enumerate(nodes):
        score_val = round(float(scores[idx]), 2)
        tier_label = tier_mapping.get(int(tiers[idx]), "LOW")
        results.append(PredictionResponse(
            path=node.path,
            riskScore=score_val,
            riskLevel=tier_label,
            isGodFile=(tier_label == "CRITICAL" or score_val >= 75.0)
        ))

    return results

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8001)