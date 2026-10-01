import numpy as np
from shapely.geometry import Point, Polygon
import json
import time

def run_anuga_simulation_mock(lat, lng, breachWidth, breachTime, waterLevel):
    """
    Mock implementation of the ANUGA hydrodynamic engine pipeline.
    
    (Note: ANUGA requires C++ compilers which are not available on this Windows 
    environment, so we are running a python-based geometric mock to fulfill the pipeline).
    
    In production, this would:
    1. Fetch SRTM DEM data for the bounding box around (lat, lng).
    2. Convert DEM to ANUGA mesh.
    3. Initialize anuga.Domain()
    4. Apply breach forcing.
    5. Export .sww to GeoJSON/GeoTIFF.
    """
    print(f"Initializing hydrodynamic domain for lat:{lat}, lng:{lng}")
    print(f"Applying breach forcing: width={breachWidth}m, time={breachTime}h, head={waterLevel}m")
    
    # Simulate processing time based on breach time (more time = more processing)
    # Scaled down for demo purposes
    time.sleep(3)
    
    # Create a realistic looking flood inundation polygon propagating downstream.
    # For this mock, we assume the river flows South-East.
    
    # Distance the flood travels depends on initial water volume (level)
    # 1 degree lat is ~111km. 0.1 deg is ~11km.
    distance_deg = (waterLevel / 100.0) * 0.1 
    
    # Width of flood plane depends on breach width
    width_deg = (breachWidth / 1000.0) * 0.05
    if width_deg < 0.005: width_deg = 0.005
    
    # Generate points for a downstream flood polygon (fanning out)
    # p1, p2 are at the dam
    p1 = (lng - width_deg/2, lat + width_deg/2)
    p2 = (lng + width_deg/2, lat + width_deg/2)
    
    # p3, p4 are downstream
    p3 = (lng + distance_deg + width_deg, lat - distance_deg)
    p4 = (lng + distance_deg - width_deg, lat - distance_deg - width_deg/2)
    
    poly = Polygon([p1, p2, p3, p4])
    
    # Return as standard GeoJSON
    geojson = {
        "type": "FeatureCollection",
        "features": [
            {
                "type": "Feature",
                "properties": {
                    "type": "inundation_extent",
                    "max_depth_meters": round(waterLevel * 0.8, 2),
                    "max_velocity_ms": 5.4,
                    "description": "Simulated flood downstream"
                },
                "geometry": {
                    "type": "Polygon",
                    "coordinates": [list(poly.exterior.coords)]
                }
            }
        ]
    }
    
    return geojson
