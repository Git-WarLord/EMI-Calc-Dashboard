import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import { useQueryClient } from "@tanstack/react-query";

const STORAGE_KEY = "emi_tracker_state";

export function DataSync() {
  const [isInitialized, setIsInitialized] = useState(false);
  const syncMutation = trpc.system.syncState.useMutation();
  const queryClient = useQueryClient();

  // Load from local storage on mount
  useEffect(() => {
    const savedState = localStorage.getItem(STORAGE_KEY);
    if (savedState) {
      try {
        const parsedState = JSON.parse(savedState);
        // Only sync if there's actually data
        if (parsedState.loans && parsedState.loans.length > 0) {
          syncMutation.mutate(parsedState, {
            onSuccess: () => {
              queryClient.invalidateQueries();
            },
          });
        }
      } catch (e) {
        console.error("Failed to parse saved state", e);
      }
    }
    setIsInitialized(true);
  }, []);

  // Set up polling to save state to local storage
  const { data: fullState } = trpc.system.getFullState.useQuery(undefined, {
    enabled: isInitialized,
    refetchInterval: 5000, // Fetch every 5 seconds to backup
  });

  useEffect(() => {
    if (fullState) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(fullState));
    }
  }, [fullState]);

  return null;
}
