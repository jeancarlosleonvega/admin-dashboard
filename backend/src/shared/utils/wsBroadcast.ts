interface WsClient {
  readyState: number;
  send: (data: string) => void;
}

const WS_OPEN = 1;
const clients = new Set<WsClient>();

export function addWsClient(ws: WsClient) {
  clients.add(ws);
}

export function removeWsClient(ws: WsClient) {
  clients.delete(ws);
}

export function broadcast(event: string, payload?: unknown) {
  const message = JSON.stringify({ event, payload });
  for (const client of clients) {
    if (client.readyState === WS_OPEN) {
      client.send(message);
    }
  }
}
