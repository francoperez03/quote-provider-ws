import { KrakenProvider } from "./kraken.provider";
import { Container } from "typedi";


export default async () => {
  Container.set("KrakenProvider", new KrakenProvider());
  console.log("Providers loaded!");
};
