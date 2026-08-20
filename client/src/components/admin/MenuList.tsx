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
    CheckCircle2,
    Image as ImageIcon,
    LogOut,
} from "lucide-react";
import axios from "axios";
import { useRouter } from "next/navigation";

export interface MenuItem {
    _id: string;
    name: string;
    flavour: string;
    price: number;
    weight: string;
    description: string;
    image: string;
    available: boolean;
}

interface FormErrors {
    name?: string;
    flavour?: string;
    price?: string;
    weight?: string;
    description?: string;
    image?: string;
}

export default function MenuList() {
    const router = useRouter();

    // --- Data & Pagination State ---
    const [items, setItems] = useState<MenuItem[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [search, setSearch] = useState<string>("");
    const [debouncedSearch, setDebouncedSearch] = useState<string>("");
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [totalPages, setTotalPages] = useState<number>(1);
    const [totalItems, setTotalItems] = useState<number>(0);
    const limit = 8;

    // --- Modal States ---
    const [isFormModalOpen, setIsFormModalOpen] = useState<boolean>(false);
    const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
    const [itemToDelete, setItemToDelete] = useState<MenuItem | null>(null);
    const [actionLoading, setActionLoading] = useState<boolean>(false);
    const [serverError, setServerError] = useState("");
    const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);
    const [logoutLoading, setLogoutLoading] = useState(false);

    // --- Form State & Validation ---
    const [formData, setFormData] = useState({
        name: "",
        flavour: "",
        price: "",
        weight: "1 Kg",
        description: "",
        available: true,
    });
    const [errors, setErrors] = useState<FormErrors>({});

    // Debounce search query to reduce server hits
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search);
            setCurrentPage(1);
        }, 400);
        return () => clearTimeout(timer);
    }, [search]);


    // To check admin logedIn or not
   useEffect(() => {

        const checkAuthentication = async () => {
            try {
                const response = await fetch("/api/admin", {
                    method: "GET",
                    credentials: "include",
                    cache: "no-store",
                });

                const data = await response.json();

                console.log("AUTH:", data);

                // NOT authenticated
                if (!response.ok || !data.authenticated) {
                    window.location.replace(
                        "/admin-panel/login"
                    );
                }

            } catch (error) {
                console.error(
                    "Authentication check failed:",
                    error
                );

                window.location.replace(
                    "/admin-panel/login"
                );
            }
        };


        // Normal page load
        checkAuthentication();


        // Browser Back / Forward
        const handlePageShow = () => {
            console.log("pageshow → checking authentication");

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


    // Fetch menu data from server
    const fetchMenu = useCallback(async () => {
        setLoading(true);
        try {
            const response = await axios.get("/api/admin/menu", {
                params: {
                    page: currentPage,
                    limit,
                    search: debouncedSearch.trim(),
                },
            });
            if (response.data.success) {
                setItems(response.data.data);
                setTotalPages(response.data.pagination.totalPages || 1);
                setTotalItems(response.data.pagination.totalItems || 0);
            }
        } catch (err) {
            // console.error("Failed to fetch menu items:", err);
        } finally {
            setLoading(false);
        }
    }, [currentPage, debouncedSearch]);

    useEffect(() => {
        fetchMenu();
    }, [fetchMenu]);

    // Form Field Validation
    const validateForm = () => {
        const newErrors: FormErrors = {};
        if (!formData.name.trim()) newErrors.name = "item name is required";
        if (!formData.flavour.trim()) newErrors.flavour = "flavour is required";
        if (!formData.price || Number(formData.price) <= 0)
            newErrors.price = "valid price is required";
        if (!formData.weight.trim()) newErrors.weight = "weight is required";
        if (!formData.description.trim())
            newErrors.description = "description is required";

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Open modal for Create/Edit
    // const handleOpenFormModal = (item?: MenuItem) => {
    //     setErrors({});
    //     if (item) {
    //         setEditingItem(item);
    //         setFormData({
    //             name: item.name,
    //             flavour: item.flavour,
    //             price: String(item.price),
    //             weight: item.weight,
    //             description: item.description,
    //             available: item.available,
    //         });
    //     } else {
    //         setEditingItem(null);
    //         setFormData({
    //             name: "",
    //             flavour: "",
    //             price: "",
    //             weight: "1 Kg",
    //             description: "",
    //             available: true,
    //         });
    //     }
    //     setIsFormModalOpen(true);
    // };

    const handleOpenFormModal = (item?: MenuItem) => {
        setErrors({});
        setServerError("");
        setIsErrorModalOpen(false);

        if (item) {
            setEditingItem(item);
            setFormData({
                name: item.name,
                flavour: item.flavour,
                price: String(item.price),
                weight: item.weight,
                description: item.description,
                available: item.available,
            });
        } else {
            setEditingItem(null);
            setFormData({
                name: "",
                flavour: "",
                price: "",
                weight: "1 Kg",
                description: "",
                available: true,
            });
        }

        setIsFormModalOpen(true);
    };

    // Submit Create or Update
    // const handleFormSubmit = async (e: React.FormEvent) => {
    //     e.preventDefault();
    //     if (!validateForm()) return;

    //     setActionLoading(true);
    //     try {
    //         const payload = {
    //             ...formData,
    //             price: Number(formData.price),
    //         };

    //         if (editingItem) {
    //             await axios.patch(`/api/admin/menu/${editingItem._id}`, payload);
    //         } else {
    //             await axios.post("/api/admin/menu", payload);
    //         }

    //         setIsFormModalOpen(false);
    //         fetchMenu();
    //     } catch (err: any) {
    //         console.error("Error saving menu item:", err);

    //         // Extract backend error message or default to generic message
    //         const errorMsg =
    //             err.response?.data?.error ||
    //             "Item name already exists or invalid data provided.";

    //         setServerError(errorMsg);

    //     } finally {
    //         setActionLoading(false);
    //     }
    // };

    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) return;

        setActionLoading(true);
        setServerError("");
        setIsErrorModalOpen(false);

        try {
            const payload = {
                ...formData,
                price: Number(formData.price),
            };

            if (editingItem) {
                await axios.put(
                    `/api/admin/menu/${editingItem._id}`,
                    payload
                );
            } else {
                await axios.post("/api/admin/menu", payload);
            }

            setIsFormModalOpen(false);
            setEditingItem(null);

            await fetchMenu();

        } catch (err: any) {
            // console.error("Error saving menu item:", err);

            const errorMsg =
                err.response?.data?.error ||
                "Failed to save menu item. Please try again.";

            setServerError(errorMsg);
            setIsErrorModalOpen(true);

        } finally {
            setActionLoading(false);
        }
    };

    // Toggle Item Availability Status
    const handleToggleAvailability = async (item: MenuItem) => {
        try {
            await axios.patch(`/api/admin/menu/${item._id}`, {
                available: !item.available,
            });
            fetchMenu();
        } catch (err) {
            console.error("Failed to update availability:", err);
        }
    };

    // Confirm Delete
    const handleDeleteConfirm = async () => {
        if (!itemToDelete) return;
        setActionLoading(true);
        try {
            await axios.delete(`/api/admin/menu/${itemToDelete._id}`);
            setIsDeleteModalOpen(false);
            setItemToDelete(null);
            fetchMenu();
        } catch (err: any) {
            // console.error("Failed to delete item:", err);
            const errorMsg =
                err.response?.data?.error ||
                "Failed to save menu item. Please try again.";

            setServerError(errorMsg);
            setIsErrorModalOpen(true);
        } finally {
            setActionLoading(false);
        }
    };



    const handleLogout = async () => {
        if (logoutLoading) return;

        setLogoutLoading(true);

        try {

            await axios.post("/api/admin", {
                state: "logout"
            });

            window.location.href = "/admin-panel/login";
        } catch (err) {
            console.error("Logout failed:", err);
        } finally {
            setLogoutLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-amber-50/30 dark:bg-stone-950 text-stone-800 dark:text-stone-100 p-4 md:p-8 transition-colors duration-300">
            <div className="max-w-7xl mx-auto space-y-6">

                {/* HEADER & TOP CONTROLS */}
                {/* <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 dark:border-stone-800 pb-6">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-serif font-bold text-stone-900 dark:text-stone-50">
                            Menu Items
                        </h1>
                        <p className="text-xs md:text-sm text-stone-500 dark:text-stone-400 mt-1">
                            Manage bakery products, set availability, prices, and listings.
                        </p>
                    </div>

                    <button
                        onClick={() => handleOpenFormModal()}
                        className="inline-flex items-center justify-center gap-2 bg-pink-600 hover:bg-pink-700 dark:bg-pink-500 dark:hover:bg-pink-600 text-white font-medium text-xs md:text-sm px-5 py-2.5 rounded-full shadow-lg transition-all active:scale-95 cursor-pointer"
                    >
                        <Plus className="w-4 h-4" /> Add New Item
                    </button>
                </div> */}


                {/* HEADER */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 border-b border-stone-200 dark:border-stone-800 pb-6">

                    {/* Title */}
                    <div>
                        <h1 className="text-2xl md:text-3xl font-serif font-bold text-stone-900 dark:text-stone-50">
                            Menu Items
                        </h1>

                        <p className="text-xs md:text-sm text-stone-500 dark:text-stone-400 mt-1">
                            Manage bakery products, set availability, prices, and listings.
                        </p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">

                        {/* Logout */}
                        <button
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

                            {logoutLoading ? "Logging out..." : "Logout"}
                        </button>

                        {/* Add Menu */}
                        <button
                            type="button"
                            onClick={() => handleOpenFormModal()}
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
                            Add New Item
                        </button>

                    </div>
                </div>


                {/* SEARCH & FILTERS */}
                <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 p-4 rounded-2xl shadow-sm">
                    <div className="relative w-full md:w-80">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search cakes, flavours..."
                            className="w-full pl-10 pr-9 py-2 rounded-full border border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-950 text-xs md:text-sm text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-pink-500 dark:focus:ring-pink-400 transition-all"
                        />
                        {search && (
                            <button
                                onClick={() => setSearch("")}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </div>

                    <div className="text-xs text-stone-500 dark:text-stone-400">
                        Showing <span className="font-semibold text-stone-800 dark:text-stone-200">{items.length}</span> of <span className="font-semibold text-stone-800 dark:text-stone-200">{totalItems}</span> items
                    </div>
                </div>

                {/* MENU ITEMS TABLE / LIST */}
                <div className="bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 rounded-2xl shadow-sm overflow-hidden">
                    {loading ? (
                        <div className="p-12 text-center text-stone-500 dark:text-stone-400 space-y-3">
                            <Sparkles className="w-6 h-6 animate-spin mx-auto text-pink-500" />
                            <p className="text-xs md:text-sm">Fetching bakery menu...</p>
                        </div>
                    ) : items.length === 0 ? (
                        <div className="p-12 text-center text-stone-500 dark:text-stone-400 space-y-2">
                            <p className="font-medium text-sm">No menu items found</p>
                            <p className="text-xs">Try adjusting your search filter or add a new cake item.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-stone-200/80 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-950/50 text-[11px] uppercase tracking-wider text-stone-500 dark:text-stone-400">
                                        <th className="p-4">Product</th>
                                        <th className="p-4">Flavour</th>
                                        <th className="p-4">Weight</th>
                                        <th className="p-4">Price</th>
                                        <th className="p-4">Status</th>
                                        <th className="p-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-stone-200/60 dark:divide-stone-800 text-xs md:text-sm">
                                    {items.map((item) => (
                                        <tr key={item._id} className="hover:bg-stone-50/50 dark:hover:bg-stone-800/40 transition-colors">
                                            <td className="p-4 flex items-center gap-3">
                                                {/* <div className="w-12 h-12 rounded-xl bg-stone-100 dark:bg-stone-800 overflow-hidden relative flex-shrink-0 border border-stone-200/50 dark:border-stone-700">
                          {item.image ? (
                            <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-stone-400">
                              <ImageIcon className="w-5 h-5" />
                            </div>
                          )}
                        </div> */}
                                                <div>
                                                    <p className="font-semibold text-stone-900 dark:text-stone-100">{item.name}</p>
                                                    <p className="text-[11px] text-stone-500 dark:text-stone-400 line-clamp-1">{item.description}</p>
                                                </div>
                                            </td>
                                            <td className="p-4 font-medium text-stone-700 dark:text-stone-300">{item.flavour}</td>
                                            <td className="p-4 text-stone-600 dark:text-stone-400">{item.weight}</td>
                                            <td className="p-4 font-semibold text-stone-900 dark:text-stone-50">₹{item.price}</td>
                                            <td className="p-4">
                                                <button
                                                    onClick={() => handleToggleAvailability(item)}
                                                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium transition-colors cursor-pointer ${item.available
                                                        ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                                                        : "bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-400 border border-stone-200 dark:border-stone-700"
                                                        }`}
                                                >
                                                    <span className={`w-1.5 h-1.5 rounded-full ${item.available ? "bg-emerald-500" : "bg-stone-400"}`} />
                                                    {item.available ? "Available" : "not-available"}
                                                </button>
                                            </td>
                                            <td className="p-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => handleOpenFormModal(item)}
                                                        className="p-2 text-stone-600 dark:text-stone-300 hover:text-pink-600 dark:hover:text-pink-400 bg-stone-100 dark:bg-stone-800 hover:bg-pink-50 dark:hover:bg-pink-950/40 rounded-full transition-colors"
                                                        title="Edit Item"
                                                    >
                                                        <Edit2 className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            setItemToDelete(item);
                                                            setIsDeleteModalOpen(true);
                                                        }}
                                                        className="p-2 text-stone-600 dark:text-stone-300 hover:text-rose-600 dark:hover:text-rose-400 bg-stone-100 dark:bg-stone-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-full transition-colors"
                                                        title="Delete Item"
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

                    {/* SERVER SIDE PAGINATION */}
                    {totalPages > 1 && (
                        <div className="p-4 border-t border-stone-200/80 dark:border-stone-800 flex items-center justify-between bg-stone-50/50 dark:bg-stone-950/50">
                            <span className="text-xs text-stone-500 dark:text-stone-400">
                                Page <span className="font-semibold text-stone-800 dark:text-stone-200">{currentPage}</span> of {totalPages}
                            </span>
                            <div className="flex items-center gap-2">
                                <button
                                    disabled={currentPage === 1}
                                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                                    className="p-2 rounded-full border border-stone-200 dark:border-stone-800 hover:bg-white dark:hover:bg-stone-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </button>
                                <button
                                    disabled={currentPage === totalPages}
                                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                                    className="p-2 rounded-full border border-stone-200 dark:border-stone-800 hover:bg-white dark:hover:bg-stone-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                >
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* CREATE / EDIT ITEM MODAL */}
            {isFormModalOpen && (
                <div className="fixed inset-0 z-50 bg-stone-950/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="w-full max-w-lg bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-800 pb-4">
                            <h3 className="font-serif font-bold text-lg text-stone-900 dark:text-stone-50">
                                {editingItem ? "Edit Menu Item" : "Create New Menu Item"}
                            </h3>
                            <button
                                onClick={() => setIsFormModalOpen(false)}
                                className="p-1.5 rounded-full text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleFormSubmit} noValidate className="space-y-4 text-xs md:text-sm">
                            {/* Item Name */}
                            <div className="space-y-1">
                                <label className="block font-semibold text-stone-700 dark:text-stone-300">Item Name</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="Vanilla Cake"
                                    className={`w-full px-4 py-2.5 rounded-full border bg-stone-50/50 dark:bg-stone-950 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 ${errors.name ? "border-rose-500 focus:ring-rose-500" : "border-stone-200 dark:border-stone-800 focus:ring-pink-500"
                                        }`}
                                />
                                {errors.name && <p className="text-[11px] text-rose-500 ml-3">{errors.name}</p>}
                            </div>

                            {/* Flavour & Weight */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="block font-semibold text-stone-700 dark:text-stone-300">Flavour</label>
                                    <input
                                        type="text"
                                        value={formData.flavour}
                                        onChange={(e) => setFormData({ ...formData, flavour: e.target.value })}
                                        placeholder="Vanilla"
                                        className={`w-full px-4 py-2.5 rounded-full border bg-stone-50/50 dark:bg-stone-950 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 ${errors.flavour ? "border-rose-500 focus:ring-rose-500" : "border-stone-200 dark:border-stone-800 focus:ring-pink-500"
                                            }`}
                                    />
                                    {errors.flavour && <p className="text-[11px] text-rose-500 ml-3">{errors.flavour}</p>}
                                </div>

                                <div className="space-y-1">
                                    <label className="block font-semibold text-stone-700 dark:text-stone-300">
                                        Weight (Kg)
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            min="0.1"
                                            step="0.1"
                                            value={formData.weight ? formData.weight.replace(" Kg", "") : ""}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                setFormData({
                                                    ...formData,
                                                    weight: val ? `${val} Kg` : "",
                                                });
                                            }}
                                            placeholder="1"
                                            className={`w-full pl-4 pr-12 py-2.5 rounded-full border bg-stone-50/50 dark:bg-stone-950 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 transition-all ${errors.weight
                                                ? "border-rose-500 focus:ring-rose-500"
                                                : "border-stone-200 dark:border-stone-800 focus:ring-pink-500 dark:focus:ring-pink-400"
                                                }`}
                                        />
                                        {/* Disabled Suffix Indicator */}
                                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-stone-400 dark:text-stone-500 pointer-events-none select-none">
                                            Kg
                                        </span>
                                    </div>
                                    {errors.weight && (
                                        <p className="text-[11px] text-rose-500 dark:text-rose-400 ml-3 pt-0.5">
                                            {errors.weight}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Price & Availability */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="block font-semibold text-stone-700 dark:text-stone-300">Price (₹)</label>
                                    <input
                                        type="number"
                                        value={formData.price}
                                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                        placeholder="550"
                                        className={`w-full px-4 py-2.5 rounded-full border bg-stone-50/50 dark:bg-stone-950 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 ${errors.price ? "border-rose-500 focus:ring-rose-500" : "border-stone-200 dark:border-stone-800 focus:ring-pink-500"
                                            }`}
                                    />
                                    {errors.price && <p className="text-[11px] text-rose-500 ml-3">{errors.price}</p>}
                                </div>

                                <div className="space-y-1 flex flex-col justify-end pb-2">
                                    <label className="flex items-center gap-2 cursor-pointer select-none">
                                        <input
                                            type="checkbox"
                                            checked={formData.available}
                                            onChange={(e) => setFormData({ ...formData, available: e.target.checked })}
                                            className="w-4 h-4 rounded text-pink-600 focus:ring-pink-500 dark:bg-stone-950 border-stone-300 dark:border-stone-800"
                                        />
                                        <span className="font-semibold text-stone-700 dark:text-stone-300">In Stock / Available</span>
                                    </label>
                                </div>
                            </div>

                            {/* Image URL */}
                            {/* <div className="space-y-1">
                <label className="block font-semibold text-stone-700 dark:text-stone-300">Image URL</label>
                <input
                  type="text"
                  value={formData.image}
                  onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                  placeholder="https://example.com/vanilla-cake.jpg"
                  className="w-full px-4 py-2.5 rounded-full border border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-950 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-pink-500"
                />
              </div> */}

                            {/* Description */}
                            <div className="space-y-1">
                                <label className="block font-semibold text-stone-700 dark:text-stone-300">Description</label>
                                <textarea
                                    rows={3}
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Delicious Vanilla Cake with rich cream..."
                                    className={`w-full px-4 py-3 rounded-2xl border bg-stone-50/50 dark:bg-stone-950 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 ${errors.description ? "border-rose-500 focus:ring-rose-500" : "border-stone-200 dark:border-stone-800 focus:ring-pink-500"
                                        }`}
                                />
                                {errors.description && <p className="text-[11px] text-rose-500 ml-3">{errors.description}</p>}
                            </div>

                            {/* Action Buttons */}
                            <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-200 dark:border-stone-800">
                                <button
                                    type="button"
                                    onClick={() => setIsFormModalOpen(false)}
                                    className="px-5 py-2.5 rounded-full border border-stone-200 dark:border-stone-800 font-medium text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={actionLoading}
                                    className="px-6 py-2.5 rounded-full bg-pink-600 hover:bg-pink-700 dark:bg-pink-500 dark:hover:bg-pink-600 text-white font-semibold transition-all active:scale-95 disabled:opacity-60"
                                >
                                    {actionLoading ? "Saving..." : editingItem ? "Update Item" : "Save Item"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* CONFIRM DELETE MODAL */}
            {isDeleteModalOpen && itemToDelete && (
                <div className="fixed inset-0 z-50 bg-stone-950/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="w-full max-w-sm bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-6 shadow-2xl text-center space-y-4">
                        <div className="w-12 h-12 bg-rose-100 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 rounded-full flex items-center justify-center mx-auto">
                            <AlertTriangle className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="font-serif font-bold text-lg text-stone-900 dark:text-stone-50">Confirm Delete</h3>
                            <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
                                Are you sure you want to delete <span className="font-semibold text-stone-800 dark:text-stone-200">"{itemToDelete.name}"</span>? This action cannot be undone.
                            </p>
                        </div>
                        <div className="flex items-center justify-center gap-3 pt-2">
                            <button
                                onClick={() => setIsDeleteModalOpen(false)}
                                className="w-1/2 py-2.5 rounded-full border border-stone-200 dark:border-stone-800 font-medium text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors text-xs md:text-sm"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDeleteConfirm}
                                disabled={actionLoading}
                                className="w-1/2 py-2.5 rounded-full bg-rose-600 hover:bg-rose-700 text-white font-semibold transition-all active:scale-95 text-xs md:text-sm disabled:opacity-60"
                            >
                                {actionLoading ? "Deleting..." : "Delete"}
                            </button>
                        </div>
                    </div>
                </div>
            )}


            {/* SERVER ERROR MODAL */}
            {isErrorModalOpen && (
                <div className="fixed inset-0 z-[60] bg-stone-950/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="w-full max-w-sm bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-6 shadow-2xl text-center space-y-5">

                        {/* Error Icon */}
                        <div className="w-14 h-14 bg-rose-100 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 rounded-full flex items-center justify-center mx-auto">
                            <AlertTriangle className="w-7 h-7" />
                        </div>

                        {/* Error Content */}
                        <div>
                            <h3 className="font-serif font-bold text-lg text-stone-900 dark:text-stone-50">
                                Unable to Save
                            </h3>

                            <p className="text-xs md:text-sm text-stone-500 dark:text-stone-400 mt-2 leading-relaxed">
                                {serverError}
                            </p>
                        </div>

                        {/* Button */}
                        <button
                            type="button"
                            onClick={() => {
                                setIsErrorModalOpen(false);
                                setServerError("");
                            }}
                            className="w-full py-2.5 rounded-full bg-rose-600 hover:bg-rose-700 text-white font-semibold transition-all active:scale-95 text-xs md:text-sm"
                        >
                            Okay
                        </button>
                    </div>
                </div>
            )}


        </div>
    );
}