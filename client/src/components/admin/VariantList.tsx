"use client";

import React, { useState, useEffect, useCallback } from "react";
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
    LogOut,
} from "lucide-react";
import axios from "axios";

interface MenuItem {
    _id: string;
    name: string;
    flavour: string;
    price: number;
    weight: string;
    description: string;
    image: string;
    available: boolean;
}

interface VariantItem {
    _id: string;
    cakeId: string;
    cakeName: string;
    weight: number;
    price: number;
    available: boolean;
}

interface FormErrors {
    cakeId?: string;
    weight?: string;
    price?: string;
}

export default function VariantList() {
    // --------------------------------------------------
    // DATA & PAGINATION
    // --------------------------------------------------

    const [items, setItems] = useState<VariantItem[]>([]);
    const [menuItems, setMenuItems] = useState<MenuItem[]>([]);

    const [loading, setLoading] = useState(true);
    const [menuLoading, setMenuLoading] = useState(false);

    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");

    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);

    const limit = 5;

    // --------------------------------------------------
    // MODAL STATES
    // --------------------------------------------------

    const [isFormModalOpen, setIsFormModalOpen] = useState(false);

    const [editingItem, setEditingItem] =
        useState<VariantItem | null>(null);

    const [isDeleteModalOpen, setIsDeleteModalOpen] =
        useState(false);

    const [itemToDelete, setItemToDelete] =
        useState<VariantItem | null>(null);

    const [actionLoading, setActionLoading] = useState(false);

    // --------------------------------------------------
    // ERROR MODAL
    // --------------------------------------------------

    const [serverError, setServerError] = useState("");
    const [isErrorModalOpen, setIsErrorModalOpen] =
        useState(false);

    // --------------------------------------------------
    // LOGOUT
    // --------------------------------------------------

    const [logoutLoading, setLogoutLoading] = useState(false);

    // --------------------------------------------------
    // FORM
    // --------------------------------------------------

    const [formData, setFormData] = useState({
        cakeId: "",
        cakeName: "",
        weight: "",
        price: "",
        available: true,
    });

    const [errors, setErrors] = useState<FormErrors>({});

    // --------------------------------------------------
    // SEARCH DEBOUNCE
    // --------------------------------------------------

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search);
            setCurrentPage(1);
        }, 400);

        return () => clearTimeout(timer);
    }, [search]);

    // --------------------------------------------------
    // AUTH CHECK
    // --------------------------------------------------

    useEffect(() => {
        const checkAuthentication = async () => {
            try {
                const response = await fetch("/api/admin", {
                    method: "GET",
                    credentials: "include",
                    cache: "no-store",
                });

                const data = await response.json();

                if (!response.ok || !data.authenticated) {
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

        const handlePageShow = () => {
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

    // --------------------------------------------------
    // FETCH MENU ITEMS
    // --------------------------------------------------

    const fetchMenuItems = async () => {
        setMenuLoading(true);

        try {
            const response = await axios.get(
                "/api/admin/menu",
                {
                    params: {
                        page: 1,
                        limit: 100,
                    },
                }
            );

            if (response.data.success) {
                setMenuItems(response.data.data || []);
            }
        } catch (error) {
            console.info(
                "Failed to fetch menu items:",
                error
            );
        } finally {
            setMenuLoading(false);
        }
    };

    // --------------------------------------------------
    // FETCH VARIANTS
    // --------------------------------------------------

    const fetchVariants = useCallback(async () => {
        setLoading(true);

        try {
            const response = await axios.get(
                "/api/admin/variant",
                {
                    params: {
                        page: currentPage,
                        limit,
                        search: debouncedSearch.trim(),
                    },
                }
            );

            if (response.data.success) {
                setItems(response.data.data || []);

                setTotalPages(
                    response.data.pagination?.totalPages || 1
                );

                setTotalItems(
                    response.data.pagination?.totalItems || 0
                );
            }
        } catch (error) {
            console.info(
                "Failed to fetch variants:",
                error
            );
        } finally {
            setLoading(false);
        }
    }, [currentPage, debouncedSearch]);

    useEffect(() => {
        fetchVariants();
    }, [fetchVariants]);

    // --------------------------------------------------
    // VALIDATION
    // --------------------------------------------------

    const validateForm = () => {
        const newErrors: FormErrors = {};

        // Cake
        if (!formData.cakeId.trim()) {
            newErrors.cakeId = "Please select a cake";
        }

        // Weight
        if (!formData.weight.trim()) {
            newErrors.weight = "Weight is required";
        } else {
            const weightValue = Number(formData.weight);

            if (!Number.isFinite(weightValue)) {
                newErrors.weight = "Enter a valid weight";
            } else if (weightValue < 0.5) {
                newErrors.weight =
                    "Minimum cake weight is 0.5 Kg";
            } else if (
                Math.round(weightValue * 10) / 10 !==
                weightValue
            ) {
                newErrors.weight =
                    "Weight must be in 0.1 Kg increments";
            }
        }

        // Price
        if (!formData.price.trim()) {
            newErrors.price = "Price is required";
        } else {
            const priceValue = Number(formData.price);

            if (!Number.isFinite(priceValue)) {
                newErrors.price =
                    "Enter a valid price";
            } else if (priceValue <= 0) {
                newErrors.price =
                    "Enter a valid price greater than ₹0";
            }
        }

        setErrors(newErrors);

        return Object.keys(newErrors).length === 0;
    };

    // --------------------------------------------------
    // OPEN ADD / EDIT MODAL
    // --------------------------------------------------

    const handleOpenFormModal = (
        item?: VariantItem
    ) => {
        setErrors({});
        setServerError("");
        setIsErrorModalOpen(false);

        if (item) {
            setEditingItem(item);

            setFormData({
                cakeId: item.cakeId,
                cakeName: item.cakeName,
                weight: String(item.weight),
                price: String(item.price),
                available: item.available,
            });
        } else {
            setEditingItem(null);

            setFormData({
                cakeId: "",
                cakeName: "",
                weight: "",
                price: "",
                available: true,
            });
        }

        setIsFormModalOpen(true);

        // Make sure dropdown has latest menu items
        if (menuItems.length === 0) {
            fetchMenuItems();
        }
    };

    // --------------------------------------------------
    // CAKE SELECTION
    // --------------------------------------------------

    const handleCakeChange = (
        e: React.ChangeEvent<HTMLSelectElement>
    ) => {
        const selectedCakeId = e.target.value;

        const selectedCake = menuItems.find(
            (item) => item._id === selectedCakeId
        );

        setFormData((prev) => ({
            ...prev,
            cakeId: selectedCakeId,
            cakeName: selectedCake?.name || "",
        }));

        if (errors.cakeId) {
            setErrors((prev) => ({
                ...prev,
                cakeId: undefined,
            }));
        }
    };

    // --------------------------------------------------
    // SUBMIT CREATE / UPDATE
    // --------------------------------------------------

    const handleFormSubmit = async (
        e: React.FormEvent
    ) => {
        e.preventDefault();

        if (!validateForm()) return;

        setActionLoading(true);
        setServerError("");
        setIsErrorModalOpen(false);

        try {
            const payload = {
                cakeId: formData.cakeId,
                cakeName: formData.cakeName,
                weight: Number(formData.weight),
                price: Number(formData.price),
                available: formData.available,
            };

            if (editingItem) {
                await axios.put(
                    `/api/admin/variant/${editingItem._id}`,
                    payload
                );
            } else {
                await axios.post(
                    "/api/admin/variant",
                    payload
                );
            }

            setIsFormModalOpen(false);
            setEditingItem(null);

            await fetchVariants();
        } catch (err: any) {
            console.info(
                "Failed to save variant:",
                err
            );

            const errorMsg =
                err.response?.data?.error ||
                err.response?.data?.message ||
                "Failed to save variant. Please try again.";

            setServerError(errorMsg);
            setIsErrorModalOpen(true);
        } finally {
            setActionLoading(false);
        }
    };

    // --------------------------------------------------
    // TOGGLE AVAILABILITY
    // --------------------------------------------------

    const handleToggleAvailability = async (
        item: VariantItem
    ) => {
        try {
            await axios.patch(
                `/api/admin/variant/${item._id}`,
                {
                    available: !item.available,
                }
            );

            await fetchVariants();
        } catch (err: any) {
            const errorMsg =
                err.response?.data?.error ||
                err.response?.data?.message ||
                "Failed to update availability.";

            setServerError(errorMsg);
            setIsErrorModalOpen(true);
        }
    };

    // --------------------------------------------------
    // DELETE
    // --------------------------------------------------

    const handleDeleteConfirm = async () => {
        if (!itemToDelete) return;

        setActionLoading(true);

        try {
            await axios.delete(
                `/api/admin/variant/${itemToDelete._id}`
            );

            setIsDeleteModalOpen(false);
            setItemToDelete(null);

            await fetchVariants();
        } catch (err: any) {
            const errorMsg =
                err.response?.data?.error ||
                err.response?.data?.message ||
                "Failed to delete variant.";

            setServerError(errorMsg);
            setIsErrorModalOpen(true);

            if (err.response?.data?.error === "Cannot delete this variant. The cake must have at least one variant.") {
                setIsDeleteModalOpen(false);
                setItemToDelete(null);
            }

        } finally {
            setActionLoading(false);
        }
    };

    // --------------------------------------------------
    // LOGOUT
    // --------------------------------------------------

    const handleLogout = async () => {
        if (logoutLoading) return;

        setLogoutLoading(true);

        try {
            await axios.post("/api/admin", {
                state: "logout",
            });

            window.location.href =
                "/admin-panel/login";
        } catch (err) {
            console.info(
                "Logout failed:",
                err
            );
        } finally {
            setLogoutLoading(false);
        }
    };

    // --------------------------------------------------
    // UI
    // --------------------------------------------------

    return (
        // <div className="min-h-screen bg-amber-50/30 dark:bg-stone-950 text-stone-800 dark:text-stone-100 p-4 md:p-8 transition-colors duration-300">

        <div className="min-h-screen bg-amber-50/30 dark:bg-stone-950 text-stone-800 dark:text-stone-100 pt-20 px-4 pb-4 md:pt-20 md:px-8 md:pb-8 lg:pt-8 transition-colors duration-300">

            <div className="max-w-7xl mx-auto space-y-6">

                {/* HEADER */}

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 border-b border-stone-200 dark:border-stone-800 pb-6">

                    <div>
                        <h1 className="text-2xl md:text-3xl font-serif font-bold text-stone-900 dark:text-stone-50">
                            Cake Variants
                        </h1>

                        <p className="text-xs md:text-sm text-stone-500 dark:text-stone-400 mt-1">
                            Manage cake weights, prices, and availability.
                        </p>
                    </div>

                    <div className="flex items-center gap-2">

                        {/* LOGOUT */}

                        {/* <button
                            type="button"
                            onClick={handleLogout}
                            disabled={logoutLoading}
                            className="
                                inline-flex items-center justify-center gap-2
                                px-4 py-2.5
                                rounded-full
                                border border-stone-200 dark:border-stone-800
                                bg-white dark:bg-stone-900
                                text-stone-600 dark:text-stone-300
                                hover:text-rose-600 dark:hover:text-rose-400
                                hover:border-rose-200 dark:hover:border-rose-900
                                hover:bg-rose-50 dark:hover:bg-rose-950/30
                                text-xs md:text-sm font-medium
                                transition-all
                                disabled:opacity-50
                                disabled:cursor-not-allowed
                            "
                        >
                            <LogOut className="w-4 h-4" />

                            {logoutLoading
                                ? "Logging out..."
                                : "Logout"}
                        </button> */}

                        {/* ADD */}

                        <button
                            type="button"
                            onClick={() =>
                                handleOpenFormModal()
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

                            Add New Variant
                        </button>
                    </div>
                </div>

                {/* SEARCH */}

                <div className="
                    flex flex-col md:flex-row
                    items-center justify-between
                    gap-4
                    bg-white dark:bg-stone-900
                    border border-stone-200/80 dark:border-stone-800
                    p-4
                    rounded-2xl
                    shadow-sm
                ">

                    <div className="relative w-full md:w-80">

                        <Search
                            className="
                                absolute left-3.5 top-1/2
                                -translate-y-1/2
                                w-4 h-4
                                text-stone-400
                            "
                        />

                        <input
                            type="text"
                            value={search}
                            onChange={(e) =>
                                setSearch(e.target.value)
                            }
                            placeholder="Search cake variants..."
                            className="
                                w-full
                                pl-10 pr-9 py-2
                                rounded-full
                                border border-stone-200
                                dark:border-stone-800
                                bg-stone-50/50
                                dark:bg-stone-950
                                text-xs md:text-sm
                                text-stone-900
                                dark:text-stone-100
                                placeholder-stone-400
                                focus:outline-none
                                focus:ring-2
                                focus:ring-pink-500
                                dark:focus:ring-pink-400
                            "
                        />

                        {search && (
                            <button
                                type="button"
                                onClick={() =>
                                    setSearch("")
                                }
                                className="
                                    absolute right-3 top-1/2
                                    -translate-y-1/2
                                    text-stone-400
                                    hover:text-stone-600
                                    dark:hover:text-stone-200
                                "
                            >
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </div>

                    <div className="text-xs text-stone-500 dark:text-stone-400">
                        Showing{" "}
                        <span className="font-semibold text-stone-800 dark:text-stone-200">
                            {items.length}
                        </span>{" "}
                        of{" "}
                        <span className="font-semibold text-stone-800 dark:text-stone-200">
                            {totalItems}
                        </span>{" "}
                        variants
                    </div>
                </div>

                {/* TABLE */}

                <div className="
                    bg-white dark:bg-stone-900
                    border border-stone-200/80
                    dark:border-stone-800
                    rounded-2xl
                    shadow-sm
                    overflow-hidden
                ">

                    {loading ? (

                        <div className="
                            p-12 text-center
                            text-stone-500
                            dark:text-stone-400
                            space-y-3
                        ">
                            <Sparkles
                                className="
                                    w-6 h-6
                                    animate-spin
                                    mx-auto
                                    text-pink-500
                                "
                            />

                            <p className="text-xs md:text-sm">
                                Fetching cake variants...
                            </p>
                        </div>

                    ) : items.length === 0 ? (

                        <div className="
                            p-12 text-center
                            text-stone-500
                            dark:text-stone-400
                            space-y-2
                        ">
                            <p className="font-medium text-sm">
                                No variants found
                            </p>

                            <p className="text-xs">
                                Try adjusting your search or add a new variant.
                            </p>
                        </div>

                    ) : (

                        <div className="overflow-x-auto">

                            <table className="w-full text-left border-collapse">

                                <thead>

                                    <tr className="
                                        border-b
                                        border-stone-200/80
                                        dark:border-stone-800
                                        bg-stone-50/50
                                        dark:bg-stone-950/50
                                        text-[11px]
                                        uppercase
                                        tracking-wider
                                        text-stone-500
                                        dark:text-stone-400
                                    ">

                                        <th className="p-4">
                                            Cake
                                        </th>

                                        <th className="p-4">
                                            Weight
                                        </th>

                                        <th className="p-4">
                                            Price
                                        </th>

                                        <th className="p-4">
                                            Status
                                        </th>

                                        <th className="p-4 text-right">
                                            Actions
                                        </th>

                                    </tr>

                                </thead>

                                <tbody className="
                                    divide-y
                                    divide-stone-200/60
                                    dark:divide-stone-800
                                    text-xs md:text-sm
                                ">

                                    {items.map((item) => (

                                        <tr
                                            key={item._id}
                                            className="
                                                hover:bg-stone-50/50
                                                dark:hover:bg-stone-800/40
                                                transition-colors
                                            "
                                        >

                                            {/* CAKE */}

                                            <td className="p-4">

                                                <p className="
                                                    font-semibold
                                                    text-stone-900
                                                    dark:text-stone-100
                                                ">
                                                    {item.cakeName}
                                                </p>

                                                <p className="
                                                    text-[11px]
                                                    text-stone-500
                                                    dark:text-stone-400
                                                ">
                                                    Cake variant
                                                </p>

                                            </td>

                                            {/* WEIGHT */}

                                            <td className="
                                                p-4
                                                font-medium
                                                text-stone-700
                                                dark:text-stone-300
                                            ">
                                                {item.weight} Kg
                                            </td>

                                            {/* PRICE */}

                                            <td className="
                                                p-4
                                                font-semibold
                                                text-stone-900
                                                dark:text-stone-50
                                            ">
                                                ₹{item.price}
                                            </td>

                                            {/* STATUS */}

                                            <td className="p-4">

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
                                                        px-3 py-1
                                                        rounded-full
                                                        text-[11px]
                                                        font-medium
                                                        transition-colors
                                                        cursor-pointer
                                                        ${item.available
                                                            ? `
                                                                    bg-emerald-100
                                                                    text-emerald-800
                                                                    dark:bg-emerald-950/60
                                                                    dark:text-emerald-300
                                                                    border
                                                                    border-emerald-200
                                                                    dark:border-emerald-800
                                                                `
                                                            : `
                                                                    bg-stone-100
                                                                    text-stone-600
                                                                    dark:bg-stone-800
                                                                    dark:text-stone-400
                                                                    border
                                                                    border-stone-200
                                                                    dark:border-stone-700
                                                                `
                                                        }
                                                    `}
                                                >

                                                    <span
                                                        className={`
                                                            w-1.5 h-1.5
                                                            rounded-full
                                                            ${item.available
                                                                ? "bg-emerald-500"
                                                                : "bg-stone-400"
                                                            }
                                                        `}
                                                    />

                                                    {item.available
                                                        ? "Available"
                                                        : "Not Available"}
                                                </button>

                                            </td>

                                            {/* ACTIONS */}

                                            <td className="p-4 text-right">

                                                <div className="
                                                    flex
                                                    items-center
                                                    justify-end
                                                    gap-2
                                                ">

                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            handleOpenFormModal(
                                                                item
                                                            )
                                                        }
                                                        className="
                                                            p-2
                                                            text-stone-600
                                                            dark:text-stone-300
                                                            hover:text-pink-600
                                                            dark:hover:text-pink-400
                                                            bg-stone-100
                                                            dark:bg-stone-800
                                                            hover:bg-pink-50
                                                            dark:hover:bg-pink-950/40
                                                            rounded-full
                                                            transition-colors
                                                        "
                                                        title="Edit Variant"
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
                                                            text-stone-600
                                                            dark:text-stone-300
                                                            hover:text-rose-600
                                                            dark:hover:text-rose-400
                                                            bg-stone-100
                                                            dark:bg-stone-800
                                                            hover:bg-rose-50
                                                            dark:hover:bg-rose-950/40
                                                            rounded-full
                                                            transition-colors
                                                        "
                                                        title="Delete Variant"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>

                                                </div>

                                            </td>

                                        </tr>

                                    ))}

                                </tbody>

                            </table>

                        </div>
                    )}

                    {/* PAGINATION */}

                    {totalPages > 1 && (

                        <div className="
                            p-4
                            border-t
                            border-stone-200/80
                            dark:border-stone-800
                            flex
                            items-center
                            justify-between
                            bg-stone-50/50
                            dark:bg-stone-950/50
                        ">

                            <span className="
                                text-xs
                                text-stone-500
                                dark:text-stone-400
                            ">
                                Page{" "}
                                <span className="
                                    font-semibold
                                    text-stone-800
                                    dark:text-stone-200
                                ">
                                    {currentPage}
                                </span>{" "}
                                of {totalPages}
                            </span>

                            <div className="
                                flex items-center gap-2
                            ">

                                <button
                                    type="button"
                                    disabled={
                                        currentPage === 1
                                    }
                                    onClick={() =>
                                        setCurrentPage(
                                            (prev) =>
                                                Math.max(
                                                    prev - 1,
                                                    1
                                                )
                                        )
                                    }
                                    className="
                                        p-2
                                        rounded-full
                                        border
                                        border-stone-200
                                        dark:border-stone-800
                                        hover:bg-white
                                        dark:hover:bg-stone-800
                                        disabled:opacity-40
                                        disabled:cursor-not-allowed
                                    "
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </button>

                                <button
                                    type="button"
                                    disabled={
                                        currentPage ===
                                        totalPages
                                    }
                                    onClick={() =>
                                        setCurrentPage(
                                            (prev) =>
                                                Math.min(
                                                    prev + 1,
                                                    totalPages
                                                )
                                        )
                                    }
                                    className="
                                        p-2
                                        rounded-full
                                        border
                                        border-stone-200
                                        dark:border-stone-800
                                        hover:bg-white
                                        dark:hover:bg-stone-800
                                        disabled:opacity-40
                                        disabled:cursor-not-allowed
                                    "
                                >
                                    <ChevronRight className="w-4 h-4" />
                                </button>

                            </div>

                        </div>
                    )}

                </div>
            </div>

            {/* =====================================================
                CREATE / EDIT VARIANT MODAL
            ===================================================== */}

            {isFormModalOpen && (

                <div className="
                    fixed inset-0
                    z-50
                    bg-stone-950/60
                    backdrop-blur-sm
                    flex items-center justify-center
                    p-4
                ">

                    <div className="
                        w-full
                        max-w-lg
                        bg-white
                        dark:bg-stone-900
                        border
                        border-stone-200
                        dark:border-stone-800
                        rounded-3xl
                        p-6
                        shadow-2xl
                        space-y-5
                        max-h-[90vh]
                        overflow-y-auto
                    ">

                        {/* MODAL HEADER */}

                        <div className="
                            flex items-center
                            justify-between
                            border-b
                            border-stone-200
                            dark:border-stone-800
                            pb-4
                        ">

                            <div>

                                <h3 className="
                                    font-serif
                                    font-bold
                                    text-lg
                                    text-stone-900
                                    dark:text-stone-50
                                ">
                                    {editingItem
                                        ? "Edit Cake Variant"
                                        : "Create New Variant"}
                                </h3>

                                <p className="
                                    text-[11px]
                                    text-stone-500
                                    dark:text-stone-400
                                    mt-1
                                ">
                                    Set weight and pricing for the cake.
                                </p>

                            </div>

                            <button
                                type="button"
                                onClick={() =>
                                    setIsFormModalOpen(false)
                                }
                                className="
                                    p-1.5
                                    rounded-full
                                    text-stone-400
                                    hover:text-stone-600
                                    dark:hover:text-stone-200
                                    hover:bg-stone-100
                                    dark:hover:bg-stone-800
                                "
                            >
                                <X className="w-5 h-5" />
                            </button>

                        </div>

                        <form
                            onSubmit={handleFormSubmit}
                            noValidate
                            className="space-y-5 text-xs md:text-sm"
                        >

                            {/* CAKE */}

                            <div className="space-y-1">

                                <label className="
                                    block
                                    font-semibold
                                    text-stone-700
                                    dark:text-stone-300
                                ">
                                    Cake
                                </label>

                                <select
                                    value={formData.cakeId}
                                    onChange={
                                        handleCakeChange
                                    }
                                    disabled={!!editingItem}
                                    className={`
                                        w-full
                                        px-4 py-2.5
                                        rounded-full
                                        border
                                        bg-stone-50/50
                                        dark:bg-stone-950
                                        text-stone-900
                                        dark:text-stone-100
                                        focus:outline-none
                                        focus:ring-2
                                        ${errors.cakeId
                                            ? `
                                                    border-rose-500
                                                    focus:ring-rose-500
                                                `
                                            : `
                                                    border-stone-200
                                                    dark:border-stone-800
                                                    focus:ring-pink-500
                                                `
                                        }
                                        ${editingItem
                                            ? "opacity-60 cursor-not-allowed"
                                            : "cursor-pointer"
                                        }
                                    `}
                                >

                                    <option value="">
                                        {menuLoading
                                            ? "Loading cakes..."
                                            : "Select a cake"}
                                    </option>

                                    {menuItems.map(
                                        (cake) => (
                                            <option
                                                key={cake._id}
                                                value={cake._id}
                                            >
                                                {cake.name}
                                                {cake.flavour
                                                    ? ` - ${cake.flavour}`
                                                    : ""}
                                            </option>
                                        )
                                    )}

                                </select>

                                {editingItem && (
                                    <p className="
                                        text-[10px]
                                        text-stone-400
                                        ml-3
                                    ">
                                        Cake cannot be changed while editing a variant.
                                    </p>
                                )}

                                {errors.cakeId && (
                                    <p className="
                                        text-[11px]
                                        text-rose-500
                                        ml-3
                                    ">
                                        {errors.cakeId}
                                    </p>
                                )}

                            </div>

                            {/* WEIGHT + PRICE */}

                            <div className="
                                grid
                                grid-cols-1
                                sm:grid-cols-2
                                gap-4
                            ">

                                {/* WEIGHT */}

                                <div className="space-y-1">

                                    <label className="
                                        block
                                        font-semibold
                                        text-stone-700
                                        dark:text-stone-300
                                    ">
                                        Weight (Kg)
                                    </label>

                                    <div className="relative">

                                        <input
                                            type="number"
                                            min="0.5"
                                            step="0.1"
                                            value={
                                                formData.weight
                                            }
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    weight:
                                                        e.target.value,
                                                })
                                            }
                                            placeholder="1"
                                            className={`
                                                w-full
                                                pl-4 pr-12
                                                py-2.5
                                                rounded-full
                                                border
                                                bg-stone-50/50
                                                dark:bg-stone-950
                                                text-stone-900
                                                dark:text-stone-100
                                                focus:outline-none
                                                focus:ring-2
                                                ${errors.weight
                                                    ? `
                                                            border-rose-500
                                                            focus:ring-rose-500
                                                        `
                                                    : `
                                                            border-stone-200
                                                            dark:border-stone-800
                                                            focus:ring-pink-500
                                                        `
                                                }
                                            `}
                                        />

                                        <span className="
                                            absolute
                                            right-4
                                            top-1/2
                                            -translate-y-1/2
                                            text-xs
                                            font-semibold
                                            text-stone-400
                                            pointer-events-none
                                        ">
                                            Kg
                                        </span>

                                    </div>

                                    {errors.weight && (
                                        <p className="
                                            text-[11px]
                                            text-rose-500
                                            ml-3
                                            pt-0.5
                                        ">
                                            {errors.weight}
                                        </p>
                                    )}

                                </div>

                                {/* PRICE */}

                                <div className="space-y-1">

                                    <label className="
                                        block
                                        font-semibold
                                        text-stone-700
                                        dark:text-stone-300
                                    ">
                                        Price (₹)
                                    </label>

                                    <input
                                        type="number"
                                        min="1"
                                        step="1"
                                        value={
                                            formData.price
                                        }
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                price:
                                                    e.target.value,
                                            })
                                        }
                                        placeholder="550"
                                        className={`
                                            w-full
                                            px-4 py-2.5
                                            rounded-full
                                            border
                                            bg-stone-50/50
                                            dark:bg-stone-950
                                            text-stone-900
                                            dark:text-stone-100
                                            focus:outline-none
                                            focus:ring-2
                                            ${errors.price
                                                ? `
                                                        border-rose-500
                                                        focus:ring-rose-500
                                                    `
                                                : `
                                                        border-stone-200
                                                        dark:border-stone-800
                                                        focus:ring-pink-500
                                                    `
                                            }
                                        `}
                                    />

                                    {errors.price && (
                                        <p className="
                                            text-[11px]
                                            text-rose-500
                                            ml-3
                                        ">
                                            {errors.price}
                                        </p>
                                    )}

                                </div>

                            </div>

                            {/* AVAILABLE */}

                            <div className="
                                rounded-2xl
                                border
                                border-stone-200
                                dark:border-stone-800
                                bg-stone-50/50
                                dark:bg-stone-950/50
                                p-4
                            ">

                                <label className="
                                    flex
                                    items-center
                                    justify-between
                                    gap-3
                                    cursor-pointer
                                    select-none
                                ">

                                    <div>

                                        <p className="
                                            font-semibold
                                            text-stone-700
                                            dark:text-stone-300
                                        ">
                                            Variant Availability
                                        </p>

                                        <p className="
                                            text-[11px]
                                            text-stone-400
                                            mt-0.5
                                        ">
                                            Customers can order this variant when enabled.
                                        </p>

                                    </div>

                                    <input
                                        type="checkbox"
                                        checked={
                                            formData.available
                                        }
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                available:
                                                    e.target
                                                        .checked,
                                            })
                                        }
                                        className="
                                            w-5 h-5
                                            rounded
                                            text-pink-600
                                            focus:ring-pink-500
                                            border-stone-300
                                            dark:bg-stone-950
                                            dark:border-stone-800
                                        "
                                    />

                                </label>

                            </div>

                            {/* ACTIONS */}

                            <div className="
                                flex
                                items-center
                                justify-end
                                gap-3
                                pt-4
                                border-t
                                border-stone-200
                                dark:border-stone-800
                            ">

                                <button
                                    type="button"
                                    onClick={() =>
                                        setIsFormModalOpen(
                                            false
                                        )
                                    }
                                    className="
                                        px-5 py-2.5
                                        rounded-full
                                        border
                                        border-stone-200
                                        dark:border-stone-800
                                        font-medium
                                        text-stone-600
                                        dark:text-stone-300
                                        hover:bg-stone-100
                                        dark:hover:bg-stone-800
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
                                        px-6 py-2.5
                                        rounded-full
                                        bg-pink-600
                                        hover:bg-pink-700
                                        dark:bg-pink-500
                                        dark:hover:bg-pink-600
                                        text-white
                                        font-semibold
                                        transition-all
                                        active:scale-95
                                        disabled:opacity-60
                                    "
                                >
                                    {actionLoading
                                        ? "Saving..."
                                        : editingItem
                                            ? "Update Variant"
                                            : "Save Variant"}
                                </button>

                            </div>

                        </form>

                    </div>
                </div>
            )}

            {/* =====================================================
                DELETE MODAL
            ===================================================== */}

            {isDeleteModalOpen &&
                itemToDelete && (

                    <div className="
                        fixed inset-0
                        z-50
                        bg-stone-950/60
                        backdrop-blur-sm
                        flex items-center justify-center
                        p-4
                    ">

                        <div className="
                            w-full
                            max-w-sm
                            bg-white
                            dark:bg-stone-900
                            border
                            border-stone-200
                            dark:border-stone-800
                            rounded-3xl
                            p-6
                            shadow-2xl
                            text-center
                            space-y-4
                        ">

                            <div className="
                                w-12 h-12
                                bg-rose-100
                                dark:bg-rose-950/50
                                text-rose-600
                                dark:text-rose-400
                                rounded-full
                                flex items-center
                                justify-center
                                mx-auto
                            ">
                                <AlertTriangle className="w-6 h-6" />
                            </div>

                            <div>

                                <h3 className="
                                    font-serif
                                    font-bold
                                    text-lg
                                    text-stone-900
                                    dark:text-stone-50
                                ">
                                    Confirm Delete
                                </h3>

                                <p className="
                                    text-xs
                                    text-stone-500
                                    dark:text-stone-400
                                    mt-1
                                ">

                                    Are you sure you want to delete{" "}

                                    <span className="
                                        font-semibold
                                        text-stone-800
                                        dark:text-stone-200
                                    ">
                                        "{itemToDelete.cakeName} -{" "}
                                        {itemToDelete.weight} Kg"
                                    </span>

                                    ?

                                    <br />

                                    This action cannot be undone.

                                </p>

                            </div>

                            <div className="
                                flex
                                items-center
                                justify-center
                                gap-3
                                pt-2
                            ">

                                <button
                                    type="button"
                                    onClick={() =>
                                        setIsDeleteModalOpen(
                                            false
                                        )
                                    }
                                    className="
                                        w-1/2
                                        py-2.5
                                        rounded-full
                                        border
                                        border-stone-200
                                        dark:border-stone-800
                                        font-medium
                                        text-stone-600
                                        dark:text-stone-300
                                        hover:bg-stone-100
                                        dark:hover:bg-stone-800
                                        text-xs md:text-sm
                                    "
                                >
                                    Cancel
                                </button>

                                <button
                                    type="button"
                                    onClick={
                                        handleDeleteConfirm
                                    }
                                    disabled={
                                        actionLoading
                                    }
                                    className="
                                        w-1/2
                                        py-2.5
                                        rounded-full
                                        bg-rose-600
                                        hover:bg-rose-700
                                        text-white
                                        font-semibold
                                        transition-all
                                        active:scale-95
                                        text-xs md:text-sm
                                        disabled:opacity-60
                                    "
                                >
                                    {actionLoading
                                        ? "Deleting..."
                                        : "Delete"}
                                </button>

                            </div>

                        </div>
                    </div>
                )}

            {/* =====================================================
                ERROR MODAL
            ===================================================== */}

            {isErrorModalOpen && (

                <div className="
                    fixed inset-0
                    z-[60]
                    bg-stone-950/60
                    backdrop-blur-sm
                    flex items-center justify-center
                    p-4
                ">

                    <div className="
                        w-full
                        max-w-sm
                        bg-white
                        dark:bg-stone-900
                        border
                        border-stone-200
                        dark:border-stone-800
                        rounded-3xl
                        p-6
                        shadow-2xl
                        text-center
                        space-y-5
                    ">

                        <div className="
                            w-14 h-14
                            bg-rose-100
                            dark:bg-rose-950/50
                            text-rose-600
                            dark:text-rose-400
                            rounded-full
                            flex items-center
                            justify-center
                            mx-auto
                        ">
                            <AlertTriangle className="w-7 h-7" />
                        </div>

                        <div>

                            <h3 className="
                                font-serif
                                font-bold
                                text-lg
                                text-stone-900
                                dark:text-stone-50
                            ">
                                Unable to Complete Action
                            </h3>

                            <p className="
                                text-xs md:text-sm
                                text-stone-500
                                dark:text-stone-400
                                mt-2
                                leading-relaxed
                            ">
                                {serverError}
                            </p>

                        </div>

                        <button
                            type="button"
                            onClick={() => {
                                setIsErrorModalOpen(
                                    false
                                );
                                setServerError("");
                            }}
                            className="
                                w-full
                                py-2.5
                                rounded-full
                                bg-rose-600
                                hover:bg-rose-700
                                text-white
                                font-semibold
                                transition-all
                                active:scale-95
                                text-xs md:text-sm
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