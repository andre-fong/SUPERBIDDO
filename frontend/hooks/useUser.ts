import { useState, useEffect } from "react";
import { fetchSession } from "@/utils/fetchFunctions";
import { User } from "@/types/userTypes";
import { ErrorType } from "@/types/errorTypes";

function useUser() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    fetchSession((error: ErrorType) => {
      console.warn(error);
      setUser(null);
      setLoading(false);
    }).then((user) => {
      setUser(user);
      setLoading(false);
    });
  }, []);

  return { user, loading, setUser };
}

export default useUser;
