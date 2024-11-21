import { useState, useEffect } from 'react';
import { Auction } from "@/types/auctionTypes";
import { AuctionSelfType } from '@/types/backendAuctionTypes';
import { fetchSelfAuctions } from '@/utils/fetchFunctions';
import { ErrorType } from '@/types/errorTypes';
import { User } from '@/types/userTypes';
import { determineTypeListings, determineTypeBids } from '@/utils/determineListings';

const useSelfAuctions = (type: AuctionSelfType, errorFcn: (error: ErrorType) => void, user: User, searchTerm: string, searchStatuses: string[], currentPage: number, pageSize: number) => {
    const [auctions, setAuctions] = useState<Auction[]>([]);
    const [totalPages, setTotalPages] = useState<number>(0);

    useEffect(() => {
        fetchSelfAuctions(errorFcn, type, user.accountId, searchTerm, searchStatuses, pageSize, currentPage)
        .then((auctionsGet) => {
            setTotalPages(Math.ceil(auctionsGet.totalNumAuctions / pageSize));
            console.log(auctionsGet);
            setAuctions(auctionsGet.auctions.map((auction: any) => {
                //TODO set the image
                return {
                    auctionId: auction.auctionId,
                    name: auction.name,
                    status: type === 'listings' ? determineTypeListings(auction.startTime, auction.endTime, auction.numBids) : determineTypeBids(new Date(auction.startTime), new Date(auction.endTime), user.accountId, auction.topBid.bidder.accountId),
                    image: null,
                    description: auction.description,
                    topBid: type === 'listings' ? auction.topBid : auction.topBid.amount,
                    numberOfBids: auction.numBids,
                    endDate: auction.endTime ? new Date(auction.endTime): null
                }
            }));
        })
    }, [searchTerm, searchStatuses, currentPage]);

    return { auctions, totalPages };
}

export default useSelfAuctions;