import { useEffect, useState, useRef } from 'react';
import { User } from '@/types/userTypes';
import { ErrorType, Severity } from '@/types/errorTypes';
import io from "socket.io-client";

function useNotifications(user: User | null, setToast: (error: ErrorType) => void) {
    const [permission, setPermission] = useState<NotificationPermission>('default');
    const socketRef = useRef<ReturnType<typeof io>>();

    useEffect(() => {
        if (!user) { return }

        Notification.requestPermission().then((permission) => {
            setPermission(permission);
            if (permission === "denied") {
                return;
            }
            socketRef.current = io(process.env.NEXT_PUBLIC_BACKEND_URL, {
                withCredentials: true,
            });

            socketRef.current?.on('connect_error', (err) => {
                setToast({ message: "There was an error establishing connections for notifications",  severity: Severity.Critical});
            });

            socketRef.current?.emit('join', user.accountId);

            socketRef.current?.on('auction_outbidded', (auctionName: string) => {
                new Notification("Outbidded!", {
                    body: `You have been outbid on the auction: ${auctionName}`,
                });
            }); 

            socketRef.current?.on('auction_recieved_bid', (auctionName: string) => {
                new Notification("New Bid!", {
                    body: `A new bid has been placed on your auction: ${auctionName}`,
                });
            });

            socketRef.current?.on('auction_bid_won', (auctionName: string) => {
                new Notification("Auction Won!", {
                    body: `You have won the auction: ${auctionName}`,
                });
            });

            socketRef.current?.on('auction_bid_lost', (auctionName: string) => {
                new Notification("Auction Lost!", {
                    body: `You have lost the auction: ${auctionName}`,
                });
            })

            socketRef.current?.on('auction_ending_soon', (auctionName: string) => {
                new Notification("Auction Ending Soon!", {
                    body: `The auction: ${auctionName} you bid on is ending soon`,
                });
            });

            socketRef.current?.on('auction_owning_ended', (auctionName: string) => {
                new Notification("Auction Ended!", {
                    body: `Your auction: ${auctionName} has ended`,
                });
            });
        });

        return () => {
            socketRef.current?.off('auction_outbidded');
            socketRef.current?.off('auction_recieved_bid');
            socketRef.current?.off('auction_bid_won');
            socketRef.current?.off('auction_bid_lost');
            socketRef.current?.off('auction_ending_soon');
            socketRef.current?.off('auction_owning_ended');
            socketRef.current?.disconnect();
        }
    }, [user]);

    return { permission };
}

export default useNotifications;