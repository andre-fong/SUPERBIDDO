import { useState, useEffect } from 'react';
import { fetchSession } from '@/utils/fetchFunctions';
import { User } from '@/types/userTypes';

function useUser() {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        fetchSession().then((user) => {
            setUser(user);
            setLoading(false);
        }).catch(() => {
            setUser(null);
            setLoading(false);
        });
    }, []);

    return { user, loading };
}

export default useUser;