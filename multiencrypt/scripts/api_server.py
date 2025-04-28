
import os
import sys
import json
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from pydantic import BaseModel
from typing import List, Dict, Any, Optional

# Add the parent directory to the path so we can import the multiencrypt module
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from multiencrypt import Multiencrypt

app = FastAPI(title="Multiencrypt API")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust this in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize the multiencrypt module
multiencrypt = Multiencrypt(min_signatures=2, total_participants=5)

# API Models
class ParticipantRequest(BaseModel):
    participant_id: str

class EncryptRequest(BaseModel):
    data: str
    participant_ids: List[str]

class DecryptShareRequest(BaseModel):
    encrypted_data: Dict[str, Any]
    participant_id: str

class CombineSharesRequest(BaseModel):
    decrypted_shares: List[Dict[str, Any]]

@app.get("/")
def read_root():
    return {"message": "Welcome to Multiencrypt API"}

@app.post("/api/generate_keypair")
def generate_keypair(request: ParticipantRequest):
    try:
        result = multiencrypt.generate_keypair(request.participant_id)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/encrypt")
def encrypt(request: EncryptRequest):
    try:
        result = multiencrypt.encrypt(request.data, request.participant_ids)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/decrypt_share")
def decrypt_share(request: DecryptShareRequest):
    try:
        result = multiencrypt.decrypt_share(request.encrypted_data, request.participant_id)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/combine_shares")
def combine_shares(request: CombineSharesRequest):
    try:
        result = multiencrypt.combine_shares(request.decrypted_shares)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/export_public_keys")
def export_public_keys():
    try:
        return multiencrypt.export_public_keys()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run("api_server:app", host="0.0.0.0", port=8000, reload=True)
