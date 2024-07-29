# WebSocket Quote Provider

Este proyecto es un servidor WebSocket que permite suscripciones a actualizaciones de order book de diferentes exchanges (Kraken y Bitget). Los clientes pueden suscribirse y desuscribirse de pares específicos y recibir actualizaciones periodicas del estado de diferentes orderbooks.

## Requisitos

- Node.js
- npm (Node Package Manager)

## Instalación y ejecución

```plaintext
npm install
npm run dev
```

El servidor WebSocket se ejecutará en ws://localhost:443.

## Uso con Postman
### Conexión al servidor WebSocket
Abre Postman.
Haz clic en el botón "New" y selecciona "WebSocket Request".
En el campo de URL, introduce localhost:443 y haz clic en "Connect".
### Suscripción a un par
Para suscribirte a un par, envía el siguiente mensaje en formato JSON:

```json
{
  "action": "subscribe",
  "exchange": "kraken",
  "base": "BTC",
  "quote": "USDT"
}
```
### Desuscripción de un par
Para desuscribirte de un par, envía el siguiente mensaje en formato JSON:

```json
{
  "action": "unsubscribe",
  "exchange": "kraken",
  "base": "BTC",
  "quote": "USDT"
}
```
### Recibir actualizaciones
Una vez suscrito, recibirás actualizaciones del order book en tiempo real en formato JSON. Ejemplo de respuesta:

```json
{
    "exchange": "bitget",
    "base": "BTC",
    "quote": "USDT",
    "bids": [
        [69669.08, 0.028768],
        [69669.43, 0.016731],
        [69669.44, 0.000184],
        [69669.45, 0.000184],
        [69669.47, 0.000184],
        [69669.48, 0.12],
        [69669.78, 0.028767],
        [69670.13, 0.029978],
        [69670.83, 0.017942],
        [69674.31, 0.110322]
    ],
    "asks": [
        [69674.32, 0.066077],
        [69677.46, 0.002517],
        [69677.74, 0.003493],
        [69677.8, 0.001438],
        [69677.86, 0.004937],
        [69678.85, 0.002157],
        [69679.2, 0.011779],
        [69679.55, 0.011779],
        [69679.56, 0.12],
        [69679.57, 0.007391]
    ]
}

```
Tambien en log logs de la api, quedan impresos el resultado enviado

## Estructura del Proyecto
```plaintext
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
