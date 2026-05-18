import * as signalR from "@microsoft/signalr";

let connection: signalR.HubConnection | null = null;

function getHubUrl(): string {
  // Route through the Next.js server (/hubs/* → http://localhost:5046/hubs/* via
  // the Route Handler at app/hubs/[...path]/route.ts). This means the browser
  // only talks to the trusted Next.js cert — no direct backend cert needed on mobile.
  if (typeof window === "undefined") return "http://localhost:5046/hubs/chat";
  return `${window.location.origin}/hubs/chat`;
}

export function getChatConnection(): signalR.HubConnection {
  if (!connection) {
    connection = new signalR.HubConnectionBuilder()
      .withUrl(getHubUrl(), {
        withCredentials: true,
        // Force Long Polling so all traffic is plain HTTP requests through the
        // Next.js proxy. WebSocket upgrades can't be proxied by Route Handlers.
        transport: signalR.HttpTransportType.LongPolling,
      })
      .withAutomaticReconnect()
      .build();
  }
  return connection;
}

export async function startChatConnection(): Promise<void> {
  const conn = getChatConnection();
  if (conn.state === signalR.HubConnectionState.Disconnected) {
    await conn.start();
  }
}

export async function stopChatConnection(): Promise<void> {
  if (connection?.state === signalR.HubConnectionState.Connected) {
    await connection.stop();
  }
}
