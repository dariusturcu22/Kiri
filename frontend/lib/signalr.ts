import * as signalR from "@microsoft/signalr";

let connection: signalR.HubConnection | null = null;

// Connect directly to the Render backend for SignalR — the Vercel proxy
// (Route Handlers) cannot upgrade WebSocket connections, and the hubs proxy
// had localhost hardcoded anyway. Connecting directly also lets us pass the
// JWT via accessTokenFactory so SignalR can authenticate the user.
function getHubUrl(): string {
  if (typeof window === "undefined") return "http://localhost:5046/hubs/chat";
  const backendUrl =
    process.env.NEXT_PUBLIC_BACKEND_URL ?? "https://kiri-fd5j.onrender.com";
  return `${backendUrl}/hubs/chat`;
}

export function getChatConnection(): signalR.HubConnection {
  if (!connection) {
    connection = new signalR.HubConnectionBuilder()
      .withUrl(getHubUrl(), {
        withCredentials: true,
        // Long Polling is required on Render's free tier (WebSocket is not
        // supported without a paid plan / persistent connection).
        transport: signalR.HttpTransportType.LongPolling,
        // Send the JWT so the hub can authenticate the caller even when
        // cross-domain cookies are blocked.
        accessTokenFactory: () => localStorage.getItem("kiri_token") ?? "",
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
