import React from "react";
import LocationBuddy from "../components/LocationBuddy";
import SearchEngineOptimisation from "../components/SearchEngineOptimisation";

function App() {
  return (
    <main className="flex flex-col justify-between h-screen">
      <SearchEngineOptimisation title="LocationBuddy"></SearchEngineOptimisation>
      <LocationBuddy></LocationBuddy>
    </main>
  );
}

export default App;
