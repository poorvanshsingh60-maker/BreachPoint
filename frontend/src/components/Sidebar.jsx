import React, { useState } from 'react';

const Sidebar = ({ onSimulate, status, selectedLocation, setSelectedLocation }) => {
  const [params, setParams] = useState({
    breachWidth: 150,
    breachTime: 0.1,
    waterLevel: 100,
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setParams({ ...params, [name]: value });
  };

  const handleLocationChange = (e) => {
    const { name, value } = e.target;
    setSelectedLocation({ ...selectedLocation, [name]: parseFloat(value) || 0 });
  };

  const applyPreset = (presetType) => {
    if (presetType === 'worst') {
      setParams({ breachWidth: 150, breachTime: 0.1, waterLevel: 100 });
    } else if (presetType === 'gradual') {
      setParams({ breachWidth: 60, breachTime: 3.0, waterLevel: 50 });
    } else if (presetType === 'minor') {
      setParams({ breachWidth: 15, breachTime: 1.5, waterLevel: 20 });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSimulate(params);
  };

  return (
    <div className="w-96 bg-gray-50 border-r p-4 flex flex-col shadow-inner overflow-y-auto">
      <h2 className="text-lg font-semibold mb-4 text-gray-700 border-b pb-2">Simulation Parameters</h2>
      
      <form onSubmit={handleSubmit} className="flex-1 flex flex-col space-y-5">
        
        {/* Location Section */}
        <div className="bg-blue-50 p-3 rounded border border-blue-100">
          <label className="block text-sm font-bold text-blue-800 mb-2">1. Target Location</label>
          <div className="flex space-x-2">
            <div className="flex-1">
              <label className="block text-xs text-gray-500 mb-1">Latitude</label>
              <input 
                type="number" name="lat" value={selectedLocation.lat.toFixed(4)} onChange={handleLocationChange} step="0.0001"
                className="w-full border border-gray-300 rounded p-1 text-sm bg-white"
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs text-gray-500 mb-1">Longitude</label>
              <input 
                type="number" name="lng" value={selectedLocation.lng.toFixed(4)} onChange={handleLocationChange} step="0.0001"
                className="w-full border border-gray-300 rounded p-1 text-sm bg-white"
              />
            </div>
          </div>
          <p className="text-xs text-blue-600 mt-2 italic">Click anywhere on the map to pinpoint a dam or river blockage.</p>
        </div>

        {/* Presets Section */}
        <div>
          <label className="block text-sm font-bold text-gray-800 mb-2">2. Quick Scenarios</label>
          <div className="grid grid-cols-3 gap-2">
            <button type="button" onClick={() => applyPreset('worst')} className="text-xs bg-red-100 text-red-700 border border-red-200 py-1 px-2 rounded hover:bg-red-200 transition">
              Worst-Case (Instant)
            </button>
            <button type="button" onClick={() => applyPreset('gradual')} className="text-xs bg-yellow-100 text-yellow-700 border border-yellow-200 py-1 px-2 rounded hover:bg-yellow-200 transition">
              Earth Dam (Gradual)
            </button>
            <button type="button" onClick={() => applyPreset('minor')} className="text-xs bg-green-100 text-green-700 border border-green-200 py-1 px-2 rounded hover:bg-green-200 transition">
              Minor Overtopping
            </button>
          </div>
        </div>

        <div className="border-t pt-4">
          <label className="block text-sm font-bold text-gray-800 mb-3">3. Fine-Tune Physics</label>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1 flex justify-between">
              Breach Width (meters) 
              <span className="text-gray-400 text-xs" title="How wide the hole in the dam is.">ⓘ</span>
            </label>
            <input 
              type="number" name="breachWidth" value={params.breachWidth} onChange={handleChange} min="5"
              className="w-full border border-gray-300 rounded p-2 text-sm focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">Width of the gap created when the dam fails.</p>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1 flex justify-between">
              Time of Failure (hours)
              <span className="text-gray-400 text-xs" title="Time taken for the breach to reach its maximum width.">ⓘ</span>
            </label>
            <input 
              type="number" name="breachTime" value={params.breachTime} onChange={handleChange} step="0.1" min="0.1"
              className="w-full border border-gray-300 rounded p-2 text-sm focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">0.1 = Instant collapse. 3.0 = Slow erosion.</p>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1 flex justify-between">
              Initial Water Level (meters)
              <span className="text-gray-400 text-xs" title="Depth of the reservoir before the breach.">ⓘ</span>
            </label>
            <input 
              type="number" name="waterLevel" value={params.waterLevel} onChange={handleChange} min="1"
              className="w-full border border-gray-300 rounded p-2 text-sm focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">Depth of the water trapped behind the dam.</p>
          </div>
        </div>

        <div className="mt-auto pt-4">
          <button 
            type="submit" 
            disabled={status === 'running' || status === 'pending'}
            className={`w-full py-3 px-4 rounded text-white font-bold shadow-sm ${status === 'running' || status === 'pending' ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
          >
            {status === 'running' || status === 'pending' ? 'Calculating Flood Extent...' : 'Run Simulation'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default Sidebar;
