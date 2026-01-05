import { useEffect, useRef, useState } from 'react';
import { createWebSocketConnection } from '@/lib/api';

export function useWebSocket(classId: string | null, onMessage?: (data: any) => void) {
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<ReturnType<typeof createWebSocketConnection> | null>(null);

  useEffect(() => {
    if (!classId) return;

    const connection = createWebSocketConnection(classId, (data) => {
      if (data.type === 'connected') {
        setIsConnected(true);
      } else if (data.type === 'vote_submitted') {
        onMessage?.(data);
      }
    });

    wsRef.current = connection;

    return () => {
      connection.close();
      setIsConnected(false);
    };
  }, [classId, onMessage]);

  return {
    isConnected,
    send: (data: any) => wsRef.current?.send(data),
  };
}









