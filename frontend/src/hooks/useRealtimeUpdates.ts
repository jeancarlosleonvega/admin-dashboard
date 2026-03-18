import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useAuthStore } from '@stores/authStore';

export function useRealtimeUpdates() {
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated) return;

    const wsUrl = (import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api')
      .replace(/^http/, 'ws')
      .replace(/\/api$/, '') + '/api/ws';
    let ws: WebSocket;
    let reconnectTimeout: ReturnType<typeof setTimeout>;
    let destroyed = false;

    function connect() {
      ws = new WebSocket(wsUrl);

      ws.onmessage = (e) => {
        try {
          const { event, payload } = JSON.parse(e.data);
          if (event === 'slots:invalidate') {
            queryClient.invalidateQueries({ queryKey: ['slots'] });
            queryClient.invalidateQueries({ queryKey: ['reports', 'dashboard'] });
            queryClient.invalidateQueries({ queryKey: ['bookings'] });
            const message = payload?.source ?? 'Disponibilidad actualizada';
            toast(message, {
              icon: '🔄',
              duration: 4000,
              style: { fontSize: '0.875rem' },
            });
          }
        } catch {
          // ignorar mensajes malformados
        }
      };

      ws.onclose = () => {
        if (!destroyed) {
          reconnectTimeout = setTimeout(connect, 3000);
        }
      };
    }

    connect();

    return () => {
      destroyed = true;
      clearTimeout(reconnectTimeout);
      ws?.close();
    };
  }, [isAuthenticated, queryClient]);
}
