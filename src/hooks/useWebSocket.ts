import { useEffect, useRef, useCallback } from 'react';
import { mockWsConnect, mockWsDisconnect, mockWsSubscribe, mockWsUnsubscribe } from '../services/mockApi';

/**
 * A custom hook to manage a WebSocket-like subscription for real-time updates.
 * It establishes a single connection and manages subscriptions to different topics as they change.
 * @param topic - The topic to subscribe to (e.g., 'chat_user1_user2'). Can be null.
 * @param onMessage - A callback function to execute when a message for the topic is received.
 */
export const useWebSocket = (topic: string | null, onMessage: (message: any) => void) => {
    // Generate a unique client ID that persists for the lifetime of the component.
    const clientIdRef = useRef<string>(`ws_client_${Date.now()}_${Math.random()}`);
    // Keep track of the current topic to handle unsubscribing.
    const currentTopicRef = useRef<string | null>(null);
    // Use a ref to store the latest onMessage callback to avoid re-triggering effects.
    const onMessageRef = useRef(onMessage);

    useEffect(() => {
        onMessageRef.current = onMessage;
    }, [onMessage]);
    
    // Effect to manage the connection lifecycle (connect on mount, disconnect on unmount).
    useEffect(() => {
        const clientId = clientIdRef.current;
        
        const handleIncomingMessage = (message: any) => {
            onMessageRef.current(message);
        };
        
        mockWsConnect(clientId, handleIncomingMessage);
        
        return () => {
            mockWsDisconnect(clientId);
        };
    }, []);
    
    // Effect to manage topic subscriptions whenever the topic prop changes.
    useEffect(() => {
        const clientId = clientIdRef.current;
        
        // Unsubscribe from the old topic if it exists.
        if (currentTopicRef.current) {
            mockWsUnsubscribe(clientId, currentTopicRef.current);
        }
        
        // Subscribe to the new topic if it is provided.
        if (topic) {
            mockWsSubscribe(clientId, topic);
            currentTopicRef.current = topic;
        }

    }, [topic]);
};