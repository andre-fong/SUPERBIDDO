import { AuctionStatus, AuctionStatusEnum, BiddingStatus, BiddingStatusEnum } from "@/types/auctionTypes"
import { Auction } from "@/types/backendAuctionTypes"

export function determineTypeListings(
    status: AuctionStatus,
    endDate: string | null,
    numBids: number,
): AuctionStatus {
    if (!endDate) {return status}
    
    if ( new Date(endDate) < new Date()) {
        return numBids > 0 ? AuctionStatusEnum.Successful : AuctionStatusEnum.Unsuccessful
    } 
    return status
}

export function determineTypeBids(
    startDate: Date,
    endDate: Date,
    accountId: string,
    topBidAccountId: string,
): BiddingStatus {
    if (startDate < new Date() && endDate > new Date()) {
        return accountId === topBidAccountId ? BiddingStatusEnum.Leading : BiddingStatusEnum.Outbid
    } 

    return accountId === topBidAccountId ? BiddingStatusEnum.Won : BiddingStatusEnum.Lost
}

export function allBiddingStatuses(): BiddingStatus[] {
    return Object.keys(BiddingStatusEnum) as BiddingStatus[]
}

export function getImageUrl(auction: Auction) {
    return auction.cards ? auction.cards[0]?.imageUrl : auction.bundle?.imageUrl
}