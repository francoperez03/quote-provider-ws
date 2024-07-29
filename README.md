# WebSocket Quote Provider

Este proyecto es un servidor WebSocket que permite suscripciones a actualizaciones de order book de diferentes exchanges (Kraken y Bitget). Los clientes pueden suscribirse y desuscribirse de pares específicos y recibir actualizaciones periodicas del estado de diferentes orderbooks.

## Requisitos

- Node.js
- npm (Node Package Manager)

## Instalación y ejecución

```json
npm install
npm run dev
```

El servidor WebSocket se ejecutará en ws://localhost:81.

## Uso con Postman
### Conexión al servidor WebSocket
Abre Postman.
Haz clic en el botón "New" y selecciona "WebSocket Request".
En el campo de URL, introduce localhost:80 y haz clic en "Connect".
Suscripción a un par
Para suscribirte a un par, envía el siguiente mensaje en formato JSON:

```json
{
  "action": "subscribe",
  "exchange": "kraken",  // o "bitget"
  "base": "BTC",
  "quote": "USDT"
}
```
Desuscripción de un par
Para desuscribirte de un par, envía el siguiente mensaje en formato JSON:

```json
{
  "action": "unsubscribe",
  "exchange": "kraken",  // o "bitget"
  "base": "BTC",
  "quote": "USDT"
}
```
### Recibir actualizaciones
Una vez suscrito, recibirás actualizaciones del order book en tiempo real en formato JSON. Ejemplo de respuesta:

```json
{
  "exchange": "kraken",
  "base": "BTC",
  "quote": "USDT",
  "bids": [
    [ 69660.83, 0.004826 ],
    [ 69660.98, 0.004632 ],
    ...
  ],
  "asks": [
    [ 69669.04, 0.57915 ],
    [ 69669.33, 0.033 ],
    ...
  ],

}

Tambien en log logs de la api, quedan impresos el resultado enviado
```
## Estructura del Proyecto
```json
quote-provider-ws
│
├── services/
│      └── quotes.service.ts
│
│── interfaces/
│      └── quotes.interface.ts
│      └── subscriptions.interface.ts
│
│── providers/
│     ├── kraken.provider.ts
│     ├── bitget.provider.ts
│     └── index.ts
│
├── utils
│
├── app.ts
│
├── package.json
│
└── tsconfig.json
```
