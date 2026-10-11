"use client";

import axios from "axios";
import {
    useCallback,
    useEffect,
    useRef,
    useState,
} from "react";
import {
    BookOpen,
    ChevronLeft,
    ChevronRight,
    Download,
    Eye,
    FileText,
    Loader2,
    Search,
    X,
} from "lucide-react";
import { Footer } from "../ui/Footer";

type Recipe = {
    _id: string;
    title: string;
    description?: string;
    fileName: string;
    fileSize: number;
    createdAt: string;
};

type Pagination = {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
};

type ApiPayload = {
    data?:
        | Recipe[]
        | {
              recipes?: Recipe[];
              pagination?: Partial<Pagination>;
          };
    recipes?: Recipe[];
    pagination?: Partial<Pagination>;
};

const api = axios.create({
    withCredentials: true,
    headers: {
        Accept: "application/json",
    },
});

const PAGE_SIZE = 10;

const formatFileSize = (bytes: number) => {
    if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";

    const units = ["B", "KB", "MB", "GB"];
    const index = Math.min(
        Math.floor(Math.log(bytes) / Math.log(1024)),
        units.length - 1
    );

    return `${(bytes / 1024 ** index).toFixed(
        index === 0 ? 0 : 2
    )} ${units[index]}`;
};

const formatDate = (date: string) => {
    const parsed = new Date(date);

    if (Number.isNaN(parsed.getTime())) return "—";

    return parsed.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
};

const getErrorMessage = (error: unknown) => {
    if (axios.isAxiosError(error)) {
        return (
            error.response?.data?.message ||
            error.message ||
            "Something went wrong."
        );
    }

    return error instanceof Error
        ? error.message
        : "Something went wrong.";
};

export default function RecipesPdf() {
    const [recipes, setRecipes] = useState<Recipe[]>([]);
    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [page, setPage] = useState(1);

    const [pagination, setPagination] = useState<Pagination>({
        page: 1,
        limit: PAGE_SIZE,
        totalItems: 0,
        totalPages: 1,
    });

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [downloadingId, setDownloadingId] = useState<string | null>(
        null
    );

    const requestIdRef = useRef(0);

    // Debounce search
    useEffect(() => {
        const timeout = setTimeout(() => {
            setDebouncedSearch(search.trim());
        }, 350);

        return () => clearTimeout(timeout);
    }, [search]);

    const loadRecipes = useCallback(async () => {
        const requestId = ++requestIdRef.current;

        setLoading(true);
        setError("");

        try {
            const response = await api.get<ApiPayload>(
                "/api/recipes",
                {
                    params: {
                        search: debouncedSearch,
                        page,
                        limit: PAGE_SIZE,
                    },
                }
            );

            if (requestId !== requestIdRef.current) return;

            const payload = response.data;

            const list: Recipe[] = Array.isArray(payload.data)
                ? payload.data
                : !Array.isArray(payload.data) &&
                    Array.isArray(payload.data?.recipes)
                  ? payload.data.recipes
                  : Array.isArray(payload.recipes)
                    ? payload.recipes
                    : [];

            const paginationData =
                payload.pagination ??
                (!Array.isArray(payload.data)
                    ? payload.data?.pagination
                    : undefined) ??
                {};

            const totalItems = Number(
                paginationData.totalItems ?? list.length
            );

            const totalPages = Math.max(
                1,
                Number(
                    paginationData.totalPages ??
                        Math.ceil(totalItems / PAGE_SIZE)
                )
            );

            setRecipes(list);
            setPagination({
                page: Number(paginationData.page ?? page),
                limit: Number(
                    paginationData.limit ?? PAGE_SIZE
                ),
                totalItems,
                totalPages,
            });

            // Handle a page that no longer exists
            if (page > totalPages) {
                setPage(totalPages);
            }
        } catch (err) {
            if (requestId !== requestIdRef.current) return;

            setError(getErrorMessage(err));
            setRecipes([]);
        } finally {
            if (requestId === requestIdRef.current) {
                setLoading(false);
            }
        }
    }, [page, debouncedSearch]);

    useEffect(() => {
        void loadRecipes();

        return () => {
            requestIdRef.current++;
        };
    }, [loadRecipes]);

    const handleSearchChange = (value: string) => {
        setSearch(value);
        setPage(1);
    };

    const previewRecipe = (recipe: Recipe) => {
        const url = `/api/recipes/${encodeURIComponent(
            recipe._id
        )}/file`;

        window.open(url, "_blank", "noopener,noreferrer");
    };

    const downloadRecipe = async (recipe: Recipe) => {
        if (downloadingId) return;

        setDownloadingId(recipe._id);
        setError("");

        try {
            const response = await api.get(
                `/api/recipes/${encodeURIComponent(
                    recipe._id
                )}/file?download=1`,
                {
                    responseType: "blob",
                }
            );

            const blob = new Blob([response.data], {
                type: "application/pdf",
            });

            const url = URL.createObjectURL(blob);

            const link = document.createElement("a");
            link.href = url;
            link.download =
                recipe.fileName || `${recipe.title}.pdf`;

            document.body.appendChild(link);
            link.click();
            link.remove();

            setTimeout(() => URL.revokeObjectURL(url), 1000);
        } catch (err) {
            setError(getErrorMessage(err));
        } finally {
            setDownloadingId(null);
        }
    };

    return (
        // <div className="min-h-screen bg-amber-50/30 px-4 pb-8 pt-24 text-stone-800 transition-colors duration-300 dark:bg-stone-950 dark:text-stone-100 md:px-8 md:pb-12 md:pt-28">
         <div className="min-h-screen flex flex-col bg-amber-50/30 dark:bg-stone-950 text-stone-800 dark:text-stone-100 transition-colors duration-300">

            <main className="flex-1 px-4 pb-8 pt-24 md:px-8 md:pb-12 md:pt-28">

            <div className="mx-auto max-w-7xl space-y-6">
                {/* Heading */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-pink-600 dark:text-pink-400">
                            <BookOpen className="h-4 w-4" />
                            Butterfly Bakes
                        </div>

                        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                            Baking Recipes
                        </h1>

                        <p className="mt-2 text-sm text-stone-500 dark:text-stone-400">
                            Explore our collection of baking recipes.
                            Preview and download your favorites.
                        </p>
                    </div>

                    <div className="flex items-center gap-3 rounded-xl border border-stone-200 bg-white px-5 py-3 shadow-sm dark:border-stone-800 dark:bg-stone-900">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-pink-50 text-pink-600 dark:bg-pink-950/40 dark:text-pink-400">
                            <BookOpen className="h-5 w-5" />
                        </div>

                        <div>
                            <p className="text-xs font-medium text-stone-500 dark:text-stone-400">
                                Available recipes
                            </p>
                            <p className="text-xl font-bold text-stone-900 dark:text-white">
                                {pagination.totalItems}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Error */}
                {error && (
                    <div
                        role="alert"
                        className="flex items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-400"
                    >
                        <span>{error}</span>

                        <button
                            type="button"
                            onClick={() => setError("")}
                            aria-label="Dismiss error"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                )}

                {/* Recipe Library */}
                <section className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm dark:border-stone-800 dark:bg-stone-900">
                    {/* Search header */}
                    <div className="flex flex-col gap-4 border-b border-stone-200 p-5 dark:border-stone-800 sm:flex-row sm:items-center sm:justify-between md:p-6">
                        <div>
                            <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-100">
                                Recipe Library
                            </h2>

                            <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
                                Find the perfect recipe for your next bake.
                            </p>
                        </div>

                        <div className="relative w-full sm:max-w-sm">
                            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />

                            <input
                                type="search"
                                value={search}
                                onChange={(event) =>
                                    handleSearchChange(
                                        event.target.value
                                    )
                                }
                                placeholder="Search recipes..."
                                aria-label="Search recipes"
                                className="w-full rounded-xl border border-stone-200 bg-stone-50 py-2.5 pl-10 pr-10 text-sm text-stone-800 outline-none transition focus:border-pink-400 focus:bg-white focus:ring-2 focus:ring-pink-100 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100 dark:focus:border-pink-500 dark:focus:ring-pink-950"
                            />

                            {search && (
                                <button
                                    type="button"
                                    onClick={() =>
                                        handleSearchChange("")
                                    }
                                    aria-label="Clear search"
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 transition hover:text-stone-700 dark:hover:text-stone-200"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Desktop Table */}
                    <div className="hidden overflow-x-auto md:block">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-stone-50/80 text-xs uppercase tracking-wide text-stone-500 dark:bg-stone-950/40 dark:text-stone-400">
                                <tr>
                                    <th className="px-6 py-4 font-semibold">
                                        Recipe
                                    </th>
                                    <th className="px-4 py-4 font-semibold">
                                        PDF File
                                    </th>
                                    <th className="px-4 py-4 font-semibold">
                                        Size
                                    </th>
                                    <th className="px-4 py-4 font-semibold">
                                        Added On
                                    </th>
                                    <th className="px-6 py-4 text-right font-semibold">
                                        Actions
                                    </th>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                                {loading ? (
                                    <tr>
                                        <td
                                            colSpan={5}
                                            className="px-6 py-20 text-center"
                                        >
                                            <Loader2 className="mx-auto mb-3 h-7 w-7 animate-spin text-pink-600" />
                                            <p className="text-sm text-stone-500">
                                                Loading recipes...
                                            </p>
                                        </td>
                                    </tr>
                                ) : recipes.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={5}
                                            className="px-6 py-20 text-center"
                                        >
                                            <EmptyRecipes
                                                searching={
                                                    !!debouncedSearch
                                                }
                                            />
                                        </td>
                                    </tr>
                                ) : (
                                    recipes.map((recipe) => (
                                        <tr
                                            key={recipe._id}
                                            className="transition-colors hover:bg-amber-50/40 dark:hover:bg-stone-800/50"
                                        >
                                            <td className="max-w-[280px] px-6 py-4">
                                                <p className="truncate font-semibold text-stone-900 dark:text-stone-100">
                                                    {recipe.title}
                                                </p>

                                                {recipe.description && (
                                                    <p className="mt-1 line-clamp-2 text-xs leading-5 text-stone-500 dark:text-stone-400">
                                                        {
                                                            recipe.description
                                                        }
                                                    </p>
                                                )}
                                            </td>

                                            <td className="max-w-[230px] px-4 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-500 dark:bg-red-950/30">
                                                        <FileText className="h-5 w-5" />
                                                    </div>

                                                    <span
                                                        title={
                                                            recipe.fileName
                                                        }
                                                        className="truncate text-xs text-stone-600 dark:text-stone-300"
                                                    >
                                                        {recipe.fileName}
                                                    </span>
                                                </div>
                                            </td>

                                            <td className="whitespace-nowrap px-4 py-4 text-xs text-stone-500 dark:text-stone-400">
                                                {formatFileSize(
                                                    recipe.fileSize
                                                )}
                                            </td>

                                            <td className="whitespace-nowrap px-4 py-4 text-xs text-stone-500 dark:text-stone-400">
                                                {formatDate(
                                                    recipe.createdAt
                                                )}
                                            </td>

                                            <td className="px-6 py-4">
                                                <div className="flex items-center justify-end gap-2">
                                                    {/* <button
                                                        type="button"
                                                        onClick={() =>
                                                            previewRecipe(
                                                                recipe
                                                            )
                                                        }
                                                        className="inline-flex items-center gap-1.5 rounded-lg border border-stone-200 px-3 py-2 text-xs font-semibold text-stone-700 transition hover:border-pink-300 hover:bg-pink-50 hover:text-pink-700 dark:border-stone-700 dark:text-stone-300 dark:hover:bg-stone-800"
                                                    >
                                                        <Eye className="h-3.5 w-3.5" />
                                                        Preview
                                                    </button> */}

                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            void downloadRecipe(
                                                                recipe
                                                            )
                                                        }
                                                        disabled={
                                                            downloadingId !==
                                                            null
                                                        }
                                                        className="inline-flex items-center gap-1.5 rounded-lg bg-pink-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-pink-700 disabled:cursor-not-allowed disabled:opacity-50"
                                                    >
                                                        {downloadingId ===
                                                        recipe._id ? (
                                                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                                        ) : (
                                                            <Download className="h-3.5 w-3.5" />
                                                        )}
                                                        Download
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile Cards */}
                    <div className="divide-y divide-stone-100 dark:divide-stone-800 md:hidden">
                        {loading ? (
                            <div className="py-20 text-center">
                                <Loader2 className="mx-auto mb-3 h-7 w-7 animate-spin text-pink-600" />
                                <p className="text-sm text-stone-500">
                                    Loading recipes...
                                </p>
                            </div>
                        ) : recipes.length === 0 ? (
                            <div className="px-5 py-16">
                                <EmptyRecipes
                                    searching={!!debouncedSearch}
                                />
                            </div>
                        ) : (
                            recipes.map((recipe) => (
                                <div
                                    key={recipe._id}
                                    className="p-5"
                                >
                                    <div className="flex items-start gap-3">
                                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-500 dark:bg-red-950/30">
                                            <FileText className="h-6 w-6" />
                                        </div>

                                        <div className="min-w-0 flex-1">
                                            <h3 className="font-semibold text-stone-900 dark:text-stone-100">
                                                {recipe.title}
                                            </h3>

                                            {recipe.description && (
                                                <p className="mt-1 line-clamp-2 text-xs leading-5 text-stone-500 dark:text-stone-400">
                                                    {recipe.description}
                                                </p>
                                            )}

                                            <p className="mt-2 truncate text-xs text-stone-400">
                                                {recipe.fileName}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="mt-4 flex items-center justify-between border-t border-stone-100 pt-3 text-xs text-stone-500 dark:border-stone-800 dark:text-stone-400">
                                        <span>
                                            {formatFileSize(
                                                recipe.fileSize
                                            )}
                                        </span>
                                        <span>
                                            {formatDate(
                                                recipe.createdAt
                                            )}
                                        </span>
                                    </div>

                                    <div className="mt-4 grid grid-cols-2 gap-3">
                                        {/* <button
                                            type="button"
                                            onClick={() =>
                                                previewRecipe(recipe)
                                            }
                                            className="inline-flex items-center justify-center gap-2 rounded-xl border border-stone-200 px-4 py-2.5 text-sm font-semibold text-stone-700 transition hover:bg-stone-50 dark:border-stone-700 dark:text-stone-300 dark:hover:bg-stone-800"
                                        >
                                            <Eye className="h-4 w-4" />
                                            Preview
                                        </button> */}

                                        <button
                                            type="button"
                                            disabled={
                                                downloadingId !== null
                                            }
                                            onClick={() =>
                                                void downloadRecipe(
                                                    recipe
                                                )
                                            }
                                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-pink-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-pink-700 disabled:opacity-50"
                                        >
                                            {downloadingId ===
                                            recipe._id ? (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : (
                                                <Download className="h-4 w-4" />
                                            )}
                                            Download
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Pagination */}
                    {!loading && pagination.totalItems > 0 && (
                        <div className="flex items-center justify-between border-t border-stone-200/80 bg-stone-50/30 px-5 py-4 dark:border-stone-800 dark:bg-stone-950/30 md:px-6">
                            <span className="text-xs text-stone-500 dark:text-stone-400">
                                Page{" "}
                                <span className="font-semibold text-stone-800 dark:text-stone-200">
                                    {page}
                                </span>{" "}
                                of{" "}
                                <span className="font-semibold text-stone-800 dark:text-stone-200">
                                    {pagination.totalPages}
                                </span>
                            </span>

                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    aria-label="Previous page"
                                    disabled={page <= 1}
                                    onClick={() =>
                                        setPage((prev) =>
                                            Math.max(1, prev - 1)
                                        )
                                    }
                                    className="rounded-xl border border-stone-200 p-2 text-stone-600 transition-colors hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-stone-800 dark:text-stone-300 dark:hover:bg-stone-800"
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </button>

                                <button
                                    type="button"
                                    aria-label="Next page"
                                    disabled={
                                        page >= pagination.totalPages
                                    }
                                    onClick={() =>
                                        setPage((prev) =>
                                            Math.min(
                                                pagination.totalPages,
                                                prev + 1
                                            )
                                        )
                                    }
                                    className="rounded-xl border border-stone-200 p-2 text-stone-600 transition-colors hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-stone-800 dark:text-stone-300 dark:hover:bg-stone-800"
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    )}
                </section>
            </div>

             </main>

             <Footer />

        </div>
    );
}

function EmptyRecipes({ searching }: { searching: boolean }) {
    return (
        <div className="flex flex-col items-center justify-center text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-pink-50 text-pink-600 dark:bg-pink-950/30 dark:text-pink-400">
                {searching ? (
                    <Search className="h-6 w-6" />
                ) : (
                    <BookOpen className="h-6 w-6" />
                )}
            </div>

            <h3 className="font-semibold text-stone-900 dark:text-stone-100">
                {searching
                    ? "No matching recipes"
                    : "No recipes available"}
            </h3>

            <p className="mt-2 max-w-xs text-sm text-stone-500 dark:text-stone-400">
                {searching
                    ? "Try searching with a different recipe name."
                    : "Our recipe collection is coming soon. Check back later."}
            </p>
        </div>
    );
}