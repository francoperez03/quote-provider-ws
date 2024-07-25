import { IQuoteProvider } from '../interfaces/quotes.interface';
import WebSocket from 'ws';
import Tree from "avl";
import { getPairKey } from '../utils/subscription';

const KRAKEN_URL = 'wss://ws.kraken.com';
export class KrakenProvider implements IQuoteProvider {

  private krakenWs: WebSocket | null = null;
  private orderBooksByPair = new Map();

  private cleanup() {
    if (this.krakenWs) {
      this.krakenWs.close();
      this.krakenWs = null;
    }
  }

  private sendRequest = (symbol: string) => {
    this.krakenWs!.send(JSON.stringify({
      event: 'subscribe',
      pair: [symbol],
      subscription: { name: 'book', depth: 10 }
    }));
  }

  private createTree = (base: string, quote: string, data: any) => {
    this.orderBooksByPair.set(getPairKey(base, quote) + "-asks", new Tree());
    this.orderBooksByPair.set(getPairKey(base, quote) + "-bids", new Tree());
    const askTree = this.orderBooksByPair.get(getPairKey(base, quote) + "-asks")
    const bidTree = this.orderBooksByPair.get(getPairKey(base, quote) + "-bids")
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
      const askTree = this.orderBooksByPair.get(getPairKey(base, quote) + "-asks")
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
      const bidTree = this.orderBooksByPair.get(getPairKey(base, quote) + "-bids")
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
    if (this.krakenWs && this.krakenWs.readyState === WebSocket.OPEN) {
      const symbol = `${base}/${quote}`;
      console.log({symbol})
    } else {
      this.krakenWs = new WebSocket(KRAKEN_URL);

      this.krakenWs.on('open', () => {
        const symbol = `${base}/${quote}`;
        this.sendRequest(symbol);
      });

      this.krakenWs.on('message', (data: string) => {
        const dataParsed = JSON.parse(data.toString());
        if (Array.isArray(dataParsed) && dataParsed[1] && dataParsed[1].as) {
          this.createTree(base, quote, dataParsed)
        } else{
          this.updateTree(base, quote, dataParsed)
        }
      });

      this.krakenWs.on('error', (error) => {
        console.log('error', error);
        this.cleanup();
      });

      this.krakenWs.on('close', () => {
        console.log(`Disconnected from Kraken ${base}/${quote}`);
        this.cleanup();
      });
    }
  }

  getQuote(base: string, quote: string, callback: (update: any) => void): void {
    console.log('Get quote provided by Kraken', base, quote);
    const asks: any[] = [];
    const bids: any[] = [];

    const askTree = this.orderBooksByPair.get(getPairKey(base, quote) + "-asks")
    const bidTree = this.orderBooksByPair.get(getPairKey(base, quote) + "-bids")
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
