import * as signalR from "@microsoft/signalr";

let connection: signalR.HubConnection | null = null;

function getHubUrl(): string {
  // Build the hub URL based on the current page's protocol and hostname.
  // HTTPS frontend → backend HTTPS port 5045
  // HTTP  frontend → backend HTTP  port 5046
  const isHttps =
    typeof window !== "undefined" && window.location.protocol === "https:";
  const protocol = isHttps ? "https" : "http";
  const port = isHttps ? "5045" : "5046";
  const hostname =
    typeof window !== "undefined" ? window.location.hostname : "localhost";
  return `${protocol}://${hostname}:${port}/hubs/chat`;
}

export function getChatConnection(): signalR.HubConnection {
  if (!connection) {
    connection = new signalR.HubConnectionBuilder()
      .withUrl(getHubUrl(), { withCredentials: true })
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
