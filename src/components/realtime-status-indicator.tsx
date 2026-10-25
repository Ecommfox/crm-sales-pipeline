import { useEffect, useState } from "react";
import { Activity, Wifi, WifiOff, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { supabaseClient } from "@/lib/supabaseClient";
import { cn } from "@/lib/utils";

export function RealtimeStatusIndicator() {
  const [isConnected, setIsConnected] = useState(false);
  const [statusMessage, setStatusMessage] = useState("checking...");

  useEffect(() => {
    // Check Supabase realtime connection
    const checkConnection = async () => {
      try {
        // First check if we can query the database
        const { data, error } = await supabaseClient.from("leads").select("id").limit(1);
        
        if (error) {
          setIsConnected(false);
          setStatusMessage("DB Error");
          console.error("Database connection error:", error);
          return;
        }

        // Check realtime channel status
        const channel = supabaseClient.channel("public_realtime_check");
        
        channel.subscribe((status: any) => {
          console.log("Realtime subscription status:", status);
          if (status === "SUBSCRIBED") {
            setIsConnected(true);
            setStatusMessage("Connecté");
          } else if (status === "CLOSED" || status === "CHANNEL_ERROR") {
            setIsConnected(false);
            setStatusMessage("Disconnected");
          }
        });

        // Cleanup
        return () => {
          supabaseClient.removeChannel(channel);
        };
      } catch (err: any) {
        setIsConnected(false);
        setStatusMessage(`Error: ${err.message}`);
        console.error("Connection check error:", err);
      }
    };

    checkConnection();

    // Periodic recheck
    const interval = setInterval(checkConnection, 10000);
    return () => clearInterval(interval);
  }, []);

  const getIcon = () => {
    if (isConnected) {
      return <Wifi className={cn("h-3.5 w-3.5 text-green-600 animate-pulse")} />;
    }
    return <WifiOff className="h-3.5 w-3.5 text-red-600" />;
  };

  const getBadgeClass = () => {
    if (isConnected) {
      return "bg-green-50 text-green-700 border-green-200";
    }
    return "bg-red-50 text-red-700 border-red-200";
  };

  return (
    <div className="flex items-center gap-2" title={statusMessage}>
      {getIcon()}
      <Badge variant="outline" className={getBadgeClass()}>
        <Activity className="h-2.5 w-2.5 mr-1" />
        {statusMessage}
      </Badge>
    </div>
  );
}
