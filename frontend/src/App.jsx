import React, { useState, useEffect } from 'react';
import axios from 'axios';
import MapComponent from './components/MapComponent';
import Sidebar from './components/Sidebar';
import './App.css';
import 'leaflet/dist/leaflet.css';

const API_BASE_URL = 'http://localhost:8000';

function App() {
  const [selectedLocation, setSelectedLocation] = useState({ lat: 30.4100, lng: 79.7000 }); // Default
  const [simulationStatus, setSimulationStatus] = useState('idle'); // idle, pending, running, completed, error
  const [taskId, setTaskId] = useState(null);
  const [results, setResults] = useState(null);

  // Request user's location when the app loads
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setSelectedLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.warn("Geolocation error:", error.message);
        }
      );
    }
  }, []);

  const handleSimulate = async (params) => {
    setSimulationStatus('pending');
    setResults(null);
    
    try {
      const response = await axios.post(`${API_BASE_URL}/simulate`, {
        // Send coordinates instead of damId
        lat: selectedLocation.lat || 0,
        lng: selectedLocation.lng || 0,
        breachWidth: parseFloat(params.breachWidth) || 150,
        breachTime: parseFloat(params.breachTime) || 0.1,
        waterLevel: parseFloat(params.waterLevel) || 100
      });
      
      setTaskId(response.data.task_id);
    } catch (error) {
      console.error("Error starting simulation:", error);
      alert(`Simulation failed to start. Ensure the Python backend is running at ${API_BASE_URL}.\n\nDetails: ${error.message}`);
      setSimulationStatus('error');
    }
  };

  // Poll for status when taskId is set
  useEffect(() => {
    let intervalId;
    
    const checkStatus = async () => {
      if (!taskId) return;
      
      try {
        const response = await axios.get(`${API_BASE_URL}/status/${taskId}`);
        const status = response.data.status;
        setSimulationStatus(status);
        
        if (status === 'completed') {
          clearInterval(intervalId);
          fetchResults();
        } else if (status === 'error') {
          clearInterval(intervalId);
        }
      } catch (error) {
        console.error("Error checking status:", error);
      }
    };

    const fetchResults = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/results/${taskId}`);
        setResults(response.data.results);
      } catch (error) {
        console.error("Error fetching results:", error);
      }
    };

    if (taskId && (simulationStatus === 'pending' || simulationStatus === 'running')) {
      intervalId = setInterval(checkStatus, 1000);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [taskId, simulationStatus]);

  return (
    <div className="flex flex-col h-screen">
      <header className="bg-blue-900 text-white p-4 shadow-md z-10 flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold">Dam Break Inundation Modelling</h1>
          <p className="text-sm text-blue-200">Smart India Hackathon 2026 - Problem 26161</p>
        </div>
        <div className="bg-blue-800 px-3 py-1 rounded text-sm">
          Status: {simulationStatus.toUpperCase()}
        </div>
      </header>
      
      <div className="flex flex-1 overflow-hidden">
        <Sidebar 
          onSimulate={handleSimulate} 
          status={simulationStatus} 
          selectedLocation={selectedLocation}
          setSelectedLocation={setSelectedLocation}
        />
        <main className="flex-1 relative">
          <MapComponent 
            results={results} 
            selectedLocation={selectedLocation}
            setSelectedLocation={setSelectedLocation}
          />
        </main>
      </div>
    </div>
  );
}

export default App;
