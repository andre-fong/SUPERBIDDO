import { AuctionStatus, AuctionStatusEnum, BiddingStatus, BiddingStatusEnum } from "@/types/auctionTypes"
import { Auction, QualityPsa, QualityUngraded } from "@/types/backendAuctionTypes"

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

export function determineQualityTooltip(quality: QualityPsa | QualityUngraded, qualityType: "PSA" | "Ungraded") {
    if (qualityType === "PSA") {
        switch (quality) {
            case 1:
            return "Poor: Card is heavily damaged and may be missing pieces. Heavy creasing, discoloration, or other destructive effects may be present.";
            case 2:
            return "Good: Card is intact and shows signs of surface wear. Card corners may show accelerated rounding and and surface discoloration.";
            case 3:
            return "Very Good: Card corners have some rounding and some surface wear is visible. Card may have minor creasing or discoloration.";
            case 4:
            return "Very Good - Excellent: Card corners have little rounding and surface wear is minimal. Card may have minor creasing or discoloration.";
            case 5:
            return "Excellent: Card corners have very minor rounding, minor chipping on edges, and surface wear is minimal.";
            case 6:
            return "Excellent - Mint: Card is in excellent condition with little to no visible wear. Very light scratches or slight edge notches may be present.";
            case 7:
            return "Near Mint: Card is in excellent condition with little to no visible wear. Very slight corner fraying or minor printing blemishes may be present. Most of the original gloss is retained.";
            case 8:
            return "Near Mint - Mint: Card is in super high-end condition that appears Mint at first glance. The card can exhibit slight fraying at one or two corners, a minor printing imperfection, or slightly off-white borders.";
            case 9:
            return "Mint: Card is in superb condition, only exhibiting one of the following minor flaws: a slight wax stain on reverse, slight off-white borders, or slight printing imperfection.";
            case 10:
            return "Gem Mint: Card is in perfect condition with four sharp corners, sharp focus, and full original gloss.";
            default:
            return "Quality not specified.";
        }
        } else {
        switch (quality) {
            case "Damaged":
            return "D (Ungraded): Card is heavily damaged and may be missing pieces. Heavy creasing, discoloration, or other destructive effects may be present.";
            case "Heavily Played":
            return "HP (Ungraded): Card is intact and shows signs of surface wear. Card corners may show accelerated rounding and and surface discoloration.";
            case "Moderately Played":
            return "MP (Ungraded): Card corners have some rounding and some surface wear is visible. Card may have minor creasing or discoloration.";
            case "Lightly Played":
            return "LP (Ungraded): Card corners have little rounding and surface wear is minimal. Card may have minor creasing or discoloration.";
            case "Near Mint":
            return "NM (Ungraded): Card is in excellent condition with little to no visible wear. Very light scratches or slight edge notches may be present.";
            case "Mint":
            return "M (Ungraded): Card is in superb condition, only exhibiting one of the following minor flaws: a slight wax stain on reverse, slight off-white borders, or slight printing imperfection.";
            default:
            return "Quality not specified.";
        }
    }
}