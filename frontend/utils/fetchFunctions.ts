import {
  AuctionBidHistory,
  AuctionSearchQuery,
  Bid,
} from "@/types/auctionTypes";
import { Severity, ErrorType } from "@/types/errorTypes";
import { User } from "@/types/userTypes";
import {
  Auction,
  AuctionPatchBody,
  AuctionSelfType,
  CardRarities,
  QualityPsa,
  QualityUngraded,
} from "@/types/backendAuctionTypes";

const url = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1`;

// we need csrf token for all requests that are not GET (excluding fetchSignup)
let csrfToken = "";

/**
 * Refreshes the csrf token in fetchFunctions.ts
 */
async function refreshCSRFToken() {
  const res = await fetch(`${url}/csrfToken`, {
    method: "GET",
    credentials: "include",
  });
  if (res.ok) {
    const data = await res.json();
    csrfToken = data.csrfToken;
  }
}

/**
 * Resets the csrf token to "" in fetchFunctions.ts.\
 * Should be called on every req to login, signup, or logout.
 */
function resetCSRFToken() {
  csrfToken = "";
}

const unknownError = "An unknown error occurred";

function customEncodeURIComponent(str: string) {
  return encodeURIComponent(str.replaceAll(/!/g, "%21"));
}

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
      errorFcn({ message: unknownError, severity: Severity.Critical });
      return null;
    }

    return await fetchLogin(errorFcn, email, password);
  } catch (error) {
    errorFcn({ message: unknownError, severity: Severity.Critical });
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
      errorFcn({ message: unknownError, severity: Severity.Critical });
      return null;
    }

    const data = await response.json();
    resetCSRFToken();
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
      errorFcn({ message: unknownError, severity: Severity.Critical });
      return null;
    }

    const userData = await response.json();
    return userData;
  } catch (error) {
    errorFcn({ message: unknownError, severity: Severity.Critical });
    return null;
  }
}

export async function fetchLogout(
  errorFcn: (error: ErrorType) => void,
  successLogout: (user: User | null) => void
) {
  if (!csrfToken) {
    await refreshCSRFToken();
  }

  try {
    const response = await fetch(`${url}/session`, {
      method: "DELETE",
      credentials: "include",
      headers: {
        "x-csrf-token": csrfToken,
      },
    });

    if (response.status === 404) {
      errorFcn({
        message: "Session info not found",
        severity: Severity.Critical,
      });
      return;
    } else if (!response.ok) {
      errorFcn({ message: unknownError, severity: Severity.Critical });
      return;
    }

    resetCSRFToken();
    successLogout(null);
  } catch (error) {
    errorFcn({ message: unknownError, severity: Severity.Critical });
  }
}

export async function getAuctionSearchResults(
  errorFcn: (error: ErrorType) => void,
  searchQuery?: AuctionSearchQuery
): Promise<{ auctions: Auction[]; totalNumAuctions: number }> {
  const params = Object.entries(searchQuery || {})
    .map(([key, value]) => {
      if (value === undefined || value === null) {
        return "";
      }
      if (typeof value === "object") {
        return Object.entries(value)
          .map(
            ([subKey, subValue]) =>
              `${key}=${customEncodeURIComponent(subValue.toString())}`
          )
          .join("&");
      }
      return `${key}=${customEncodeURIComponent(value.toString())}`;
    })
    .join("&");

  try {
    const response = await fetch(`${url}/auctions?${params}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    });

    if (response.ok) {
      const auctions = await response.json();
      return auctions;
    } else {
      errorFcn({ message: unknownError, severity: Severity.Critical });
      return {
        auctions: [],
        totalNumAuctions: 0,
      };
    }
  } catch (error) {
    errorFcn({ message: unknownError, severity: Severity.Critical });
    return {
      auctions: [],
      totalNumAuctions: 0,
    };
  }
}

export async function getAuctionBids(
  errorFcn: (error: ErrorType) => void,
  auctionId: string,
  page: number,
  pageSize: number,
  summary: boolean
) {
  try {
    summary = summary ? true : false;
    const response = await fetch(
      `${url}/auctions/${auctionId}/bids?page=${page}&pageSize=${pageSize}&summary=${summary}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      }
    );

    if (response.ok) {
      const bids = await response.json();
      return bids.summary;
    } else if (response.status === 400) {
      errorFcn({
        message: "Request format is invalid",
        severity: Severity.Warning,
      });
      return [];
    } else if (response.status === 404) {
      errorFcn({ message: "Auction not found", severity: Severity.Critical });
      return [];
    }
  } catch (error) {
    errorFcn({ message: unknownError, severity: Severity.Critical });
    return [];
  }
}

export async function pollForAuctionUpdates(
  errorFcn: (error: ErrorType) => void,
  auctionId: string,
  signal: AbortSignal,
  longPollMaxBidId: string
) {
  try {
    const response = await fetch(
      `${url}/auctions/${auctionId}?longPollMaxBidId=${longPollMaxBidId}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        signal,
      }
    );

    if (response.ok) {
      const newBid = await response.json();
      return newBid;
    } else if (response.status === 400) {
      errorFcn({
        message: "Request format is invalid",
        severity: Severity.Warning,
      });
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
    return null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (err: any) {
    if (err.name === "AbortError") {
      console.log(`Polling for auction ${auctionId} aborted`);
    } else {
      console.error(err);
      errorFcn({ message: unknownError, severity: Severity.Critical });
    }
    return null;
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
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      signal,
    });
    if (response.ok) {
      const data = await response.json();
      notifcationFcn(data.message);
      pollNotifications(accountId, errorFcn, notifcationFcn, signal);
    } else {
      errorFcn({ message: unknownError, severity: Severity.Critical });
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    if (error.name === "AbortError") {
      console.warn("Polling for notifications aborted");
      return;
    } else {
      console.error(error);
      errorFcn({ message: unknownError, severity: Severity.Critical });
    }
  }
}

export async function submitBid(
  errorFcn: (error: ErrorType) => void,
  auctionId: string,
  amount: number,
  bidderId: string
) {
  if (!csrfToken) {
    await refreshCSRFToken();
  }

  try {
    const response = await fetch(`${url}/auctions/${auctionId}/bids`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-csrf-token": csrfToken,
      },
      body: JSON.stringify({ amount, bidderId }),
      credentials: "include",
    });

    if (response.ok) {
      return await response.json();
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
    return null;
  } catch (error) {
    errorFcn({ message: unknownError, severity: Severity.Critical });
    return null;
  }
}
export async function createAuction(
  errorFcn: (error: ErrorType) => void,
  auctionData: Auction
) {
  if (!csrfToken) {
    await refreshCSRFToken();
  }

  try {
    const response = await fetch(`${url}/auctions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-csrf-token": csrfToken,
      },
      credentials: "include",
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
          message: unknownError,
          severity: Severity.Critical,
        });
      }
      return null;
    }

    const auction = await response.json();
    return auction;
  } catch (error) {
    errorFcn({ message: unknownError, severity: Severity.Critical });
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
      credentials: "include",
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
      errorFcn({ message: unknownError, severity: Severity.Critical });
      return null;
    }
  } catch (error) {
    errorFcn({ message: unknownError, severity: Severity.Critical });
    return null;
  }
}

// NOTE:  THIS IS FOR YOURLISTINGS AND YOURBIDDINGS
export async function fetchSelfAuctions(
  errorFcn: (error: ErrorType) => void,
  type: AuctionSelfType,
  accountId: string,
  searchName: string,
  searchStatuses: string[],
  pageSize: number,
  currentPage: number
) {
  try {
    const searchStatusQuery = searchStatuses
      .map(
        (status) =>
          `${type === "biddings" ? "bidStatus" : "auctionStatus"}=${status}`
      )
      .join("&");
    const response = await fetch(
      `${url}/auctions?${
        type === "biddings" ? "includeBidStatusFor" : "auctioneerId"
      }=${accountId}${
        searchName ? "&name=" + searchName : ""
      }&page=${currentPage}&pageSize=${pageSize}&${searchStatusQuery}&sortBy=startTimeAsc`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      }
    );

    if (response.ok) {
      const auctions = await response.json();
      return auctions;
    } else if (response.status === 404) {
      errorFcn({ message: "No auctions found", severity: Severity.Warning });
    } else if (response.status === 400) {
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
      errorFcn({ message: unknownError, severity: Severity.Critical });
    }

    return { auctions: [], totalNumAuctions: 0 };
  } catch (error) {
    errorFcn({ message: unknownError, severity: Severity.Critical });
    return { auctions: [], totalNumAuctions: 0 };
  }
}

export async function editAuction(
  errorFcn: (error: ErrorType) => void,
  auctionId: string,
  auctionData: AuctionPatchBody
) {
  if (!csrfToken) {
    await refreshCSRFToken();
  }

  try {
    const response = await fetch(`${url}/auctions/${auctionId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "x-csrf-token": csrfToken,
      },
      credentials: "include",
      body: JSON.stringify(auctionData),
    });

    if (response.ok) {
      const auction = await response.json();
      return auction;
    } else if (response.status === 400) {
      errorFcn({
        message: "Request format is invalid",
        severity: Severity.Warning,
      });
    } else if (response.status === 404) {
      errorFcn({ message: "Auction not found", severity: Severity.Critical });
    } else if (response.status === 409) {
      errorFcn({
        message: "Auction is no longer editable",
        severity: Severity.Warning,
      });
    } else {
      errorFcn({ message: unknownError, severity: Severity.Critical });
    }

    return null;
  } catch (error) {
    errorFcn({ message: unknownError, severity: Severity.Critical });
    return null;
  }
}

export async function deleteAuction(
  errorFcn: (error: ErrorType) => void,
  auctionId: string
) {
  if (!csrfToken) {
    await refreshCSRFToken();
  }

  try {
    const response = await fetch(`${url}/auctions/${auctionId}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        "x-csrf-token": csrfToken,
      },
      credentials: "include",
    });

    if (response.ok) {
      return true;
    } else if (response.status === 404) {
      errorFcn({ message: "Auction not found", severity: Severity.Critical });
    } else if (response.status === 409) {
      errorFcn({
        message: "Auction is no longer editable",
        severity: Severity.Warning,
      });
    } else {
      errorFcn({ message: unknownError, severity: Severity.Critical });
    }

    return false;
  } catch (error) {
    errorFcn({ message: unknownError, severity: Severity.Critical });
    return false;
  }
}

export async function addWatching(
  errorFcn: (error: ErrorType) => void,
  accountId: string,
  auctionId: string
) {
  if (!csrfToken) {
    await refreshCSRFToken();
  }

  try {
    const response = await fetch(`${url}/auctions/${auctionId}/watchers`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-csrf-token": csrfToken,
      },
      credentials: "include",
      body: JSON.stringify({ watcherId: accountId }),
    });

    if (response.ok) {
      return true;
    } else if (response.status === 400) {
      errorFcn({
        message: "Request format is invalid",
        severity: Severity.Warning,
      });
    } else if (response.status === 401) {
      errorFcn({
        message: "Action requires authentication",
        severity: Severity.Warning,
      });
    } else if (response.status === 404) {
      errorFcn({ message: "Auction not found", severity: Severity.Critical });
    } else if (response.status === 409) {
      errorFcn({
        message: "Cannot watch own auction",
        severity: Severity.Warning,
      });
    } else {
      errorFcn({ message: unknownError, severity: Severity.Critical });
    }

    return false;
  } catch (error) {
    errorFcn({ message: unknownError, severity: Severity.Critical });
    return false;
  }
}

export async function removeWatching(
  errorFcn: (error: ErrorType) => void,
  accountId: string,
  auctionId: string
) {
  if (!csrfToken) {
    await refreshCSRFToken();
  }

  try {
    const response = await fetch(
      `${url}/auctions/${auctionId}/watchers/${accountId}`,
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "x-csrf-token": csrfToken,
        },
        credentials: "include",
      }
    );

    if (response.ok) {
      return false;
    } else if (response.status === 404) {
      errorFcn({
        message: "Not watching auction",
        severity: Severity.Critical,
      });
    } else if (response.status === 401) {
      errorFcn({
        message: "Action requires authentication",
        severity: Severity.Warning,
      });
    } else if (response.status === 400) {
      errorFcn({
        message: "Request format is invalid",
        severity: Severity.Warning,
      });
    } else {
      errorFcn({ message: unknownError, severity: Severity.Critical });
    }

    return true;
  } catch (error) {
    errorFcn({ message: unknownError, severity: Severity.Critical });
    return true;
  }
}

export async function getWatching(
  errorFcn: (error: ErrorType) => void,
  accountId: string,
  auctionId: string
) {
  try {
    const response = await fetch(
      `${url}/auctions/${auctionId}?includeWatchingFor=${accountId}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      }
    );

    if (response.ok) {
      const watching = await response.json();
      return watching.watching;
    } else if (response.status === 401) {
      errorFcn({
        message: "Action requires authentication",
        severity: Severity.Warning,
      });
    } else if (response.status === 400) {
      errorFcn({
        message: "Request format is invalid",
        severity: Severity.Warning,
      });
    }
    return false;
  } catch (error) {
    errorFcn({ message: unknownError, severity: Severity.Critical });
    return false;
  }
}

export async function uploadImage(
  errorFcn: (error: ErrorType) => void,
  image: File
) {
  if (!csrfToken) {
    await refreshCSRFToken();
  }

  try {
    const formData = new FormData();
    formData.append("image", image);

    const response = await fetch(`${url}/images`, {
      method: "POST",
      headers: {
        "x-csrf-token": csrfToken,
      },
      body: formData,
      credentials: "include",
    });

    if (response.ok) {
      const data = await response.json();
      return data.imageUrl;
    } else if (response.status === 400) {
      errorFcn({
        message: "Request format is invalid",
        severity: Severity.Warning,
      });
    } else if (response.status === 500) {
      errorFcn({
        message: "Internal server error",
        severity: Severity.Critical,
      });
    } else {
      errorFcn({ message: unknownError, severity: Severity.Critical });
    }

    return null;
  } catch (error) {
    errorFcn({ message: unknownError, severity: Severity.Critical });
    return null;
  }
}

export async function getGeminiInput(
  errorFcn: (error: ErrorType) => void,
  imageUrl: string
) {
  try {
    const response = await fetch(
      `${url}/images/${encodeURIComponent(imageUrl)}/geminiDetails`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      }
    );

    if (response.ok) {
      const data = await response.json();
      return data;
    } else if (response.status === 400) {
      errorFcn({
        message: "Request format is invalid",
        severity: Severity.Warning,
      });
    } else if (response.status === 401) {
      errorFcn({
        message: "Action requires authentication",
        severity: Severity.Warning,
      });
    } else if (response.status === 404) {
      errorFcn({
        message: "Image not found",
        severity: Severity.Critical,
      });
    } else {
      errorFcn({ message: unknownError, severity: Severity.Critical });
    }

    return null;
  } catch (error) {
    errorFcn({ message: unknownError, severity: Severity.Critical });
    return null;
  }
}

export async function editLocation(
  errorFcn: (error: ErrorType) => void,
  accountId: string,
  placeId: string,
  sessionToken: string
) {
  if (!csrfToken) {
    await refreshCSRFToken();
  }

  try {
    const response = await fetch(
      `${url}/accounts/${accountId}/address?sessionToken=${sessionToken}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-csrf-token": csrfToken,
        },
        credentials: "include",
        body: JSON.stringify({ placeId }),
      }
    );

    if (response.ok) {
      return await response.json();
    } else if (response.status === 400) {
      errorFcn({
        message: "Request format is invalid",
        severity: Severity.Warning,
      });
    } else if (response.status === 401) {
      errorFcn({
        message: "Action requires authentication",
        severity: Severity.Warning,
      });
    } else if (response.status === 404) {
      errorFcn({ message: "Place ID not found", severity: Severity.Critical });
    } else {
      errorFcn({ message: unknownError, severity: Severity.Critical });
    }
  } catch (error) {
    errorFcn({ message: unknownError, severity: Severity.Critical });
    return null;
  }

  return null;
}
