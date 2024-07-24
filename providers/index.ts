import { KrakenProvider } from "./kraken.provider";
import { BitgetProvider } from "./bitget.provider";
import { Container } from "typedi";


export default async () => {
  Container.set("KrakenProvider", new KrakenProvider());
  Container.set("BitgetProvider", new BitgetProvider());
  console.log("Providers loaded!");
};
