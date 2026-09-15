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
    AlertTriangle,
    Tag,
    CakeSlice,
    CheckCircle,
    XCircle,
    CalendarDays,
    Clock3,
    PauseCircle,
    Percent,
    IndianRupee,
} from "lucide-react";

import axios from "axios";

import Toast, {
    ToastType,
} from "../ui/Toast"

// ============================================================
// TYPES
// ============================================================

export type OfferStatus =
    | "ACTIVE"
    | "EXPIRED"
    | "UPCOMING"
    | "INACTIVE";

export interface OfferItem {
    _id: string;
    title: string;

    discountType:
    | "PERCENTAGE"
    | "FLAT";

    discountValue: number;

    startDate: string;
    endDate: string;

    offerStatus: OfferStatus;

    isActive: boolean;
}

export interface MenuItem {
    _id: string;

    name: string;
    flavour: string;
    description: string;

    image?: string;

    available: boolean;

    weight?: number;
    price?: number;

    offerId?: string | null;
    offer?: OfferItem | null;
}

interface FormErrors {
    name?: string;
    flavour?: string;
    weight?: string;
    price?: string;
    description?: string;
    offerId?: string;
}

interface FormData {
    name: string;
    flavour: string;
    weight: string;
    price: string;
    description: string;
    available: boolean;
    offerId: string | null;
}

const INITIAL_FORM_DATA: FormData = {
    name: "",
    flavour: "",
    weight: "",
    price: "",
    description: "",
    available: true,
    offerId: null,
};

// ============================================================
// HELPERS
// ============================================================

function formatOfferValue(offer: OfferItem) {
    if (offer.discountType === "PERCENTAGE") {
        return `${offer.discountValue}% OFF`;
    }

    return `₹${offer.discountValue} OFF`;
}

/**
 * Backend should normally provide offerStatus.
 *
 * This fallback is useful if an older API response does not
 * contain offerStatus.
 */
function getOfferStatus(offer: OfferItem): OfferStatus {
    if (!offer.isActive) return "INACTIVE"
    if (
        offer.offerStatus === "ACTIVE" ||
        offer.offerStatus === "UPCOMING" ||
        offer.offerStatus === "EXPIRED"
    ) {
        return offer.offerStatus;
    }

    const now = Date.now();

    const start = new Date(
        offer.startDate
    ).getTime();

    const end = new Date(
        offer.endDate
    ).getTime();

    if (
        Number.isNaN(start) ||
        Number.isNaN(end)
    ) {
        return "EXPIRED";
    }

    if (now < start) {
        return "UPCOMING";
    }

    if (now >= start && now <= end) {
        return "ACTIVE";
    }

    return "EXPIRED";
}

function getOfferStatusConfig(
    status: OfferStatus
) {
    switch (status) {
        case "ACTIVE":
            return {
                label: "ACTIVE",
                icon: CheckCircle,
                badgeClass:
                    "bg-emerald-50 text-emerald-700 border-emerald-200 " +
                    "dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800",
                iconClass:
                    "text-emerald-600 dark:text-emerald-400",
                titleClass:
                    "text-pink-600 dark:text-pink-400",
            };

        case "UPCOMING":
            return {
                label: "UPCOMING",
                icon: Clock3,
                badgeClass:
                    "bg-amber-50 text-amber-700 border-amber-200 " +
                    "dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800",
                iconClass:
                    "text-amber-600 dark:text-amber-400",
                titleClass:
                    "text-amber-700 dark:text-amber-400",
            };

        case "INACTIVE":
            return {
                label: "INACTIVE",
                icon: PauseCircle, // or AlertCircle / Ban
                badgeClass:
                    "bg-rose-50 text-rose-700 border-rose-200 " +
                    "dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800",
                iconClass:
                    "text-rose-600 dark:text-rose-400",
                titleClass:
                    "text-rose-700 dark:text-rose-400",
            };

        case "EXPIRED":
        default:
            return {
                label: "EXPIRED",
                icon: XCircle,
                badgeClass:
                    "bg-stone-100 text-stone-600 border-stone-200 " +
                    "dark:bg-stone-800 dark:text-stone-400 dark:border-stone-700",
                iconClass:
                    "text-stone-500 dark:text-stone-400",
                titleClass:
                    "text-stone-500 dark:text-stone-400",
            };
    }
}

function formatOfferDate(date: string) {
    const parsedDate = new Date(date);

    if (
        Number.isNaN(
            parsedDate.getTime()
        )
    ) {
        return "Invalid date";
    }

    return parsedDate.toLocaleString(
        "en-IN",
        {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        }
    );
}

function formatShortOfferDate(date: string) {
    const parsedDate = new Date(date);

    if (
        Number.isNaN(
            parsedDate.getTime()
        )
    ) {
        return "Invalid date";
    }

    return parsedDate.toLocaleDateString(
        "en-IN",
        {
            day: "2-digit",
            month: "short",
            year: "numeric",
        }
    );
}

// ============================================================
// COMPONENT
// ============================================================

export default function MenuList() {
    // ========================================================
    // MENU DATA
    // ========================================================

    const [items, setItems] =
        useState<MenuItem[]>([]);

    const [loading, setLoading] =
        useState(true);

    // IMPORTANT:
    // Store ALL offers.
    //
    // Previously this was activeOffers and UPCOMING / EXPIRED
    // offers were removed before reaching the UI.
    const [offers, setOffers] =
        useState<OfferItem[]>([]);

    const [offersLoading, setOffersLoading] =
        useState(false);

    const [search, setSearch] =
        useState("");

    const [debouncedSearch, setDebouncedSearch] =
        useState("");

    const [currentPage, setCurrentPage] =
        useState(1);

    const [totalPages, setTotalPages] =
        useState(1);

    const [totalItems, setTotalItems] =
        useState(0);

    const limit = 5;

    // ========================================================
    // FORM
    // ========================================================

    const [isFormModalOpen, setIsFormModalOpen] =
        useState(false);

    const [editingItem, setEditingItem] =
        useState<MenuItem | null>(null);

    const [formData, setFormData] =
        useState<FormData>(
            INITIAL_FORM_DATA
        );

    const [errors, setErrors] =
        useState<FormErrors>({});

    // ========================================================
    // DELETE
    // ========================================================

    const [isDeleteModalOpen, setIsDeleteModalOpen] =
        useState(false);

    const [itemToDelete, setItemToDelete] =
        useState<MenuItem | null>(null);

    // ========================================================
    // ACTION
    // ========================================================

    const [actionLoading, setActionLoading] =
        useState(false);

    const [serverError, setServerError] =
        useState("");

    const [isErrorModalOpen, setIsErrorModalOpen] =
        useState(false);



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

    // ========================================================
    // SEARCH DEBOUNCE
    // ========================================================

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(
                search.trim()
            );

            setCurrentPage(1);
        }, 400);

        return () =>
            clearTimeout(timer);
    }, [search]);

    // ========================================================
    // AUTHENTICATION
    // ========================================================

    useEffect(() => {
        const checkAuthentication =
            async () => {
                try {
                    const response =
                        await fetch(
                            "/api/admin",
                            {
                                method: "GET",
                                credentials:
                                    "include",
                                cache: "no-store",
                            }
                        );

                    const data =
                        await response.json();

                    if (
                        !response.ok ||
                        !data.authenticated
                    ) {
                        window.location.replace(
                            "/admin-panel/login"
                        );
                    }
                } catch (error) {
                    console.info(
                        "Authentication check failed:",
                        error
                    );

                    window.location.replace(
                        "/admin-panel/login"
                    );
                }
            };

        checkAuthentication();

        const handlePageShow =
            () => {
                checkAuthentication();
            };

        window.addEventListener(
            "pageshow",
            handlePageShow
        );

        return () => {
            window.removeEventListener(
                "pageshow",
                handlePageShow
            );
        };
    }, []);

    // ========================================================
    // FETCH MENU
    // ========================================================

    const fetchMenu = useCallback(
        async () => {
            setLoading(true);

            try {
                const response =
                    await axios.get(
                        "/api/admin/menu",
                        {
                            params: {
                                page: currentPage,
                                limit,
                                search: debouncedSearch,
                            },
                        }
                    );

                if (
                    response.data?.success
                ) {
                    setItems(
                        response.data.data ||
                        []
                    );

                    setTotalPages(
                        response.data
                            .pagination
                            ?.totalPages || 1
                    );

                    setTotalItems(
                        response.data
                            .pagination
                            ?.totalItems || 0
                    );
                }
            } catch (error) {
                console.info(
                    "Failed to fetch menu:",
                    error
                );
            } finally {
                setLoading(false);
            }
        },
        [
            currentPage,
            debouncedSearch,
        ]
    );

    useEffect(() => {
        fetchMenu();
    }, [fetchMenu]);

    // ========================================================
    // FETCH ALL OFFERS
    // ========================================================

    const fetchOffers = useCallback(
        async () => {
            setOffersLoading(true);

            try {
                const response =
                    await axios.get(
                        "/api/admin/offer",
                        {
                            params: {
                                page: 1,
                                limit: 100,
                                search: "",
                            },
                        }
                    );

                if (
                    response.data?.success
                ) {
                    const filteredOffers =
                        response.data.data
                        || [];



                    /**
                     * IMPORTANT:
                     *
                     * Do NOT filter here.
                     *
                     * We need:
                     * ACTIVE
                     * UPCOMING
                     * EXPIRED
                     *
                     * in the UI.
                     */
                    setOffers(
                        filteredOffers
                    );
                } else {
                    setOffers([]);
                }
            } catch (error: any) {
                console.error(
                    "Failed to fetch offers:",
                    error?.response
                        ?.data ||
                    error?.message
                );

                setOffers([]);
            } finally {
                setOffersLoading(false);
            }
        },
        []
    );

    useEffect(() => {
        fetchOffers();
    }, [fetchOffers]);

    useEffect(() => {
        if (isFormModalOpen) {
            fetchOffers();
        }
    }, [
        isFormModalOpen,
        fetchOffers,
    ]);

    // ========================================================
    // OFFER COUNTS
    // ========================================================

    const activeOfferCount =
        offers.filter(
            (offer) =>
                getOfferStatus(
                    offer
                ) === "ACTIVE"
        ).length;

    const upcomingOfferCount =
        offers.filter(
            (offer) =>
                getOfferStatus(
                    offer
                ) === "UPCOMING"
        ).length;

    const expiredOfferCount =
        offers.filter(
            (offer) =>
                getOfferStatus(
                    offer
                ) === "EXPIRED"
        ).length;

    const inactiveOfferCount =
        offers.filter(
            (offer) =>
                getOfferStatus(
                    offer
                ) === "INACTIVE"
        ).length;

    // ========================================================
    // FORM VALIDATION
    // ========================================================

    const validateForm = () => {
        const newErrors: FormErrors =
            {};

        // NAME
        if (!formData.name.trim()) {
            newErrors.name =
                "Menu name is required";
        }

        // FLAVOUR
        if (!formData.flavour.trim()) {
            newErrors.flavour =
                "Flavour is required";
        }

        // CREATE ONLY
        if (!editingItem) {
            // WEIGHT
            if (!formData.weight.trim()) {
                newErrors.weight =
                    "Weight is required";
            } else {
                const weight =
                    Number(
                        formData.weight
                    );

                if (
                    !Number.isFinite(
                        weight
                    )
                ) {
                    newErrors.weight =
                        "Weight must be a valid number";
                } else if (
                    weight < 0.5
                ) {
                    newErrors.weight =
                        "Minimum cake weight is 0.5 Kg";
                } else if (
                    Math.round(
                        weight * 10
                    ) /
                    10 !==
                    weight
                ) {
                    newErrors.weight =
                        "Weight must be in 0.1 Kg increments";
                }
            }

            // PRICE
            if (!formData.price.trim()) {
                newErrors.price =
                    "Price is required";
            } else {
                const price =
                    Number(
                        formData.price
                    );

                if (
                    !Number.isFinite(
                        price
                    )
                ) {
                    newErrors.price =
                        "Price must be a valid number";
                } else if (
                    price <= 0
                ) {
                    newErrors.price =
                        "Price must be greater than ₹0";
                }
            }
        }

        // DESCRIPTION
        if (
            !formData.description.trim()
        ) {
            newErrors.description =
                "Description is required";
        }

        setErrors(
            newErrors
        );

        return (
            Object.keys(
                newErrors
            ).length === 0
        );
    };

    // ========================================================
    // OPEN CREATE / EDIT
    // ========================================================

    const handleOpenFormModal = (
        item?: MenuItem
    ) => {
        setErrors({});
        setServerError("");
        setIsErrorModalOpen(false);

        if (item) {
            setEditingItem(item);

            setFormData({
                name: item.name,
                flavour: item.flavour,

                weight:
                    item.weight !==
                        undefined
                        ? String(
                            item.weight
                        )
                        : "",

                price:
                    item.price !==
                        undefined
                        ? String(
                            item.price
                        )
                        : "",

                description:
                    item.description ||
                    "",

                available:
                    item.available,

                offerId:
                    item.offerId
                        ? String(
                            item.offerId
                        )
                        : null,
            });
        } else {
            setEditingItem(null);

            setFormData({
                ...INITIAL_FORM_DATA,
            });
        }

        setIsFormModalOpen(true);
    };

    // ========================================================
    // CLOSE FORM
    // ========================================================

    const handleCloseFormModal = () => {
        setIsFormModalOpen(false);
        setEditingItem(null);

        setFormData({
            ...INITIAL_FORM_DATA,
        });

        setErrors({});
        setServerError("");
    };

    // ========================================================
    // CREATE / UPDATE
    // ========================================================

    const handleFormSubmit =
        async (
            e: React.FormEvent
        ) => {
            e.preventDefault();

            if (!validateForm()) {
                return;
            }

            setActionLoading(true);
            setServerError("");
            setIsErrorModalOpen(false);

            try {
                if (editingItem) {
                    const payload = {
                        name: formData.name.trim(),

                        flavour:
                            formData.flavour.trim(),

                        description:
                            formData.description.trim(),

                        available:
                            formData.available,

                        offerId:
                            formData.offerId ||
                            null,
                    };

                    await axios.put(
                        `/api/admin/menu/${editingItem._id}`,
                        payload
                    );
                    handleCloseFormModal();

                    await fetchMenu();

                    showToast("Menu item updated", "success");
                } else {
                    const payload = {
                        name: formData.name.trim(),

                        flavour:
                            formData.flavour.trim(),

                        weight: Number(
                            formData.weight
                        ),

                        price: Number(
                            formData.price
                        ),

                        description:
                            formData.description.trim(),

                        available:
                            formData.available,

                        offerId:
                            formData.offerId ||
                            null,
                    };

                    await axios.post(
                        "/api/admin/menu",
                        payload
                    );

                    handleCloseFormModal();

                    await fetchMenu();

                    showToast("Menu item added", "success");
                }

                // handleCloseFormModal();

                // await fetchMenu();
            } catch (error: any) {
                const errorMessage =
                    error?.response
                        ?.data?.error ||
                    error?.response
                        ?.data?.message ||
                    "Failed to save menu item. Please try again.";

                setServerError(
                    errorMessage
                );

                setIsErrorModalOpen(
                    true
                );
            } finally {
                setActionLoading(false);
            }
        };

    // ========================================================
    // AVAILABILITY
    // ========================================================

    const handleToggleAvailability =
        async (
            item: MenuItem
        ) => {
            try {
                await axios.patch(
                    `/api/admin/menu/${item._id}`,
                    {
                        available:
                            !item.available,
                    }
                );

                await fetchMenu();

                showToast(
                    item.available
                        ? "Menu item marked unavailable"
                        : "Menu item marked available",
                    "success"
                );
            } catch (error: any) {
                const errorMessage =
                    error?.response
                        ?.data?.error ||
                    "Failed to update availability.";

                setServerError(
                    errorMessage
                );

                setIsErrorModalOpen(
                    true
                );
            }
        };

    // ========================================================
    // DELETE
    // ========================================================

    const handleDeleteConfirm =
        async () => {
            if (!itemToDelete) {
                return;
            }

            setActionLoading(true);

            try {
                await axios.delete(
                    `/api/admin/menu/${itemToDelete._id}`
                );

                setIsDeleteModalOpen(
                    false
                );

                setItemToDelete(null);

                await fetchMenu();

                showToast("Menu item deleted", "success");
            } catch (error: any) {
                const errorMessage =
                    error?.response
                        ?.data?.error ||
                    error?.response
                        ?.data?.message ||
                    "Failed to delete menu item. Please try again.";

                setServerError(
                    errorMessage
                );

                setIsErrorModalOpen(
                    true
                );
            } finally {
                setActionLoading(false);
            }
        };

    // ========================================================
    // CURRENT EDIT OFFER
    // ========================================================

    const currentEditOffer =
        editingItem?.offer || null;

    /**
     * ALL offers are available in dropdown.
     *
     * This means:
     *
     * ACTIVE   -> selectable
     * UPCOMING -> selectable
     * EXPIRED  -> visible, but clearly marked
     *
     * We keep the currently attached offer even if the
     * backend did not return it in the offers endpoint.
     */
    const offersForDropdown = [
        ...offers,

        ...(currentEditOffer &&
            !offers.some(
                (offer) =>
                    offer._id ===
                    currentEditOffer._id
            )
            ? [currentEditOffer]
            : []),
    ];

    // ========================================================
    // SELECTED OFFER
    // ========================================================

    const selectedOffer =
        formData.offerId
            ? offersForDropdown.find(
                (offer) =>
                    offer._id ===
                    formData.offerId
            )
            : null;

    // ========================================================
    // UI
    // ========================================================

    return (
        <div
            className="
                min-h-screen
                bg-amber-50/30
                dark:bg-stone-950
                text-stone-800
                dark:text-stone-100
                pt-20
                px-4
                pb-4
                md:pt-20
                md:px-8
                md:pb-8
                lg:pt-8
                transition-colors
                duration-300
            "
        >

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

            <div
                className="
                    max-w-7xl
                    mx-auto
                    space-y-6
                "
            >
                {/* ==================================================
                    HEADER
                ================================================== */}

                <div
                    className="
                        flex
                        flex-col
                        sm:flex-row
                        sm:items-center
                        sm:justify-between
                        gap-5
                        border-b
                        border-stone-200
                        dark:border-stone-800
                        pb-6
                    "
                >
                    <div>
                        <div
                            className="
                                flex
                                items-center
                                gap-2
                            "
                        >
                            <div
                                className="
                                    w-9
                                    h-9
                                    rounded-xl
                                    bg-pink-100
                                    dark:bg-pink-950/40
                                    text-pink-600
                                    dark:text-pink-400
                                    flex
                                    items-center
                                    justify-center
                                "
                            >
                                <CakeSlice className="w-5 h-5" />
                            </div>

                            <h1
                                className="
                                    text-2xl
                                    md:text-3xl
                                    font-serif
                                    font-bold
                                    text-stone-900
                                    dark:text-stone-50
                                "
                            >
                                Menu Items
                            </h1>
                        </div>

                        <p
                            className="
                                text-xs
                                md:text-sm
                                text-stone-500
                                dark:text-stone-400
                                mt-2
                            "
                        >
                            Manage bakery
                            products,
                            flavours,
                            offers,
                            availability,
                            and listings.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={() =>
                            handleOpenFormModal()
                        }
                        className="
                            inline-flex
                            items-center
                            justify-center
                            gap-2
                            bg-pink-600
                            hover:bg-pink-700
                            dark:bg-pink-500
                            dark:hover:bg-pink-600
                            text-white
                            font-medium
                            text-xs
                            md:text-sm
                            px-5
                            py-2.5
                            rounded-full
                            shadow-lg
                            shadow-pink-600/20
                            transition-all
                            active:scale-95
                            cursor-pointer
                        "
                    >
                        <Plus className="w-4 h-4" />
                        Add New Item
                    </button>
                </div>

                {/* ==================================================
                    SEARCH + OFFER SUMMARY
                ================================================== */}

                <div
                    className="
                        flex
                        flex-col
                        md:flex-row
                        md:items-center
                        md:justify-between
                        gap-4
                        bg-white
                        dark:bg-stone-900
                        border
                        border-stone-200/80
                        dark:border-stone-800
                        p-4
                        rounded-2xl
                        shadow-sm
                    "
                >
                    <div
                        className="
                            relative
                            w-full
                            md:w-96
                        "
                    >
                        <Search
                            className="
                                absolute
                                left-3.5
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
                            onChange={(e) =>
                                setSearch(
                                    e.target.value
                                )
                            }
                            placeholder="Search cakes, flavours..."
                            className="
                                w-full
                                pl-10
                                pr-10
                                py-2.5
                                rounded-full
                                border
                                border-stone-200
                                dark:border-stone-800
                                bg-stone-50/50
                                dark:bg-stone-950
                                text-xs
                                md:text-sm
                                text-stone-900
                                dark:text-stone-100
                                placeholder-stone-400
                                focus:outline-none
                                focus:ring-2
                                focus:ring-pink-500/50
                                focus:border-pink-500
                            "
                        />

                        {search && (
                            <button
                                type="button"
                                onClick={() =>
                                    setSearch("")
                                }
                                className="
                                    absolute
                                    right-3
                                    top-1/2
                                    -translate-y-1/2
                                    text-stone-400
                                    hover:text-stone-700
                                    dark:hover:text-stone-200
                                "
                            >
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </div>

                    <div
                        className="
                            flex
                            flex-wrap
                            items-center
                            gap-2
                            md:justify-end
                        "
                    >
                        {/* STATUS WITH COUNT */}

                        {/* <div
                            className="
                                inline-flex
                                items-center
                                gap-2
                                px-3
                                py-2
                                rounded-xl
                                bg-emerald-50
                                dark:bg-emerald-950/20
                                border
                                border-emerald-100
                                dark:border-emerald-900
                            "
                        >
                            <CheckCircle
                                className="
                                    w-3.5
                                    h-3.5
                                    text-emerald-600
                                    dark:text-emerald-400
                                "
                            />

                            <span
                                className="
                                    text-xs
                                    font-medium
                                    text-emerald-700
                                    dark:text-emerald-300
                                "
                            >
                                {activeOfferCount} active
                            </span>
                        </div>


                        <div
                            className="
                                inline-flex
                                items-center
                                gap-2
                                px-3
                                py-2
                                rounded-xl
                                bg-amber-50
                                dark:bg-amber-950/20
                                border
                                border-amber-100
                                dark:border-amber-900
                            "
                        >
                            <Clock3
                                className="
                                    w-3.5
                                    h-3.5
                                    text-amber-600
                                    dark:text-amber-400
                                "
                            />

                            <span
                                className="
                                    text-xs
                                    font-medium
                                    text-amber-700
                                    dark:text-amber-300
                                "
                            >
                                {upcomingOfferCount} upcoming
                            </span>
                        </div>

                        <div
                            className="
        inline-flex
        items-center
        gap-2
        px-3
        py-2
        rounded-xl
        bg-stone-100
        dark:bg-stone-900/40
        border
        border-stone-200
        dark:border-stone-800
    "
                        >
                            <XCircle
                                className="
            w-3.5
            h-3.5
            text-stone-500
            dark:text-stone-400
        "
                            />

                            <span
                                className="
            text-xs
            font-medium
            text-stone-700
            dark:text-stone-300
        "
                            >
                                {expiredOfferCount} expired
                            </span>
                        </div> */}

                        {/* TOTAL ITEMS */}

                        <div
                            className="
                                text-xs
                                text-stone-500
                                dark:text-stone-400
                                ml-1
                            "
                        >
                            Showing{" "}
                            <span
                                className="
                                    font-semibold
                                    text-stone-800
                                    dark:text-stone-200
                                "
                            >
                                {items.length}
                            </span>{" "}
                            of{" "}
                            <span
                                className="
                                    font-semibold
                                    text-stone-800
                                    dark:text-stone-200
                                "
                            >
                                {totalItems}
                            </span>{" "}
                            items
                        </div>
                    </div>
                </div>

                {/* ==================================================
                    OFFER STATUS LEGEND
                ================================================== */}

                {/* <div
                    className="
                        flex
                        flex-wrap
                        items-center
                        gap-3
                        px-1
                    "
                >
                    <span
                        className="
                            text-[10px]
                            uppercase
                            tracking-wider
                            font-semibold
                            text-stone-400
                        "
                    >
                        Offer status
                    </span>

                    {(
                        [
                            "ACTIVE",
                            "UPCOMING",
                            "EXPIRED",
                            "INACTIVE",
                        ] as OfferStatus[]
                    ).map((status) => {
                        const config =
                            getOfferStatusConfig(
                                status
                            );

                        const Icon =
                            config.icon;

                        return (
                            <span
                                key={status}
                                className={`
                                    inline-flex
                                    items-center
                                    gap-1.5
                                    px-2.5
                                    py-1
                                    rounded-full
                                    border
                                    text-[10px]
                                    font-bold
                                    ${config.badgeClass}
                                `}
                            >
                                <Icon className="w-3 h-3" />
                                <span
                                    className="
            text-xs
            font-medium
            text-stone-700
            dark:text-stone-300
        "
                                >
                                    {status === "ACTIVE"
                                        ? activeOfferCount
                                        : status === "UPCOMING"
                                            ? upcomingOfferCount
                                            : status === "EXPIRED"
                                                ? expiredOfferCount
                                                : status === "INACTIVE"
                                                    ? inactiveOfferCount
                                                    : 0}
                                </span>
                                {status}
                            </span>
                        );
                    })}
                </div> */}

                {/* ==================================================
                    TABLE
                ================================================== */}

                <div
                    className="
                        bg-white
                        dark:bg-stone-900
                        border
                        border-stone-200/80
                        dark:border-stone-800
                        rounded-2xl
                        shadow-sm
                        overflow-hidden
                    "
                >
                    {loading ? (
                        <div
                            className="
                                p-16
                                text-center
                                text-stone-500
                                dark:text-stone-400
                                space-y-3
                            "
                        >
                            <Sparkles
                                className="
                                    w-7
                                    h-7
                                    animate-spin
                                    mx-auto
                                    text-pink-500
                                "
                            />

                            <p className="text-xs md:text-sm">
                                Fetching bakery
                                menu...
                            </p>
                        </div>
                    ) : items.length ===
                        0 ? (
                        <div
                            className="
                                p-16
                                text-center
                                text-stone-500
                                dark:text-stone-400
                            "
                        >
                            <div
                                className="
                                    w-14
                                    h-14
                                    mx-auto
                                    rounded-2xl
                                    bg-stone-100
                                    dark:bg-stone-800
                                    flex
                                    items-center
                                    justify-center
                                    mb-4
                                "
                            >
                                <CakeSlice className="w-6 h-6" />
                            </div>

                            <p
                                className="
                                    font-semibold
                                    text-sm
                                    text-stone-700
                                    dark:text-stone-300
                                "
                            >
                                No menu items
                                found
                            </p>

                            <p className="text-xs mt-1">
                                Try adjusting
                                your search
                                or add a new
                                cake item.
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table
                                className="
                                    w-full
                                    min-w-[1100px]
                                    table-fixed
                                    text-left
                                    border-collapse
                                "
                            >
                                <colgroup>
                                    <col className="w-[27%]" />
                                    <col className="w-[15%]" />
                                    <col className="w-[29%]" />
                                    <col className="w-[14%]" />
                                    <col className="w-[15%]" />
                                </colgroup>

                                <thead>
                                    <tr
                                        className="
                                            border-b
                                            border-stone-200/80
                                            dark:border-stone-800
                                            bg-stone-50/60
                                            dark:bg-stone-950/50
                                            text-[10px]
                                            md:text-[11px]
                                            uppercase
                                            tracking-wider
                                            text-stone-500
                                            dark:text-stone-400
                                        "
                                    >
                                        <th className="px-5 py-4">
                                            Product
                                        </th>

                                        <th className="px-4 py-4">
                                            Flavour
                                        </th>

                                        <th className="px-4 py-4">
                                            Offer
                                        </th>

                                        <th className="px-4 py-4">
                                            Status
                                        </th>

                                        <th className="px-5 py-4 text-right">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>

                                <tbody
                                    className="
                                        divide-y
                                        divide-stone-200/60
                                        dark:divide-stone-800
                                        text-xs
                                        md:text-sm
                                    "
                                >
                                    {items.map(
                                        (
                                            item
                                        ) => {
                                            const attachedOffer =
                                                item.offer ||
                                                null;

                                            const hasOffer =
                                                Boolean(
                                                    item.offerId ||
                                                    item.offer
                                                );

                                            const offerStatus =
                                                attachedOffer
                                                    ? getOfferStatus(
                                                        attachedOffer
                                                    )
                                                    : null;

                                            const offerConfig =
                                                offerStatus
                                                    ? getOfferStatusConfig(
                                                        offerStatus
                                                    )
                                                    : null;

                                            const OfferStatusIcon =
                                                offerConfig?.icon;

                                            return (
                                                <tr
                                                    key={
                                                        item._id
                                                    }
                                                    className={`
                                                        transition-colors
                                                        ${hasOffer
                                                            ? "bg-pink-50/30 dark:bg-pink-950/10 hover:bg-pink-50/60 dark:hover:bg-pink-950/20"
                                                            : "hover:bg-stone-50/60 dark:hover:bg-stone-800/40"
                                                        }
                                                    `}
                                                >
                                                    {/* PRODUCT */}

                                                    <td className="px-5 py-4 align-middle">
                                                        <div className="flex items-center gap-3">
                                                            <div
                                                                className="
                                                                    w-11
                                                                    h-11
                                                                    rounded-xl
                                                                    bg-pink-100
                                                                    dark:bg-pink-950/40
                                                                    border
                                                                    border-pink-200
                                                                    dark:border-pink-800
                                                                    flex
                                                                    items-center
                                                                    justify-center
                                                                    text-pink-600
                                                                    dark:text-pink-400
                                                                    shrink-0
                                                                "
                                                            >
                                                                <CakeSlice className="w-5 h-5" />
                                                            </div>

                                                            <div className="min-w-0">
                                                                <p
                                                                    className="
                                                                        font-semibold
                                                                        text-stone-900
                                                                        dark:text-stone-100
                                                                        truncate
                                                                    "
                                                                >
                                                                    {
                                                                        item.name
                                                                    }
                                                                </p>

                                                                <p
                                                                    className="
                                                                        text-[11px]
                                                                        text-stone-500
                                                                        dark:text-stone-400
                                                                        truncate
                                                                        max-w-[230px]
                                                                        mt-0.5
                                                                    "
                                                                >
                                                                    {
                                                                        item.description
                                                                    }
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </td>

                                                    {/* FLAVOUR */}

                                                    <td className="px-4 py-4 align-middle">
                                                        <span
                                                            className="
                                                                inline-flex
                                                                items-center
                                                                px-2.5
                                                                py-1.5
                                                                rounded-full
                                                                text-[11px]
                                                                font-medium
                                                                bg-stone-100
                                                                dark:bg-stone-800
                                                                text-stone-700
                                                                dark:text-stone-300
                                                                border
                                                                border-stone-200
                                                                dark:border-stone-700
                                                            "
                                                        >
                                                            {
                                                                item.flavour
                                                            }
                                                        </span>
                                                    </td>

                                                    {/* OFFER */}

                                                    <td className="px-4 py-4 align-middle">
                                                        {attachedOffer ? (
                                                            <div className="space-y-2">
                                                                <div className="flex items-center gap-2">
                                                                    <Tag
                                                                        className={`
                                                                            w-3.5
                                                                            h-3.5
                                                                            shrink-0
                                                                            ${offerConfig?.iconClass
                                                                            }
                                                                        `}
                                                                    />

                                                                    <span
                                                                        className={`
                                                                            text-xs
                                                                            font-semibold
                                                                            truncate
                                                                            ${offerConfig?.titleClass
                                                                            }
                                                                        `}
                                                                    >
                                                                        {
                                                                            attachedOffer.title
                                                                        }
                                                                    </span>

                                                                    {OfferStatusIcon &&
                                                                        offerConfig && (
                                                                            <span
                                                                                className={`
                                                                                    inline-flex
                                                                                    items-center
                                                                                    gap-1
                                                                                    shrink-0
                                                                                    px-1.5
                                                                                    py-0.5
                                                                                    rounded-full
                                                                                    border
                                                                                    text-[9px]
                                                                                    font-bold
                                                                                    ${offerConfig.badgeClass}
                                                                                `}
                                                                            >
                                                                                <OfferStatusIcon className="w-2.5 h-2.5" />
                                                                                {
                                                                                    offerConfig.label
                                                                                }
                                                                            </span>
                                                                        )}
                                                                </div>

                                                                <div
                                                                    className="
                                                                        flex
                                                                        items-center
                                                                        gap-1.5
                                                                        text-[11px]
                                                                        font-semibold
                                                                        text-stone-600
                                                                        dark:text-stone-300
                                                                    "
                                                                >
                                                                    {/* {attachedOffer.discountType ===
                                                                    "PERCENTAGE" ? (
                                                                        <Percent className="w-3 h-3 text-pink-500" />
                                                                    ) : (
                                                                        <IndianRupee className="w-3 h-3 text-pink-500" />
                                                                    )} */}

                                                                    {
                                                                        formatOfferValue(
                                                                            attachedOffer
                                                                        )
                                                                    }
                                                                </div>

                                                                <div
                                                                    className="
                                                                        flex
                                                                        items-center
                                                                        gap-1.5
                                                                        text-[10px]
                                                                        text-stone-400
                                                                    "
                                                                >
                                                                    <CalendarDays className="w-3 h-3" />

                                                                    <span className="truncate">
                                                                        {
                                                                            formatShortOfferDate(
                                                                                attachedOffer.startDate
                                                                            )
                                                                        }{" "}
                                                                        →
                                                                        {" "}
                                                                        {
                                                                            formatShortOfferDate(
                                                                                attachedOffer.endDate
                                                                            )
                                                                        }
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div className="flex items-center gap-2">
                                                                <span
                                                                    className="
                                                                        w-7
                                                                        h-7
                                                                        rounded-lg
                                                                        bg-stone-100
                                                                        dark:bg-stone-800
                                                                        flex
                                                                        items-center
                                                                        justify-center
                                                                    "
                                                                >
                                                                    <Tag
                                                                        className="
                                                                            w-3.5
                                                                            h-3.5
                                                                            text-stone-400
                                                                        "
                                                                    />
                                                                </span>

                                                                <span
                                                                    className="
                                                                        text-xs
                                                                        text-stone-400
                                                                        italic
                                                                    "
                                                                >
                                                                    No
                                                                    offer
                                                                </span>
                                                            </div>
                                                        )}
                                                    </td>

                                                    {/* PRODUCT AVAILABILITY */}

                                                    <td className="px-4 py-4 align-middle">
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                handleToggleAvailability(
                                                                    item
                                                                )
                                                            }
                                                            className={`
                                                                inline-flex
                                                                items-center
                                                                gap-1.5
                                                                px-3
                                                                py-1.5
                                                                rounded-full
                                                                text-[11px]
                                                                font-semibold
                                                                transition-all
                                                                cursor-pointer
                                                                ${item.available
                                                                    ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-950/70"
                                                                    : "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800 hover:bg-rose-100 dark:hover:bg-rose-950/70"
                                                                }
                                                            `}
                                                        >
                                                            {item.available ? (
                                                                <>
                                                                    <CheckCircle className="w-3.5 h-3.5" />
                                                                    Available
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <XCircle className="w-3.5 h-3.5" />
                                                                    Unavailable
                                                                </>
                                                            )}
                                                        </button>
                                                    </td>

                                                    {/* ACTIONS */}

                                                    <td className="px-5 py-4 align-middle">
                                                        <div className="flex items-center justify-end gap-1">
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    handleOpenFormModal(
                                                                        item
                                                                    )
                                                                }
                                                                className="
                                                                    p-2
                                                                    rounded-xl
                                                                    text-stone-500
                                                                    hover:text-pink-600
                                                                    hover:bg-pink-50
                                                                    dark:text-stone-400
                                                                    dark:hover:text-pink-400
                                                                    dark:hover:bg-pink-950/30
                                                                    transition-colors
                                                                "
                                                                title="Edit Menu Item"
                                                            >
                                                                <Edit2 className="w-4 h-4" />
                                                            </button>

                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    setItemToDelete(
                                                                        item
                                                                    );

                                                                    setIsDeleteModalOpen(
                                                                        true
                                                                    );
                                                                }}
                                                                className="
                                                                    p-2
                                                                    rounded-xl
                                                                    text-stone-500
                                                                    hover:text-rose-600
                                                                    hover:bg-rose-50
                                                                    dark:text-stone-400
                                                                    dark:hover:text-rose-400
                                                                    dark:hover:bg-rose-950/30
                                                                    transition-colors
                                                                "
                                                                title="Delete Menu Item"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        }
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* ==================================================
                        PAGINATION
                    ================================================== */}

                    {!loading &&
                        items.length >
                        0 && (
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
                                        {
                                            currentPage
                                        }
                                    </span>{" "}
                                    of{" "}
                                    <span
                                        className="
                                            font-semibold
                                            text-stone-800
                                            dark:text-stone-200
                                        "
                                    >
                                        {
                                            totalPages
                                        }
                                    </span>
                                </span>

                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        disabled={
                                            currentPage <=
                                            1
                                        }
                                        onClick={() =>
                                            setCurrentPage(
                                                (
                                                    p
                                                ) =>
                                                    Math.max(
                                                        1,
                                                        p -
                                                        1
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
                                        <ChevronLeft className="w-4 h-4" />
                                    </button>

                                    <button
                                        type="button"
                                        disabled={
                                            currentPage >=
                                            totalPages
                                        }
                                        onClick={() =>
                                            setCurrentPage(
                                                (
                                                    p
                                                ) =>
                                                    Math.min(
                                                        totalPages,
                                                        p +
                                                        1
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

            {/* ============================================================
                CREATE / EDIT MODAL
            ============================================================ */}

            {isFormModalOpen && (
                <div
                    className="
                        fixed
                        inset-0
                        z-50
                        flex
                        items-center
                        justify-center
                        p-4
                        bg-stone-950/60
                        backdrop-blur-sm
                        animate-in
                        fade-in
                        duration-200
                    "
                >
                    <div
                        className="
                            bg-white
                            dark:bg-stone-900
                            border
                            border-stone-200
                            dark:border-stone-800
                            rounded-3xl
                            shadow-2xl
                            w-full
                            max-w-xl
                            overflow-hidden
                            max-h-[92vh]
                            flex
                            flex-col
                        "
                    >
                        {/* MODAL HEADER */}

                        <div
                            className="
                                flex
                                items-center
                                justify-between
                                px-6
                                py-5
                                border-b
                                border-stone-200
                                dark:border-stone-800
                                shrink-0
                            "
                        >
                            <div>
                                <div className="flex items-center gap-2">
                                    <div
                                        className="
                                            w-8
                                            h-8
                                            rounded-lg
                                            bg-pink-100
                                            dark:bg-pink-950/40
                                            text-pink-600
                                            dark:text-pink-400
                                            flex
                                            items-center
                                            justify-center
                                        "
                                    >
                                        {editingItem ? (
                                            <Edit2 className="w-4 h-4" />
                                        ) : (
                                            <Plus className="w-4 h-4" />
                                        )}
                                    </div>

                                    <h2
                                        className="
                                            text-lg
                                            font-serif
                                            font-bold
                                            text-stone-900
                                            dark:text-stone-100
                                        "
                                    >
                                        {editingItem
                                            ? "Edit Menu Item"
                                            : "Add New Cake"}
                                    </h2>
                                </div>

                                <p
                                    className="
                                        text-[11px]
                                        text-stone-500
                                        dark:text-stone-400
                                        mt-1
                                        ml-10
                                    "
                                >
                                    {editingItem
                                        ? "Update product details and offer."
                                        : "Add a new cake to your bakery menu."}
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={
                                    handleCloseFormModal
                                }
                                className="
                                    p-2
                                    rounded-xl
                                    text-stone-400
                                    hover:text-stone-700
                                    hover:bg-stone-100
                                    dark:hover:text-stone-200
                                    dark:hover:bg-stone-800
                                    transition-colors
                                "
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* FORM */}

                        <form
                            onSubmit={
                                handleFormSubmit
                            }
                            className="
                                p-6
                                space-y-5
                                overflow-y-auto
                            "
                        >
                            {/* NAME */}

                            <div>
                                <label
                                    className="
                                        block
                                        text-xs
                                        font-semibold
                                        text-stone-700
                                        dark:text-stone-300
                                        mb-1.5
                                    "
                                >
                                    Cake Name *
                                </label>

                                <input
                                    type="text"
                                    value={
                                        formData.name
                                    }
                                    onChange={(e) =>
                                        setFormData(
                                            {
                                                ...formData,
                                                name: e
                                                    .target
                                                    .value,
                                            }
                                        )
                                    }
                                    placeholder="e.g. White Forest"
                                    className="
                                        w-full
                                        px-3.5
                                        py-2.5
                                        rounded-xl
                                        border
                                        border-stone-200
                                        dark:border-stone-800
                                        bg-stone-50
                                        dark:bg-stone-950
                                        text-sm
                                        text-stone-900
                                        dark:text-stone-100
                                        focus:outline-none
                                        focus:ring-2
                                        focus:ring-pink-500/40
                                        focus:border-pink-500
                                    "
                                />

                                {errors.name && (
                                    <p className="text-xs text-rose-500 mt-1.5">
                                        {
                                            errors.name
                                        }
                                    </p>
                                )}
                            </div>

                            {/* FLAVOUR */}

                            <div>
                                <label
                                    className="
                                        block
                                        text-xs
                                        font-semibold
                                        text-stone-700
                                        dark:text-stone-300
                                        mb-1.5
                                    "
                                >
                                    Flavour *
                                </label>

                                <input
                                    type="text"
                                    value={
                                        formData.flavour
                                    }
                                    onChange={(e) =>
                                        setFormData(
                                            {
                                                ...formData,
                                                flavour:
                                                    e
                                                        .target
                                                        .value,
                                            }
                                        )
                                    }
                                    placeholder="e.g. White Chocolate"
                                    className="
                                        w-full
                                        px-3.5
                                        py-2.5
                                        rounded-xl
                                        border
                                        border-stone-200
                                        dark:border-stone-800
                                        bg-stone-50
                                        dark:bg-stone-950
                                        text-sm
                                        text-stone-900
                                        dark:text-stone-100
                                        focus:outline-none
                                        focus:ring-2
                                        focus:ring-pink-500/40
                                        focus:border-pink-500
                                    "
                                />

                                {errors.flavour && (
                                    <p className="text-xs text-rose-500 mt-1.5">
                                        {
                                            errors.flavour
                                        }
                                    </p>
                                )}
                            </div>

                            {/* WEIGHT + PRICE */}

                            {!editingItem && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label
                                            className="
                                                block
                                                text-xs
                                                font-semibold
                                                text-stone-700
                                                dark:text-stone-300
                                                mb-1.5
                                            "
                                        >
                                            Initial Weight
                                            (Kg) *
                                        </label>

                                        <input
                                            type="number"
                                            min="0.5"
                                            step="0.1"
                                            value={
                                                formData.weight
                                            }
                                            onChange={(
                                                e
                                            ) =>
                                                setFormData(
                                                    {
                                                        ...formData,
                                                        weight: e
                                                            .target
                                                            .value,
                                                    }
                                                )
                                            }
                                            placeholder="1.0"
                                            className="
                                                w-full
                                                px-3.5
                                                py-2.5
                                                rounded-xl
                                                border
                                                border-stone-200
                                                dark:border-stone-800
                                                bg-stone-50
                                                dark:bg-stone-950
                                                text-sm
                                                focus:outline-none
                                                focus:ring-2
                                                focus:ring-pink-500/40
                                                focus:border-pink-500
                                            "
                                        />

                                        <p className="text-[10px] text-stone-400 mt-1">
                                            Minimum 0.5 Kg
                                            · 0.1 Kg
                                            increments
                                        </p>

                                        {errors.weight && (
                                            <p className="text-xs text-rose-500 mt-1.5">
                                                {
                                                    errors.weight
                                                }
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <label
                                            className="
                                                block
                                                text-xs
                                                font-semibold
                                                text-stone-700
                                                dark:text-stone-300
                                                mb-1.5
                                            "
                                        >
                                            Price (₹) *
                                        </label>

                                        <input
                                            type="number"
                                            min="1"
                                            step="1"
                                            value={
                                                formData.price
                                            }
                                            onChange={(
                                                e
                                            ) =>
                                                setFormData(
                                                    {
                                                        ...formData,
                                                        price: e
                                                            .target
                                                            .value,
                                                    }
                                                )
                                            }
                                            placeholder="650"
                                            className="
                                                w-full
                                                px-3.5
                                                py-2.5
                                                rounded-xl
                                                border
                                                border-stone-200
                                                dark:border-stone-800
                                                bg-stone-50
                                                dark:bg-stone-950
                                                text-sm
                                                focus:outline-none
                                                focus:ring-2
                                                focus:ring-pink-500/40
                                                focus:border-pink-500
                                            "
                                        />

                                        {errors.price && (
                                            <p className="text-xs text-rose-500 mt-1.5">
                                                {
                                                    errors.price
                                                }
                                            </p>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* ==================================================
                                OFFER
                            ================================================== */}

                            <div>
                                <div className="flex items-center justify-between mb-1.5">
                                    <div>
                                        <label
                                            className="
                                                block
                                                text-xs
                                                font-semibold
                                                text-stone-700
                                                dark:text-stone-300
                                            "
                                        >
                                            Attach Offer
                                        </label>

                                        <p className="text-[10px] text-stone-400 mt-0.5">
                                            Upcoming offers can
                                            be attached now and
                                            will become active
                                            on their start date.
                                        </p>
                                    </div>

                                    {offersLoading && (
                                        <span
                                            className="
                                                text-[10px]
                                                text-stone-400
                                            "
                                        >
                                            Loading offers...
                                        </span>
                                    )}
                                </div>

                                <select
                                    value={formData.offerId || ""}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            offerId: e.target.value || null,
                                        })
                                    }
                                    disabled={offersLoading}
                                    className="
        w-full
        px-3.5
        py-2.5
        rounded-xl
        border
        border-stone-200
        dark:border-stone-800
        bg-stone-50
        dark:bg-stone-950
        text-sm
        text-stone-900
        dark:text-stone-100
        focus:outline-none
        focus:ring-2
        focus:ring-pink-500/40
        focus:border-pink-500
        disabled:opacity-50
    "
                                >
                                    <option value="">
                                        No offer — Standard Pricing
                                    </option>

                                    {offersForDropdown
                                        .filter((offer) => {
                                            const status = getOfferStatus(offer);

                                            return (
                                                status === "ACTIVE" ||
                                                status === "UPCOMING"
                                            );
                                        })
                                        .map((offer) => {
                                            const status = getOfferStatus(offer);

                                            return (
                                                <option
                                                    key={offer._id}
                                                    value={offer._id}
                                                >
                                                    {offer.title} —{" "}
                                                    {formatOfferValue(offer)}{" "}
                                                    ({status})
                                                </option>
                                            );
                                        })}
                                </select>

                                {/* SELECTED OFFER PREVIEW */}

                                {selectedOffer && (
                                    <div
                                        className="
                                            mt-3
                                            rounded-2xl
                                            border
                                            border-stone-200
                                            dark:border-stone-800
                                            overflow-hidden
                                            bg-stone-50
                                            dark:bg-stone-950
                                        "
                                    >
                                        {(() => {
                                            const status =
                                                getOfferStatus(
                                                    selectedOffer
                                                );

                                            const config =
                                                getOfferStatusConfig(
                                                    status
                                                );

                                            const StatusIcon =
                                                config.icon;

                                            return (
                                                <>
                                                    {/* OFFER HEADER */}

                                                    <div
                                                        className="
                                                            p-4
                                                            flex
                                                            items-start
                                                            justify-between
                                                            gap-3
                                                        "
                                                    >
                                                        <div className="flex items-start gap-3 min-w-0">
                                                            <div
                                                                className="
                                                                    w-9
                                                                    h-9
                                                                    rounded-xl
                                                                    bg-white
                                                                    dark:bg-stone-900
                                                                    border
                                                                    border-stone-200
                                                                    dark:border-stone-800
                                                                    flex
                                                                    items-center
                                                                    justify-center
                                                                    text-pink-600
                                                                    dark:text-pink-400
                                                                    shrink-0
                                                                "
                                                            >
                                                                <Tag className="w-4 h-4" />
                                                            </div>

                                                            <div className="min-w-0">
                                                                <p
                                                                    className="
                                                                        text-sm
                                                                        font-semibold
                                                                        text-stone-900
                                                                        dark:text-stone-100
                                                                        truncate
                                                                    "
                                                                >
                                                                    {
                                                                        selectedOffer.title
                                                                    }
                                                                </p>

                                                                <p
                                                                    className="
                                                                        text-xs
                                                                        font-semibold
                                                                        text-pink-600
                                                                        dark:text-pink-400
                                                                        mt-0.5
                                                                    "
                                                                >
                                                                    {
                                                                        formatOfferValue(
                                                                            selectedOffer
                                                                        )
                                                                    }
                                                                </p>
                                                            </div>
                                                        </div>

                                                        <span
                                                            className={`
                                                                inline-flex
                                                                items-center
                                                                gap-1.5
                                                                shrink-0
                                                                px-2.5
                                                                py-1.5
                                                                rounded-full
                                                                border
                                                                text-[9px]
                                                                font-bold
                                                                ${config.badgeClass}
                                                            `}
                                                        >
                                                            <StatusIcon className="w-3 h-3" />
                                                            {
                                                                status
                                                            }
                                                        </span>
                                                    </div>

                                                    {/* OFFER DATES */}

                                                    <div
                                                        className="
                                                            border-t
                                                            border-stone-200
                                                            dark:border-stone-800
                                                            px-4
                                                            py-3
                                                            space-y-2
                                                        "
                                                    >
                                                        <div
                                                            className="
                                                                flex
                                                                items-center
                                                                gap-2
                                                                text-[10px]
                                                                text-stone-500
                                                                dark:text-stone-400
                                                            "
                                                        >
                                                            <CalendarDays className="w-3.5 h-3.5 shrink-0" />

                                                            <span>
                                                                {
                                                                    formatOfferDate(
                                                                        selectedOffer.startDate
                                                                    )
                                                                }
                                                            </span>

                                                            <span>
                                                                →
                                                            </span>

                                                            <span>
                                                                {
                                                                    formatOfferDate(
                                                                        selectedOffer.endDate
                                                                    )
                                                                }
                                                            </span>
                                                        </div>

                                                        {/* STATUS MESSAGE */}

                                                        {status ===
                                                            "UPCOMING" && (
                                                                <div
                                                                    className="
                                                                    rounded-xl
                                                                    bg-amber-50
                                                                    dark:bg-amber-950/20
                                                                    border
                                                                    border-amber-100
                                                                    dark:border-amber-900
                                                                    px-3
                                                                    py-2
                                                                "
                                                                >
                                                                    <p
                                                                        className="
                                                                        text-[10px]
                                                                        font-semibold
                                                                        text-amber-700
                                                                        dark:text-amber-400
                                                                    "
                                                                    >
                                                                        This
                                                                        offer
                                                                        is
                                                                        scheduled
                                                                        and
                                                                        can
                                                                        be
                                                                        attached
                                                                        now.
                                                                    </p>

                                                                    <p
                                                                        className="
                                                                        text-[9px]
                                                                        text-amber-600
                                                                        dark:text-amber-500
                                                                        mt-0.5
                                                                    "
                                                                    >
                                                                        The
                                                                        discount
                                                                        should
                                                                        apply
                                                                        only
                                                                        after
                                                                        the
                                                                        start
                                                                        date.
                                                                    </p>
                                                                </div>
                                                            )}

                                                        {status ===
                                                            "ACTIVE" && (
                                                                <div
                                                                    className="
                                                                    rounded-xl
                                                                    bg-emerald-50
                                                                    dark:bg-emerald-950/20
                                                                    border
                                                                    border-emerald-100
                                                                    dark:border-emerald-900
                                                                    px-3
                                                                    py-2
                                                                "
                                                                >
                                                                    <p
                                                                        className="
                                                                        text-[10px]
                                                                        font-semibold
                                                                        text-emerald-700
                                                                        dark:text-emerald-400
                                                                    "
                                                                    >
                                                                        This
                                                                        offer
                                                                        is
                                                                        currently
                                                                        active.
                                                                    </p>
                                                                </div>
                                                            )}

                                                        {status ===
                                                            "EXPIRED" && (
                                                                <div
                                                                    className="
                                                                    rounded-xl
                                                                    bg-stone-100
                                                                    dark:bg-stone-900
                                                                    border
                                                                    border-stone-200
                                                                    dark:border-stone-800
                                                                    px-3
                                                                    py-2
                                                                "
                                                                >
                                                                    <p
                                                                        className="
                                                                        text-[10px]
                                                                        font-semibold
                                                                        text-stone-600
                                                                        dark:text-stone-400
                                                                    "
                                                                    >
                                                                        This
                                                                        offer
                                                                        has
                                                                        expired.
                                                                    </p>
                                                                </div>
                                                            )}
                                                    </div>
                                                </>
                                            );
                                        })()}
                                    </div>
                                )}

                                {/* NO OFFERS */}

                                {offers.length ===
                                    0 &&
                                    !offersLoading && (
                                        <div
                                            className="
                                                mt-3
                                                p-3
                                                rounded-xl
                                                bg-stone-50
                                                dark:bg-stone-950
                                                border
                                                border-stone-200
                                                dark:border-stone-800
                                            "
                                        >
                                            <p
                                                className="
                                                    text-[10px]
                                                    text-stone-400
                                                "
                                            >
                                                No
                                                Active
                                                offers
                                                available.
                                                Create an
                                                offer first
                                                from the
                                                Offers page.
                                            </p>
                                        </div>
                                    )}
                            </div>

                            {/* DESCRIPTION */}

                            <div>
                                <label
                                    className="
                                        block
                                        text-xs
                                        font-semibold
                                        text-stone-700
                                        dark:text-stone-300
                                        mb-1.5
                                    "
                                >
                                    Description *
                                </label>

                                <textarea
                                    rows={3}
                                    value={
                                        formData.description
                                    }
                                    onChange={(e) =>
                                        setFormData(
                                            {
                                                ...formData,
                                                description:
                                                    e
                                                        .target
                                                        .value,
                                            }
                                        )
                                    }
                                    placeholder="Write a brief description..."
                                    className="
                                        w-full
                                        px-3.5
                                        py-2.5
                                        rounded-xl
                                        border
                                        border-stone-200
                                        dark:border-stone-800
                                        bg-stone-50
                                        dark:bg-stone-950
                                        text-sm
                                        text-stone-900
                                        dark:text-stone-100
                                        resize-none
                                        focus:outline-none
                                        focus:ring-2
                                        focus:ring-pink-500/40
                                        focus:border-pink-500
                                    "
                                />

                                {errors.description && (
                                    <p className="text-xs text-rose-500 mt-1.5">
                                        {
                                            errors.description
                                        }
                                    </p>
                                )}
                            </div>

                            {/* AVAILABLE */}

                            <div
                                className="
                                    flex
                                    items-center
                                    justify-between
                                    gap-4
                                    p-3.5
                                    rounded-xl
                                    bg-stone-50
                                    dark:bg-stone-950
                                    border
                                    border-stone-200
                                    dark:border-stone-800
                                "
                            >
                                <div className="flex items-center gap-3">
                                    <div
                                        className={`
                                            w-8
                                            h-8
                                            rounded-lg
                                            flex
                                            items-center
                                            justify-center
                                            ${formData.available
                                                ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400"
                                                : "bg-rose-100 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400"
                                            }
                                        `}
                                    >
                                        {formData.available ? (
                                            <CheckCircle className="w-4 h-4" />
                                        ) : (
                                            <XCircle className="w-4 h-4" />
                                        )}
                                    </div>

                                    <div>
                                        <p
                                            className="
                                                text-xs
                                                font-semibold
                                                text-stone-800
                                                dark:text-stone-200
                                            "
                                        >
                                            Available for
                                            Ordering
                                        </p>

                                        <p
                                            className="
                                                text-[10px]
                                                text-stone-500
                                                dark:text-stone-400
                                                mt-0.5
                                            "
                                        >
                                            Customers can
                                            order this item
                                        </p>
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    role="switch"
                                    aria-checked={
                                        formData.available
                                    }
                                    onClick={() =>
                                        setFormData(
                                            {
                                                ...formData,
                                                available:
                                                    !formData.available,
                                            }
                                        )
                                    }
                                    className={`
                                        relative
                                        w-11
                                        h-6
                                        rounded-full
                                        transition-colors
                                        cursor-pointer
                                        shrink-0
                                        ${formData.available
                                            ? "bg-pink-600"
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
                                            transition-transform
                                            ${formData.available
                                                ? "translate-x-5"
                                                : "translate-x-0.5"
                                            }
                                        `}
                                    />
                                </button>
                            </div>

                            {/* ACTIONS */}

                            <div
                                className="
                                    flex
                                    items-center
                                    justify-end
                                    gap-3
                                    pt-4
                                    border-t
                                    border-stone-200
                                    dark:border-stone-800
                                "
                            >
                                <button
                                    type="button"
                                    onClick={
                                        handleCloseFormModal
                                    }
                                    disabled={
                                        actionLoading
                                    }
                                    className="
                                        px-4
                                        py-2.5
                                        rounded-full
                                        text-xs
                                        font-medium
                                        border
                                        border-stone-200
                                        dark:border-stone-800
                                        text-stone-600
                                        dark:text-stone-400
                                        hover:bg-stone-100
                                        dark:hover:bg-stone-800
                                        transition-colors
                                        disabled:opacity-50
                                    "
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    disabled={
                                        actionLoading
                                    }
                                    className="
                                        px-5
                                        py-2.5
                                        rounded-full
                                        text-xs
                                        font-semibold
                                        bg-pink-600
                                        hover:bg-pink-700
                                        text-white
                                        shadow-md
                                        shadow-pink-600/20
                                        transition-all
                                        active:scale-95
                                        disabled:opacity-50
                                        disabled:cursor-not-allowed
                                    "
                                >
                                    {actionLoading
                                        ? "Saving..."
                                        : editingItem
                                            ? "Update Item"
                                            : "Create Item"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ============================================================
                DELETE MODAL
            ============================================================ */}

            {isDeleteModalOpen &&
                itemToDelete && (
                    <div
                        className="
                            fixed
                            inset-0
                            z-50
                            flex
                            items-center
                            justify-center
                            p-4
                            bg-stone-950/60
                            backdrop-blur-sm
                            animate-in
                            fade-in
                            duration-200
                        "
                    >
                        <div
                            className="
                                bg-white
                                dark:bg-stone-900
                                border
                                border-stone-200
                                dark:border-stone-800
                                rounded-3xl
                                p-6
                                max-w-sm
                                w-full
                                text-center
                                shadow-2xl
                            "
                        >
                            <div
                                className="
                                    w-14
                                    h-14
                                    rounded-2xl
                                    bg-rose-100
                                    dark:bg-rose-950/50
                                    text-rose-600
                                    dark:text-rose-400
                                    flex
                                    items-center
                                    justify-center
                                    mx-auto
                                    mb-4
                                "
                            >
                                <AlertTriangle className="w-6 h-6" />
                            </div>

                            <h3
                                className="
                                    font-serif
                                    font-bold
                                    text-lg
                                    text-stone-900
                                    dark:text-stone-100
                                "
                            >
                                Delete "
                                {
                                    itemToDelete.name
                                }
                                "?
                            </h3>

                            <p
                                className="
                                    text-xs
                                    text-stone-500
                                    dark:text-stone-400
                                    mt-2
                                    leading-relaxed
                                "
                            >
                                This will
                                permanently
                                remove this
                                cake from
                                your menu.
                                This action
                                cannot be
                                undone.
                            </p>

                            <div
                                className="
                                    flex
                                    items-center
                                    justify-center
                                    gap-3
                                    mt-6
                                "
                            >
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsDeleteModalOpen(
                                            false
                                        );

                                        setItemToDelete(
                                            null
                                        );
                                    }}
                                    disabled={
                                        actionLoading
                                    }
                                    className="
                                        px-4
                                        py-2.5
                                        rounded-full
                                        text-xs
                                        font-medium
                                        border
                                        border-stone-200
                                        dark:border-stone-800
                                        text-stone-600
                                        dark:text-stone-400
                                        hover:bg-stone-100
                                        dark:hover:bg-stone-800
                                        disabled:opacity-50
                                    "
                                >
                                    Cancel
                                </button>

                                <button
                                    type="button"
                                    disabled={
                                        actionLoading
                                    }
                                    onClick={
                                        handleDeleteConfirm
                                    }
                                    className="
                                        px-5
                                        py-2.5
                                        rounded-full
                                        text-xs
                                        font-semibold
                                        bg-rose-600
                                        hover:bg-rose-700
                                        text-white
                                        shadow-md
                                        transition-all
                                        disabled:opacity-50
                                    "
                                >
                                    {actionLoading
                                        ? "Deleting..."
                                        : "Delete Item"}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

            {/* ============================================================
                ERROR MODAL
            ============================================================ */}

            {isErrorModalOpen && (
                <div
                    className="
                        fixed
                        inset-0
                        z-[60]
                        flex
                        items-center
                        justify-center
                        p-4
                        bg-stone-950/60
                        backdrop-blur-sm
                    "
                >
                    <div
                        className="
                            bg-white
                            dark:bg-stone-900
                            border
                            border-stone-200
                            dark:border-stone-800
                            rounded-3xl
                            p-6
                            max-w-sm
                            w-full
                            text-center
                            shadow-2xl
                        "
                    >
                        <div
                            className="
                                w-14
                                h-14
                                rounded-2xl
                                bg-rose-100
                                dark:bg-rose-950/50
                                text-rose-600
                                dark:text-rose-400
                                flex
                                items-center
                                justify-center
                                mx-auto
                                mb-4
                            "
                        >
                            <AlertTriangle className="w-6 h-6" />
                        </div>

                        <h3
                            className="
                                font-serif
                                font-bold
                                text-lg
                                text-stone-900
                                dark:text-stone-100
                            "
                        >
                            Action Failed
                        </h3>

                        <p
                            className="
                                text-xs
                                text-rose-500
                                dark:text-rose-400
                                mt-2
                                leading-relaxed
                            "
                        >
                            {
                                serverError
                            }
                        </p>

                        <button
                            type="button"
                            onClick={() =>
                                setIsErrorModalOpen(
                                    false
                                )
                            }
                            className="
                                mt-6
                                px-6
                                py-2.5
                                rounded-full
                                text-xs
                                font-semibold
                                bg-stone-800
                                hover:bg-stone-900
                                text-white
                                dark:bg-stone-200
                                dark:text-stone-900
                                dark:hover:bg-white
                                shadow-md
                                transition-all
                            "
                        >
                            Dismiss
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}


