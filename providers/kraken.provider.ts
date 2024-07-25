import { IQuoteProvider } from '../interfaces/quotes.interface';
import WebSocket from 'ws';
import Tree from "avl";
import { getPairKey } from '../utils/subscription';

const EXCHANGE_URL = 'wss://ws.kraken.com';
const ASKS_SUFFIX = '-asks'
const BIDS_SUFFIX = '-bids'
const SUBSCRIBE_EVENT = 'subscribe'
export class KrakenProvider implements IQuoteProvider {

  private wsClient: WebSocket | null = null;
  private orderBooksByPair = new Map();

  private cleanup() {
    if (this.wsClient) {
      this.wsClient.close();
      this.wsClient = null;
    }
  }

  private sendRequest = (symbol: string) => {
    this.wsClient!.send(JSON.stringify({
      event: SUBSCRIBE_EVENT,
      pair: [symbol],
      subscription: { name: 'book', depth: 10 }
    }));
  }

  private createTree = (base: string, quote: string, data: any) => {
    this.orderBooksByPair.set(getPairKey(base, quote) + ASKS_SUFFIX, new Tree());
    this.orderBooksByPair.set(getPairKey(base, quote) + BIDS_SUFFIX, new Tree());
    const askTree = this.orderBooksByPair.get(getPairKey(base, quote) + ASKS_SUFFIX)
    const bidTree = this.orderBooksByPair.get(getPairKey(base, quote) + BIDS_SUFFIX)
    const asks = data[1].as
    const bids = data[1].bs
    for (const askOrder of asks) {
      const [price, volume, timestamp] = askOrder;
      askTree.insert(parseFloat(price), {volume: parseFloat(volume), timestamp})
    }
    for (const bidOrder of bids) {
      const [price, volume, timestamp] = bidOrder;
      bidTree.insert(parseFloat(price), {volume: parseFloat(volume), timestamp})
    }
    return true
  }

  private updateTree = (base: string, quote: string, data: any) => {
    if (data.a) { 
      const askTree = this.orderBooksByPair.get(getPairKey(base, quote) + ASKS_SUFFIX)
      data.a.forEach((order: any) => {
        const [price, volume, timestamp] = order;
        if (parseFloat(volume) === 0) {
          askTree.remove(parseFloat(price));
        } else {
          if(askTree.find(parseFloat(price))) askTree.remove(parseFloat(price));
          askTree.insert(parseFloat(price), { volume: parseFloat(volume), timestamp });
        }
      });
    }
    if (data.b) {
      const bidTree = this.orderBooksByPair.get(getPairKey(base, quote) + BIDS_SUFFIX)
      data.b.forEach((order: any) => {
        const [price, volume, timestamp] = order;
        if (parseFloat(volume) === 0) {
          bidTree.remove(parseFloat(price));
        } else {
          if(bidTree.find(parseFloat(price))) bidTree.remove(parseFloat(price));
          bidTree.insert(parseFloat(price), { volume: parseFloat(volume), timestamp });
        }
      });
    }
  }

  subscribe(base: string, quote: string) {
    if (this.wsClient && this.wsClient.readyState === WebSocket.OPEN) {
      const symbol = `${base}/${quote}`;
      console.log({symbol})
    } else {
      this.wsClient = new WebSocket(EXCHANGE_URL);

      this.wsClient.on('open', () => {
        const symbol = `${base}/${quote}`;
        this.sendRequest(symbol);
      });

      this.wsClient.on('message', (data: string) => {
        const dataParsed = JSON.parse(data.toString());
        if (Array.isArray(dataParsed) && dataParsed[1] && dataParsed[1].as) {
          this.createTree(base, quote, dataParsed)
        } else{
          this.updateTree(base, quote, dataParsed)
        }
      });

      this.wsClient.on('error', (error) => {
        console.log('error', error);
        this.cleanup();
      });

      this.wsClient.on('close', () => {
        console.log(`Disconnected from Kraken ${base}/${quote}`);
        this.cleanup();
      });
    }
  }

  getQuote(base: string, quote: string, callback: (update: any) => void): void {
    console.log('Get quote provided by Kraken', base, quote);
    const asks: any[] = [];
    const bids: any[] = [];

    const askTree = this.orderBooksByPair.get(getPairKey(base, quote) + ASKS_SUFFIX)
    const bidTree = this.orderBooksByPair.get(getPairKey(base, quote) + BIDS_SUFFIX)
    askTree.forEach((node: any) => {
      asks.push([node.key, node.data.volume]);
    });
    bidTree.forEach((node: any) => {
      bids.push([node.key, node.data.volume]);
    });

    const result = {
      bids,
      asks
    }
    console.log(result)
    callback(result)
  }

}
