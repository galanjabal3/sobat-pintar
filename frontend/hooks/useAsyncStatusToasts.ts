import { useEffect, useRef } from "react";

type AsyncStatus = "processing" | "completed" | "failed";

type AsyncStatusItem = {
  id?: string;
  status?: AsyncStatus;
  title?: string;
};

interface UseAsyncStatusToastsOptions {
  completedMessage: (item: AsyncStatusItem) => string;
  failedMessage: (item: AsyncStatusItem) => string;
  onStatusSettled?: () => void;
  showToast: (message: string, type: "success" | "error") => void;
}

export function useAsyncStatusToasts(
  items: AsyncStatusItem[],
  options: UseAsyncStatusToastsOptions
) {
  const { completedMessage, failedMessage, onStatusSettled, showToast } = options;
  const previousStatusesRef = useRef<Map<string, AsyncStatus>>(new Map());
  const hasSeenInitialItemsRef = useRef(false);

  useEffect(() => {
    const nextStatuses = new Map<string, AsyncStatus>();

    for (const item of items) {
      if (!item.id || !item.status) continue;

      nextStatuses.set(item.id, item.status);

      if (!hasSeenInitialItemsRef.current) continue;

      const previousStatus = previousStatusesRef.current.get(item.id);
      if (previousStatus !== "processing" || item.status === "processing") continue;

      onStatusSettled?.();
      if (item.status === "completed") {
        showToast(completedMessage(item), "success");
      } else if (item.status === "failed") {
        showToast(failedMessage(item), "error");
      }
    }

    previousStatusesRef.current = nextStatuses;
    hasSeenInitialItemsRef.current = true;
  }, [completedMessage, failedMessage, items, onStatusSettled, showToast]);
}
