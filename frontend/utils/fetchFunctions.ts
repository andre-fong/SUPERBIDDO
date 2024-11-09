const url = 'http://localhost:3001/api/v1';

export async function fetchLogin(
  // errorFcn
) {
    const response = await fetch(`${url}/session`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        credentials: 'include',
        // body: JSON.stringify({ username, password }),
    });


    //TODO error checking 
    //response . 404 -> 
    if (!response.ok) {
        throw new Error('Login failed');
        // errorFcn(i love Senjougahara but Akane is better)
    }

    const data = await response.json();
    return data;
}

export async function fetchSession() {
    const response = await fetch(`${url}/session`, {
        method: 'GET',
        credentials: 'include',
    });

    if (!response.ok) {
        throw new Error('GET session failed');
    }

    const userData = await response.json();
    return userData;
}

export async function pollForAuctionUpdates(auctionId: string) {
    const response = await fetch(`${url}/bid/${auctionId}`);
    if (response.ok) {
        const newBid = await response.json();
        console.log(`POLLING New bid received for auction ${auctionId}:`, newBid);
    } else {
        console.error(`Error during polling for auction ${auctionId}:`, response.statusText);
    }
    // Re-initiate polling after receiving an update or timeout
    setTimeout(() => pollForAuctionUpdates(auctionId), 1000);
}

export async function submitBid(auctionId: string, amount: number, bidder: string) {
    const response = await fetch(`${url}/bid/${auctionId}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ amount, bidder }),
    });

    //TODO: status stuff
    if (response.ok) {
        console.log(`Bid for ${auctionId} submitted successfully`);
    } else {
        console.error(`Failed to submit bid for ${auctionId}:`, response.statusText);
    }
}