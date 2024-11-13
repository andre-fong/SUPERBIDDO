import express from "express";

export const router = express.Router();

// Object to store clients per auction
let auctionClients = {};

// In-memory storage for auction bids
let currentBids = {
  auction1: [{ amount: 1, bidder: "victo", date: new Date() }],
  auction2: [{ amount: 200, bidder: "Initial Bidder", date: new Date() }],
  // Add more auctions as needed
};

// TODO: ts types, and check if this fcn is time efficient
function formatBids(bids) {
  let bidders = {};
  for (let bid of bids) {
    if (!bidders[bid.bidder]) {
      bidders[bid.bidder] = { bids: 0, highBid: 0 };
    }
    bidders[bid.bidder].bids++;
    if (bid.amount > bidders[bid.bidder].highBid) {
      bidders[bid.bidder].highBid = bid.amount;
    }
  }

  let formattedBids = [];
  for (let bidder in bidders) {
    formattedBids.push({
      bidder,
      bids: bidders[bidder].bids,
      highBid: bidders[bidder].highBid,
      lastBidTime: bids[bids.length - 1].date,
    });
  }

  formattedBids.sort((a, b) => b.highBid - a.highBid);

  return formattedBids;
}

// Endpoint for clients to submit new bids for a specific auction
router.post("/:auctionId", express.json(), (req, res) => {
  const { auctionId } = req.params;
  const { amount, bidder } = req.body;

  console.log(`Received bid in ${auctionId}: $${amount} by ${bidder}`);
  // Ensure the auction exists
  if (!currentBids[auctionId]) {
    return res.status(404).send("Auction not found");
  }

  let auction = currentBids[auctionId];
  if (amount > auction[auction.length - 1].amount) {
    currentBids[auctionId].push({ amount, bidder, date: new Date() });
    console.log(`New highest bid in ${auctionId}: $${amount} by ${bidder}`);

    // Notify all clients waiting for this auction
    if (auctionClients[auctionId]) {
      auctionClients[auctionId].forEach((client) =>
        client.res.json(formatBids(currentBids[auctionId]))
      );
      auctionClients[auctionId] = [];
    }

    res.status(200).send("Bid accepted");
  } else {
    res.status(400).send("Bid too low");
  }
});

// Endpoint for clients to poll for updates to a specific auction
router.get("/:auctionId", (req, res) => {
  const { auctionId } = req.params;
  const poll = req.query.poll === "true";

  // Check if the client is polling for updates
  if (poll) {
    // Ensure the auction exists
    if (!currentBids[auctionId]) {
      return res.status(404).send("Auction not found");
    }

    // Initialize the auction's client list if it doesn't exist
    if (!auctionClients[auctionId]) {
      auctionClients[auctionId] = [];
    }

    // Add the response object to the auction's client list
    auctionClients[auctionId].push({ res });

    // Handle connection close
    req.on("close", () => {
      auctionClients[auctionId] = auctionClients[auctionId].filter(
        (client) => client.res !== res
      );
    });
    return;
  } else {
    // Return the current state of the auction
    res.json(formatBids(currentBids[auctionId]));
  }
});
