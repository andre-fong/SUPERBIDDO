import express from "express";

export const router = express.Router();

// Object to store clients per auction
let auctionClients = {};

// TODO: Change from in-memory to db
// In-memory storage for auction bids
let currentBids = {
  auction1: [],
  auction2: [{ amount: 200, bidder: "Initial Bidder", date: new Date() }],
  // Add more auctions as needed
};
let startingBid = 0.5;

// TODO: ts types, and check if this fcn is time efficient
function formatBids(bids) {
  let bidders = {};
  for (let bid of bids) {
    if (!bidders[bid.bidder]) {
      bidders[bid.bidder] = { bids: 0, highBid: 0, lastBidTime: bid.date };
    }
    bidders[bid.bidder].bids++;
    if (bid.amount > bidders[bid.bidder].highBid) {
      bidders[bid.bidder].highBid = bid.amount;
      bidders[bid.bidder].lastBidTime = bid.date;
    }
  }

  let formattedBids = [];
  for (let bidder in bidders) {
    formattedBids.push({
      bidder,
      bids: bidders[bidder].bids,
      highBid: bidders[bidder].highBid,
      lastBidTime: bidders[bidder].lastBidTime,
    });
  }

  formattedBids.sort((a, b) => b.highBid - a.highBid);

  return formattedBids;
}

// Endpoint for clients to submit new bids for a specific auction
// TODO: Refactor to connect to db
router.post("/:auctionId", express.json(), (req, res) => {
  const { auctionId } = req.params;
  const { amount, bidder } = req.body;

  console.log(`Received bid in ${auctionId}: $${amount} by ${bidder}`);
  // Ensure the auction exists
  if (!currentBids[auctionId]) {
    return res.status(404).send("Auction not found");
  }

  // TODO: Verify last bid wasn't by the same bidder,
  // verify bid is higher than the last bid + <spread>
  // verify bid is a multiple of <spread>
  let auction = currentBids[auctionId];
  if (
    amount >
    (auction.length > 0 ? auction[auction.length - 1]?.amount : startingBid)
  ) {
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
