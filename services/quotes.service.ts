import { Service } from "typedi";


@Service()
export class QuoteService {
  constructor(

  ) {}

  async subscribe(exchange: string, base: string, quote: string ) {
    try {
      const symbol = `${base}/${quote}`;
      const clientId = `${exchange}-${symbol}`;
      console.log("Client Subscribed")
      return clientId;
    } catch (e) {
      console.error((e as Error).message);
      return false;
    }
  }
}