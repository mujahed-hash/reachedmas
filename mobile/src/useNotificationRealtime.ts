import { useEffect } from "react";
import { useAudioPlayer } from "expo-audio";
import { realtimeService } from "./RealtimeService";

export function useNotificationRealtime(onNewNotification?: (n: any) => void) {
    const urgentPlayer = useAudioPlayer(require("../assets/alert-urgent.wav"));
    const softPlayer = useAudioPlayer(require("../assets/alert-soft.wav"));

    useEffect(() => {
        const unsubscribe = realtimeService.subscribe((data) => {
            // Play sound locally in the hook (so we can use useAudioPlayer)
            const isUrgent = ["EMERGENCY", "TOW_ALERT", "CALL"].includes(data.type);
            if (isUrgent) {
                urgentPlayer.play();
            } else {
                softPlayer.play();
            }

            // Callback to update UI
            onNewNotification?.(data);
        });

        return () => unsubscribe();
    }, [onNewNotification, urgentPlayer, softPlayer]);
}
