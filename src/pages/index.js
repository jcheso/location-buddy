import React from "react";
import LocationBuddy from "../components/LocationBuddy";
import SearchEngineOptimisation from "../components/SearchEngineOptimisation";

function App() {
  return (
    <main className="flex flex-col justify-between h-screen">
      <SearchEngineOptimisation></SearchEngineOptimisation>
      <LocationBuddy></LocationBuddy>
    </main>
  );
}

export default App;
