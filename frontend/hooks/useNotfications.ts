import { useEffect, useState, useRef } from 'react';
import { User } from '@/types/userTypes';
import { ErrorType, Severity } from '@/types/errorTypes';
import io from "socket.io-client";
import { NotificationEvents } from '@/types/notificationTypes';

function useNotifications(user: User | null, setToast: (error: ErrorType) => void) {
    const [permission, setPermission] = useState<NotificationPermission>('default');
    const socketRef = useRef<ReturnType<typeof io>>();

    useEffect(() => {
        if (!user) {
            return;
        }

        Notification.requestPermission().then((permission) => {
            setPermission(permission);

            if (permission === "denied") {
                return;
            }

            socketRef.current = io(process.env.NEXT_PUBLIC_BACKEND_URL, {
                withCredentials: true,
            });

            socketRef.current.on('connect_error', (err) => {
                setToast({
                    message: "There was an error establishing connections for notifications",
                    severity: Severity.Critical,
                });
            });

            socketRef.current.emit('join', user.accountId);

            // Setting up all event listeners
            socketRef.current.on(NotificationEvents.AuctionOutbidded, (auctionName: string) => {
                new Notification("Outbidded!", {
                    body: `You have been outbid on the auction: ${auctionName}`,
                });
            });

            socketRef.current.on(NotificationEvents.AuctionReceivedBid, (auctionName: string) => {
                new Notification("New Bid!", {
                    body: `A new bid has been placed on your auction: ${auctionName}`,
                });
            });

            socketRef.current.on(NotificationEvents.AuctionBidWon, (auctionName: string) => {
                new Notification("Auction Won!", {
                    body: `You have won the auction: ${auctionName}`,
                });
            });

            socketRef.current.on(NotificationEvents.AuctionBidLost, (auctionName: string) => {
                new Notification("Auction Lost!", {
                    body: `You have lost the auction: ${auctionName}`,
                });
            });

            socketRef.current.on(NotificationEvents.AuctionEndingSoon, (auctionName: string) => {
                new Notification("Auction Ending Soon!", {
                    body: `The auction: ${auctionName} you bid on is ending soon`,
                });
            });

            socketRef.current.on(NotificationEvents.AuctionOwningEnded, (auctionName: string) => {
                new Notification("Auction Ended!", {
                    body: `Your auction: ${auctionName} has ended`,
                });
            });

            socketRef.current.on(NotificationEvents.AuctionWatchingReceivedBid, (auctionName: string) => {
                new Notification("New Bid!", {
                    body: `A new bid has been placed on the auction you are watching: ${auctionName}`,
                });
            });

            socketRef.current.on(NotificationEvents.AuctionWatchingEnded, (auctionName: string) => {
                new Notification("Auction Ended!", {
                    body: `The auction you are watching: ${auctionName} has ended`,
                });
            });

            socketRef.current.on(NotificationEvents.AuctionWatchingEndingSoon, (auctionName: string) => {
                new Notification("Auction Ending Soon!", {
                    body: `The auction you are watching: ${auctionName} is ending soon`,
                });
            });
        });

        // Cleanup function
        return () => {
            Object.values(NotificationEvents).forEach((event) => {
                socketRef.current?.off(event);
            });

            socketRef.current?.disconnect();
        };
    }, [user]); // Dependency array

    return { permission };
}

export default useNotifications;
