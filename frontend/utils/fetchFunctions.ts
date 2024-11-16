import { AuctionBidHistory, Bid } from "@/types/auctionTypes";
import { Severity, ErrorType } from "@/types/errorTypes";

const url = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1`;
const unkownError = "An unknown error occurred";

/*
  TODO: DON'T USE AWAIT FOR FRONTEND FETCH FUNCTIONS
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

    if (response.status === 404) {
      // errorFcn({
      //   message: "Session info not found",
      //   severity: Severity.Critical,
      // });
      return null;
    } else if (!response.ok) {
      errorFcn({ message: unkownError, severity: Severity.Critical });
      return null;
    }

    const userData = await response.json();
    return userData;
  } catch (error) {
    errorFcn({ message: unkownError, severity: Severity.Critical });
    return null;
  }
}

export async function getAuctionBids(
  errorFcn: (error: ErrorType) => void,
  auctionId: string
) {
  try {
    const response = await fetch(`${url}/bid/${auctionId}?poll=false`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (response.ok) {
      const bids = await response.json();
      return bids;
    } else if (response.status === 404) {
      errorFcn({ message: "Auction not found", severity: Severity.Critical });
      return [];
    }
  } catch (error) {
    errorFcn({ message: unkownError, severity: Severity.Critical });
    return [];
  }
}

export async function pollForAuctionUpdates(
  errorFcn: (error: ErrorType) => void,
  auctionId: string,
  signal: AbortSignal,
  setBids: (bids: AuctionBidHistory[]) => void
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
      const newBid: AuctionBidHistory[] = await response.json();
      console.log(`POLLING New bid received for auction ${auctionId}:`, newBid);
      setBids(newBid);
    } else if (response.status === 502) {
      console.log(`Polling for auction ${auctionId} timed out`);
    } else if (response.status === 404) {
      errorFcn({
        message: "Error initiating connection for an auction",
        severity: Severity.Critical,
      });
      console.error(
        `Error during polling for auction ${auctionId}:`,
        response.statusText
      );
    }
    // Re-initiate polling after receiving an update without any delay
    pollForAuctionUpdates(errorFcn, auctionId, signal, setBids);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (err: any) {
    if (err.name === "AbortError") {
      console.log(`Polling for auction ${auctionId} aborted`);
      return;
    } else {
      // errorFcn({ message: unkownError, severity: Severity.Critical });
    }
  }
}

export async function submitBid(
  errorFcn: (error: ErrorType) => void,
  auctionId: string,
  amount: number,
  bidder: string
) {
  try {
    const response = await fetch(`${url}/bid/${auctionId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ amount, bidder }),
    });

    if (response.ok) {
      console.log(`Bid for ${auctionId} submitted successfully`);
    } else if (response.status === 400) {
      errorFcn({ message: "Bid too low", severity: Severity.Warning });
    } else if (response.status === 404) {
      errorFcn({ message: "Auction not found", severity: Severity.Critical });
      console.error(
        `Failed to submit bid for ${auctionId}:`,
        response.statusText
      );
    } else {
      errorFcn({
        message: "Failed to submit bid",
        severity: Severity.Critical,
      });
      console.error(
        `Failed to submit bid for ${auctionId}:`,
        response.statusText
      );
    }
  } catch (error) {
    errorFcn({ message: unkownError, severity: Severity.Critical });
  }
}
