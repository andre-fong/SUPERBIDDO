
import React, { useEffect } from 'react';
import { ToastContainer, toast, ToastOptions } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { ErrorType, Severity } from '@/types/errorTypes';

function ErrorToast({ message, severity }: ErrorType) {
    useEffect(() => {
        // const toastOptions: ToastOptions = {
        //     style: {
        //         backgroundColor: 'white',
        //     },
        //     icon: severity === Severity.Critical ? <span>❗</span> : <span>⚠️</span>
        // };
        if (severity === Severity.Critical) {
            toast.error(message);
        } else if (severity === Severity.Warning) {
            toast.warn(message);
        } else if (severity === Severity.Info) {
            toast.info(message);
        }
    }, [message, severity]);

    return <ToastContainer />;
}

export default ErrorToast;
