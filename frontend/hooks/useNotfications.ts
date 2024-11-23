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

            socketRef.current.on('connect_error', (err) => {
                setToast({ message: "There was an error establishing connections for notifications",  severity: Severity.Critical});
            });

            socketRef.current?.on('auction_outbidded', (auctionName: string) => {
                console.log(auctionName);
            }); 

            socketRef.current?.on('auction_recieved_bid', (auctionName: string) => {
                console.log(auctionName);
            });

            socketRef.current?.on('auction_bid_won', (auctionName: string) => {
                console.log(auctionName);
            });

            socketRef.current?.on('auction_bid_lost', (auctionName: string) => {
                console.log(auctionName);
            })

            socketRef.current?.on('auction_bid_ending_soon', (auctionName: string) => {
                console.log(auctionName);
            });

            socketRef.current?.on('auction_owning_ended', (auctionName: string) => {
                console.log(auctionName);
            });
        });

        return () => {
            socketRef.current?.off('auction_owning_ended');
            socketRef.current?.off('auction_outbidded');
            socketRef.current?.off('auction_recieved_bid');
            socketRef.current?.off('auction_bid_won');
            socketRef.current?.off('auction_bid_lost');
            socketRef.current?.off('auction_bid_ending_soon');
            socketRef.current?.disconnect();
        }
    }, [user]);

    return { permission };
}

export default useNotifications;