import WebSocket from 'ws';

const wsServer = new WebSocket.Server({ port: 81 });


wsServer.on('connection', (ws: WebSocket) => {
  console.log('New client connected');

  ws.on('message', (message: string) => {
    const { action, exchange, base, quote } = JSON.parse(message);

    if (action === 'subscribe') {
      const symbol = `${base}/${quote}`;
      const clientId = `${exchange}-${symbol}`;
      console.log("Subscribed!")

      ws.on('close', () => {
        console.log("Disconnected!")
      });
    }
  });
});

console.log('WebSocket server started on ws://localhost:81');