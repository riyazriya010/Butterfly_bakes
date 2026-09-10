"use client";

import React, {
    useState,
    useEffect,
    useCallback,
} from "react";

import {
    Search,
    Plus,
    Edit2,
    Trash2,
    X,
    ChevronLeft,
    ChevronRight,
    Sparkles,
    Tags,
    AlertTriangle,
} from "lucide-react";

import axios from "axios";


import Toast, {
    ToastType,
} from "../ui/Toast"


interface OfferItem {
    _id: string;
    title: string;
    discountType: "PERCENTAGE" | "FLAT";
    discountValue: number;
    startDate: string;
    endDate: string;
    offerStatus: "ACTIVE" | "EXPIRED" | "UPCOMING";
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

interface FormData {
    title: string;
    discountType: "PERCENTAGE" | "FLAT";
    discountValue: string;
    startDate: string;
    endDate: string;
    isActive: boolean;
}

const INITIAL_FORM: FormData = {
    title: "",
    discountType: "PERCENTAGE",
    discountValue: "",
    startDate: "",
    endDate: "",
    isActive: true,
};

/* =====================================================
   DATE HELPERS
===================================================== */

function pad(value: number) {
    return String(value).padStart(2, "0");
}

function getCurrentDateTimeLocal() {
    const now = new Date();

    return [
        now.getFullYear(),
        "-",
        pad(now.getMonth() + 1),
        "-",
        pad(now.getDate()),
        "T",
        pad(now.getHours()),
        ":",
        pad(now.getMinutes()),
    ].join("");
}

function formatDateTimeLocal(value: string) {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "";
    }

    return [
        date.getFullYear(),
        "-",
        pad(date.getMonth() + 1),
        "-",
        pad(date.getDate()),
        "T",
        pad(date.getHours()),
        ":",
        pad(date.getMinutes()),
    ].join("");
}

function getDateTimeLocalPlusHours(
    value: string,
    hours: number
) {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "";
    }

    date.setHours(date.getHours() + hours);

    return [
        date.getFullYear(),
        "-",
        pad(date.getMonth() + 1),
        "-",
        pad(date.getDate()),
        "T",
        pad(date.getHours()),
        ":",
        pad(date.getMinutes()),
    ].join("");
}

function formatDate(value: string) {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "Invalid date";
    }

    return date.toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

/* =====================================================
   COMPONENT
===================================================== */

export default function OfferList() {
    const [offers, setOffers] = useState<OfferItem[]>([]);

    const [loading, setLoading] = useState(true);

    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] =
        useState("");

    const [page, setPage] = useState(1);
    const [limit] = useState(5);

    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);

    const [showModal, setShowModal] = useState(false);

    const [editingOffer, setEditingOffer] =
        useState<OfferItem | null>(null);

    const [formData, setFormData] =
        useState<FormData>(INITIAL_FORM);

    const [formErrors, setFormErrors] = useState<
        Record<string, string>
    >({});

    const [saving, setSaving] = useState(false);

    const [deleteModal, setDeleteModal] = useState<{
        open: boolean;
        offer: OfferItem | null;
    }>({
        open: false,
        offer: null,
    });

    const [deleting, setDeleting] = useState(false);

    const [togglingOfferId, setTogglingOfferId] =
        useState<string | null>(null);

    const [errorModal, setErrorModal] = useState<{
        open: boolean;
        message: string;
    }>({
        open: false,
        message: "",
    });


    // ========================================================
    // TOAST ALERT
    // ========================================================

    const [toast, setToast] = useState({
        isOpen: false,
        message: "",
        type: "success" as ToastType,
    });

    const showToast = (
        message: string,
        type: ToastType = "success"
    ) => {
        console.log('showToast', { message, type })
        setToast({
            isOpen: true,
            message,
            type,
        });
    };

    /* =====================================================
       AUTH CHECK
    ===================================================== */

    useEffect(() => {
        const checkAuth = async () => {
            try {
                await axios.get("/api/admin");
            } catch {
                window.location.href =
                    "/admin-panel/login";
            }
        };

        checkAuth();
    }, []);

    /* =====================================================
       SEARCH DEBOUNCE
    ===================================================== */

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search);
            setPage(1);
        }, 400);

        return () => clearTimeout(timer);
    }, [search]);

    /* =====================================================
       FETCH OFFERS
    ===================================================== */

    const fetchOffers = useCallback(async () => {
        try {
            setLoading(true);

            const response = await axios.get(
                "/api/admin/offer",
                {
                    params: {
                        page,
                        limit,
                        search: debouncedSearch,
                    },
                }
            );

            const result = response.data;

            /*
             * API may return:
             *
             * {
             *   success: true,
             *   data: [],
             *   pagination: {}
             * }
             *
             * or:
             *
             * {
             *   success: true,
             *   offers: [],
             *   totalPages: 1,
             *   totalItems: 10
             * }
             */

            const apiOffers = Array.isArray(
                result?.data
            )
                ? result.data
                : Array.isArray(result?.offers)
                    ? result.offers
                    : [];

            /*
             * Show only ACTIVE + UPCOMING.
             * EXPIRED offers are not displayed.
             */
            // const filteredOffers =
            //     apiOffers.filter(
            //         (offer: OfferItem) =>
            //             offer.offerStatus !==
            //             "EXPIRED"
            //     );

            setOffers(apiOffers);

            setTotalPages(
                Number(
                    result?.pagination
                        ?.totalPages ??
                    result?.totalPages ??
                    1
                )
            );

            setTotalItems(
                Number(
                    result?.pagination
                        ?.totalItems ??
                    result?.totalItems ??
                    0
                )
            );
        } catch (error: any) {
            console.error(
                "Failed to fetch offers:",
                error
            );

            setErrorModal({
                open: true,
                message:
                    error?.response?.data
                        ?.message ||
                    "Failed to load offers.",
            });

            setOffers([]);
        } finally {
            setLoading(false);
        }
    }, [
        page,
        limit,
        debouncedSearch,
    ]);

    useEffect(() => {
        fetchOffers();
    }, [fetchOffers]);

    /* =====================================================
       UPDATE FORM FIELD
    ===================================================== */

    const updateFormField = <
        K extends keyof FormData
    >(
        field: K,
        value: FormData[K]
    ) => {
        setFormData((prev) => ({
            ...prev,
            [field]: value,
        }));

        /*
         * Remove error as soon as user modifies
         * that particular field.
         */
        setFormErrors((prev) => {
            if (!prev[field]) {
                return prev;
            }

            const next = {
                ...prev,
            };

            delete next[field];

            return next;
        });
    };

    /* =====================================================
       OPEN CREATE
    ===================================================== */

    const handleCreate = () => {
        setEditingOffer(null);

        const now = getCurrentDateTimeLocal();

        setFormData({
            ...INITIAL_FORM,
            startDate: now,
            endDate:
                getDateTimeLocalPlusHours(
                    now,
                    1
                ),
        });

        setFormErrors({});
        setShowModal(true);
    };

    /* =====================================================
       OPEN EDIT
    ===================================================== */

    const handleEdit = (
        item: OfferItem
    ) => {
        setEditingOffer(item);

        setFormData({
            title: item.title,
            discountType:
                item.discountType,
            discountValue:
                String(item.discountValue),
            startDate:
                formatDateTimeLocal(
                    item.startDate
                ),
            endDate:
                formatDateTimeLocal(
                    item.endDate
                ),
            isActive: item.isActive,
        });

        setFormErrors({});
        setShowModal(true);
    };

    /* =====================================================
       CLOSE MODAL
    ===================================================== */

    const closeModal = () => {
        if (saving) {
            return;
        }

        setShowModal(false);
        setEditingOffer(null);
        setFormData(INITIAL_FORM);
        setFormErrors({});
    };

    /* =====================================================
       FORM VALIDATION
    ===================================================== */

    const validateForm = () => {
        const errors: Record<
            string,
            string
        > = {};

        /* ---------------------------------------------
           TITLE
        --------------------------------------------- */

        const title =
            formData.title.trim();

        if (!title) {
            errors.title =
                "Offer title is required.";
        } else if (title.length < 3) {
            errors.title =
                "Offer title must be at least 3 characters.";
        } else if (title.length > 100) {
            errors.title =
                "Offer title cannot exceed 100 characters.";
        }

        /* ---------------------------------------------
           DISCOUNT TYPE
        --------------------------------------------- */

        if (
            formData.discountType !==
            "PERCENTAGE" &&
            formData.discountType !==
            "FLAT"
        ) {
            errors.discountType =
                "Please select a valid discount type.";
        }

        /* ---------------------------------------------
           DISCOUNT VALUE
        --------------------------------------------- */

        const discountValueText =
            formData.discountValue.trim();

        const discountValue = Number(
            discountValueText
        );

        if (!discountValueText) {
            errors.discountValue =
                "Discount value is required.";
        } else if (
            !Number.isFinite(
                discountValue
            )
        ) {
            errors.discountValue =
                "Please enter a valid discount value.";
        } else if (
            discountValue <= 0
        ) {
            errors.discountValue =
                "Discount value must be greater than 0.";
        } else if (
            formData.discountType ===
            "PERCENTAGE" &&
            discountValue > 100
        ) {
            errors.discountValue =
                "Percentage discount cannot exceed 100%.";
        }

        /* ---------------------------------------------
           START DATE
        --------------------------------------------- */

        if (!formData.startDate) {
            errors.startDate =
                "Start date and time is required.";
        }

        /* ---------------------------------------------
           END DATE
        --------------------------------------------- */

        if (!formData.endDate) {
            errors.endDate =
                "End date and time is required.";
        }

        /* ---------------------------------------------
           DATE VALIDATION
        --------------------------------------------- */

        if (
            formData.startDate &&
            formData.endDate
        ) {
            const start = new Date(
                formData.startDate
            );

            const end = new Date(
                formData.endDate
            );

            const now = new Date();

            const startTime =
                start.getTime();

            const endTime =
                end.getTime();

            const nowTime =
                now.getTime();

            /* Invalid start date */

            if (
                Number.isNaN(startTime)
            ) {
                errors.startDate =
                    "Please enter a valid start date and time.";
            }

            /* Invalid end date */

            if (
                Number.isNaN(endTime)
            ) {
                errors.endDate =
                    "Please enter a valid end date and time.";
            }

            if (
                !Number.isNaN(startTime) &&
                !Number.isNaN(endTime)
            ) {
                /*
                 * CREATE:
                 *
                 * Start must be now/future.
                 *
                 * EDIT:
                 *
                 * Existing start dates may already
                 * be in the past.
                 */
                if (
                    !editingOffer &&
                    startTime < nowTime
                ) {
                    errors.startDate =
                        "Start date and time cannot be in the past.";
                }

                /*
                 * End must always be after start.
                 */
                if (
                    endTime <= startTime
                ) {
                    errors.endDate =
                        "End date and time must be after the start date.";
                }

                /*
                 * CREATE:
                 *
                 * End must also be in future.
                 */
                if (
                    !editingOffer &&
                    endTime <= nowTime
                ) {
                    errors.endDate =
                        "End date and time must be in the future.";
                }
            }
        }

        setFormErrors(errors);

        return (
            Object.keys(errors)
                .length === 0
        );
    };

    /* =====================================================
       SAVE OFFER
    ===================================================== */

    const handleSubmit = async (
        e: React.FormEvent<HTMLFormElement>
    ) => {
        e.preventDefault();

        const isValid =
            validateForm();

        if (!isValid) {
            return;
        }

        try {
            setSaving(true);

            const payload = {
                title:
                    formData.title.trim(),

                discountType:
                    formData.discountType,

                discountValue:
                    Number(
                        formData.discountValue
                    ),

                startDate:
                    new Date(
                        formData.startDate
                    ).toISOString(),

                endDate:
                    new Date(
                        formData.endDate
                    ).toISOString(),

                isActive:
                    formData.isActive,
            };

            if (editingOffer) {
                await axios.put(
                    `/api/admin/offer/${editingOffer._id}`,
                    payload
                );
            } else {
                await axios.post(
                    "/api/admin/offer",
                    payload
                );
            }

            setShowModal(false);
            setEditingOffer(null);
            setFormData(INITIAL_FORM);
            setFormErrors({});

            await fetchOffers();

            showToast(
                editingOffer
                    ? "Offer updated"
                    : "Offer added",
                "success"
            );
        } catch (error: any) {
            console.error(
                "Failed to save offer:",
                error
            );

            setErrorModal({
                open: true,
                message:
                    error?.response?.data
                        ?.message ||
                    "Failed to save offer.",
            });
        } finally {
            setSaving(false);
        }
    };

    /* =====================================================
       TOGGLE ENABLE / DISABLE
    ===================================================== */

    const handleToggleStatus = async (
        item: OfferItem
    ) => {
        try {
            setTogglingOfferId(
                item._id
            );

            await axios.patch(
                `/api/admin/offer/${item._id}`,
                {
                    isActive:
                        !item.isActive,
                }
            );

            await fetchOffers();

            showToast(
                item.isActive
                    ? "Offer disabled"
                    : "Offer enabled",
                "success"
            );
        } catch (error: any) {
            console.error(
                "Failed to update offer status:",
                error
            );

            setErrorModal({
                open: true,
                message:
                    error?.response?.data
                        ?.message ||
                    "Failed to update offer status.",
            });
        } finally {
            setTogglingOfferId(null);
        }
    };

    /* =====================================================
       DELETE
    ===================================================== */

    const openDeleteModal = (
        item: OfferItem
    ) => {
        setDeleteModal({
            open: true,
            offer: item,
        });
    };

    const closeDeleteModal = () => {
        if (deleting) {
            return;
        }

        setDeleteModal({
            open: false,
            offer: null,
        });
    };

    const handleDelete = async () => {
        if (!deleteModal.offer) {
            return;
        }

        try {
            setDeleting(true);

            await axios.delete(
                `/api/admin/offer/${deleteModal.offer._id}`
            );

            setDeleteModal({
                open: false,
                offer: null,
            });

            /*
             * If deleting the last item on a page,
             * go back one page.
             */
            if (
                offers.length === 1 &&
                page > 1
            ) {
                setPage(
                    (prev) =>
                        Math.max(
                            1,
                            prev - 1
                        )
                );
            } else {
                await fetchOffers();

                showToast("Offer deleted", "success");
            }
        } catch (error: any) {
            console.error(
                "Failed to delete offer:",
                error
            );

            setErrorModal({
                open: true,
                message:
                    error?.response?.data
                        ?.message ||
                    "Failed to delete offer.",
            });
        } finally {
            setDeleting(false);
        }
    };

    /* =====================================================
       DISCOUNT DISPLAY
    ===================================================== */

    const formatDiscount = (
        item: OfferItem
    ) => {
        if (
            item.discountType ===
            "PERCENTAGE"
        ) {
            return `${item.discountValue}%`;
        }

        return `₹${item.discountValue}`;
    };

    /* =====================================================
       STATUS STYLE
    ===================================================== */

    const getOfferStatusStyle = (
        status: OfferItem["offerStatus"]
    ) => {
        switch (status) {
            case "ACTIVE":
                return {
                    wrapper: `
                        bg-emerald-100
                        text-emerald-800
                        border-emerald-200
                        dark:bg-emerald-950/60
                        dark:text-emerald-300
                        dark:border-emerald-800
                    `,
                    dot: "bg-emerald-500",
                    label: "Active",
                };

            case "UPCOMING":
                return {
                    wrapper: `
                        bg-amber-100
                        text-amber-800
                        border-amber-200
                        dark:bg-amber-950/60
                        dark:text-amber-300
                        dark:border-amber-800
                    `,
                    dot: "bg-amber-500",
                    label: "Upcoming",
                };

            case "EXPIRED":
            default:
                return {
                    wrapper: `
                        bg-rose-100
                        text-rose-800
                        border-rose-200
                        dark:bg-rose-950/60
                        dark:text-rose-300
                        dark:border-rose-800
                    `,
                    dot: "bg-rose-500",
                    label: "Expired",
                };
        }
    };

    /* =====================================================
       FIELD ERROR COMPONENT
    ===================================================== */

    const FieldError = ({
        message,
    }: {
        message?: string;
    }) => {
        if (!message) {
            return null;
        }

        return (
            <p
                className="
                    mt-1.5
                    flex
                    items-start
                    gap-1
                    text-xs
                    font-medium
                    text-rose-500
                "
            >
                <span>•</span>

                <span>
                    {message}
                </span>
            </p>
        );
    };

    /* =====================================================
       RENDER
    ===================================================== */

    return (
        // <div
        //     className="
        //         min-h-screen
        //         bg-stone-50
        //         dark:bg-stone-950
        //         text-stone-900
        //         dark:text-stone-100
        //         p-4
        //         sm:p-6
        //         lg:p-8
        //     "
        // >

        <div className="min-h-screen bg-amber-50/30 dark:bg-stone-950 text-stone-800 dark:text-stone-100 pt-20 px-4 pb-4 md:pt-20 md:px-8 md:pb-8 lg:pt-8 transition-colors duration-300">


            {/* TOAST */}

            <Toast
                isOpen={toast.isOpen}
                message={toast.message}
                type={toast.type}
                onClose={() =>
                    setToast((prev) => ({
                        ...prev,
                        isOpen: false,
                    }))
                }
            />


            <div className="max-w-7xl mx-auto">

                {/* ========================================
                    HEADER
                ======================================== */}

                <div
                    className="
                        flex
                        flex-col
                        sm:flex-row
                        sm:items-center
                        sm:justify-between
                        gap-4
                        mb-6
                    "
                >
                    <div>
                        <div className="flex items-center gap-2">
                            <Tags
                                className="
                                    w-6
                                    h-6
                                    text-rose-500
                                "
                            />

                            <h1
                                className="
                                    text-2xl
                                    sm:text-3xl
                                    font-bold
                                "
                            >
                                Offers
                            </h1>
                        </div>

                        <p
                            className="
                                mt-1
                                text-sm
                                text-stone-500
                                dark:text-stone-400
                            "
                        >
                            Create and manage your
                            bakery offers
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={
                            handleCreate
                        }
                        className="
                                                        inline-flex items-center justify-center gap-2
                                                        bg-pink-600 hover:bg-pink-700
                                                        dark:bg-pink-500 dark:hover:bg-pink-600
                                                        text-white
                                                        font-medium
                                                        text-xs md:text-sm
                                                        px-5 py-2.5
                                                        rounded-full
                                                        shadow-lg
                                                        transition-all
                                                        active:scale-95
                                                        cursor-pointer
                                                    "
                    >
                        <Plus className="w-4 h-4" />

                        Add New Offer
                    </button>
                </div>

                {/* ========================================
                    SEARCH
                ======================================== */}

                <div
                    className="
        mb-5
        bg-white
        dark:bg-stone-900
        border
        border-stone-200
        dark:border-stone-800
        rounded-2xl
        p-3
        flex
        items-center
        justify-between
        gap-4
    "
                >
                    {/* Search */}
                    <div className="relative max-w-md flex-1">
                        <Search
                            className="
                absolute
                left-3
                top-1/2
                -translate-y-1/2
                w-4
                h-4
                text-stone-400
            "
                        />

                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search offers..."
                            className="
                w-full
                pl-10
                pr-4
                py-2.5
                rounded-xl
                border
                border-stone-200
                dark:border-stone-700
                bg-stone-50
                dark:bg-stone-950
                text-sm
                text-black
                dark:text-white
                outline-none
                focus:ring-2
                focus:ring-rose-400
                dark:focus:ring-rose-500
            "
                        />
                    </div>

                    {/* Count */}
                    <div className="text-xs text-stone-500 dark:text-stone-400">
                        Showing{" "}
                        <span className="font-semibold text-stone-800 dark:text-stone-200">
                            {(page - 1) * limit + 1}
                        </span>{" "}
                        {" of "}
                        <span className="font-semibold text-stone-800 dark:text-stone-200">
                            {totalItems}
                        </span>{" "}
                        Offers
                    </div>
                </div>


                {/* ========================================
                    TABLE
                ======================================== */}

                <div
                    className="
                        bg-white
                        dark:bg-stone-900
                        border
                        border-stone-200
                        dark:border-stone-800
                        rounded-2xl
                        overflow-hidden
                    "
                >
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[900px]">

                            <thead>
                                <tr
                                    className="
                                        border-b
                                        border-stone-200
                                        dark:border-stone-800
                                        bg-stone-50
                                        dark:bg-stone-950/50
                                    "
                                >
                                    <th className="text-left p-4 text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase">
                                        Offer
                                    </th>

                                    <th className="text-left p-4 text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase">
                                        Discount
                                    </th>

                                    <th className="text-left p-4 text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase">
                                        Start
                                    </th>

                                    <th className="text-left p-4 text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase">
                                        End
                                    </th>

                                    <th className="text-left p-4 text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase">
                                        Status
                                    </th>

                                    <th className="text-right p-4 text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase">
                                        Actions
                                    </th>
                                </tr>
                            </thead>

                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td
                                            colSpan={6}
                                            className="
                                                p-10
                                                text-center
                                                text-sm
                                                text-stone-500
                                            "
                                        >
                                            Loading offers...
                                        </td>
                                    </tr>
                                ) : offers.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={6}
                                            className="p-10 text-center"
                                        >
                                            <div
                                                className="
                                                    flex
                                                    flex-col
                                                    items-center
                                                    justify-center
                                                    gap-2
                                                "
                                            >
                                                <Sparkles
                                                    className="
                                                        w-8
                                                        h-8
                                                        text-stone-300
                                                        dark:text-stone-700
                                                    "
                                                />

                                                <p
                                                    className="
                                                        font-medium
                                                        text-stone-600
                                                        dark:text-stone-400
                                                    "
                                                >
                                                    No offers
                                                    found
                                                </p>

                                                <p
                                                    className="
                                                        text-xs
                                                        text-stone-400
                                                    "
                                                >
                                                    Create your
                                                    first offer
                                                    to get
                                                    started.
                                                </p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    offers.map(
                                        (item) => {
                                            const statusStyle =
                                                getOfferStatusStyle(
                                                    item.offerStatus
                                                );

                                            const isToggling =
                                                togglingOfferId ===
                                                item._id;

                                            return (
                                                <tr
                                                    key={
                                                        item._id
                                                    }
                                                    className="
                                                        border-b
                                                        border-stone-100
                                                        dark:border-stone-800
                                                        last:border-b-0
                                                        hover:bg-stone-50
                                                        dark:hover:bg-stone-800/40
                                                        transition
                                                    "
                                                >
                                                    {/* OFFER */}

                                                    <td className="p-4">
                                                        <div>
                                                            <p
                                                                className="
                                                                    font-semibold
                                                                    text-stone-900
                                                                    dark:text-stone-100
                                                                "
                                                            >
                                                                {
                                                                    item.title
                                                                }
                                                            </p>

                                                            {/* <p
                                                                className={`
                                                                    text-[11px]
                                                                    mt-0.5
                                                                    ${item.offerStatus ===
                                                                        "ACTIVE"
                                                                        ? "text-emerald-600 dark:text-emerald-400"
                                                                        : "text-amber-600 dark:text-amber-400"
                                                                    }
                                                                `}
                                                            >
                                                                {item.offerStatus ===
                                                                    "ACTIVE"
                                                                    ? "Currently active"
                                                                    : "Scheduled"}
                                                            </p> */}

                                                        </div>
                                                    </td>

                                                    {/* DISCOUNT */}

                                                    <td className="p-4">
                                                        <div>
                                                            <p
                                                                className="
                                                                    font-semibold
                                                                    text-rose-500
                                                                    dark:text-rose-400
                                                                "
                                                            >
                                                                {formatDiscount(
                                                                    item
                                                                )}
                                                            </p>

                                                            <p
                                                                className="
                                                                    text-[11px]
                                                                    text-stone-400
                                                                    mt-0.5
                                                                "
                                                            >
                                                                {
                                                                    item.discountType
                                                                }
                                                            </p>
                                                        </div>
                                                    </td>

                                                    {/* START */}

                                                    <td className="p-4">
                                                        <p
                                                            className="
                                                                text-sm
                                                                text-stone-700
                                                                dark:text-stone-300
                                                            "
                                                        >
                                                            {formatDate(
                                                                item.startDate
                                                            )}
                                                        </p>
                                                    </td>

                                                    {/* END */}

                                                    <td className="p-4">
                                                        <p
                                                            className="
                                                                text-sm
                                                                text-stone-700
                                                                dark:text-stone-300
                                                            "
                                                        >
                                                            {formatDate(
                                                                item.endDate
                                                            )}
                                                        </p>
                                                    </td>

                                                    {/* STATUS */}

                                                    <td className="p-4">
                                                        <div
                                                            className="
                                                                flex
                                                                flex-col
                                                                items-start
                                                                gap-1.5
                                                            "
                                                        >
                                                            <span
                                                                className={`
                                                                    inline-flex
                                                                    items-center
                                                                    gap-1.5
                                                                    px-3
                                                                    py-1
                                                                    rounded-full
                                                                    text-[11px]
                                                                    font-medium
                                                                    border
                                                                    ${statusStyle.wrapper}
                                                                `}
                                                            >
                                                                <span
                                                                    className={`
                                                                        w-1.5
                                                                        h-1.5
                                                                        rounded-full
                                                                        ${statusStyle.dot}
                                                                    `}
                                                                />

                                                                {
                                                                    statusStyle.label
                                                                }
                                                            </span>

                                                            <button
                                                                type="button"
                                                                disabled={
                                                                    isToggling
                                                                }
                                                                onClick={() =>
                                                                    handleToggleStatus(
                                                                        item
                                                                    )
                                                                }
                                                                className={`
                                                                    inline-flex
                                                                    items-center
                                                                    gap-1.5
                                                                    px-3
                                                                    py-1
                                                                    rounded-full
                                                                    text-[10px]
                                                                    font-medium
                                                                    transition-colors
                                                                    border
                                                                    ${item.isActive
                                                                        ? `
                                                                                bg-stone-100
                                                                                text-stone-700
                                                                                border-stone-200
                                                                                dark:bg-stone-800
                                                                                dark:text-stone-300
                                                                                dark:border-stone-700
                                                                            `
                                                                        : `
                                                                                bg-stone-50
                                                                                text-stone-400
                                                                                border-stone-200
                                                                                dark:bg-stone-900
                                                                                dark:text-stone-500
                                                                                dark:border-stone-800
                                                                            `
                                                                    }
                                                                    ${isToggling
                                                                        ? "opacity-50 cursor-not-allowed"
                                                                        : "cursor-pointer"
                                                                    }
                                                                `}
                                                            >
                                                                <span
                                                                    className={`
                                                                        w-1.5
                                                                        h-1.5
                                                                        rounded-full
                                                                        ${item.isActive
                                                                            ? "bg-emerald-500"
                                                                            : "bg-stone-400"
                                                                        }
                                                                    `}
                                                                />

                                                                {isToggling
                                                                    ? "Updating..."
                                                                    : item.isActive
                                                                        ? "Enabled"
                                                                        : "Disabled"}
                                                            </button>
                                                        </div>
                                                    </td>

                                                    {/* ACTIONS */}

                                                    <td className="p-4">
                                                        <div
                                                            className="
                                                                flex
                                                                items-center
                                                                justify-end
                                                                gap-2
                                                            "
                                                        >
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    handleEdit(
                                                                        item
                                                                    )
                                                                }
                                                                className="
                                                                    p-2
                                                                    rounded-lg
                                                                    text-stone-500
                                                                    hover:text-stone-900
                                                                    hover:bg-stone-100
                                                                    dark:text-stone-400
                                                                    dark:hover:text-stone-100
                                                                    dark:hover:bg-stone-800
                                                                    transition
                                                                    cursor-pointer
                                                                "
                                                                title="Edit offer"
                                                            >
                                                                <Edit2 className="w-4 h-4" />
                                                            </button>

                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    openDeleteModal(
                                                                        item
                                                                    )
                                                                }
                                                                className="
                                                                    p-2
                                                                    rounded-lg
                                                                    text-stone-500
                                                                    hover:text-rose-600
                                                                    hover:bg-rose-50
                                                                    dark:text-stone-400
                                                                    dark:hover:text-rose-400
                                                                    dark:hover:bg-rose-950/30
                                                                    transition
                                                                    cursor-pointer
                                                                "
                                                                title="Delete offer"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        }
                                    )
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* ========================================
                        PAGINATION
                    ======================================== */}

                    {/* {!loading &&
                        totalItems > 0 && (
                            <div
                                className="
                                    flex
                                    flex-col
                                    sm:flex-row
                                    sm:items-center
                                    sm:justify-between
                                    gap-3
                                    px-4
                                    py-3
                                    border-t
                                    border-stone-200
                                    dark:border-stone-800
                                "
                            >
                                <p
                                    className="
                                        text-xs
                                        text-stone-500
                                        dark:text-stone-400
                                    "
                                >
                                    Showing{" "}
                                    <span className="font-semibold">
                                        {(page - 1) *
                                            limit +
                                            1}
                                    </span>{" "}
                                    -
                                    <span className="font-semibold">
                                        {" "}
                                        {Math.min(
                                            page *
                                            limit,
                                            totalItems
                                        )}
                                    </span>{" "}
                                    of{" "}
                                    <span className="font-semibold">
                                        {totalItems}
                                    </span>{" "}
                                    offers
                                </p>

                                <div
                                    className="
                                        flex
                                        items-center
                                        gap-2
                                    "
                                >
                                    <button
                                        type="button"
                                        disabled={
                                            page <= 1
                                        }
                                        onClick={() =>
                                            setPage(
                                                (
                                                    prev
                                                ) =>
                                                    Math.max(
                                                        1,
                                                        prev -
                                                        1
                                                    )
                                            )
                                        }
                                        className="
                                            p-2
                                            rounded-lg
                                            border
                                            border-stone-200
                                            dark:border-stone-700
                                            disabled:opacity-40
                                            disabled:cursor-not-allowed
                                            hover:bg-stone-100
                                            dark:hover:bg-stone-800
                                            transition
                                            cursor-pointer
                                        "
                                    >
                                        <ChevronLeft className="w-4 h-4" />
                                    </button>

                                    <span
                                        className="
                                            text-xs
                                            font-medium
                                            min-w-[80px]
                                            text-center
                                        "
                                    >
                                        Page {page} of{" "}
                                        {totalPages}
                                    </span>

                                    <button
                                        type="button"
                                        disabled={
                                            page >=
                                            totalPages
                                        }
                                        onClick={() =>
                                            setPage(
                                                (
                                                    prev
                                                ) =>
                                                    Math.min(
                                                        totalPages,
                                                        prev +
                                                        1
                                                    )
                                            )
                                        }
                                        className="
                                            p-2
                                            rounded-lg
                                            border
                                            border-stone-200
                                            dark:border-stone-700
                                            disabled:opacity-40
                                            disabled:cursor-not-allowed
                                            hover:bg-stone-100
                                            dark:hover:bg-stone-800
                                            transition
                                            cursor-pointer
                                        "
                                    >
                                        <ChevronRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        )} */}


                    {!loading &&
                        totalItems > 0 && (
                            <div
                                className="
                flex
                items-center
                justify-between
                px-5
                md:px-6
                py-4
                border-t
                border-stone-200/80
                dark:border-stone-800
                bg-stone-50/30
                dark:bg-stone-950/30
            "
                            >
                                {/* Page count */}
                                <span
                                    className="
                    text-xs
                    text-stone-500
                    dark:text-stone-400
                "
                                >
                                    Page{" "}
                                    <span
                                        className="
                        font-semibold
                        text-stone-800
                        dark:text-stone-200
                    "
                                    >
                                        {page}
                                    </span>{" "}
                                    of{" "}
                                    <span
                                        className="
                        font-semibold
                        text-stone-800
                        dark:text-stone-200
                    "
                                    >
                                        {totalPages}
                                    </span>
                                </span>

                                {/* Navigation */}
                                <div className="flex items-center gap-2">
                                    {/* Previous */}
                                    <button
                                        type="button"
                                        disabled={page <= 1}
                                        onClick={() =>
                                            setPage((prev) =>
                                                Math.max(1, prev - 1)
                                            )
                                        }
                                        className="
                        p-2
                        rounded-xl
                        border
                        border-stone-200
                        dark:border-stone-800
                        disabled:opacity-40
                        disabled:cursor-not-allowed
                        hover:bg-stone-100
                        dark:hover:bg-stone-800
                        text-stone-600
                        dark:text-stone-300
                        transition-colors
                    "
                                    >
                                        <ChevronLeft className="w-4 h-4" />
                                    </button>

                                    {/* Next */}
                                    <button
                                        type="button"
                                        disabled={page >= totalPages}
                                        onClick={() =>
                                            setPage((prev) =>
                                                Math.min(
                                                    totalPages,
                                                    prev + 1
                                                )
                                            )
                                        }
                                        className="
                        p-2
                        rounded-xl
                        border
                        border-stone-200
                        dark:border-stone-800
                        disabled:opacity-40
                        disabled:cursor-not-allowed
                        hover:bg-stone-100
                        dark:hover:bg-stone-800
                        text-stone-600
                        dark:text-stone-300
                        transition-colors
                    "
                                    >
                                        <ChevronRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        )}
                </div>
            </div>

            {/* =================================================
                CREATE / EDIT MODAL
            ================================================= */}

            {showModal && (
                <div
                    className="
                        fixed
                        inset-0
                        z-50
                        flex
                        items-center
                        justify-center
                        p-4
                        bg-black/50
                        backdrop-blur-sm
                    "
                    onMouseDown={(e) => {
                        if (
                            e.target ===
                            e.currentTarget
                        ) {
                            closeModal();
                        }
                    }}
                >
                    <div
                        className="
                            w-full
                            max-w-lg
                            max-h-[90vh]
                            overflow-y-auto
                            bg-white
                            dark:bg-stone-900
                            rounded-2xl
                            shadow-2xl
                            border
                            border-stone-200
                            dark:border-stone-800
                        "
                    >
                        {/* MODAL HEADER */}

                        <div
                            className="
                                flex
                                items-center
                                justify-between
                                p-5
                                border-b
                                border-stone-200
                                dark:border-stone-800
                            "
                        >
                            <div>
                                <h2
                                    className="
                                        text-lg
                                        font-bold
                                    "
                                >
                                    {editingOffer
                                        ? "Edit Offer"
                                        : "Create Offer"}
                                </h2>

                                <p
                                    className="
                                        text-xs
                                        text-stone-500
                                        dark:text-stone-400
                                        mt-1
                                    "
                                >
                                    {editingOffer
                                        ? "Update offer details"
                                        : "Create a new bakery offer"}
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={
                                    closeModal
                                }
                                disabled={saving}
                                className="
                                    p-2
                                    rounded-lg
                                    hover:bg-stone-100
                                    dark:hover:bg-stone-800
                                    transition
                                    cursor-pointer
                                    disabled:opacity-50
                                "
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* FORM */}

                        <form
                            onSubmit={
                                handleSubmit
                            }
                            noValidate
                            className="p-5 space-y-5"
                        >
                            {/* TITLE */}

                            <div>
                                <label
                                    className="
                                        block
                                        text-sm
                                        font-medium
                                        mb-1.5
                                    "
                                >
                                    Offer Title
                                </label>

                                <input
                                    type="text"
                                    value={
                                        formData.title
                                    }
                                    onChange={(e) =>
                                        updateFormField(
                                            "title",
                                            e.target.value
                                        )
                                    }
                                    placeholder="e.g. Weekend Special"
                                    maxLength={100}
                                    className={`
                                        w-full
                                        px-3
                                        py-2.5
                                        rounded-xl
                                        border
                                        bg-stone-50
                                        dark:bg-stone-950
                                        outline-none
                                        text-sm
                                        transition
                                        ${formErrors.title
                                            ? "border-rose-500 focus:ring-2 focus:ring-rose-200 dark:focus:ring-rose-900"
                                            : "border-stone-200 dark:border-stone-700 focus:ring-2 focus:ring-rose-400"
                                        }
                                    `}
                                />

                                <FieldError
                                    message={
                                        formErrors.title
                                    }
                                />
                            </div>

                            {/* DISCOUNT */}

                            <div
                                className="
                                    grid
                                    grid-cols-1
                                    sm:grid-cols-2
                                    gap-4
                                "
                            >
                                {/* TYPE */}

                                <div>
                                    <label
                                        className="
                                            block
                                            text-sm
                                            font-medium
                                            mb-1.5
                                        "
                                    >
                                        Discount Type
                                    </label>

                                    <select
                                        value={
                                            formData.discountType
                                        }
                                        onChange={(
                                            e
                                        ) =>
                                            updateFormField(
                                                "discountType",
                                                e.target
                                                    .value as
                                                | "PERCENTAGE"
                                                | "FLAT"
                                            )
                                        }
                                        className={`
                                            w-full
                                            px-3
                                            py-2.5
                                            rounded-xl
                                            border
                                            bg-stone-50
                                            dark:bg-stone-950
                                            text-sm
                                            outline-none
                                            transition
                                            ${formErrors.discountType
                                                ? "border-rose-500"
                                                : "border-stone-200 dark:border-stone-700"
                                            }
                                            focus:ring-2
                                            focus:ring-rose-400
                                        `}
                                    >
                                        <option value="PERCENTAGE">
                                            Percentage
                                        </option>

                                        <option value="FLAT">
                                            Flat Amount
                                        </option>
                                    </select>

                                    <FieldError
                                        message={
                                            formErrors.discountType
                                        }
                                    />
                                </div>

                                {/* VALUE */}

                                <div>
                                    <label
                                        className="
                                            block
                                            text-sm
                                            font-medium
                                            mb-1.5
                                        "
                                    >
                                        Discount Value
                                    </label>

                                    <input
                                        type="number"
                                        min="0.01"
                                        max={
                                            formData.discountType ===
                                                "PERCENTAGE"
                                                ? "100"
                                                : undefined
                                        }
                                        step="0.01"
                                        value={
                                            formData.discountValue
                                        }
                                        onChange={(
                                            e
                                        ) =>
                                            updateFormField(
                                                "discountValue",
                                                e.target
                                                    .value
                                            )
                                        }
                                        placeholder={
                                            formData.discountType ===
                                                "PERCENTAGE"
                                                ? "10"
                                                : "100"
                                        }
                                        className={`
                                            w-full
                                            px-3
                                            py-2.5
                                            rounded-xl
                                            border
                                            bg-stone-50
                                            dark:bg-stone-950
                                            text-sm
                                            outline-none
                                            transition
                                            ${formErrors.discountValue
                                                ? "border-rose-500"
                                                : "border-stone-200 dark:border-stone-700"
                                            }
                                            focus:ring-2
                                            focus:ring-rose-400
                                        `}
                                    />

                                    <FieldError
                                        message={
                                            formErrors.discountValue
                                        }
                                    />
                                </div>
                            </div>

                            {/* START DATE */}

                            <div>
                                <label
                                    className="
                                        block
                                        text-sm
                                        font-medium
                                        mb-1.5
                                    "
                                >
                                    Start Date & Time
                                </label>

                                <input
                                    type="datetime-local"
                                    min={
                                        editingOffer
                                            ? undefined
                                            : getCurrentDateTimeLocal()
                                    }
                                    value={
                                        formData.startDate
                                    }
                                    onChange={(e) => {
                                        const value =
                                            e.target
                                                .value;

                                        updateFormField(
                                            "startDate",
                                            value
                                        );

                                        /*
                                         * Immediately show
                                         * end-date error if
                                         * it became invalid.
                                         */
                                        if (
                                            value &&
                                            formData.endDate &&
                                            new Date(
                                                formData.endDate
                                            ) <=
                                            new Date(
                                                value
                                            )
                                        ) {
                                            setFormErrors(
                                                (
                                                    prev
                                                ) => ({
                                                    ...prev,
                                                    endDate:
                                                        "End date and time must be after the start date.",
                                                })
                                            );
                                        }
                                    }}
                                    className={`
                                        w-full
                                        px-3
                                        py-2.5
                                        rounded-xl
                                        border
                                        bg-stone-50
                                        dark:bg-stone-950
                                        text-sm
                                        outline-none
                                        transition
                                        ${formErrors.startDate
                                            ? "border-rose-500"
                                            : "border-stone-200 dark:border-stone-700"
                                        }
                                        focus:ring-2
                                        focus:ring-rose-400
                                    `}
                                />

                                <FieldError
                                    message={
                                        formErrors.startDate
                                    }
                                />
                            </div>

                            {/* END DATE */}

                            <div>
                                <label
                                    className="
                                        block
                                        text-sm
                                        font-medium
                                        mb-1.5
                                    "
                                >
                                    End Date & Time
                                </label>

                                <input
                                    type="datetime-local"
                                    min={
                                        formData.startDate ||
                                        getCurrentDateTimeLocal()
                                    }
                                    value={
                                        formData.endDate
                                    }
                                    onChange={(e) =>
                                        updateFormField(
                                            "endDate",
                                            e.target
                                                .value
                                        )
                                    }
                                    className={`
                                        w-full
                                        px-3
                                        py-2.5
                                        rounded-xl
                                        border
                                        bg-stone-50
                                        dark:bg-stone-950
                                        text-sm
                                        outline-none
                                        transition
                                        ${formErrors.endDate
                                            ? "border-rose-500"
                                            : "border-stone-200 dark:border-stone-700"
                                        }
                                        focus:ring-2
                                        focus:ring-rose-400
                                    `}
                                />

                                <FieldError
                                    message={
                                        formErrors.endDate
                                    }
                                />
                            </div>

                            {/* ENABLE */}

                            <div
                                className="
                                    flex
                                    items-center
                                    justify-between
                                    p-3
                                    rounded-xl
                                    bg-stone-50
                                    dark:bg-stone-950
                                    border
                                    border-stone-200
                                    dark:border-stone-800
                                "
                            >
                                <div>
                                    <p
                                        className="
                                            text-sm
                                            font-medium
                                        "
                                    >
                                        Enable offer
                                    </p>

                                    <p
                                        className="
                                            text-xs
                                            text-stone-500
                                            dark:text-stone-400
                                        "
                                    >
                                        Allow this offer
                                        to be used
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    onClick={() =>
                                        updateFormField(
                                            "isActive",
                                            !formData.isActive
                                        )
                                    }
                                    className={`
                                        relative
                                        w-11
                                        h-6
                                        rounded-full
                                        transition
                                        cursor-pointer
                                        ${formData.isActive
                                            ? "bg-emerald-500"
                                            : "bg-stone-300 dark:bg-stone-700"
                                        }
                                    `}
                                >
                                    <span
                                        className={`
                                            absolute
                                            top-0.5
                                            w-5
                                            h-5
                                            rounded-full
                                            bg-white
                                            shadow
                                            transition
                                            ${formData.isActive
                                                ? "left-5"
                                                : "left-0.5"
                                            }
                                        `}
                                    />
                                </button>
                            </div>

                            {/* BUTTONS */}

                            <div
                                className="
                                    flex
                                    gap-3
                                    pt-2
                                "
                            >
                                <button
                                    type="button"
                                    onClick={
                                        closeModal
                                    }
                                    disabled={
                                        saving
                                    }
                                    className="
                                        flex-1
                                        px-4
                                        py-2.5
                                        rounded-xl
                                        border
                                        border-stone-200
                                        dark:border-stone-700
                                        text-sm
                                        font-medium
                                        hover:bg-stone-100
                                        dark:hover:bg-stone-800
                                        transition
                                        disabled:opacity-50
                                        cursor-pointer
                                    "
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    disabled={
                                        saving
                                    }
                                    className="
                                        flex-1
                                        px-4
                                        py-2.5
                                        rounded-xl
                                        bg-stone-900
                                        dark:bg-stone-100
                                        text-white
                                        dark:text-stone-900
                                        text-sm
                                        font-semibold
                                        hover:bg-stone-800
                                        dark:hover:bg-stone-200
                                        transition
                                        disabled:opacity-50
                                        cursor-pointer
                                    "
                                >
                                    {saving
                                        ? "Saving..."
                                        : editingOffer
                                            ? "Update Offer"
                                            : "Create Offer"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* =================================================
                DELETE MODAL
            ================================================= */}

            {deleteModal.open &&
                deleteModal.offer && (
                    <div
                        className="
                            fixed
                            inset-0
                            z-[60]
                            flex
                            items-center
                            justify-center
                            p-4
                            bg-black/50
                            backdrop-blur-sm
                        "
                    >
                        <div
                            className="
                                w-full
                                max-w-sm
                                bg-white
                                dark:bg-stone-900
                                rounded-2xl
                                border
                                border-stone-200
                                dark:border-stone-800
                                shadow-2xl
                                p-6
                            "
                        >
                            <div
                                className="
                                    w-12
                                    h-12
                                    rounded-full
                                    bg-rose-100
                                    dark:bg-rose-950/50
                                    flex
                                    items-center
                                    justify-center
                                    mb-4
                                "
                            >
                                <AlertTriangle
                                    className="
                                        w-6
                                        h-6
                                        text-rose-500
                                    "
                                />
                            </div>

                            <h3
                                className="
                                    text-lg
                                    font-bold
                                "
                            >
                                Delete Offer?
                            </h3>

                            <p
                                className="
                                    text-sm
                                    text-stone-500
                                    dark:text-stone-400
                                    mt-2
                                    leading-6
                                "
                            >
                                Are you sure you want
                                to delete{" "}
                                <span
                                    className="
                                        font-semibold
                                        text-stone-800
                                        dark:text-stone-200
                                    "
                                >
                                    "
                                    {
                                        deleteModal
                                            .offer
                                            .title
                                    }
                                    "
                                </span>
                                ? This action cannot
                                be undone.
                            </p>

                            <div
                                className="
                                    flex
                                    gap-3
                                    mt-6
                                "
                            >
                                <button
                                    type="button"
                                    onClick={
                                        closeDeleteModal
                                    }
                                    disabled={
                                        deleting
                                    }
                                    className="
                                        flex-1
                                        px-4
                                        py-2.5
                                        rounded-xl
                                        border
                                        border-stone-200
                                        dark:border-stone-700
                                        text-sm
                                        font-medium
                                        hover:bg-stone-100
                                        dark:hover:bg-stone-800
                                        transition
                                        cursor-pointer
                                        disabled:opacity-50
                                    "
                                >
                                    Cancel
                                </button>

                                <button
                                    type="button"
                                    onClick={
                                        handleDelete
                                    }
                                    disabled={
                                        deleting
                                    }
                                    className="
                                        flex-1
                                        px-4
                                        py-2.5
                                        rounded-xl
                                        bg-rose-500
                                        text-white
                                        text-sm
                                        font-semibold
                                        hover:bg-rose-600
                                        transition
                                        disabled:opacity-50
                                        cursor-pointer
                                    "
                                >
                                    {deleting
                                        ? "Deleting..."
                                        : "Delete"}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

            {/* =================================================
                ERROR MODAL
            ================================================= */}

            {errorModal.open && (
                <div
                    className="
                        fixed
                        inset-0
                        z-[70]
                        flex
                        items-center
                        justify-center
                        p-4
                        bg-black/50
                        backdrop-blur-sm
                    "
                >
                    <div
                        className="
                            w-full
                            max-w-sm
                            bg-white
                            dark:bg-stone-900
                            rounded-2xl
                            border
                            border-stone-200
                            dark:border-stone-800
                            shadow-2xl
                            p-6
                        "
                    >
                        <div
                            className="
                                w-12
                                h-12
                                rounded-full
                                bg-rose-100
                                dark:bg-rose-950/50
                                flex
                                items-center
                                justify-center
                                mb-4
                            "
                        >
                            <AlertTriangle
                                className="
                                    w-6
                                    h-6
                                    text-rose-500
                                "
                            />
                        </div>

                        <h3
                            className="
                                text-lg
                                font-bold
                            "
                        >
                            Something went wrong
                        </h3>

                        <p
                            className="
                                text-sm
                                text-stone-500
                                dark:text-stone-400
                                mt-2
                                leading-6
                            "
                        >
                            {
                                errorModal.message
                            }
                        </p>

                        <button
                            type="button"
                            onClick={() =>
                                setErrorModal({
                                    open: false,
                                    message: "",
                                })
                            }
                            className="
                                w-full
                                mt-6
                                px-4
                                py-2.5
                                rounded-xl
                                bg-stone-900
                                dark:bg-stone-100
                                text-white
                                dark:text-stone-900
                                text-sm
                                font-semibold
                                hover:bg-stone-800
                                dark:hover:bg-stone-200
                                transition
                                cursor-pointer
                            "
                        >
                            Okay
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}







// "use client";

// import React, {
//     useState,
//     useEffect,
//     useCallback,
// } from "react";

// import {
//     Search,
//     Plus,
//     Edit2,
//     Trash2,
//     X,
//     ChevronLeft,
//     ChevronRight,
//     Sparkles,
//     AlertTriangle,
// } from "lucide-react";

// import axios from "axios";

// interface OfferItem {
//     _id: string;
//     title: string;
//     discountType: "PERCENTAGE" | "FLAT";
//     discountValue: number;
//     startDate: string;
//     endDate: string;
//     offerStatus: "ACTIVE" | "EXPIRED" | "UPCOMING";
//     isActive: boolean;
//     createdAt: string;
//     updatedAt: string;
// }

// interface FormData {
//     title: string;
//     discountType: "PERCENTAGE" | "FLAT";
//     discountValue: string;
//     startDate: string;
//     endDate: string;
//     isActive: boolean;
// }

// const INITIAL_FORM: FormData = {
//     title: "",
//     discountType: "PERCENTAGE",
//     discountValue: "",
//     startDate: "",
//     endDate: "",
//     isActive: true,
// };

// function pad(value: number) {
//     return String(value).padStart(2, "0");
// }

// function getCurrentDateTimeLocal() {
//     const now = new Date();

//     return [
//         now.getFullYear(),
//         "-",
//         pad(now.getMonth() + 1),
//         "-",
//         pad(now.getDate()),
//         "T",
//         pad(now.getHours()),
//         ":",
//         pad(now.getMinutes()),
//     ].join("");
// }

// function formatDateTimeLocal(value: string) {
//     const date = new Date(value);

//     return [
//         date.getFullYear(),
//         "-",
//         pad(date.getMonth() + 1),
//         "-",
//         pad(date.getDate()),
//         "T",
//         pad(date.getHours()),
//         ":",
//         pad(date.getMinutes()),
//     ].join("");
// }

// function getDateTimeLocalPlusHours(
//     value: string,
//     hours: number
// ) {
//     const date = new Date(value);

//     date.setHours(date.getHours() + hours);

//     return [
//         date.getFullYear(),
//         "-",
//         pad(date.getMonth() + 1),
//         "-",
//         pad(date.getDate()),
//         "T",
//         pad(date.getHours()),
//         ":",
//         pad(date.getMinutes()),
//     ].join("");
// }

// function formatDate(value: string) {
//     return new Date(value).toLocaleString("en-IN", {
//         day: "2-digit",
//         month: "short",
//         year: "numeric",
//         hour: "2-digit",
//         minute: "2-digit",
//     });
// }

// export default function OfferList() {
//     const [offers, setOffers] = useState<OfferItem[]>([]);

//     const [loading, setLoading] = useState(true);

//     const [search, setSearch] = useState("");
//     const [debouncedSearch, setDebouncedSearch] = useState("");

//     const [page, setPage] = useState(1);
//     const [limit] = useState(5);

//     const [totalPages, setTotalPages] = useState(1);
//     const [totalItems, setTotalItems] = useState(0);

//     const [showModal, setShowModal] = useState(false);
//     const [editingOffer, setEditingOffer] =
//         useState<OfferItem | null>(null);

//     const [formData, setFormData] =
//         useState<FormData>(INITIAL_FORM);

//     const [formErrors, setFormErrors] = useState<
//         Record<string, string>
//     >({});

//     const [saving, setSaving] = useState(false);

//     const [deleteModal, setDeleteModal] = useState<{
//         open: boolean;
//         offer: OfferItem | null;
//     }>({
//         open: false,
//         offer: null,
//     });

//     const [deleting, setDeleting] = useState(false);

//     const [errorModal, setErrorModal] = useState<{
//         open: boolean;
//         message: string;
//     }>({
//         open: false,
//         message: "",
//     });

//     /* -----------------------------------------
//        AUTH CHECK
//     ----------------------------------------- */

//     useEffect(() => {
//         const checkAuth = async () => {
//             try {
//                 await axios.get("/api/admin");
//             } catch {
//                 window.location.href =
//                     "/admin-panel/login";
//             }
//         };

//         checkAuth();
//     }, []);

//     /* -----------------------------------------
//        SEARCH DEBOUNCE
//     ----------------------------------------- */

//     useEffect(() => {
//         const timer = setTimeout(() => {
//             setDebouncedSearch(search);
//             setPage(1);
//         }, 400);

//         return () => clearTimeout(timer);
//     }, [search]);

//     /* -----------------------------------------
//        FETCH OFFERS
//     ----------------------------------------- */

//     const fetchOffers = useCallback(async () => {
//         try {
//             setLoading(true);

//             const response = await axios.get(
//                 "/api/admin/offer",
//                 {
//                     params: {
//                         page,
//                         limit,
//                         search: debouncedSearch,
//                     },
//                 }
//             );

//             const result = response.data;

//             setOffers(
//                 result?.data ||
//                     result?.offers ||
//                     []
//             );

//             setTotalPages(
//                 result?.pagination?.totalPages ||
//                     result?.totalPages ||
//                     1
//             );

//             setTotalItems(
//                 result?.pagination?.totalItems ||
//                     result?.totalItems ||
//                     0
//             );
//         } catch (error: any) {
//             console.error(
//                 "Failed to fetch offers:",
//                 error
//             );

//             setErrorModal({
//                 open: true,
//                 message:
//                     error?.response?.data?.message ||
//                     "Failed to load offers.",
//             });
//         } finally {
//             setLoading(false);
//         }
//     }, [page, limit, debouncedSearch]);

//     useEffect(() => {
//         fetchOffers();
//     }, [fetchOffers]);

//     /* -----------------------------------------
//        OPEN CREATE
//     ----------------------------------------- */

//     const handleCreate = () => {
//         setEditingOffer(null);

//         const now = getCurrentDateTimeLocal();

//         setFormData({
//             ...INITIAL_FORM,
//             startDate: now,
//             endDate: getDateTimeLocalPlusHours(
//                 now,
//                 1
//             ),
//         });

//         setFormErrors({});
//         setShowModal(true);
//     };

//     /* -----------------------------------------
//        OPEN EDIT
//     ----------------------------------------- */

//     const handleEdit = (item: OfferItem) => {
//         setEditingOffer(item);

//         setFormData({
//             title: item.title,
//             discountType: item.discountType,
//             discountValue:
//                 String(item.discountValue),
//             startDate:
//                 formatDateTimeLocal(
//                     item.startDate
//                 ),
//             endDate:
//                 formatDateTimeLocal(
//                     item.endDate
//                 ),
//             isActive: item.isActive,
//         });

//         setFormErrors({});
//         setShowModal(true);
//     };

//     /* -----------------------------------------
//        CLOSE MODAL
//     ----------------------------------------- */

//     const closeModal = () => {
//         if (saving) return;

//         setShowModal(false);
//         setEditingOffer(null);
//         setFormData(INITIAL_FORM);
//         setFormErrors({});
//     };

//     /* -----------------------------------------
//        FORM VALIDATION
//     ----------------------------------------- */

//     const validateForm = () => {
//         const errors: Record<
//             string,
//             string
//         > = {};

//         if (!formData.title.trim()) {
//             errors.title =
//                 "Offer title is required";
//         }

//         if (
//             formData.discountType !==
//                 "PERCENTAGE" &&
//             formData.discountType !== "FLAT"
//         ) {
//             errors.discountType =
//                 "Invalid discount type";
//         }

//         const discountValue = Number(
//             formData.discountValue
//         );

//         if (
//             !formData.discountValue ||
//             Number.isNaN(discountValue) ||
//             discountValue <= 0
//         ) {
//             errors.discountValue =
//                 "Discount value must be greater than 0";
//         }

//         if (
//             formData.discountType ===
//                 "PERCENTAGE" &&
//             discountValue > 100
//         ) {
//             errors.discountValue =
//                 "Percentage discount cannot exceed 100%";
//         }

//         if (!formData.startDate) {
//             errors.startDate =
//                 "Start date is required";
//         }

//         if (!formData.endDate) {
//             errors.endDate =
//                 "End date is required";
//         }

//         if (
//             formData.startDate &&
//             formData.endDate
//         ) {
//             const start = new Date(
//                 formData.startDate
//             );

//             const end = new Date(
//                 formData.endDate
//             );

//             const now = new Date();

//             if (start < now) {
//                 errors.startDate =
//                     "Start date cannot be in the past";
//             }

//             if (end <= start) {
//                 errors.endDate =
//                     "End date must be after start date";
//             }

//             if (end < now) {
//                 errors.endDate =
//                     "End date cannot be in the past";
//             }
//         }

//         setFormErrors(errors);

//         return Object.keys(errors).length === 0;
//     };

//     /* -----------------------------------------
//        SAVE OFFER
//     ----------------------------------------- */

//     const handleSubmit = async (
//         e: React.FormEvent
//     ) => {
//         e.preventDefault();

//         if (!validateForm()) {
//             return;
//         }

//         try {
//             setSaving(true);

//             const payload = {
//                 title: formData.title.trim(),
//                 discountType:
//                     formData.discountType,
//                 discountValue: Number(
//                     formData.discountValue
//                 ),
//                 startDate: new Date(
//                     formData.startDate
//                 ).toISOString(),
//                 endDate: new Date(
//                     formData.endDate
//                 ).toISOString(),
//                 isActive:
//                     formData.isActive,
//             };

//             if (editingOffer) {
//                 await axios.put(
//                     `/api/admin/offer/${editingOffer._id}`,
//                     payload
//                 );
//             } else {
//                 await axios.post(
//                     "/api/admin/offer",
//                     payload
//                 );
//             }

//             closeModal();

//             await fetchOffers();
//         } catch (error: any) {
//             console.error(
//                 "Failed to save offer:",
//                 error
//             );

//             setErrorModal({
//                 open: true,
//                 message:
//                     error?.response?.data?.message ||
//                     "Failed to save offer.",
//             });
//         } finally {
//             setSaving(false);
//         }
//     };

//     /* -----------------------------------------
//        TOGGLE ENABLE/DISABLE
//     ----------------------------------------- */

//     const handleToggleStatus = async (
//         item: OfferItem
//     ) => {
//         try {
//             await axios.patch(
//                 `/api/admin/offer/${item._id}`,
//                 {
//                     isActive: !item.isActive,
//                 }
//             );

//             await fetchOffers();
//         } catch (error: any) {
//             console.error(
//                 "Failed to update offer status:",
//                 error
//             );

//             setErrorModal({
//                 open: true,
//                 message:
//                     error?.response?.data?.message ||
//                     "Failed to update offer status.",
//             });
//         }
//     };

//     /* -----------------------------------------
//        DELETE
//     ----------------------------------------- */

//     const openDeleteModal = (
//         item: OfferItem
//     ) => {
//         setDeleteModal({
//             open: true,
//             offer: item,
//         });
//     };

//     const closeDeleteModal = () => {
//         if (deleting) return;

//         setDeleteModal({
//             open: false,
//             offer: null,
//         });
//     };

//     const handleDelete = async () => {
//         if (!deleteModal.offer) return;

//         try {
//             setDeleting(true);

//             await axios.delete(
//                 `/api/admin/offer/${deleteModal.offer._id}`
//             );

//             closeDeleteModal();

//             if (
//                 offers.length === 1 &&
//                 page > 1
//             ) {
//                 setPage((prev) => prev - 1);
//             } else {
//                 await fetchOffers();
//             }
//         } catch (error: any) {
//             console.error(
//                 "Failed to delete offer:",
//                 error
//             );

//             setErrorModal({
//                 open: true,
//                 message:
//                     error?.response?.data?.message ||
//                     "Failed to delete offer.",
//             });
//         } finally {
//             setDeleting(false);
//         }
//     };

//     /* -----------------------------------------
//        DISCOUNT DISPLAY
//     ----------------------------------------- */

//     const formatDiscount = (
//         item: OfferItem
//     ) => {
//         if (
//             item.discountType ===
//             "PERCENTAGE"
//         ) {
//             return `${item.discountValue}%`;
//         }

//         return `₹${item.discountValue}`;
//     };

//     /* -----------------------------------------
//        STATUS STYLE
//     ----------------------------------------- */

//     const getOfferStatusStyle = (
//         status: OfferItem["offerStatus"]
//     ) => {
//         switch (status) {
//             case "ACTIVE":
//                 return {
//                     wrapper: `
//                         bg-emerald-100
//                         text-emerald-800
//                         border-emerald-200
//                         dark:bg-emerald-950/60
//                         dark:text-emerald-300
//                         dark:border-emerald-800
//                     `,
//                     dot: "bg-emerald-500",
//                     label: "Active",
//                 };

//             case "UPCOMING":
//                 return {
//                     wrapper: `
//                         bg-amber-100
//                         text-amber-800
//                         border-amber-200
//                         dark:bg-amber-950/60
//                         dark:text-amber-300
//                         dark:border-amber-800
//                     `,
//                     dot: "bg-amber-500",
//                     label: "Upcoming",
//                 };

//             case "EXPIRED":
//             default:
//                 return {
//                     wrapper: `
//                         bg-rose-100
//                         text-rose-800
//                         border-rose-200
//                         dark:bg-rose-950/60
//                         dark:text-rose-300
//                         dark:border-rose-800
//                     `,
//                     dot: "bg-rose-500",
//                     label: "Expired",
//                 };
//         }
//     };

//     return (
//         <div
//             className="
//                 min-h-screen
//                 bg-stone-50
//                 dark:bg-stone-950
//                 text-stone-900
//                 dark:text-stone-100
//                 p-4
//                 sm:p-6
//                 lg:p-8
//             "
//         >
//             <div className="max-w-7xl mx-auto">

//                 {/* ========================================
//                     HEADER
//                 ======================================== */}

//                 <div
//                     className="
//                         flex
//                         flex-col
//                         sm:flex-row
//                         sm:items-center
//                         sm:justify-between
//                         gap-4
//                         mb-6
//                     "
//                 >
//                     <div>
//                         <div className="flex items-center gap-2">
//                             <Sparkles
//                                 className="
//                                     w-6
//                                     h-6
//                                     text-rose-500
//                                 "
//                             />

//                             <h1
//                                 className="
//                                     text-2xl
//                                     sm:text-3xl
//                                     font-bold
//                                 "
//                             >
//                                 Offers
//                             </h1>
//                         </div>

//                         <p
//                             className="
//                                 mt-1
//                                 text-sm
//                                 text-stone-500
//                                 dark:text-stone-400
//                             "
//                         >
//                             Create and manage your
//                             bakery offers
//                         </p>
//                     </div>

//                     <button
//                         type="button"
//                         onClick={handleCreate}
//                         className="
//                             inline-flex
//                             items-center
//                             justify-center
//                             gap-2
//                             px-4
//                             py-2.5
//                             rounded-xl
//                             bg-stone-900
//                             dark:bg-stone-100
//                             text-white
//                             dark:text-stone-900
//                             text-sm
//                             font-semibold
//                             hover:bg-stone-800
//                             dark:hover:bg-stone-200
//                             transition
//                             cursor-pointer
//                         "
//                     >
//                         <Plus className="w-4 h-4" />

//                         Add Offer
//                     </button>
//                 </div>

//                 {/* ========================================
//                     SEARCH
//                 ======================================== */}

//                 <div
//                     className="
//                         mb-5
//                         bg-white
//                         dark:bg-stone-900
//                         border
//                         border-stone-200
//                         dark:border-stone-800
//                         rounded-2xl
//                         p-3
//                     "
//                 >
//                     <div
//                         className="
//                             relative
//                             max-w-md
//                         "
//                     >
//                         <Search
//                             className="
//                                 absolute
//                                 left-3
//                                 top-1/2
//                                 -translate-y-1/2
//                                 w-4
//                                 h-4
//                                 text-stone-400
//                             "
//                         />

//                         <input
//                             type="text"
//                             value={search}
//                             onChange={(e) =>
//                                 setSearch(
//                                     e.target.value
//                                 )
//                             }
//                             placeholder="Search offers..."
//                             className="
//                                 w-full
//                                 pl-10
//                                 pr-4
//                                 py-2.5
//                                 rounded-xl
//                                 border
//                                 border-stone-200
//                                 dark:border-stone-700
//                                 bg-stone-50
//                                 dark:bg-stone-950
//                                 text-sm
//                                 outline-none
//                                 focus:ring-2
//                                 focus:ring-rose-400
//                                 dark:focus:ring-rose-500
//                             "
//                         />
//                     </div>
//                 </div>

//                 {/* ========================================
//                     TABLE
//                 ======================================== */}

//                 <div
//                     className="
//                         bg-white
//                         dark:bg-stone-900
//                         border
//                         border-stone-200
//                         dark:border-stone-800
//                         rounded-2xl
//                         overflow-hidden
//                     "
//                 >
//                     <div className="overflow-x-auto">
//                         <table className="w-full min-w-[900px]">

//                             <thead>
//                                 <tr
//                                     className="
//                                         border-b
//                                         border-stone-200
//                                         dark:border-stone-800
//                                         bg-stone-50
//                                         dark:bg-stone-950/50
//                                     "
//                                 >
//                                     <th
//                                         className="
//                                             text-left
//                                             p-4
//                                             text-xs
//                                             font-semibold
//                                             text-stone-500
//                                             dark:text-stone-400
//                                             uppercase
//                                         "
//                                     >
//                                         Offer
//                                     </th>

//                                     <th
//                                         className="
//                                             text-left
//                                             p-4
//                                             text-xs
//                                             font-semibold
//                                             text-stone-500
//                                             dark:text-stone-400
//                                             uppercase
//                                         "
//                                     >
//                                         Discount
//                                     </th>

//                                     <th
//                                         className="
//                                             text-left
//                                             p-4
//                                             text-xs
//                                             font-semibold
//                                             text-stone-500
//                                             dark:text-stone-400
//                                             uppercase
//                                         "
//                                     >
//                                         Start
//                                     </th>

//                                     <th
//                                         className="
//                                             text-left
//                                             p-4
//                                             text-xs
//                                             font-semibold
//                                             text-stone-500
//                                             dark:text-stone-400
//                                             uppercase
//                                         "
//                                     >
//                                         End
//                                     </th>

//                                     <th
//                                         className="
//                                             text-left
//                                             p-4
//                                             text-xs
//                                             font-semibold
//                                             text-stone-500
//                                             dark:text-stone-400
//                                             uppercase
//                                         "
//                                     >
//                                         Status
//                                     </th>

//                                     <th
//                                         className="
//                                             text-right
//                                             p-4
//                                             text-xs
//                                             font-semibold
//                                             text-stone-500
//                                             dark:text-stone-400
//                                             uppercase
//                                         "
//                                     >
//                                         Actions
//                                     </th>
//                                 </tr>
//                             </thead>

//                             <tbody>
//                                 {loading ? (
//                                     <tr>
//                                         <td
//                                             colSpan={6}
//                                             className="
//                                                 p-10
//                                                 text-center
//                                                 text-sm
//                                                 text-stone-500
//                                             "
//                                         >
//                                             Loading offers...
//                                         </td>
//                                     </tr>
//                                 ) : offers.length ===
//                                   0 ? (
//                                     <tr>
//                                         <td
//                                             colSpan={6}
//                                             className="
//                                                 p-10
//                                                 text-center
//                                             "
//                                         >
//                                             <div
//                                                 className="
//                                                     flex
//                                                     flex-col
//                                                     items-center
//                                                     justify-center
//                                                     gap-2
//                                                 "
//                                             >
//                                                 <Sparkles
//                                                     className="
//                                                         w-8
//                                                         h-8
//                                                         text-stone-300
//                                                         dark:text-stone-700
//                                                     "
//                                                 />

//                                                 <p
//                                                     className="
//                                                         font-medium
//                                                         text-stone-600
//                                                         dark:text-stone-400
//                                                     "
//                                                 >
//                                                     No offers
//                                                     found
//                                                 </p>

//                                                 <p
//                                                     className="
//                                                         text-xs
//                                                         text-stone-400
//                                                     "
//                                                 >
//                                                     Create your
//                                                     first offer
//                                                     to get
//                                                     started.
//                                                 </p>
//                                             </div>
//                                         </td>
//                                     </tr>
//                                 ) : (
//                                     offers.map(
//                                         (item) => {
//                                             const statusStyle =
//                                                 getOfferStatusStyle(
//                                                     item.offerStatus
//                                                 );

//                                             return (
//                                                 <tr
//                                                     key={
//                                                         item._id
//                                                     }
//                                                     className="
//                                                         border-b
//                                                         border-stone-100
//                                                         dark:border-stone-800
//                                                         last:border-b-0
//                                                         hover:bg-stone-50
//                                                         dark:hover:bg-stone-800/40
//                                                         transition
//                                                     "
//                                                 >

//                                                     {/* OFFER */}

//                                                     <td className="p-4">
//                                                         <div>
//                                                             <p
//                                                                 className="
//                                                                     font-semibold
//                                                                     text-stone-900
//                                                                     dark:text-stone-100
//                                                                 "
//                                                             >
//                                                                 {
//                                                                     item.title
//                                                                 }
//                                                             </p>

//                                                             <p
//                                                                 className={`
//                                                                     text-[11px]
//                                                                     mt-0.5
//                                                                     ${
//                                                                         item.offerStatus ===
//                                                                         "ACTIVE"
//                                                                             ? "text-emerald-600 dark:text-emerald-400"
//                                                                             : item.offerStatus ===
//                                                                                 "UPCOMING"
//                                                                                 ? "text-amber-600 dark:text-amber-400"
//                                                                                 : "text-rose-500 dark:text-rose-400"
//                                                                     }
//                                                                 `}
//                                                             >
//                                                                 {item.offerStatus ===
//                                                                 "ACTIVE"
//                                                                     ? "Currently active"
//                                                                     : item.offerStatus ===
//                                                                         "UPCOMING"
//                                                                         ? "Scheduled"
//                                                                         : "Expired"}
//                                                             </p>
//                                                         </div>
//                                                     </td>

//                                                     {/* DISCOUNT */}

//                                                     <td className="p-4">
//                                                         <div>
//                                                             <p
//                                                                 className="
//                                                                     font-semibold
//                                                                     text-rose-500
//                                                                     dark:text-rose-400
//                                                                 "
//                                                             >
//                                                                 {formatDiscount(
//                                                                     item
//                                                                 )}
//                                                             </p>

//                                                             <p
//                                                                 className="
//                                                                     text-[11px]
//                                                                     text-stone-400
//                                                                     mt-0.5
//                                                                 "
//                                                             >
//                                                                 {
//                                                                     item.discountType
//                                                                 }
//                                                             </p>
//                                                         </div>
//                                                     </td>

//                                                     {/* START */}

//                                                     <td className="p-4">
//                                                         <p
//                                                             className="
//                                                                 text-sm
//                                                                 text-stone-700
//                                                                 dark:text-stone-300
//                                                             "
//                                                         >
//                                                             {formatDate(
//                                                                 item.startDate
//                                                             )}
//                                                         </p>
//                                                     </td>

//                                                     {/* END */}

//                                                     <td className="p-4">
//                                                         <p
//                                                             className="
//                                                                 text-sm
//                                                                 text-stone-700
//                                                                 dark:text-stone-300
//                                                             "
//                                                         >
//                                                             {formatDate(
//                                                                 item.endDate
//                                                             )}
//                                                         </p>
//                                                     </td>

//                                                     {/* STATUS */}

//                                                     <td className="p-4">
//                                                         <div
//                                                             className="
//                                                                 flex
//                                                                 flex-col
//                                                                 items-start
//                                                                 gap-1.5
//                                                             "
//                                                         >

//                                                             {/* DATE STATUS */}

//                                                             <span
//                                                                 className={`
//                                                                     inline-flex
//                                                                     items-center
//                                                                     gap-1.5
//                                                                     px-3
//                                                                     py-1
//                                                                     rounded-full
//                                                                     text-[11px]
//                                                                     font-medium
//                                                                     border
//                                                                     ${statusStyle.wrapper}
//                                                                 `}
//                                                             >
//                                                                 <span
//                                                                     className={`
//                                                                         w-1.5
//                                                                         h-1.5
//                                                                         rounded-full
//                                                                         ${statusStyle.dot}
//                                                                     `}
//                                                                 />

//                                                                 {
//                                                                     statusStyle.label
//                                                                 }
//                                                             </span>

//                                                             {/* MANUAL ENABLE / DISABLE */}

//                                                             <button
//                                                                 type="button"
//                                                                 onClick={() =>
//                                                                     handleToggleStatus(
//                                                                         item
//                                                                     )
//                                                                 }
//                                                                 className={`
//                                                                     inline-flex
//                                                                     items-center
//                                                                     gap-1.5
//                                                                     px-3
//                                                                     py-1
//                                                                     rounded-full
//                                                                     text-[10px]
//                                                                     font-medium
//                                                                     transition-colors
//                                                                     cursor-pointer
//                                                                     border
//                                                                     ${
//                                                                         item.isActive
//                                                                             ? `
//                                                                                 bg-stone-100
//                                                                                 text-stone-700
//                                                                                 border-stone-200
//                                                                                 dark:bg-stone-800
//                                                                                 dark:text-stone-300
//                                                                                 dark:border-stone-700
//                                                                             `
//                                                                             : `
//                                                                                 bg-stone-50
//                                                                                 text-stone-400
//                                                                                 border-stone-200
//                                                                                 dark:bg-stone-900
//                                                                                 dark:text-stone-500
//                                                                                 dark:border-stone-800
//                                                                             `
//                                                                     }
//                                                                 `}
//                                                             >
//                                                                 <span
//                                                                     className={`
//                                                                         w-1.5
//                                                                         h-1.5
//                                                                         rounded-full
//                                                                         ${
//                                                                             item.isActive
//                                                                                 ? "bg-emerald-500"
//                                                                                 : "bg-stone-400"
//                                                                         }
//                                                                     `}
//                                                                 />

//                                                                 {item.isActive
//                                                                     ? "Enabled"
//                                                                     : "Disabled"}
//                                                             </button>
//                                                         </div>
//                                                     </td>

//                                                     {/* ACTIONS */}

//                                                     <td className="p-4">
//                                                         <div
//                                                             className="
//                                                                 flex
//                                                                 items-center
//                                                                 justify-end
//                                                                 gap-2
//                                                             "
//                                                         >
//                                                             <button
//                                                                 type="button"
//                                                                 onClick={() =>
//                                                                     handleEdit(
//                                                                         item
//                                                                     )
//                                                                 }
//                                                                 className="
//                                                                     p-2
//                                                                     rounded-lg
//                                                                     text-stone-500
//                                                                     hover:text-stone-900
//                                                                     hover:bg-stone-100
//                                                                     dark:text-stone-400
//                                                                     dark:hover:text-stone-100
//                                                                     dark:hover:bg-stone-800
//                                                                     transition
//                                                                     cursor-pointer
//                                                                 "
//                                                                 title="Edit offer"
//                                                             >
//                                                                 <Edit2 className="w-4 h-4" />
//                                                             </button>

//                                                             <button
//                                                                 type="button"
//                                                                 onClick={() =>
//                                                                     openDeleteModal(
//                                                                         item
//                                                                     )
//                                                                 }
//                                                                 className="
//                                                                     p-2
//                                                                     rounded-lg
//                                                                     text-stone-500
//                                                                     hover:text-rose-600
//                                                                     hover:bg-rose-50
//                                                                     dark:text-stone-400
//                                                                     dark:hover:text-rose-400
//                                                                     dark:hover:bg-rose-950/30
//                                                                     transition
//                                                                     cursor-pointer
//                                                                 "
//                                                                 title="Delete offer"
//                                                             >
//                                                                 <Trash2 className="w-4 h-4" />
//                                                             </button>
//                                                         </div>
//                                                     </td>

//                                                 </tr>
//                                             );
//                                         }
//                                     )
//                                 )}
//                             </tbody>
//                         </table>
//                     </div>

//                     {/* ========================================
//                         PAGINATION
//                     ======================================== */}

//                     {!loading &&
//                         offers.length > 0 && (
//                             <div
//                                 className="
//                                     flex
//                                     flex-col
//                                     sm:flex-row
//                                     sm:items-center
//                                     sm:justify-between
//                                     gap-3
//                                     px-4
//                                     py-3
//                                     border-t
//                                     border-stone-200
//                                     dark:border-stone-800
//                                 "
//                             >
//                                 <p
//                                     className="
//                                         text-xs
//                                         text-stone-500
//                                         dark:text-stone-400
//                                     "
//                                 >
//                                     Showing{" "}
//                                     <span className="font-semibold">
//                                         {(page - 1) *
//                                             limit +
//                                             1}
//                                     </span>{" "}
//                                     -
//                                     <span className="font-semibold">
//                                         {" "}
//                                         {Math.min(
//                                             page *
//                                                 limit,
//                                             totalItems
//                                         )}
//                                     </span>{" "}
//                                     of{" "}
//                                     <span className="font-semibold">
//                                         {totalItems}
//                                     </span>{" "}
//                                     offers
//                                 </p>

//                                 <div
//                                     className="
//                                         flex
//                                         items-center
//                                         gap-2
//                                     "
//                                 >
//                                     <button
//                                         type="button"
//                                         disabled={
//                                             page <= 1
//                                         }
//                                         onClick={() =>
//                                             setPage(
//                                                 (prev) =>
//                                                     Math.max(
//                                                         1,
//                                                         prev -
//                                                             1
//                                                     )
//                                             )
//                                         }
//                                         className="
//                                             p-2
//                                             rounded-lg
//                                             border
//                                             border-stone-200
//                                             dark:border-stone-700
//                                             disabled:opacity-40
//                                             disabled:cursor-not-allowed
//                                             hover:bg-stone-100
//                                             dark:hover:bg-stone-800
//                                             transition
//                                             cursor-pointer
//                                         "
//                                     >
//                                         <ChevronLeft className="w-4 h-4" />
//                                     </button>

//                                     <span
//                                         className="
//                                             text-xs
//                                             font-medium
//                                             min-w-[80px]
//                                             text-center
//                                         "
//                                     >
//                                         Page {page} of{" "}
//                                         {totalPages}
//                                     </span>

//                                     <button
//                                         type="button"
//                                         disabled={
//                                             page >=
//                                             totalPages
//                                         }
//                                         onClick={() =>
//                                             setPage(
//                                                 (prev) =>
//                                                     Math.min(
//                                                         totalPages,
//                                                         prev +
//                                                             1
//                                                     )
//                                             )
//                                         }
//                                         className="
//                                             p-2
//                                             rounded-lg
//                                             border
//                                             border-stone-200
//                                             dark:border-stone-700
//                                             disabled:opacity-40
//                                             disabled:cursor-not-allowed
//                                             hover:bg-stone-100
//                                             dark:hover:bg-stone-800
//                                             transition
//                                             cursor-pointer
//                                         "
//                                     >
//                                         <ChevronRight className="w-4 h-4" />
//                                     </button>
//                                 </div>
//                             </div>
//                         )}
//                 </div>
//             </div>

//             {/* ============================================
//                 CREATE / EDIT MODAL
//             ============================================ */}

//             {showModal && (
//                 <div
//                     className="
//                         fixed
//                         inset-0
//                         z-50
//                         flex
//                         items-center
//                         justify-center
//                         p-4
//                         bg-black/50
//                         backdrop-blur-sm
//                     "
//                     onMouseDown={(e) => {
//                         if (
//                             e.target ===
//                             e.currentTarget
//                         ) {
//                             closeModal();
//                         }
//                     }}
//                 >
//                     <div
//                         className="
//                             w-full
//                             max-w-lg
//                             max-h-[90vh]
//                             overflow-y-auto
//                             bg-white
//                             dark:bg-stone-900
//                             rounded-2xl
//                             shadow-2xl
//                             border
//                             border-stone-200
//                             dark:border-stone-800
//                         "
//                     >
//                         {/* MODAL HEADER */}

//                         <div
//                             className="
//                                 flex
//                                 items-center
//                                 justify-between
//                                 p-5
//                                 border-b
//                                 border-stone-200
//                                 dark:border-stone-800
//                             "
//                         >
//                             <div>
//                                 <h2
//                                     className="
//                                         text-lg
//                                         font-bold
//                                     "
//                                 >
//                                     {editingOffer
//                                         ? "Edit Offer"
//                                         : "Create Offer"}
//                                 </h2>

//                                 <p
//                                     className="
//                                         text-xs
//                                         text-stone-500
//                                         dark:text-stone-400
//                                         mt-1
//                                     "
//                                 >
//                                     {editingOffer
//                                         ? "Update offer details"
//                                         : "Create a new bakery offer"}
//                                 </p>
//                             </div>

//                             <button
//                                 type="button"
//                                 onClick={
//                                     closeModal
//                                 }
//                                 className="
//                                     p-2
//                                     rounded-lg
//                                     hover:bg-stone-100
//                                     dark:hover:bg-stone-800
//                                     transition
//                                     cursor-pointer
//                                 "
//                             >
//                                 <X className="w-5 h-5" />
//                             </button>
//                         </div>

//                         {/* FORM */}

//                         <form
//                             onSubmit={
//                                 handleSubmit
//                             }
//                             className="p-5 space-y-5"
//                         >
//                             {/* TITLE */}

//                             <div>
//                                 <label
//                                     className="
//                                         block
//                                         text-sm
//                                         font-medium
//                                         mb-1.5
//                                     "
//                                 >
//                                     Offer Title
//                                 </label>

//                                 <input
//                                     type="text"
//                                     value={
//                                         formData.title
//                                     }
//                                     onChange={(e) =>
//                                         setFormData(
//                                             (
//                                                 prev
//                                             ) => ({
//                                                 ...prev,
//                                                 title: e
//                                                     .target
//                                                     .value,
//                                             })
//                                         )
//                                     }
//                                     placeholder="e.g. Weekend Special"
//                                     className={`
//                                         w-full
//                                         px-3
//                                         py-2.5
//                                         rounded-xl
//                                         border
//                                         bg-stone-50
//                                         dark:bg-stone-950
//                                         outline-none
//                                         text-sm
//                                         ${
//                                             formErrors.title
//                                                 ? "border-rose-500"
//                                                 : "border-stone-200 dark:border-stone-700"
//                                         }
//                                         focus:ring-2
//                                         focus:ring-rose-400
//                                     `}
//                                 />

//                                 {formErrors.title && (
//                                     <p className="mt-1 text-xs text-rose-500">
//                                         {
//                                             formErrors.title
//                                         }
//                                     </p>
//                                 )}
//                             </div>

//                             {/* DISCOUNT TYPE + VALUE */}

//                             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

//                                 <div>
//                                     <label
//                                         className="
//                                             block
//                                             text-sm
//                                             font-medium
//                                             mb-1.5
//                                         "
//                                     >
//                                         Discount Type
//                                     </label>

//                                     <select
//                                         value={
//                                             formData.discountType
//                                         }
//                                         onChange={(
//                                             e
//                                         ) =>
//                                             setFormData(
//                                                 (
//                                                     prev
//                                                 ) => ({
//                                                     ...prev,
//                                                     discountType:
//                                                         e
//                                                             .target
//                                                             .value as
//                                                             | "PERCENTAGE"
//                                                             | "FLAT",
//                                                 })
//                                             )
//                                         }
//                                         className="
//                                             w-full
//                                             px-3
//                                             py-2.5
//                                             rounded-xl
//                                             border
//                                             border-stone-200
//                                             dark:border-stone-700
//                                             bg-stone-50
//                                             dark:bg-stone-950
//                                             text-sm
//                                             outline-none
//                                             focus:ring-2
//                                             focus:ring-rose-400
//                                         "
//                                     >
//                                         <option value="PERCENTAGE">
//                                             Percentage
//                                         </option>

//                                         <option value="FLAT">
//                                             Flat Amount
//                                         </option>
//                                     </select>
//                                 </div>

//                                 <div>
//                                     <label
//                                         className="
//                                             block
//                                             text-sm
//                                             font-medium
//                                             mb-1.5
//                                         "
//                                     >
//                                         Discount Value
//                                     </label>

//                                     <div className="relative">
//                                         <input
//                                             type="number"
//                                             min="1"
//                                             step="0.01"
//                                             value={
//                                                 formData.discountValue
//                                             }
//                                             onChange={(
//                                                 e
//                                             ) =>
//                                                 setFormData(
//                                                     (
//                                                         prev
//                                                     ) => ({
//                                                         ...prev,
//                                                         discountValue:
//                                                             e
//                                                                 .target
//                                                                 .value,
//                                                     })
//                                                 )
//                                             }
//                                             placeholder={
//                                                 formData.discountType ===
//                                                 "PERCENTAGE"
//                                                     ? "10"
//                                                     : "100"
//                                             }
//                                             className={`
//                                                 w-full
//                                                 px-3
//                                                 py-2.5
//                                                 rounded-xl
//                                                 border
//                                                 bg-stone-50
//                                                 dark:bg-stone-950
//                                                 text-sm
//                                                 outline-none
//                                                 ${
//                                                     formErrors.discountValue
//                                                         ? "border-rose-500"
//                                                         : "border-stone-200 dark:border-stone-700"
//                                                 }
//                                                 focus:ring-2
//                                                 focus:ring-rose-400
//                                             `}
//                                         />
//                                     </div>

//                                     {formErrors.discountValue && (
//                                         <p className="mt-1 text-xs text-rose-500">
//                                             {
//                                                 formErrors.discountValue
//                                             }
//                                         </p>
//                                     )}
//                                 </div>
//                             </div>

//                             {/* START DATE */}

//                             <div>
//                                 <label
//                                     className="
//                                         block
//                                         text-sm
//                                         font-medium
//                                         mb-1.5
//                                     "
//                                 >
//                                     Start Date & Time
//                                 </label>

//                                 <input
//                                     type="datetime-local"
//                                     min={getCurrentDateTimeLocal()}
//                                     value={
//                                         formData.startDate
//                                     }
//                                     onChange={(e) =>
//                                         setFormData(
//                                             (
//                                                 prev
//                                             ) => ({
//                                                 ...prev,
//                                                 startDate:
//                                                     e
//                                                         .target
//                                                         .value,
//                                             })
//                                         )
//                                     }
//                                     className={`
//                                         w-full
//                                         px-3
//                                         py-2.5
//                                         rounded-xl
//                                         border
//                                         bg-stone-50
//                                         dark:bg-stone-950
//                                         text-sm
//                                         outline-none
//                                         ${
//                                             formErrors.startDate
//                                                 ? "border-rose-500"
//                                                 : "border-stone-200 dark:border-stone-700"
//                                         }
//                                         focus:ring-2
//                                         focus:ring-rose-400
//                                     `}
//                                 />

//                                 {formErrors.startDate && (
//                                     <p className="mt-1 text-xs text-rose-500">
//                                         {
//                                             formErrors.startDate
//                                         }
//                                     </p>
//                                 )}
//                             </div>

//                             {/* END DATE */}

//                             <div>
//                                 <label
//                                     className="
//                                         block
//                                         text-sm
//                                         font-medium
//                                         mb-1.5
//                                     "
//                                 >
//                                     End Date & Time
//                                 </label>

//                                 <input
//                                     type="datetime-local"
//                                     min={
//                                         formData.startDate ||
//                                         getCurrentDateTimeLocal()
//                                     }
//                                     value={
//                                         formData.endDate
//                                     }
//                                     onChange={(e) =>
//                                         setFormData(
//                                             (
//                                                 prev
//                                             ) => ({
//                                                 ...prev,
//                                                 endDate:
//                                                     e
//                                                         .target
//                                                         .value,
//                                             })
//                                         )
//                                     }
//                                     className={`
//                                         w-full
//                                         px-3
//                                         py-2.5
//                                         rounded-xl
//                                         border
//                                         bg-stone-50
//                                         dark:bg-stone-950
//                                         text-sm
//                                         outline-none
//                                         ${
//                                             formErrors.endDate
//                                                 ? "border-rose-500"
//                                                 : "border-stone-200 dark:border-stone-700"
//                                         }
//                                         focus:ring-2
//                                         focus:ring-rose-400
//                                     `}
//                                 />

//                                 {formErrors.endDate && (
//                                     <p className="mt-1 text-xs text-rose-500">
//                                         {
//                                             formErrors.endDate
//                                         }
//                                     </p>
//                                 )}
//                             </div>

//                             {/* ENABLE */}

//                             <div
//                                 className="
//                                     flex
//                                     items-center
//                                     justify-between
//                                     p-3
//                                     rounded-xl
//                                     bg-stone-50
//                                     dark:bg-stone-950
//                                     border
//                                     border-stone-200
//                                     dark:border-stone-800
//                                 "
//                             >
//                                 <div>
//                                     <p
//                                         className="
//                                             text-sm
//                                             font-medium
//                                         "
//                                     >
//                                         Enable offer
//                                     </p>

//                                     <p
//                                         className="
//                                             text-xs
//                                             text-stone-500
//                                             dark:text-stone-400
//                                         "
//                                     >
//                                         Allow this offer
//                                         to be used
//                                     </p>
//                                 </div>

//                                 <button
//                                     type="button"
//                                     onClick={() =>
//                                         setFormData(
//                                             (
//                                                 prev
//                                             ) => ({
//                                                 ...prev,
//                                                 isActive:
//                                                     !prev.isActive,
//                                             })
//                                         )
//                                     }
//                                     className={`
//                                         relative
//                                         w-11
//                                         h-6
//                                         rounded-full
//                                         transition
//                                         cursor-pointer
//                                         ${
//                                             formData.isActive
//                                                 ? "bg-emerald-500"
//                                                 : "bg-stone-300 dark:bg-stone-700"
//                                         }
//                                     `}
//                                 >
//                                     <span
//                                         className={`
//                                             absolute
//                                             top-0.5
//                                             w-5
//                                             h-5
//                                             rounded-full
//                                             bg-white
//                                             shadow
//                                             transition
//                                             ${
//                                                 formData.isActive
//                                                     ? "left-5"
//                                                     : "left-0.5"
//                                             }
//                                         `}
//                                     />
//                                 </button>
//                             </div>

//                             {/* BUTTONS */}

//                             <div
//                                 className="
//                                     flex
//                                     gap-3
//                                     pt-2
//                                 "
//                             >
//                                 <button
//                                     type="button"
//                                     onClick={
//                                         closeModal
//                                     }
//                                     disabled={saving}
//                                     className="
//                                         flex-1
//                                         px-4
//                                         py-2.5
//                                         rounded-xl
//                                         border
//                                         border-stone-200
//                                         dark:border-stone-700
//                                         text-sm
//                                         font-medium
//                                         hover:bg-stone-100
//                                         dark:hover:bg-stone-800
//                                         transition
//                                         disabled:opacity-50
//                                         cursor-pointer
//                                     "
//                                 >
//                                     Cancel
//                                 </button>

//                                 <button
//                                     type="submit"
//                                     disabled={saving}
//                                     className="
//                                         flex-1
//                                         px-4
//                                         py-2.5
//                                         rounded-xl
//                                         bg-stone-900
//                                         dark:bg-stone-100
//                                         text-white
//                                         dark:text-stone-900
//                                         text-sm
//                                         font-semibold
//                                         hover:bg-stone-800
//                                         dark:hover:bg-stone-200
//                                         transition
//                                         disabled:opacity-50
//                                         cursor-pointer
//                                     "
//                                 >
//                                     {saving
//                                         ? "Saving..."
//                                         : editingOffer
//                                             ? "Update Offer"
//                                             : "Create Offer"}
//                                 </button>
//                             </div>
//                         </form>
//                     </div>
//                 </div>
//             )}

//             {/* ============================================
//                 DELETE MODAL
//             ============================================ */}

//             {deleteModal.open &&
//                 deleteModal.offer && (
//                     <div
//                         className="
//                             fixed
//                             inset-0
//                             z-[60]
//                             flex
//                             items-center
//                             justify-center
//                             p-4
//                             bg-black/50
//                             backdrop-blur-sm
//                         "
//                     >
//                         <div
//                             className="
//                                 w-full
//                                 max-w-sm
//                                 bg-white
//                                 dark:bg-stone-900
//                                 rounded-2xl
//                                 border
//                                 border-stone-200
//                                 dark:border-stone-800
//                                 shadow-2xl
//                                 p-6
//                             "
//                         >
//                             <div
//                                 className="
//                                     w-12
//                                     h-12
//                                     rounded-full
//                                     bg-rose-100
//                                     dark:bg-rose-950/50
//                                     flex
//                                     items-center
//                                     justify-center
//                                     mb-4
//                                 "
//                             >
//                                 <AlertTriangle
//                                     className="
//                                         w-6
//                                         h-6
//                                         text-rose-500
//                                     "
//                                 />
//                             </div>

//                             <h3
//                                 className="
//                                     text-lg
//                                     font-bold
//                                 "
//                             >
//                                 Delete Offer?
//                             </h3>

//                             <p
//                                 className="
//                                     text-sm
//                                     text-stone-500
//                                     dark:text-stone-400
//                                     mt-2
//                                 "
//                             >
//                                 Are you sure you want
//                                 to delete{" "}
//                                 <span
//                                     className="
//                                         font-semibold
//                                         text-stone-800
//                                         dark:text-stone-200
//                                     "
//                                 >
//                                     "
//                                     {
//                                         deleteModal
//                                             .offer
//                                             .title
//                                     }
//                                     "
//                                 </span>
//                                 ? This action cannot
//                                 be undone.
//                             </p>

//                             <div
//                                 className="
//                                     flex
//                                     gap-3
//                                     mt-6
//                                 "
//                             >
//                                 <button
//                                     type="button"
//                                     onClick={
//                                         closeDeleteModal
//                                     }
//                                     disabled={deleting}
//                                     className="
//                                         flex-1
//                                         px-4
//                                         py-2.5
//                                         rounded-xl
//                                         border
//                                         border-stone-200
//                                         dark:border-stone-700
//                                         text-sm
//                                         font-medium
//                                         hover:bg-stone-100
//                                         dark:hover:bg-stone-800
//                                         transition
//                                         cursor-pointer
//                                     "
//                                 >
//                                     Cancel
//                                 </button>

//                                 <button
//                                     type="button"
//                                     onClick={
//                                         handleDelete
//                                     }
//                                     disabled={deleting}
//                                     className="
//                                         flex-1
//                                         px-4
//                                         py-2.5
//                                         rounded-xl
//                                         bg-rose-500
//                                         text-white
//                                         text-sm
//                                         font-semibold
//                                         hover:bg-rose-600
//                                         transition
//                                         disabled:opacity-50
//                                         cursor-pointer
//                                     "
//                                 >
//                                     {deleting
//                                         ? "Deleting..."
//                                         : "Delete"}
//                                 </button>
//                             </div>
//                         </div>
//                     </div>
//                 )}

//             {/* ============================================
//                 ERROR MODAL
//             ============================================ */}

//             {errorModal.open && (
//                 <div
//                     className="
//                         fixed
//                         inset-0
//                         z-[70]
//                         flex
//                         items-center
//                         justify-center
//                         p-4
//                         bg-black/50
//                         backdrop-blur-sm
//                     "
//                 >
//                     <div
//                         className="
//                             w-full
//                             max-w-sm
//                             bg-white
//                             dark:bg-stone-900
//                             rounded-2xl
//                             border
//                             border-stone-200
//                             dark:border-stone-800
//                             shadow-2xl
//                             p-6
//                         "
//                     >
//                         <div
//                             className="
//                                 w-12
//                                 h-12
//                                 rounded-full
//                                 bg-rose-100
//                                 dark:bg-rose-950/50
//                                 flex
//                                 items-center
//                                 justify-center
//                                 mb-4
//                             "
//                         >
//                             <AlertTriangle
//                                 className="
//                                     w-6
//                                     h-6
//                                     text-rose-500
//                                 "
//                             />
//                         </div>

//                         <h3
//                             className="
//                                 text-lg
//                                 font-bold
//                             "
//                         >
//                             Something went wrong
//                         </h3>

//                         <p
//                             className="
//                                 text-sm
//                                 text-stone-500
//                                 dark:text-stone-400
//                                 mt-2
//                             "
//                         >
//                             {
//                                 errorModal.message
//                             }
//                         </p>

//                         <button
//                             type="button"
//                             onClick={() =>
//                                 setErrorModal({
//                                     open: false,
//                                     message: "",
//                                 })
//                             }
//                             className="
//                                 w-full
//                                 mt-6
//                                 px-4
//                                 py-2.5
//                                 rounded-xl
//                                 bg-stone-900
//                                 dark:bg-stone-100
//                                 text-white
//                                 dark:text-stone-900
//                                 text-sm
//                                 font-semibold
//                                 hover:bg-stone-800
//                                 dark:hover:bg-stone-200
//                                 transition
//                                 cursor-pointer
//                             "
//                         >
//                             Okay
//                         </button>
//                     </div>
//                 </div>
//             )}
//         </div>
//     );
// }