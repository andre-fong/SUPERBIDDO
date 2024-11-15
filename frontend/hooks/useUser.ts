import { useState, useEffect } from 'react';
import { fetchSession } from '@/utils/fetchFunctions';
import { User } from '@/types/userTypes';
import { ErrorType } from '@/types/errorTypes';

function useUser() {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        fetchSession((error: ErrorType) => {
            console.error(error);
            setUser(null);
            setLoading(false);
        })
        .then((user) => {
            console.log(user);
            setUser(user);
            setLoading(false);
        })
    }, []);

    return { user, loading };
}

export default useUser;