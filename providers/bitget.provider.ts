import { IQuoteProvider } from '../interfaces/quotes.interface';
import WebSocket from 'ws';
import Tree from "avl";
import { getPairKey } from '../utils/subscription';

const EXCHANGE_URL = 'wss://ws.bitget.com/v2/ws/public';
const SPOT_TYPE = 'SPOT';
const BOOK_DEPTH_15 ='books15';
export class BitgetProvider implements IQuoteProvider {

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
      op:"subscribe",
      args:[
          {
              instType:SPOT_TYPE,
              channel:BOOK_DEPTH_15,
              instId:symbol
          }
      ]
  }));
  }

  private getOrCreateTree(base: string, quote: string, treeType: string) {
    const pairKey = getPairKey(base, quote) + `-${treeType}`
    if (!this.orderBooksByPair.has(pairKey)) {
      this.orderBooksByPair.set(pairKey, new Tree());
    }
    return this.orderBooksByPair.get(pairKey);
  }

  private updateTree = (base: string, quote: string, data: any) => {
    const asks = data.data[0].asks;
    const bids = data.data[0].bids;
    if (asks && asks.length > 0) { 
      const askTree = this.getOrCreateTree(base, quote, '-asks');
      asks.forEach((order: any) => {
        const [price, volume] = order;
        if (parseFloat(volume) === 0) {
          askTree.remove(parseFloat(price));
        } else {
          if(askTree.find(parseFloat(price))) askTree.remove(parseFloat(price));
          askTree.insert(parseFloat(price), { volume: parseFloat(volume) });
        }
      });
    }
    if (bids && bids.length > 0) {
      const bidTree = this.getOrCreateTree(base, quote, '-bids');
      bids.forEach((order: any) => {
        const [price, volume] = order;
        if (parseFloat(volume) === 0) {
          bidTree.remove(parseFloat(price));
        } else {
          if(bidTree.find(parseFloat(price))) bidTree.remove(parseFloat(price));
          bidTree.insert(parseFloat(price), { volume: parseFloat(volume) });
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
        const symbol = `${base}${quote}`;
        this.sendRequest(symbol);
      });

      this.wsClient.on('message', (data: string) => {
        const dataParsed = JSON.parse(data.toString());
        if(dataParsed.action === 'error') throw new Error;
        if(dataParsed.action === 'snapshot') this.updateTree(base, quote, dataParsed);
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
    const asks: any[] = [];
    const bids: any[] = [];

    const askTree = this.getOrCreateTree(base, quote, "-asks")
    const bidTree = this.getOrCreateTree(base, quote, "-bids")
    askTree.forEach((node: any) => {
      asks.push([node.key, node.data.volume]);
    });
    bidTree.forEach((node: any) => {
      bids.push([node.key, node.data.volume]);
    });
    const result = {
      bids: bids.slice(bids.length - 10,bids.length),
      asks: asks.slice(0, 10)
    }
    console.log(result)
    callback("result")
  }

}
