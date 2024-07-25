import WebSocket from 'ws';

export interface Subscription {
  clients: Set<WebSocket>;
  intervalId: NodeJS.Timeout | null;
}

export interface Subscriptions {
  [key: string]: Subscription;
}
