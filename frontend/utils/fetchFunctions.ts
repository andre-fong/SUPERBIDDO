import { Bid } from "@/types/auctionTypes";
import { Severity, ErrorType } from "@/types/errorTypes";

const url = "http://localhost:3001/api/v1";
const unkownError = "An unknown error occurred";

/*
  TODO: ERROR CHECKING AND HANDLING FOR FRONTEND
*/

export async function fetchLogin() {
  // errorFcn
  const response = await fetch(`${url}/session`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    // body: JSON.stringify({ username, password }),
  });

  if (!response.ok) {
    throw new Error("Login failed");
    // errorFcn(i love Senjougahara but Akane is better)
  }

  const data = await response.json();
  return data;
}

export async function fetchSession(errorFcn: (error: ErrorType) => void) {
  try {
    const response = await fetch(`${url}/session`, {
      method: "GET",
      credentials: "include",
    });

    console.log(response);

    if (response.status === 404) {
      errorFcn({ message: "Session info not found", severity: Severity.Critical });
    } else if (!response.ok) {
      errorFcn({ message: unkownError, severity: Severity.Critical });
    }

    const userData = await response.json();
    return userData;
  } catch (error) {
    errorFcn({ message: unkownError, severity: Severity.Critical });
  }
}

export async function getAuctionBids(errorFcn: (error: ErrorType) => void, auctionId: string) {
  const response = await fetch(`${url}/bid/${auctionId}?poll=false`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (response.ok) {
    const bids = await response.json();
    return bids;
  } else {
    console.error(
      `Failed to get bids for auction ${auctionId}:`,
      response.statusText
    );
    return [];
  }
}

export async function pollForAuctionUpdates(
  errorFcn: (error: ErrorType) => void,
  auctionId: string,
  signal: AbortSignal,
  setBids: (bids: Bid[]) => void
) {
  try {
    const response = await fetch(`${url}/bid/${auctionId}?poll=true`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      signal,
    });

    if (response.ok) {
      const newBid = await response.json();
      console.log(`POLLING New bid received for auction ${auctionId}:`, newBid);
      setBids(newBid);
    } else {
      console.error(
        `Error during polling for auction ${auctionId}:`,
        response.statusText
      );
    }
    // Re-initiate polling after receiving an update or timeout
    setTimeout(() => pollForAuctionUpdates(errorFcn, auctionId, signal, setBids), 1000);
  } catch (err) {
    console.log(`Polling for auction ${auctionId} aborted:`, err);
  }
}

export async function submitBid(
  errorFcn: (error: ErrorType) => void,
  auctionId: string,
  amount: number,
  bidder: string
) {
  const response = await fetch(`${url}/bid/${auctionId}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ amount, bidder }),
  });

  //TODO: status stuff
  if (response.ok) {
    console.log(`Bid for ${auctionId} submitted successfully`);
  } else {
    console.error(
      `Failed to submit bid for ${auctionId}:`,
      response.statusText
    );
  }
}
