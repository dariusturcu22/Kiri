import * as signalR from "@microsoft/signalr";

let connection: signalR.HubConnection | null = null;

const hubUrl = `${process.env.NEXT_PUBLIC_API_URL}/hubs/chat`;

export function getChatConnection(): signalR.HubConnection {
  if (!connection) {
    connection = new signalR.HubConnectionBuilder()
      .withUrl(hubUrl, { withCredentials: true })
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
