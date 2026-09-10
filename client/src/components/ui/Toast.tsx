"use client";

import React, { useEffect } from "react";
import {
    CheckCircle,
    XCircle,
    AlertTriangle,
    Info,
    X,
} from "lucide-react";

export type ToastType =
    | "success"
    | "error"
    | "warning"
    | "info";

interface ToastProps {
    message: string;
    type?: ToastType;
    isOpen: boolean;
    onClose: () => void;
    duration?: number;
}

const toastConfig = {
    success: {
        icon: CheckCircle,
        iconClass: "text-emerald-600 dark:text-emerald-400",
        borderClass:
            "border-emerald-200 dark:border-emerald-800",
    },

    error: {
        icon: XCircle,
        iconClass: "text-rose-600 dark:text-rose-400",
        borderClass:
            "border-rose-200 dark:border-rose-800",
    },

    warning: {
        icon: AlertTriangle,
        iconClass: "text-amber-600 dark:text-amber-400",
        borderClass:
            "border-amber-200 dark:border-amber-800",
    },

    info: {
        icon: Info,
        iconClass: "text-blue-600 dark:text-blue-400",
        borderClass:
            "border-blue-200 dark:border-blue-800",
    },
};

export default function Toast({
    message,
    type = "success",
    isOpen,
    onClose,
    duration = 3000,
}: ToastProps) {
    useEffect(() => {
        if (!isOpen) return;

        const timer = window.setTimeout(() => {
            onClose();
        }, duration);

        return () => {
            window.clearTimeout(timer);
        };
    }, [isOpen, duration, onClose]);

    if (!isOpen) {
        return null;
    }

    const config = toastConfig[type];
    const Icon = config.icon;

    return (
        <div
            role="alert"
            className="
                fixed
                top-5
                right-5
                z-[99999]
                w-[calc(100%-2rem)]
                max-w-sm
                pointer-events-auto
            "
        >
            <div
                className={`
                    flex
                    items-center
                    gap-3
                    px-4
                    py-3.5
                    rounded-2xl
                    border
                    shadow-2xl
                    bg-white
                    dark:bg-stone-900
                    ${config.borderClass}
                `}
            >
                {/* ICON */}

                <Icon
                    className={`
                        w-5
                        h-5
                        shrink-0
                        ${config.iconClass}
                    `}
                />

                {/* MESSAGE */}

                <p
                    className="
                        flex-1
                        text-sm
                        font-medium
                        text-stone-800
                        dark:text-stone-100
                    "
                >
                    {message}
                </p>

                {/* CLOSE */}

                <button
                    type="button"
                    onClick={onClose}
                    aria-label="Close notification"
                    className="
                        shrink-0
                        p-1
                        rounded-lg
                        text-stone-400
                        hover:text-stone-700
                        hover:bg-stone-100
                        dark:hover:text-stone-200
                        dark:hover:bg-stone-800
                        transition-colors
                    "
                >
                    <X className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}