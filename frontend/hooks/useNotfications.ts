import { useEffect, useState } from 'react';
import { pollNotifications } from '@/utils/fetchFunctions';
import { User } from '@/types/userTypes';
import { ErrorType } from '@/types/errorTypes';

function useNotifications(user: User | null, setToast: (error: ErrorType) => void) {
    const [permission, setPermission] = useState<NotificationPermission>(Notification.permission);
    
    useEffect(() => {
        if (!user) { return }
        const controller = new AbortController();

        Notification.requestPermission().then((permission) => {
            if (permission === "denied") {
                return;
            }
            setPermission(permission);
            const signal = controller.signal;
            pollNotifications(user.accountId, setToast, (message) => { console.log(message) }, signal);
        });

        return () => {
            controller.abort("Polling aborted");
        };
    }, [user]);

    return { permission };
}

export default useNotifications;