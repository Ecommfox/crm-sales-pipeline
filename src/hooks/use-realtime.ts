import { useEffect, useState, useRef } from "react";
import { supabaseClient } from "@/lib/supabaseClient";
import type { RealtimeChannel } from "@supabase/supabase-js";

interface SubscriptionOptions {
  schema?: string;
  table: string;
  event?: "*" | "INSERT" | "UPDATE" | "DELETE";
  onInsert?: (payload: any) => void;
  onUpdate?: (payload: any) => void;
  onDelete?: (payload: any) => void;
}

interface UseRealtimeResult {
  isConnected: boolean;
  isSubscribed: boolean;
  unsubscribe: () => void;
}

/**
 * Hook for subscribing to Supabase real-time updates
 * Automatically handles connection lifecycle
 */
export function useRealtime(options: SubscriptionOptions): UseRealtimeResult {
  const { schema = "public", table, event = "*", onInsert, onUpdate, onDelete } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    const setupSubscription = async () => {
      try {
        // Create channel name
        const channelName = `${schema}:${table}`;

        // Subscribe to changes
        const newChannel = supabaseClient.channel(channelName).on(
          "postgres_changes",
          {
            event: event as any,
            schema,
            table,
          },
          (payload) => {
            console.log(`[${table}] Real-time update:`, payload);

            if (payload.eventType === "INSERT" && onInsert) {
              onInsert(payload.new);
            } else if (payload.eventType === "UPDATE" && onUpdate) {
              onUpdate(payload.new);
            } else if (payload.eventType === "DELETE" && onDelete) {
              onDelete(payload.old);
            }
          }
        );

        channelRef.current = newChannel;

        // Subscribe
        await newChannel.subscribe((status) => {
          /* console.log(`[${table}] Subscription status:`, status); */
          setIsConnected(status === "SUBSCRIBED");
          if (status === "SUBSCRIBED") {
            setIsSubscribed(true);
          }
        });
      } catch (error) {
        console.error(`Failed to subscribe to ${table}:`, error);
        setIsConnected(false);
      }
    };

    setupSubscription();

    // Cleanup on unmount
    return () => {
      if (channelRef.current) {
        supabaseClient.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [table, schema, event, onInsert, onUpdate, onDelete]);

  const unsubscribe = () => {
    if (channelRef.current) {
      supabaseClient.removeChannel(channelRef.current);
      channelRef.current = null;
      setIsSubscribed(false);
      setIsConnected(false);
    }
  };

  return { isConnected, isSubscribed, unsubscribe };
}

/**
 * Hook for managing multiple real-time subscriptions
 */
export function useRealtimeMultiple(
  subscriptions: SubscriptionOptions[]
): { isConnected: boolean; activeSubscriptions: number } {
  const [activeSubscriptions, setActiveSubscriptions] = useState(0);

  const results = subscriptions.map((sub) => useRealtime(sub));

  useEffect(() => {
    const connected = results.filter((r) => r.isConnected).length;
    setActiveSubscriptions(connected);
  }, [results]);

  const isConnected = results.some((r) => r.isConnected);

  return { isConnected, activeSubscriptions };
}
