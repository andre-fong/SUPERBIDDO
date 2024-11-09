import express from 'express';

export const router = express.Router();

// Object to store clients per auction
let auctionClients = {};

// In-memory storage for auction bids
let currentBids = {
    'auction1': [{ amount: 100, bidder: 'Initial Bidder' }],
    'auction2': [{ amount: 200, bidder: 'Initial Bidder' }]
    // Add more auctions as needed
};

// Endpoint for clients to submit new bids for a specific auction
router.post('/:auctionId', express.json(), (req, res) => {
    const { auctionId } = req.params;
    const { amount, bidder } = req.body;

    console.log(`Received bid in ${auctionId}: $${amount} by ${bidder}`);
    // Ensure the auction exists
    if (!currentBids[auctionId]) {
        return res.status(404).send('Auction not found');
    }
    
    let auction = currentBids[auctionId];
    if (amount > auction[auction.length - 1].amount) {
        currentBids[auctionId].push({ amount, bidder });
        console.log(`New highest bid in ${auctionId}: $${amount} by ${bidder}`);

        // Notify all clients waiting for this auction
        if (auctionClients[auctionId]) {
            auctionClients[auctionId].forEach(client => client.res.json(currentBids[auctionId]));
            auctionClients[auctionId] = [];
        }

        res.status(200).send('Bid accepted');
    } else {
        res.status(400).send('Bid too low');
    }
});

// Endpoint for clients to poll for updates to a specific auction
router.get('/:auctionId', (req, res) => {
    const { auctionId } = req.params;
    // Ensure the auction exists
    if (!currentBids[auctionId]) {
        return res.status(404).send('Auction not found');
    }

    // Initialize the auction's client list if it doesn't exist
    if (!auctionClients[auctionId]) {
        auctionClients[auctionId] = [];
    }

    // Add the response object to the auction's client list
    auctionClients[auctionId].push({ res });

    // Handle connection close
    req.on('close', () => {
        auctionClients[auctionId] = auctionClients[auctionId].filter(client => client.res !== res);
    });
});
