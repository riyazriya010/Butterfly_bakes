
"use client";

import axios from "axios";
import {
  ChangeEvent,
  FormEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

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

type DeleteModalState = {
  ids: string[];
  title: string;
};

const api = axios.create({
  baseURL: "",
  withCredentials: true,
  headers: {
    Accept: "application/json",
  },
});

const PAGE_SIZE = 10;
const MAX_FILE_SIZE = 15 * 1024 * 1024;

export default function Recipe() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: PAGE_SIZE,
    totalItems: 0,
    totalPages: 1,
  });

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [deleting, setDeleting] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [deleteModal, setDeleteModal] =
    useState<DeleteModalState | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const getErrorMessage = (err: unknown): string => {
    if (axios.isAxiosError(err)) {
      return (
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        "Something went wrong."
      );
    }

    return err instanceof Error
      ? err.message
      : "Something went wrong.";
  };

  const formatFileSize = (bytes: number) => {
    if (!bytes || bytes < 0) return "0 B";

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
    if (!date) return "—";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) return "—";

    return parsedDate.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const extractRecipes = (payload: any): Recipe[] => {
    if (Array.isArray(payload.data)) {
      return payload.data;
    }

    if (Array.isArray(payload.data?.recipes)) {
      return payload.data.recipes;
    }

    if (Array.isArray(payload.recipes)) {
      return payload.recipes;
    }

    return [];
  };

  const applyRecipeResponse = (
    payload: any,
    requestedPage: number
  ) => {
    const list = extractRecipes(payload);

    const paginationData =
      payload.pagination ?? payload.data?.pagination ?? {};

    const totalItems = Number(
      paginationData.totalItems ??
        paginationData.total ??
        list.length
    );

    setRecipes(list);

    setPagination({
      page: Number(paginationData.page ?? requestedPage),
      limit: Number(paginationData.limit ?? PAGE_SIZE),
      totalItems,
      totalPages: Math.max(
        1,
        Number(
          paginationData.totalPages ??
            Math.ceil(totalItems / PAGE_SIZE) ??
            1
        )
      ),
    });

    setSelectedIds([]);
  };

  const loadRecipes = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await api.get("/api/admin/recipes", {
        params: {
          search: search.trim(),
          page,
          limit: PAGE_SIZE,
        },
      });

      applyRecipeResponse(response.data, page);
    } catch (err) {
      setError(getErrorMessage(err));
      setRecipes([]);
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      void loadRecipes();
    }, 300);

    return () => clearTimeout(timeout);
  }, [loadRecipes]);

  const handleFileChange = (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const selectedFile = event.target.files?.[0];

    setError("");
    setSuccess("");

    if (!selectedFile) {
      setFile(null);
      return;
    }

    const isPdf =
      selectedFile.type === "application/pdf" ||
      selectedFile.name.toLowerCase().endsWith(".pdf");

    if (!isPdf) {
      setFile(null);
      event.target.value = "";
      setError("Only PDF files are allowed.");
      return;
    }

    if (selectedFile.size === 0) {
      setFile(null);
      event.target.value = "";
      setError("The selected PDF is empty.");
      return;
    }

    if (selectedFile.size > MAX_FILE_SIZE) {
      setFile(null);
      event.target.value = "";
      setError("Maximum PDF file size is 15 MB.");
      return;
    }

    setFile(selectedFile);
  };

  const handleUpload = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!title.trim()) {
      setError("Please enter a recipe title.");
      return;
    }

    if (!file) {
      setError("Please select a PDF file.");
      return;
    }

    const formData = new FormData();
    formData.append("title", title.trim());
    formData.append("description", description.trim());
    formData.append("file", file);

    setUploading(true);
    setUploadProgress(0);

    try {
      await api.post("/api/admin/recipes", formData, {
        onUploadProgress: (event) => {
          if (event.total) {
            setUploadProgress(
              Math.round((event.loaded / event.total) * 100)
            );
          }
        },
      });

      setTitle("");
      setDescription("");
      setFile(null);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      setPage(1);
      setSuccess("Recipe PDF uploaded successfully.");

      const response = await api.get("/api/admin/recipes", {
        params: {
          search: search.trim(),
          page: 1,
          limit: PAGE_SIZE,
        },
      });

      applyRecipeResponse(response.data, 1);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const toggleSelection = (id: string) => {
    setSelectedIds((current) =>
      current.includes(id)
        ? current.filter((selectedId) => selectedId !== id)
        : [...current, id]
    );
  };

  const allVisibleSelected =
    recipes.length > 0 &&
    recipes.every((recipe) => selectedIds.includes(recipe._id));

  const toggleSelectAll = () => {
    if (allVisibleSelected) {
      setSelectedIds((current) =>
        current.filter(
          (id) => !recipes.some((recipe) => recipe._id === id)
        )
      );
    } else {
      setSelectedIds((current) => [
        ...new Set([
          ...current,
          ...recipes.map((recipe) => recipe._id),
        ]),
      ]);
    }
  };

  // Open the custom confirmation modal instead of window.confirm().
  const requestDelete = (ids: string[], itemTitle?: string) => {
    if (deleting || ids.length === 0) return;

    setError("");
    setSuccess("");

    setDeleteModal({
      ids,
      title:
        itemTitle ??
        (ids.length === 1
          ? "this recipe PDF"
          : `${ids.length} selected recipe PDFs`),
    });
  };

  const closeDeleteModal = () => {
    if (deleting) return;
    setDeleteModal(null);
  };

  const handleDelete = async () => {
    if (!deleteModal || deleting) return;

    const ids = deleteModal.ids;

    setError("");
    setSuccess("");
    setDeleting(true);

    try {
      const response = await api.delete("/api/admin/recipes", {
        data: { ids },
      });

      const payload = response.data;
      const result = payload.data ?? payload;

      const deletedCount = Number(
        result.deletedCount ?? ids.length
      );

      const failedIds: string[] = result.failedIds ?? [];
      const notFoundIds: string[] = result.notFoundIds ?? [];
      const invalidIds: string[] = result.invalidIds ?? [];

      const failedSet = new Set([
        ...failedIds,
        ...notFoundIds,
        ...invalidIds,
      ]);

      setSelectedIds((current) =>
        current.filter(
          (id) => !ids.includes(id) || failedSet.has(id)
        )
      );

      setDeleteModal(null);

      if (deletedCount > 0) {
        setSuccess(
          `${deletedCount} recipe${
            deletedCount === 1 ? "" : "s"
          } deleted successfully.`
        );
      }

      if (failedSet.size > 0) {
        setError(
          `${failedSet.size} recipe${
            failedSet.size === 1 ? "" : "s"
          } could not be deleted.`
        );
      }

      await loadRecipes();
    } catch (err) {
      setError(getErrorMessage(err));
      setDeleteModal(null);
      await loadRecipes();
    } finally {
      setDeleting(false);
    }
  };

  // Preview is the only action that opens a new tab.
  const previewRecipe = (recipe: Recipe) => {
    window.open(
      `/api/admin/recipes/${encodeURIComponent(
        recipe._id
      )}/file`,
      "_blank",
      "noopener,noreferrer"
    );
  };

  // Download the file as a blob so it is downloaded rather than
  // navigated to in the current tab.
  const downloadRecipe = async (recipe: Recipe) => {
    setError("");
    setSuccess("");

    try {
      const response = await api.get(
        `/api/admin/recipes/${encodeURIComponent(
          recipe._id
        )}/file?download=1`,
        {
          responseType: "blob",
        }
      );

      const blobUrl = URL.createObjectURL(
        new Blob([response.data], {
          type: "application/pdf",
        })
      );

      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = recipe.fileName || `${recipe.title}.pdf`;

      document.body.appendChild(link);
      link.click();
      link.remove();

      URL.revokeObjectURL(blobUrl);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  // Close the modal with Escape and prevent background scrolling.
  useEffect(() => {
    if (!deleteModal) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !deleting) {
        setDeleteModal(null);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [deleteModal, deleting]);

  return (
    // <div className="min-h-screen bg-gray-50 px-4 py-6 text-gray-900 sm:px-6 lg:px-8">
    <div className="min-h-screen bg-amber-50/30 dark:bg-stone-950 text-stone-800 dark:text-stone-100 pt-20 px-4 pb-4 md:pt-20 md:px-8 md:pb-8 lg:pt-8 transition-colors duration-300">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Page heading */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Baking Recipes
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Upload, organize, preview, and download recipe PDFs.
            </p>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white px-4 py-3 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Total recipes
            </p>
            <p className="mt-1 text-2xl font-bold">
              {pagination.totalItems}
            </p>
          </div>
        </div>

        {/* Alert messages */}
        {error && (
          <div
            role="alert"
            className="flex items-start justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            <span>{error}</span>
            <button
              type="button"
              onClick={() => setError("")}
              className="font-semibold hover:text-red-900"
              aria-label="Dismiss error"
            >
              ✕
            </button>
          </div>
        )}

        {success && (
          <div
            role="status"
            className="flex items-start justify-between gap-3 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700"
          >
            <span>{success}</span>
            <button
              type="button"
              onClick={() => setSuccess("")}
              className="font-semibold hover:text-green-900"
              aria-label="Dismiss success message"
            >
              ✕
            </button>
          </div>
        )}

        {/* Upload form */}
        <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-5">
            <h2 className="text-lg font-semibold">
              Add a new recipe
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Upload a PDF file. Maximum file size: 15 MB.
            </p>
          </div>

          <form onSubmit={handleUpload} className="space-y-5">
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <div>
                <label
                  htmlFor="recipe-title"
                  className="mb-1.5 block text-sm font-medium text-gray-700"
                >
                  Recipe title <span className="text-red-500">*</span>
                </label>
                <input
                  id="recipe-title"
                  type="text"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="e.g. Chocolate Truffle Cake"
                  maxLength={150}
                  required
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none transition focus:border-pink-500 focus:ring-2 focus:ring-pink-100"
                />
              </div>

              <div>
                <label
                  htmlFor="recipe-description"
                  className="mb-1.5 block text-sm font-medium text-gray-700"
                >
                  Description
                </label>
                <input
                  id="recipe-description"
                  type="text"
                  value={description}
                  onChange={(event) =>
                    setDescription(event.target.value)
                  }
                  placeholder="Short description (optional)"
                  maxLength={1000}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none transition focus:border-pink-500 focus:ring-2 focus:ring-pink-100"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="recipe-file"
                className="mb-1.5 block text-sm font-medium text-gray-700"
              >
                Recipe PDF <span className="text-red-500">*</span>
              </label>

              <input
                ref={fileInputRef}
                id="recipe-file"
                type="file"
                accept=".pdf,application/pdf"
                onChange={handleFileChange}
                required
                className="block w-full cursor-pointer rounded-lg border border-gray-300 bg-white text-sm text-gray-600 file:mr-4 file:cursor-pointer file:border-0 file:bg-pink-50 file:px-4 file:py-2.5 file:font-medium file:text-pink-700 hover:file:bg-pink-100"
              />

              {file && (
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-lg bg-gray-50 px-3 py-2.5 text-sm">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-gray-800">
                      {file.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatFileSize(file.size)}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setFile(null);
                      if (fileInputRef.current) {
                        fileInputRef.current.value = "";
                      }
                    }}
                    className="text-sm font-medium text-red-600 hover:text-red-800"
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>

            {uploading && (
              <div>
                <div className="mb-1.5 flex justify-between text-xs text-gray-500">
                  <span>Uploading PDF...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div
                  className="h-2 overflow-hidden rounded-full bg-gray-200"
                  role="progressbar"
                  aria-valuenow={uploadProgress}
                  aria-valuemin={0}
                  aria-valuemax={100}
                >
                  <div
                    className="h-full rounded-full bg-pink-600 transition-all"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={uploading || !file || !title.trim()}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-pink-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-pink-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {uploading ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Uploading...
                  </>
                ) : (
                  <>＋ Upload Recipe</>
                )}
              </button>
            </div>
          </form>
        </section>

        {/* Recipe library */}
        <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-gray-200 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold">
                Recipe library
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Search and manage uploaded PDFs.
              </p>
            </div>

            <div className="relative w-full sm:max-w-sm">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                ⌕
              </span>
              <input
                type="search"
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(1);
                }}
                placeholder="Search recipes..."
                aria-label="Search recipes"
                className="w-full rounded-lg border border-gray-300 py-2.5 pl-9 pr-3 text-sm outline-none transition focus:border-pink-500 focus:ring-2 focus:ring-pink-100"
              />
            </div>
          </div>

          {selectedIds.length > 0 && (
            <div className="flex flex-col gap-3 border-b border-pink-100 bg-pink-50 px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm font-medium text-pink-800">
                {selectedIds.length} recipe
                {selectedIds.length === 1 ? "" : "s"} selected
              </p>

              <button
                type="button"
                disabled={deleting}
                onClick={() =>
                  requestDelete(selectedIds)
                }
                className="inline-flex items-center justify-center gap-2 self-start rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50 sm:self-auto"
              >
                Delete selected
              </button>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px] text-left text-sm">
              <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="w-12 px-5 py-3.5">
                    <input
                      type="checkbox"
                      checked={allVisibleSelected}
                      onChange={toggleSelectAll}
                      disabled={recipes.length === 0 || loading}
                      aria-label="Select all visible recipes"
                      className="h-4 w-4 rounded border-gray-300 accent-pink-600"
                    />
                  </th>
                  <th className="px-4 py-3.5">Recipe</th>
                  <th className="px-4 py-3.5">PDF file</th>
                  <th className="px-4 py-3.5">File size</th>
                  <th className="px-4 py-3.5">Uploaded on</th>
                  <th className="px-5 py-3.5 text-right">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-5 py-16 text-center text-gray-500"
                    >
                      <div className="mx-auto mb-3 h-7 w-7 animate-spin rounded-full border-2 border-pink-600 border-t-transparent" />
                      Loading recipes...
                    </td>
                  </tr>
                ) : recipes.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-5 py-16 text-center"
                    >
                      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-pink-50 text-xl text-pink-600">
                        PDF
                      </div>
                      <p className="font-medium text-gray-800">
                        No recipes found
                      </p>
                      <p className="mt-1 text-gray-500">
                        {search.trim()
                          ? "Try a different search term."
                          : "Upload your first recipe PDF above."}
                      </p>
                    </td>
                  </tr>
                ) : (
                  recipes.map((recipe) => (
                    <tr
                      key={recipe._id}
                      className="transition hover:bg-gray-50"
                    >
                      <td className="px-5 py-4">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(recipe._id)}
                          onChange={() =>
                            toggleSelection(recipe._id)
                          }
                          aria-label={`Select ${recipe.title}`}
                          className="h-4 w-4 rounded border-gray-300 accent-pink-600"
                        />
                      </td>

                      <td className="max-w-[280px] px-4 py-4">
                        <p className="truncate font-semibold text-gray-900">
                          {recipe.title}
                        </p>
                        {recipe.description && (
                          <p className="mt-1 line-clamp-2 text-xs text-gray-500">
                            {recipe.description}
                          </p>
                        )}
                      </td>

                      <td className="max-w-[220px] px-4 py-4">
                        <div className="flex items-center gap-2">
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-red-50 text-xs font-bold text-red-600">
                            PDF
                          </span>
                          <span
                            title={recipe.fileName}
                            className="truncate text-gray-600"
                          >
                            {recipe.fileName}
                          </span>
                        </div>
                      </td>

                      <td className="whitespace-nowrap px-4 py-4 text-gray-600">
                        {formatFileSize(recipe.fileSize)}
                      </td>

                      <td className="whitespace-nowrap px-4 py-4 text-gray-600">
                        {formatDate(recipe.createdAt)}
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => previewRecipe(recipe)}
                            title="Preview PDF in a new tab"
                            className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 hover:border-pink-300 hover:bg-pink-50 hover:text-pink-700"
                          >
                            Preview
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              void downloadRecipe(recipe)
                            }
                            title="Download PDF"
                            className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-100"
                          >
                            Download
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              requestDelete(
                                [recipe._id],
                                recipe.title
                              )
                            }
                            disabled={deleting}
                            title="Delete recipe"
                            className="rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {/* Pagination */}
{!loading && pagination.totalItems > 0 && (
    <div
        className="
            flex items-center justify-between
            px-5 md:px-6 py-4
            border-t border-stone-200/80
            dark:border-stone-800
            bg-stone-50/30 dark:bg-stone-950/30
        "
    >
        {/* Page count */}
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

        {/* Navigation */}
        <div className="flex items-center gap-2">
            {/* Previous */}
            <button
                type="button"
                aria-label="Previous page"
                disabled={page <= 1 || loading}
                onClick={() =>
                    setPage((prev) => Math.max(1, prev - 1))
                }
                className="
                    p-2 rounded-xl border
                    border-stone-200 dark:border-stone-800
                    disabled:opacity-40
                    disabled:cursor-not-allowed
                    hover:bg-stone-100
                    dark:hover:bg-stone-800
                    text-stone-600 dark:text-stone-300
                    transition-colors
                "
            >
                <ChevronLeft className="h-4 w-4" />
            </button>

            {/* Next */}
            <button
                type="button"
                aria-label="Next page"
                disabled={page >= pagination.totalPages || loading}
                onClick={() =>
                    setPage((prev) =>
                        Math.min(pagination.totalPages, prev + 1)
                    )
                }
                className="
                    p-2 rounded-xl border
                    border-stone-200 dark:border-stone-800
                    disabled:opacity-40
                    disabled:cursor-not-allowed
                    hover:bg-stone-100
                    dark:hover:bg-stone-800
                    text-stone-600 dark:text-stone-300
                    transition-colors
                "
            >
                <ChevronRight className="h-4 w-4" />
            </button>
        </div>
    </div>
)}
        </section>
      </div>

      {/* Custom centered delete confirmation modal */}
      {deleteModal && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-950/50 px-4 py-6 backdrop-blur-[3px]"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeDeleteModal();
            }
          }}
        >
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-modal-title"
            aria-describedby="delete-modal-description"
            className="w-full max-w-md overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-2xl"
          >
            <div className="p-6 sm:p-7">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-50">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  className="h-7 w-7 text-red-600"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 6h18M9 6V4h6v2m-9 0 1 14h10l1-14M10 10v6m4-6v6"
                  />
                </svg>
              </div>

              <h2
                id="delete-modal-title"
                className="mt-5 text-center text-xl font-bold text-gray-900"
              >
                Delete recipe{deleteModal.ids.length === 1 ? "" : "s"}?
              </h2>

              <p
                id="delete-modal-description"
                className="mt-3 text-center text-sm leading-6 text-gray-500"
              >
                Are you sure you want to delete{" "}
                <span className="font-semibold text-gray-800">
                  {deleteModal.title}
                </span>
                ? This action cannot be undone.
              </p>

              {deleteModal.ids.length > 1 && (
                <div className="mt-4 rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-center text-sm font-medium text-red-700">
                  {deleteModal.ids.length} recipe PDFs will be deleted.
                </div>
              )}

              <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-center">
                <button
                  type="button"
                  onClick={closeDeleteModal}
                  disabled={deleting}
                  className="inline-flex min-h-11 flex-1 items-center justify-center rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={() => void handleDelete()}
                  disabled={deleting}
                  className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-lg bg-red-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {deleting ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Deleting...
                    </>
                  ) : (
                    "Yes, delete"
                  )}
                </button>
              </div>
            </div>

            <div className="h-1 bg-gradient-to-r from-pink-500 via-red-500 to-red-600" />
          </div>
        </div>
      )}
    </div>
  );
}











// "use client";

// import axios from "axios";
// import {
//   ChangeEvent,
//   FormEvent,
//   useCallback,
//   useEffect,
//   useRef,
//   useState,
// } from "react";

// type Recipe = {
//   _id: string;
//   title: string;
//   description?: string;
//   fileName: string;
//   fileSize: number;
//   createdAt: string;
// };

// type Pagination = {
//   page: number;
//   limit: number;
//   totalItems: number;
//   totalPages: number;
// };

// // Uses your existing Next.js API routes.
// const api = axios.create({
//   baseURL: "",
//   withCredentials: true,
//   headers: {
//     Accept: "application/json",
//   },
// });

// const PAGE_SIZE = 10;
// const MAX_FILE_SIZE = 15 * 1024 * 1024;

// export default function Recipe() {
//   const [recipes, setRecipes] = useState<Recipe[]>([]);
//   const [search, setSearch] = useState("");
//   const [page, setPage] = useState(1);

//   const [pagination, setPagination] = useState<Pagination>({
//     page: 1,
//     limit: PAGE_SIZE,
//     totalItems: 0,
//     totalPages: 1,
//   });

//   const [title, setTitle] = useState("");
//   const [description, setDescription] = useState("");
//   const [file, setFile] = useState<File | null>(null);

//   const [selectedIds, setSelectedIds] = useState<string[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [uploading, setUploading] = useState(false);
//   const [uploadProgress, setUploadProgress] = useState(0);
//   const [deleting, setDeleting] = useState(false);

//   const [error, setError] = useState("");
//   const [success, setSuccess] = useState("");

//   const fileInputRef = useRef<HTMLInputElement>(null);

//   const getErrorMessage = (err: unknown): string => {
//     if (axios.isAxiosError(err)) {
//       return (
//         err.response?.data?.message ||
//         err.response?.data?.error ||
//         err.message ||
//         "Something went wrong."
//       );
//     }

//     return err instanceof Error ? err.message : "Something went wrong.";
//   };

//   const formatFileSize = (bytes: number) => {
//     if (!bytes || bytes < 0) return "0 B";

//     const units = ["B", "KB", "MB", "GB"];
//     const index = Math.min(
//       Math.floor(Math.log(bytes) / Math.log(1024)),
//       units.length - 1
//     );

//     return `${(bytes / 1024 ** index).toFixed(index === 0 ? 0 : 2)} ${units[index]}`;
//   };

//   const formatDate = (date: string) => {
//     if (!date) return "—";

//     const parsedDate = new Date(date);

//     if (Number.isNaN(parsedDate.getTime())) return "—";

//     return parsedDate.toLocaleDateString("en-IN", {
//       day: "2-digit",
//       month: "short",
//       year: "numeric",
//     });
//   };

//   const loadRecipes = useCallback(async () => {
//     setLoading(true);
//     setError("");

//     try {
//       const response = await api.get("/api/admin/recipes", {
//         params: {
//           search: search.trim(),
//           page,
//           limit: PAGE_SIZE,
//         },
//       });

//       const payload = response.data;

//       // Supports a response shaped as:
//       // { success, data: [...], pagination: {...} }
//       // or { success, data: { recipes: [...], pagination: {...} } }
//       const list: Recipe[] = Array.isArray(payload.data)
//         ? payload.data
//         : Array.isArray(payload.data?.recipes)
//           ? payload.data.recipes
//           : Array.isArray(payload.recipes)
//             ? payload.recipes
//             : [];

//       const paginationData =
//         payload.pagination ?? payload.data?.pagination ?? {};

//       setRecipes(list);

//       setPagination({
//         page: Number(paginationData.page ?? page),
//         limit: Number(paginationData.limit ?? PAGE_SIZE),
//         totalItems: Number(
//           paginationData.totalItems ??
//             paginationData.total ??
//             list.length
//         ),
//         totalPages: Math.max(
//           1,
//           Number(paginationData.totalPages ?? 1)
//         ),
//       });

//       setSelectedIds([]);
//     } catch (err) {
//       setError(getErrorMessage(err));
//       setRecipes([]);
//     } finally {
//       setLoading(false);
//     }
//   }, [page, search]);

//   // Debounce search to avoid sending a request on every keystroke.
//   useEffect(() => {
//     const timeout = setTimeout(() => {
//       void loadRecipes();
//     }, 300);

//     return () => clearTimeout(timeout);
//   }, [loadRecipes]);

//   const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
//     const selectedFile = event.target.files?.[0];

//     setError("");
//     setSuccess("");

//     if (!selectedFile) {
//       setFile(null);
//       return;
//     }

//     const isPdf =
//       selectedFile.type === "application/pdf" ||
//       selectedFile.name.toLowerCase().endsWith(".pdf");

//     if (!isPdf) {
//       setFile(null);
//       event.target.value = "";
//       setError("Only PDF files are allowed.");
//       return;
//     }

//     if (selectedFile.size === 0) {
//       setFile(null);
//       event.target.value = "";
//       setError("The selected PDF is empty.");
//       return;
//     }

//     if (selectedFile.size > MAX_FILE_SIZE) {
//       setFile(null);
//       event.target.value = "";
//       setError("Maximum PDF file size is 15 MB.");
//       return;
//     }

//     setFile(selectedFile);
//   };

//   const handleUpload = async (event: FormEvent<HTMLFormElement>) => {
//     event.preventDefault();

//     setError("");
//     setSuccess("");

//     if (!title.trim()) {
//       setError("Please enter a recipe title.");
//       return;
//     }

//     if (!file) {
//       setError("Please select a PDF file.");
//       return;
//     }

//     const formData = new FormData();
//     formData.append("title", title.trim());
//     formData.append("description", description.trim());
//     formData.append("file", file);

//     setUploading(true);
//     setUploadProgress(0);

//     try {
//       await api.post("/api/admin/recipes", formData, {
//         onUploadProgress: (event) => {
//           if (event.total) {
//             setUploadProgress(
//               Math.round((event.loaded / event.total) * 100)
//             );
//           }
//         },
//       });

//       setTitle("");
//       setDescription("");
//       setFile(null);

//       if (fileInputRef.current) {
//         fileInputRef.current.value = "";
//       }

//       setPage(1);
//       setSuccess("Recipe PDF uploaded successfully.");

//       // Refresh the list after upload.
//       const response = await api.get("/api/admin/recipes", {
//         params: {
//           search: search.trim(),
//           page: 1,
//           limit: PAGE_SIZE,
//         },
//       });

//       const payload = response.data;

//       const list: Recipe[] = Array.isArray(payload.data)
//         ? payload.data
//         : Array.isArray(payload.data?.recipes)
//           ? payload.data.recipes
//           : Array.isArray(payload.recipes)
//             ? payload.recipes
//             : [];

//       const paginationData =
//         payload.pagination ?? payload.data?.pagination ?? {};

//       setRecipes(list);
//       setPagination({
//         page: Number(paginationData.page ?? 1),
//         limit: Number(paginationData.limit ?? PAGE_SIZE),
//         totalItems: Number(
//           paginationData.totalItems ??
//             paginationData.total ??
//             list.length
//         ),
//         totalPages: Math.max(
//           1,
//           Number(paginationData.totalPages ?? 1)
//         ),
//       });

//       setSelectedIds([]);
//     } catch (err) {
//       setError(getErrorMessage(err));
//     } finally {
//       setUploading(false);
//       setUploadProgress(0);
//     }
//   };

//   const toggleSelection = (id: string) => {
//     setSelectedIds((current) =>
//       current.includes(id)
//         ? current.filter((selectedId) => selectedId !== id)
//         : [...current, id]
//     );
//   };

//   const allVisibleSelected =
//     recipes.length > 0 &&
//     recipes.every((recipe) => selectedIds.includes(recipe._id));

//   const toggleSelectAll = () => {
//     if (allVisibleSelected) {
//       setSelectedIds((current) =>
//         current.filter(
//           (id) => !recipes.some((recipe) => recipe._id === id)
//         )
//       );
//     } else {
//       setSelectedIds((current) => [
//         ...new Set([
//           ...current,
//           ...recipes.map((recipe) => recipe._id),
//         ]),
//       ]);
//     }
//   };

//   const handleDelete = async (ids: string[]) => {
//     if (ids.length === 0) {
//       setError("Select at least one recipe to delete.");
//       return;
//     }

//     const confirmed = window.confirm(
//       ids.length === 1
//         ? "Are you sure you want to delete this recipe PDF?"
//         : `Are you sure you want to delete ${ids.length} recipe PDFs?`
//     );

//     if (!confirmed) return;

//     setError("");
//     setSuccess("");
//     setDeleting(true);

//     try {
//       const response = await api.delete("/api/admin/recipes", {
//         data: { ids },
//       });

//       const payload = response.data;
//       const result = payload.data ?? payload;

//       const deletedCount = Number(
//         result.deletedCount ?? ids.length
//       );

//       const failedIds: string[] = result.failedIds ?? [];
//       const notFoundIds: string[] = result.notFoundIds ?? [];
//       const invalidIds: string[] = result.invalidIds ?? [];

//       const failedSet = new Set([
//         ...failedIds,
//         ...notFoundIds,
//         ...invalidIds,
//       ]);

//       setSelectedIds((current) =>
//         current.filter(
//           (id) => !ids.includes(id) || failedSet.has(id)
//         )
//       );

//       if (deletedCount > 0) {
//         setSuccess(
//           `${deletedCount} recipe${deletedCount === 1 ? "" : "s"} deleted successfully.`
//         );
//       }

//       if (failedSet.size > 0) {
//         setError(
//           `${failedSet.size} recipe${failedSet.size === 1 ? "" : "s"} could not be deleted.`
//         );
//       }

//       await loadRecipes();
//     } catch (err) {
//       setError(getErrorMessage(err));
//       await loadRecipes();
//     } finally {
//       setDeleting(false);
//     }
//   };

//   const previewRecipe = (recipe: Recipe) => {
//     window.open(
//       `/api/admin/recipes/${encodeURIComponent(recipe._id)}/file`,
//       "_blank",
//       "noopener,noreferrer"
//     );
//   };

//   const downloadRecipe = (recipe: Recipe) => {
//     const link = document.createElement("a");

//     link.href = `/api/admin/recipes/${encodeURIComponent(recipe._id)}/file?download=1`;
//     link.download = recipe.fileName || `${recipe.title}.pdf`;

//     document.body.appendChild(link);
//     link.click();
//     link.remove();
//   };

//   return (
//     <div className="min-h-screen bg-gray-50 px-4 py-6 text-gray-900 sm:px-6 lg:px-8">
//       <div className="mx-auto max-w-7xl space-y-6">
//         {/* Page heading */}
//         <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
//           <div>
//             <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
//               Baking Recipes
//             </h1>
//             <p className="mt-1 text-sm text-gray-500">
//               Upload, organize, preview, and download recipe PDFs.
//             </p>
//           </div>

//           <div className="rounded-lg border border-gray-200 bg-white px-4 py-3 shadow-sm">
//             <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
//               Total recipes
//             </p>
//             <p className="mt-1 text-2xl font-bold">
//               {pagination.totalItems}
//             </p>
//           </div>
//         </div>

//         {/* Alert messages */}
//         {error && (
//           <div
//             role="alert"
//             className="flex items-start justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
//           >
//             <span>{error}</span>
//             <button
//               type="button"
//               onClick={() => setError("")}
//               className="font-semibold hover:text-red-900"
//               aria-label="Dismiss error"
//             >
//               ✕
//             </button>
//           </div>
//         )}

//         {success && (
//           <div
//             role="status"
//             className="flex items-start justify-between gap-3 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700"
//           >
//             <span>{success}</span>
//             <button
//               type="button"
//               onClick={() => setSuccess("")}
//               className="font-semibold hover:text-green-900"
//               aria-label="Dismiss success message"
//             >
//               ✕
//             </button>
//           </div>
//         )}

//         {/* Upload form */}
//         <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
//           <div className="mb-5">
//             <h2 className="text-lg font-semibold">Add a new recipe</h2>
//             <p className="mt-1 text-sm text-gray-500">
//               Upload a PDF file. Maximum file size: 15 MB.
//             </p>
//           </div>

//           <form onSubmit={handleUpload} className="space-y-5">
//             <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
//               <div>
//                 <label
//                   htmlFor="recipe-title"
//                   className="mb-1.5 block text-sm font-medium text-gray-700"
//                 >
//                   Recipe title <span className="text-red-500">*</span>
//                 </label>
//                 <input
//                   id="recipe-title"
//                   type="text"
//                   value={title}
//                   onChange={(event) => setTitle(event.target.value)}
//                   placeholder="e.g. Chocolate Truffle Cake"
//                   maxLength={150}
//                   required
//                   className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none transition focus:border-pink-500 focus:ring-2 focus:ring-pink-100"
//                 />
//               </div>

//               <div>
//                 <label
//                   htmlFor="recipe-description"
//                   className="mb-1.5 block text-sm font-medium text-gray-700"
//                 >
//                   Description
//                 </label>
//                 <input
//                   id="recipe-description"
//                   type="text"
//                   value={description}
//                   onChange={(event) =>
//                     setDescription(event.target.value)
//                   }
//                   placeholder="Short description (optional)"
//                   maxLength={1000}
//                   className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none transition focus:border-pink-500 focus:ring-2 focus:ring-pink-100"
//                 />
//               </div>
//             </div>

//             <div>
//               <label
//                 htmlFor="recipe-file"
//                 className="mb-1.5 block text-sm font-medium text-gray-700"
//               >
//                 Recipe PDF <span className="text-red-500">*</span>
//               </label>

//               <input
//                 ref={fileInputRef}
//                 id="recipe-file"
//                 type="file"
//                 accept=".pdf,application/pdf"
//                 onChange={handleFileChange}
//                 required
//                 className="block w-full cursor-pointer rounded-lg border border-gray-300 bg-white text-sm text-gray-600 file:mr-4 file:cursor-pointer file:border-0 file:bg-pink-50 file:px-4 file:py-2.5 file:font-medium file:text-pink-700 hover:file:bg-pink-100"
//               />

//               {file && (
//                 <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-lg bg-gray-50 px-3 py-2.5 text-sm">
//                   <div className="min-w-0">
//                     <p className="truncate font-medium text-gray-800">
//                       {file.name}
//                     </p>
//                     <p className="text-xs text-gray-500">
//                       {formatFileSize(file.size)}
//                     </p>
//                   </div>

//                   <button
//                     type="button"
//                     onClick={() => {
//                       setFile(null);
//                       if (fileInputRef.current) {
//                         fileInputRef.current.value = "";
//                       }
//                     }}
//                     className="text-sm font-medium text-red-600 hover:text-red-800"
//                   >
//                     Remove
//                   </button>
//                 </div>
//               )}
//             </div>

//             {uploading && (
//               <div>
//                 <div className="mb-1.5 flex justify-between text-xs text-gray-500">
//                   <span>Uploading PDF...</span>
//                   <span>{uploadProgress}%</span>
//                 </div>
//                 <div
//                   className="h-2 overflow-hidden rounded-full bg-gray-200"
//                   role="progressbar"
//                   aria-valuenow={uploadProgress}
//                   aria-valuemin={0}
//                   aria-valuemax={100}
//                 >
//                   <div
//                     className="h-full rounded-full bg-pink-600 transition-all"
//                     style={{ width: `${uploadProgress}%` }}
//                   />
//                 </div>
//               </div>
//             )}

//             <div className="flex justify-end">
//               <button
//                 type="submit"
//                 disabled={uploading || !file || !title.trim()}
//                 className="inline-flex items-center justify-center gap-2 rounded-lg bg-pink-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-pink-700 disabled:cursor-not-allowed disabled:opacity-50"
//               >
//                 {uploading ? (
//                   <>
//                     <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
//                     Uploading...
//                   </>
//                 ) : (
//                   <>＋ Upload Recipe</>
//                 )}
//               </button>
//             </div>
//           </form>
//         </section>

//         {/* Recipe listing */}
//         <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
//           <div className="flex flex-col gap-4 border-b border-gray-200 p-5 sm:flex-row sm:items-center sm:justify-between">
//             <div>
//               <h2 className="text-lg font-semibold">Recipe library</h2>
//               <p className="mt-1 text-sm text-gray-500">
//                 Search and manage uploaded PDFs.
//               </p>
//             </div>

//             <div className="relative w-full sm:max-w-sm">
//               <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
//                 ⌕
//               </span>
//               <input
//                 type="search"
//                 value={search}
//                 onChange={(event) => {
//                   setSearch(event.target.value);
//                   setPage(1);
//                 }}
//                 placeholder="Search recipes..."
//                 aria-label="Search recipes"
//                 className="w-full rounded-lg border border-gray-300 py-2.5 pl-9 pr-3 text-sm outline-none transition focus:border-pink-500 focus:ring-2 focus:ring-pink-100"
//               />
//             </div>
//           </div>

//           {selectedIds.length > 0 && (
//             <div className="flex flex-col gap-3 border-b border-pink-100 bg-pink-50 px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
//               <p className="text-sm font-medium text-pink-800">
//                 {selectedIds.length} recipe
//                 {selectedIds.length === 1 ? "" : "s"} selected
//               </p>

//               <button
//                 type="button"
//                 disabled={deleting}
//                 onClick={() => void handleDelete(selectedIds)}
//                 className="inline-flex items-center justify-center gap-2 self-start rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50 sm:self-auto"
//               >
//                 {deleting ? "Deleting..." : "Delete selected"}
//               </button>
//             </div>
//           )}

//           <div className="overflow-x-auto">
//             <table className="w-full min-w-[850px] text-left text-sm">
//               <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
//                 <tr>
//                   <th className="w-12 px-5 py-3.5">
//                     <input
//                       type="checkbox"
//                       checked={allVisibleSelected}
//                       onChange={toggleSelectAll}
//                       disabled={recipes.length === 0 || loading}
//                       aria-label="Select all visible recipes"
//                       className="h-4 w-4 rounded border-gray-300 accent-pink-600"
//                     />
//                   </th>
//                   <th className="px-4 py-3.5">Recipe</th>
//                   <th className="px-4 py-3.5">PDF file</th>
//                   <th className="px-4 py-3.5">File size</th>
//                   <th className="px-4 py-3.5">Uploaded on</th>
//                   <th className="px-5 py-3.5 text-right">Actions</th>
//                 </tr>
//               </thead>

//               <tbody className="divide-y divide-gray-100">
//                 {loading ? (
//                   <tr>
//                     <td
//                       colSpan={6}
//                       className="px-5 py-16 text-center text-gray-500"
//                     >
//                       <div className="mx-auto mb-3 h-7 w-7 animate-spin rounded-full border-2 border-pink-600 border-t-transparent" />
//                       Loading recipes...
//                     </td>
//                   </tr>
//                 ) : recipes.length === 0 ? (
//                   <tr>
//                     <td
//                       colSpan={6}
//                       className="px-5 py-16 text-center"
//                     >
//                       <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-pink-50 text-xl text-pink-600">
//                         PDF
//                       </div>
//                       <p className="font-medium text-gray-800">
//                         No recipes found
//                       </p>
//                       <p className="mt-1 text-gray-500">
//                         {search.trim()
//                           ? "Try a different search term."
//                           : "Upload your first recipe PDF above."}
//                       </p>
//                     </td>
//                   </tr>
//                 ) : (
//                   recipes.map((recipe) => (
//                     <tr
//                       key={recipe._id}
//                       className="transition hover:bg-gray-50"
//                     >
//                       <td className="px-5 py-4">
//                         <input
//                           type="checkbox"
//                           checked={selectedIds.includes(recipe._id)}
//                           onChange={() => toggleSelection(recipe._id)}
//                           aria-label={`Select ${recipe.title}`}
//                           className="h-4 w-4 rounded border-gray-300 accent-pink-600"
//                         />
//                       </td>

//                       <td className="max-w-[280px] px-4 py-4">
//                         <p className="truncate font-semibold text-gray-900">
//                           {recipe.title}
//                         </p>
//                         {recipe.description && (
//                           <p className="mt-1 line-clamp-2 text-xs text-gray-500">
//                             {recipe.description}
//                           </p>
//                         )}
//                       </td>

//                       <td className="max-w-[220px] px-4 py-4">
//                         <div className="flex items-center gap-2">
//                           <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-red-50 text-xs font-bold text-red-600">
//                             PDF
//                           </span>
//                           <span
//                             title={recipe.fileName}
//                             className="truncate text-gray-600"
//                           >
//                             {recipe.fileName}
//                           </span>
//                         </div>
//                       </td>

//                       <td className="whitespace-nowrap px-4 py-4 text-gray-600">
//                         {formatFileSize(recipe.fileSize)}
//                       </td>

//                       <td className="whitespace-nowrap px-4 py-4 text-gray-600">
//                         {formatDate(recipe.createdAt)}
//                       </td>

//                       <td className="px-5 py-4">
//                         <div className="flex items-center justify-end gap-2">
//                           <button
//                             type="button"
//                             onClick={() => previewRecipe(recipe)}
//                             title="Preview PDF"
//                             className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 hover:border-pink-300 hover:bg-pink-50 hover:text-pink-700"
//                           >
//                             Preview
//                           </button>

//                           <button
//                             type="button"
//                             onClick={() => downloadRecipe(recipe)}
//                             title="Download PDF"
//                             className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-100"
//                           >
//                             Download
//                           </button>

//                           <button
//                             type="button"
//                             onClick={() => void handleDelete([recipe._id])}
//                             disabled={deleting}
//                             title="Delete recipe"
//                             className="rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
//                           >
//                             Delete
//                           </button>
//                         </div>
//                       </td>
//                     </tr>
//                   ))
//                 )}
//               </tbody>
//             </table>
//           </div>

//           {/* Pagination */}
//           <div className="flex flex-col gap-3 border-t border-gray-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
//             <p className="text-sm text-gray-500">
//               {pagination.totalItems === 0
//                 ? "No recipes"
//                 : `Showing ${(page - 1) * PAGE_SIZE + 1}–${Math.min(
//                     page * PAGE_SIZE,
//                     pagination.totalItems
//                   )} of ${pagination.totalItems} recipes`}
//             </p>

//             <div className="flex items-center gap-2">
//               <button
//                 type="button"
//                 disabled={page <= 1 || loading}
//                 onClick={() => setPage((current) => Math.max(1, current - 1))}
//                 className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
//               >
//                 Previous
//               </button>

//               <span className="min-w-20 text-center text-sm text-gray-600">
//                 Page {page} of {pagination.totalPages}
//               </span>

//               <button
//                 type="button"
//                 disabled={page >= pagination.totalPages || loading}
//                 onClick={() =>
//                   setPage((current) =>
//                     Math.min(pagination.totalPages, current + 1)
//                   )
//                 }
//                 className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
//               >
//                 Next
//               </button>
//             </div>
//           </div>
//         </section>
//       </div>
//     </div>
//   );
// }
