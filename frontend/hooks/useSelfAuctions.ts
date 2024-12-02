import { useState, useEffect } from "react";
import { AuctionSelfType, Auction } from "@/types/backendAuctionTypes";
import { AuctionListings, AuctionStatus } from "@/types/auctionTypes";
import { fetchSelfAuctions } from "@/utils/fetchFunctions";
import { ErrorType } from "@/types/errorTypes";
import { User } from "@/types/userTypes";
import {
  allBiddingStatuses,
  getImageUrl,
} from "@/utils/determineFunctions";

const useSelfAuctions = (
  type: AuctionSelfType,
  errorFcn: (error: ErrorType) => void,
  user: User,
  searchTerm: string,
  searchStatuses: string[],
  currentPage: number,
  pageSize: number,
  setCurPage: (page: number) => void
) => {
  const [auctions, setAuctions] = useState<AuctionListings[]>([]);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);

  function auctionsSet() {
    setIsLoaded(false);
    fetchSelfAuctions(
      (err: ErrorType) => {
        setIsLoaded(true);
        errorFcn(err);
      },
      type,
      user.accountId,
      searchTerm,
      type === "biddings" && searchStatuses.length === 0 ? allBiddingStatuses() : searchStatuses,
      pageSize,
      currentPage
    ).then((auctionsGet) => {
      setTotalPages(Math.ceil(auctionsGet.totalNumAuctions / pageSize));
      setAuctions(
        auctionsGet.auctions.map((auction: Auction & { bidStatus: string; auctionStatus: AuctionStatus; endTime: string | null }) => {
          return {
              auctionId: auction.auctionId,
              name: auction.name,
              status: type === "biddings" ? auction.bidStatus : auction.auctionStatus,
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
  }

  useEffect(() => {
    auctionsSet();
    setCurPage(1);
  }, [searchTerm, searchStatuses]);

  useEffect(() => {
    auctionsSet();
  }, [currentPage]);

  return { auctions, totalPages, isLoaded };
};

export default useSelfAuctions;
