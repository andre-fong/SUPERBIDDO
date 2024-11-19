import { Response } from "express";

const pendingLpRequests: { [key: string]: Response[] } = {};

export function addLpClient(reqId: string, client: Response) {
  if (!pendingLpRequests[reqId]) {
    pendingLpRequests[reqId] = [];
  }
  pendingLpRequests[reqId].push(client);
}

export function removeLpClient(reqId: string, client: Response) {
  pendingLpRequests[reqId] = pendingLpRequests[reqId].filter(
    (c) => c !== client
  );
}

export function closeLpRequest(
  reqId: string,
  closeFn: (client: Response) => void
) {
  if (!pendingLpRequests[reqId]) {
    return;
  }
  pendingLpRequests[reqId].forEach((client) => closeFn(client));
  delete pendingLpRequests[reqId];
}
