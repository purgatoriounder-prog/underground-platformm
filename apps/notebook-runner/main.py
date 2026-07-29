from fastapi import FastAPI, BackgroundTasks, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uuid
import os
import asyncio
import papermill as pm

ARTIFACTS_DIR = os.environ.get("ARTIFACTS_DIR", "artifacts")
os.makedirs(ARTIFACTS_DIR, exist_ok=True)

app = FastAPI(title="Notebook Runner")

# CORS: allow all origins for testing (per user request)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class RunRequest(BaseModel):
    notebook: str
    parameters: dict = {}

# Simple in-memory job status store (ephemeral)
jobs = {}

async def run_notebook_job(job_id: str, notebook_path: str, out_path: str, parameters: dict):
    jobs[job_id] = {"status": "running"}
    try:
        pm.execute_notebook(notebook_path, out_path, parameters=parameters)
        jobs[job_id] = {"status": "finished", "out": out_path}
    except Exception as e:
        jobs[job_id] = {"status": "failed", "error": str(e)}

@app.post("/run-notebook")
async def run_notebook(req: RunRequest, background_tasks: BackgroundTasks):
    notebook_path = req.notebook
    if not os.path.isabs(notebook_path):
        notebook_path = os.path.join(os.getcwd(), notebook_path)
    if not os.path.exists(notebook_path):
        raise HTTPException(status_code=404, detail=f"Notebook not found: {req.notebook}")
    job_id = str(uuid.uuid4())
    out_name = f"{job_id}.ipynb"
    out_path = os.path.join(ARTIFACTS_DIR, out_name)
    # schedule background job
    loop = asyncio.get_event_loop()
    loop.create_task(run_notebook_job(job_id, notebook_path, out_path, req.parameters or {}))
    jobs[job_id] = {"status": "queued"}
    return {"job_id": job_id, "status": "queued"}

@app.get("/status/{job_id}")
async def status(job_id: str):
    job = jobs.get(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="job not found")
    return job

@app.get("/artifacts/{filename}")
async def get_artifact(filename: str):
    path = os.path.join(ARTIFACTS_DIR, filename)
    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail="artifact not found")
    return {"path": path}
