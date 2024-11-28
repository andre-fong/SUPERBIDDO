export enum NotificationEvents {
    AuctionOutbidded = 'auction_outbidded',
    AuctionReceivedBid = 'auction_recieved_bid',
    AuctionBidWon = 'auction_bid_won',
    AuctionBidLost = 'auction_bid_lost',
    AuctionEndingSoon = 'auction_ending_soon',
    AuctionOwningEnded = 'auction_owning_ended',
    AuctionWatchingReceivedBid = 'auction_watching_recieved_bid',
    AuctionWatchingEnded = 'auction_watching_ended',
    AuctionWatchingEndingSoon = 'auction_watching_ending_soon',
}

export const NotificationMessages = {
    [NotificationEvents.AuctionOutbidded]: {
        eventHeader: "Outbidded!",
        eventBody: (auctionName: string) => `You have been outbid on the auction: ${auctionName}`,
    },
    [NotificationEvents.AuctionReceivedBid]: {
        eventHeader: "New Bid!",
        eventBody: (auctionName: string) => `A new bid has been placed on your auction: ${auctionName}`,
    },
    [NotificationEvents.AuctionBidWon]: {
        eventHeader: "Auction Won!",
        eventBody: (auctionName: string) => `You have won the auction: ${auctionName}`,
    },
    [NotificationEvents.AuctionBidLost]: {
        eventHeader: "Auction Lost!",
        eventBody: (auctionName: string) => `You have lost the auction: ${auctionName}`,
    },
    [NotificationEvents.AuctionEndingSoon]: {
        eventHeader: "Auction Ending Soon!",
        eventBody: (auctionName: string) => `The auction: ${auctionName} you bid on is ending soon`,
    },
    [NotificationEvents.AuctionOwningEnded]: {
        eventHeader: "Auction Ended!",
        eventBody: (auctionName: string) => `Your auction: ${auctionName} has ended`,
    },
    [NotificationEvents.AuctionWatchingReceivedBid]: {
        eventHeader: "New Bid!",
        eventBody: (auctionName: string) => `A new bid has been placed on the auction you are watching: ${auctionName}`,
    },
    [NotificationEvents.AuctionWatchingEnded]: {
        eventHeader: "Auction Ended!",
        eventBody: (auctionName: string) => `The auction you are watching: ${auctionName} has ended`,
    },
    [NotificationEvents.AuctionWatchingEndingSoon]: {
        eventHeader: "Auction Ending Soon!",
        eventBody: (auctionName: string) => `The auction you are watching: ${auctionName} is ending soon`,
    },
    
};