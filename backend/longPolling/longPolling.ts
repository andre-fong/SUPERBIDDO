import { Response } from "express";
import { LpTypes } from "../types/lpTypes";
import { handleCloseAuctionRequest } from "./auctionLongPolling";

const pendingLpRequests: {
  [key: string]: { clients: Response[]; type: LpTypes };
} = {};

export function addLpClient(reqId: string, client: Response) {
  if (!pendingLpRequests[reqId]) {
    pendingLpRequests[reqId] = { clients: [], type: LpTypes.AUCTION };
  }
  pendingLpRequests[reqId].clients.push(client);
}

export function removeLpClient(reqId: string, client: Response) {
  // will this work? aren't these objects
  console.log("removeLpClient: ", reqId, client);
  console.log(
    "pendingLpRequests[reqId].clients before: ",
    pendingLpRequests[reqId].clients
  );
  pendingLpRequests[reqId].clients = pendingLpRequests[reqId].clients.filter(
    (c) => c !== client
  );
  console.log(
    "pendingLpRequests[reqId].clients after: ",
    pendingLpRequests[reqId].clients
  );
}

export function closeLpRequest(reqId: string) {
  if (!pendingLpRequests[reqId]) {
    return;
  }
  switch (pendingLpRequests[reqId].type) {
    case LpTypes.AUCTION:
      handleCloseAuctionRequest(reqId, pendingLpRequests[reqId].clients);
  }
  delete pendingLpRequests[reqId];
}
