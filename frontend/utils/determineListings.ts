import { AuctionStatus, AuctionStatusEnum, BiddingStatus, BiddingStatusEnum } from "@/types/auctionTypes"

export function determineTypeListings(
    startDate: string | null,
    endDate: string | null,
    numBids: number,
): AuctionStatus {
    const convertStartDate = startDate ? new Date(startDate) : null
    const convertEndDate = endDate ? new Date(endDate) : null
    if (convertStartDate === null || convertEndDate === null) {
        return "NotScheduled"
    }
    else if (convertStartDate > new Date()) {
        return AuctionStatusEnum.Scheduled
    } else if (convertStartDate < new Date() && convertEndDate > new Date()) {
        return AuctionStatusEnum.Ongoing
    } else if (numBids > 0) {
        return AuctionStatusEnum.Successful
    } else {
        return AuctionStatusEnum.Unsuccessful
    }
}

export function determineTypeBids(
    startDate: Date,
    endDate: Date,
    accountId: string,
    topBidAccountId: string,
): BiddingStatus {
    if (startDate < new Date() && endDate > new Date()) {
        return accountId === topBidAccountId ? BiddingStatusEnum.Winning : BiddingStatusEnum.Outbidded
    } 

    return accountId === topBidAccountId ? BiddingStatusEnum.Won : BiddingStatusEnum.Lost
}