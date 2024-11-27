import { ErrorType } from "@/types/errorTypes";
import { addWatching, removeWatching } from "@/utils/fetchFunctions";

export function handleWatching(isWatching: boolean, auctionId: string, userId: string, toggleWatching: (isWatching: boolean) => void, setToast: (err: ErrorType) => void) {  
    if (isWatching) {
      removeWatching(setToast, userId, auctionId).then((newValue: boolean) => {
        toggleWatching(newValue);
      })
    } else {
      addWatching(setToast, userId, auctionId).then((newValue: boolean) => {
        toggleWatching(newValue);
      })
    }
}