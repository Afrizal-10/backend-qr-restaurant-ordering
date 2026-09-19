import midtransClient from "midtrans-client";
import {env} from "./env";

interface MidtransCoreApi {
  charge(parameter: unknown): Promise<{
    transaction_id: string;
    actions?: {name: string; url: string}[];
  }>;
  transaction: {
    status(orderId: string): Promise<{transaction_status: string}>;
  };
}

export const midtransCore = new midtransClient.CoreApi({
  isProduction: env.midtransIsProduction,
  serverKey: env.midtransServerKey,
  clientKey: env.midtransClientKey,
}) as unknown as MidtransCoreApi;
