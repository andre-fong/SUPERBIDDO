import { useState, useEffect } from "react";
import { AuctionSelfType, Auction } from "@/types/backendAuctionTypes";
import { fetchSelfAuctions } from "@/utils/fetchFunctions";
import { ErrorType } from "@/types/errorTypes";
import { User } from "@/types/userTypes";
import {
  allBiddingStatuses,
  determineTypeListings,
  getImageUrl,
} from "@/utils/determineFunctions";
import { AuctionStatus } from "@/types/auctionTypes";

const useSelfAuctions = (
  type: AuctionSelfType,
  errorFcn: (error: ErrorType) => void,
  user: User,
  searchTerm: string,
  searchStatuses: string[],
  currentPage: number,
  pageSize: number
  
) => {
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  useEffect(() => {
    if (type === "biddings" && searchStatuses.length === 0) {
      // eslint-disable-next-line react-hooks/exhaustive-deps
      searchStatuses = allBiddingStatuses();
    }
    setIsLoaded(false);
    fetchSelfAuctions(
      (err: ErrorType) => {
        setIsLoaded(false);
        errorFcn(err);
      },
      type,
      user.accountId,
      searchTerm,
      searchStatuses,
      pageSize,
      currentPage
    ).then((auctionsGet) => {
      setTotalPages(Math.ceil(auctionsGet.totalNumAuctions / pageSize));
      setAuctions(
        auctionsGet.auctions.map((auction: Auction & { bidStatus: string; auctionStatus: AuctionStatus; endTime: string | null }) => {
          return {
              auctionId: auction.auctionId,
              name: auction.name,
              status: type === "biddings" ? auction.bidStatus : determineTypeListings(auction.auctionStatus, auction.endTime, auction.numBids),
              image: null,
              description: auction.description,
              topBid: auction.topBid ? auction.topBid.amount.toFixed(2): null,
              numberOfBids: auction.numBids,
              endDate: auction.endTime ? new Date(auction.endTime) : null,
              imageUrl: getImageUrl(auction)
            };
        })
      );
      setIsLoaded(true);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, searchStatuses, currentPage]);

  return { auctions, totalPages, isLoaded };
};

export default useSelfAuctions;
