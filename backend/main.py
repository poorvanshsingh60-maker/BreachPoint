from fastapi import FastAPI, BackgroundTasks, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uuid
import asyncio

from simulation.engine import run_anuga_simulation_mock

app = FastAPI()

# Enable CORS for the frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins for development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class SimulationParams(BaseModel):
    lat: float
    lng: float
    breachWidth: float
    breachTime: float
    waterLevel: float

# In-memory database for task status and results
tasks_db = {}

async def run_simulation(task_id: str, params: SimulationParams):
    tasks_db[task_id] = {"status": "running"}
    
    # Run the hydrodynamic simulation pipeline
    try:
        # Offload the synchronous simulation to a thread so it doesn't block FastAPI
        result_geojson = await asyncio.to_thread(
            run_anuga_simulation_mock,
            params.lat,
            params.lng,
            params.breachWidth,
            params.breachTime,
            params.waterLevel
        )
        
        tasks_db[task_id] = {
            "status": "completed",
            "results": {
                "message": "Hydrodynamic Simulation Finished",
                "processedParams": params.model_dump(),
                "geoJson": result_geojson
            }
        }
    except Exception as e:
        print(f"Simulation failed: {str(e)}")
        tasks_db[task_id] = {"status": "error", "message": str(e)}

@app.post("/simulate")
async def start_simulation(params: SimulationParams, background_tasks: BackgroundTasks):
    task_id = str(uuid.uuid4())
    tasks_db[task_id] = {"status": "pending"}
    
    # Start the simulation in the background
    background_tasks.add_task(run_simulation, task_id, params)
    
    return {"task_id": task_id, "status": "pending"}

@app.get("/status/{task_id}")
async def get_status(task_id: str):
    if task_id not in tasks_db:
        raise HTTPException(status_code=404, detail="Task not found")
    return {"task_id": task_id, "status": tasks_db[task_id]["status"]}

@app.get("/results/{task_id}")
async def get_results(task_id: str):
    if task_id not in tasks_db:
        raise HTTPException(status_code=404, detail="Task not found")
    
    task_info = tasks_db[task_id]
    if task_info["status"] != "completed":
        raise HTTPException(status_code=400, detail="Simulation not yet completed")
        
    return {"task_id": task_id, "results": task_info["results"]}

@app.get("/")
async def root():
    return {"message": "Dam Break Simulation API is running."}
