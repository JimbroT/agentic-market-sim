"use client";

import { ExploreCanvas } from "./explore-canvas";
import { PromptEntryScreen } from "./components/prompt-entry-screen";
import { useSimulation } from "./hooks/use-simulation";

export default function ExplorePage() {
  const {
    world,
    participants,
    latestAgentInsights,
    entities,
    loading,
    error,
    initializeSimulation,
    addRound,
  } = useSimulation();

  if (!world) {
    return (
      <PromptEntryScreen
        loading={loading}
        error={error}
        onSubmit={(prompt) => initializeSimulation(prompt)}
      />
    );
  }

  return (
    <ExploreCanvas
      entities={entities}
      participants={participants}
      world={world}
      latestAgentInsights={latestAgentInsights}
      loading={loading}
      error={error}
      onAddRound={(userEvent) => addRound(userEvent)}
    />
  );
}
