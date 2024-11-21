import {
  AuctionBidHistory,
  AuctionSearchQuery,
  Bid,
} from "@/types/auctionTypes";
import { Severity, ErrorType } from "@/types/errorTypes";
import { User } from "@/types/userTypes";
import { Arapey } from "next/font/google";

// const url = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1`;
const url = `http://localhost:3001/api/v1`;
const unkownError = "An unknown error occurred";

/*
  TODO: DON'T USE AWAIT FOR FRONTEND FETCH FUNCTIONS
*/

export async function fetchSignup(
  errorFcn: (error: ErrorType) => void,
  username: string,
  password: string,
  email: string
) {
  try {
    const response = await fetch(`${url}/accounts`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ username, password, email }),
    });

    if (response.status === 400) {
      errorFcn({
        message: "Request format is invalid",
        severity: Severity.Warning,
      });
      return null;
    } else if (!response.ok) {
      errorFcn({ message: unkownError, severity: Severity.Critical });
      return null;
    }

    return await fetchLogin(errorFcn, email, password);
  } catch (error) {
    errorFcn({ message: unkownError, severity: Severity.Critical });
    return null;
  }
}

export async function fetchLogin(
  errorFcn: (error: ErrorType) => void,
  email: string,
  password: string
) {
  try {
    const response = await fetch(`${url}/session`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ email, password }),
    });

    if (response.status === 400) {
      errorFcn({
        message: "Request format is invalid",
        severity: Severity.Warning,
      });
      return null;
    } else if (response.status === 401) {
      errorFcn({
        message: "Invalid login credentials",
        severity: Severity.Warning,
      });
      return null;
    } else if (!response.ok) {
      errorFcn({ message: unkownError, severity: Severity.Critical });
      return null;
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error(error);
    return null;
  }
}

export async function fetchSession(errorFcn: (error: ErrorType) => void) {
  try {
    const response = await fetch(`${url}/session`, {
      method: "GET",
      credentials: "include",
    });

    if (response.status === 404) {
      errorFcn({
        message: "Session info not found",
        severity: Severity.Warning,
      });
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

export async function fetchLogout(
  errorFcn: (error: ErrorType) => void,
  successLogout: (user: User | null) => void
) {
  try {
    const response = await fetch(`${url}/session`, {
      method: "DELETE",
      credentials: "include",
    });

    if (response.status === 404) {
      errorFcn({
        message: "Session info not found",
        severity: Severity.Critical,
      });
      return;
    } else if (!response.ok) {
      errorFcn({ message: unkownError, severity: Severity.Critical });
      return;
    }

    successLogout(null);
  } catch (error) {
    errorFcn({ message: unkownError, severity: Severity.Critical });
  }
}

export async function getAuctionSearchResults(
  errorFcn: (error: ErrorType) => void,
  searchQuery?: AuctionSearchQuery
) {
  // TODO: Sort by option
  const params = new URLSearchParams(searchQuery as Record<string, string>);

  try {
    const response = await fetch(`${url}/auctions?${params}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (response.ok) {
      const auctions = await response.json();
      return auctions;
    } else {
      errorFcn({ message: unkownError, severity: Severity.Critical });
      return [];
    }
  } catch (error) {
    errorFcn({ message: unkownError, severity: Severity.Critical });
    return [];
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
      errorFcn({ message: unkownError, severity: Severity.Critical });
    }
  }
}

export async function pollNotifications(
  accountId: string,
  errorFcn: (error: ErrorType) => void,
  notifcationFcn: (message: string) => void,
  signal: AbortSignal
) {
  try {
    const response = await fetch(`${url}/notifications/${accountId}`, {
      method: "GET",
    });
    if (response.ok) {
      const data = await response.json();
      notifcationFcn(data.message);
      pollNotifications(accountId, errorFcn, notifcationFcn, signal);
    } else {
      errorFcn({ message: unkownError, severity: Severity.Critical });
    }
  } catch (error) {
    console.error(error);
    errorFcn({ message: unkownError, severity: Severity.Critical });
  }
}

//

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
export async function createAuction(
  errorFcn: (error: ErrorType) => void,
  auctionData: {
    auctioneerId: string;
    name: string;
    description: string;
    startPrice: number;
    spread: number;
    startTime: string;
    endTime: string;
    type: string;
    bundle?: {
      game: string;
      name: string;
      description: string;
      manufacturer: string;
      set: string;
    };
    cards?: {
      game: string;
      name: string;
      description: string;
      manufacturer: string;
      quality: string;
      rarity: string;
      set: string;
      isFoil: boolean;
    };
  }
) {
  try {
    const response = await fetch(`${url}/auctions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        credentials: "include",
      },
      body: JSON.stringify({
        ...auctionData,
        cards: auctionData.cards ? [auctionData.cards] : undefined,
      }),
    });

    if (!response.ok) {
      if (response.status === 400) {
        errorFcn({
          message: "Request format is invalid",
          severity: Severity.Warning,
        });
      } else if (response.status === 401) {
        errorFcn({
          message: "Action requires authentication",
          severity: Severity.Warning,
        });
      } else {
        errorFcn({
          message: unkownError,
          severity: Severity.Critical,
        });
      }
      return null;
    }

    const auction = await response.json();
    return auction;
  } catch (error) {
    errorFcn({ message: unkownError, severity: Severity.Critical });
    return null;
  }
}

export async function fetchAuction(
  errorFcn: (error: ErrorType) => void,
  auctionId: string
) {
  try {
    const response = await fetch(`${url}/auctions/${auctionId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (response.ok) {
      const auction = await response.json();
      return auction;
    } else if (response.status === 404) {
      errorFcn({ message: "Auction not found", severity: Severity.Critical });
      return null;
    } else if (response.status === 400) {
      errorFcn({
        message: "Request format is invalid",
        severity: Severity.Warning,
      });
      return null;
    } else {
      errorFcn({ message: unkownError, severity: Severity.Critical });
      return null;
    }
  } catch (error) {
    errorFcn({ message: unkownError, severity: Severity.Critical });
    return null;
  }
}
