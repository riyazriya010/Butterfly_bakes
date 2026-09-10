"use client";

import axios from "axios";
import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  Check,
  Clock,
  Minus,
  Plus,
  ShoppingBag,
  Sparkles,
  X,
  Tag,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Suspense,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Footer } from "../ui/Footer";

// =========================================================
// TYPES
// =========================================================

type Offer = {
  _id: string;
  title: string;
  discountType: "PERCENTAGE" | "FLAT";
  discountValue: number;
  startDate: string;
  endDate: string;
  offerStatus:
    | "ACTIVE"
    | "UPCOMING"
    | "EXPIRED"
    | "INACTIVE";
  isActive: boolean;
};

type CakeVariant = {
  _id: string;
  cakeId?: string;
  cakeName?: string;
  weight: number;
  price: number;
  available: boolean;
};

type MenuItem = {
  _id: string;
  name: string;
  flavour: string;
  description?: string;
  image?: string;
  available: boolean;
  offer?: Offer | null;
  variants: CakeVariant[];
};

type AvailabilityModal = {
  open: boolean;
  title: string;
  message: string;
};

type AvailabilityReason =
  | "CAKE_NOT_FOUND"
  | "CAKE_UNAVAILABLE"
  | "VARIANT_UNAVAILABLE"
  | "INVALID_CAKE_ID"
  | "INVALID_VARIANT_ID"
  | "VARIANT_ID_REQUIRED"
  | "OFFER_CLOSED"
  | "AVAILABILITY_CHECK_FAILED";

const TIMINGS = [
  "Morning",
  "Evening",
  "Night",
] as const;

type Timing = (typeof TIMINGS)[number];

// =========================================================
// PRICE FORMATTER
// =========================================================

function formatPrice(
  value: number
): string {
  return Number(value || 0).toLocaleString(
    "en-IN",
    {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }
  );
}

// =========================================================
// OFFER HELPERS
// =========================================================

/**
 * Only ACTIVE offers are applied to the current order.
 *
 * UPCOMING:
 * - Can be displayed
 * - But must NOT discount the current order
 *
 * EXPIRED / INACTIVE:
 * - Never applied
 */
function isCurrentlyActiveOffer(
  offer?: Offer | null
): offer is Offer {
  if (!offer) {
    return false;
  }

  if (!offer.isActive) {
    return false;
  }

  if (offer.offerStatus !== "ACTIVE") {
    return false;
  }

  const startDate = new Date(
    offer.startDate
  ).getTime();

  const endDate = new Date(
    offer.endDate
  ).getTime();

  const now = Date.now();

  if (
    !Number.isFinite(startDate) ||
    !Number.isFinite(endDate)
  ) {
    return false;
  }

  return (
    now >= startDate &&
    now <= endDate
  );
}

/**
 * Check whether an offer can be displayed.
 *
 * ACTIVE + UPCOMING are displayable.
 */
function isDisplayableOffer(
  offer?: Offer | null
): offer is Offer {
  if (!offer) {
    return false;
  }

  if (!offer.isActive) {
    return false;
  }

  return (
    offer.offerStatus === "ACTIVE" ||
    offer.offerStatus === "UPCOMING"
  );
}

/**
 * Calculate discount on the COMPLETE SUBTOTAL.
 *
 * Example:
 *
 * Unit price = ₹500
 * Quantity = 2
 * Subtotal = ₹1000
 *
 * 10%:
 * ₹1000 - ₹100 = ₹900
 *
 * ₹200 flat:
 * ₹1000 - ₹200 = ₹800
 */
function calculateOrderPricing(
  unitPrice: number,
  quantity: number,
  offer?: Offer | null
) {
  const safeUnitPrice = Math.max(
    0,
    Number(unitPrice) || 0
  );

  const safeQuantity = Math.max(
    1,
    Number(quantity) || 1
  );

  // =======================================================
  // SUBTOTAL BEFORE OFFER
  // =======================================================

  const subtotal = Number(
    (
      safeUnitPrice *
      safeQuantity
    ).toFixed(2)
  );

  // =======================================================
  // DEFAULT - NO DISCOUNT
  // =======================================================

  if (
    !isCurrentlyActiveOffer(
      offer
    )
  ) {
    return {
      unitPrice: safeUnitPrice,
      quantity: safeQuantity,
      subtotal,
      discountAmount: 0,
      finalTotal: subtotal,
      hasDiscount: false,
    };
  }

  const discountValue = Number(
    offer.discountValue
  );

  if (
    !Number.isFinite(
      discountValue
    ) ||
    discountValue <= 0
  ) {
    return {
      unitPrice: safeUnitPrice,
      quantity: safeQuantity,
      subtotal,
      discountAmount: 0,
      finalTotal: subtotal,
      hasDiscount: false,
    };
  }

  let discountAmount = 0;

  // =======================================================
  // PERCENTAGE DISCOUNT
  // =======================================================

  if (
    offer.discountType ===
    "PERCENTAGE"
  ) {
    const percentage =
      Math.min(
        Math.max(
          discountValue,
          0
        ),
        100
      );

    discountAmount =
      (subtotal * percentage) /
      100;
  }

  // =======================================================
  // FLAT DISCOUNT
  // =======================================================

  if (
    offer.discountType ===
    "FLAT"
  ) {
    discountAmount =
      discountValue;
  }

  // Never discount more than subtotal
  discountAmount = Math.min(
    subtotal,
    discountAmount
  );

  discountAmount = Number(
    discountAmount.toFixed(2)
  );

  const finalTotal = Number(
    Math.max(
      0,
      subtotal -
        discountAmount
    ).toFixed(2)
  );

  return {
    unitPrice: safeUnitPrice,
    quantity: safeQuantity,
    subtotal,
    discountAmount,
    finalTotal,
    hasDiscount:
      discountAmount > 0,
  };
}

// =========================================================
// OFFER TEXT
// =========================================================

function formatOfferText(
  offer?: Offer | null
) {
  if (!offer) {
    return "";
  }

  if (
    offer.discountType ===
    "PERCENTAGE"
  ) {
    return `${offer.discountValue}% OFF`;
  }

  return `₹${formatPrice(
    offer.discountValue
  )} OFF`;
}

// =========================================================
// CAKE DETAILS CONTENT
// =========================================================

function CakeDetailsContent() {
  const router = useRouter();
  const searchParams =
    useSearchParams();

  const cakeId =
    searchParams.get("id");

  const [cake, setCake] =
    useState<MenuItem | null>(
      null
    );

  const [loading, setLoading] =
    useState(true);

  const [
    checkingAvailability,
    setCheckingAvailability,
  ] = useState(false);

  const [
    selectedVariant,
    setSelectedVariant,
  ] =
    useState<CakeVariant | null>(
      null
    );

  const [
    orderQuantity,
    setOrderQuantity,
  ] = useState(1);

  const [orderDate, setOrderDate] =
    useState("");

  const [
    orderTiming,
    setOrderTiming,
  ] = useState("");

  const [
    isOrderModalOpen,
    setIsOrderModalOpen,
  ] = useState(false);

  const [orderError, setOrderError] =
    useState("");

  const [
    availabilityModal,
    setAvailabilityModal,
  ] =
    useState<AvailabilityModal>({
      open: false,
      title: "",
      message: "",
    });

  // =========================================================
  // DATE
  // =========================================================

  const getTodayString = () => {
    const now = new Date();

    return `${now.getFullYear()}-${String(
      now.getMonth() + 1
    ).padStart(2, "0")}-${String(
      now.getDate()
    ).padStart(2, "0")}`;
  };

  const todayString =
    getTodayString();

  const now = new Date();

  const currentHour =
    now.getHours();

  const isToday =
    orderDate === todayString;

  const timingDisabled: Record<
    Timing,
    boolean
  > = {
    Morning:
      isToday &&
      currentHour >= 12,

    Evening:
      isToday &&
      currentHour >= 18,

    Night:
      isToday &&
      currentHour >= 23,
  };

  // =========================================================
  // FETCH CAKE
  // =========================================================

  useEffect(() => {
    if (!cakeId) {
      setLoading(false);

      setAvailabilityModal({
        open: true,
        title: "Cake Not Found",
        message:
          "No cake was selected. Please go back to the menu and choose a cake.",
      });

      return;
    }

    const fetchCake = async () => {
      try {
        setLoading(true);

        const response =
          await axios.get(
            `/api/menu/details/${cakeId}`
          );

        console.log(
          "menu details response |",
          response
        );

        const result =
          response.data.data;

        if (!result?.cake) {
          throw new Error(
            "CAKE_NOT_FOUND"
          );
        }

        const variants: CakeVariant[] =
          Array.isArray(
            result.cake.variant
          )
            ? result.cake.variant
            : [];

        const fetchedCake: MenuItem =
          {
            ...result.cake.cake,
            offer:
              result.cake.cake
                ?.offer ?? null,
            variants,
          };

        console.log(
          "cake variants |",
          variants
        );

        console.log(
          "fetchedCake |",
          fetchedCake
        );

        setCake(
          fetchedCake
        );

        // =====================================================
        // DEFAULT VARIANT
        // =====================================================

        const smallestAvailableVariant =
          [...variants]
            .filter(
              (variant) =>
                fetchedCake.available &&
                variant.available
            )
            .sort(
              (a, b) =>
                a.weight - b.weight
            )[0];

        setSelectedVariant(
          smallestAvailableVariant ||
            null
        );
      } catch (error: any) {
        const status =
          error.response?.status;

        if (status === 404) {
          setAvailabilityModal({
            open: true,
            title:
              "Cake Not Found",
            message:
              "This cake no longer exists. Please go back to the menu.",
          });
        } else {
          setAvailabilityModal({
            open: true,
            title:
              "Unable to Load Cake",
            message:
              "We couldn't load this cake right now. Please try again.",
          });
        }
      } finally {
        setLoading(false);
      }
    };

    fetchCake();
  }, [cakeId]);

  // =========================================================
  // AVAILABLE VARIANTS
  // =========================================================

  const availableVariants =
    useMemo(() => {
      if (
        !cake ||
        !cake.available
      ) {
        return [];
      }

      return [...cake.variants]
        .filter(
          (variant) =>
            variant.available
        )
        .sort(
          (a, b) =>
            a.weight - b.weight
        );
    }, [cake]);

  // =========================================================
  // CURRENT OFFER
  // =========================================================

  const currentOffer =
    useMemo(() => {
      if (!cake?.offer) {
        return null;
      }

      return isDisplayableOffer(
        cake.offer
      )
        ? cake.offer
        : null;
    }, [cake]);

  // =========================================================
  // ACTIVE OFFER
  // =========================================================

  const activeOffer =
    useMemo(() => {
      if (!cake?.offer) {
        return null;
      }

      return isCurrentlyActiveOffer(
        cake.offer
      )
        ? cake.offer
        : null;
    }, [cake]);

  // =========================================================
  // SELECTED VARIANT
  // =========================================================

  const originalUnitPrice =
    selectedVariant
      ? Number(
          selectedVariant.price
        )
      : 0;

  // =========================================================
  // ORDER PRICING
  //
  // IMPORTANT:
  // Offer is applied ONCE to the total subtotal.
  // =========================================================

  const orderPricing =
    useMemo(() => {
      return calculateOrderPricing(
        originalUnitPrice,
        orderQuantity,
        activeOffer
      );
    }, [
      originalUnitPrice,
      orderQuantity,
      activeOffer,
    ]);

  const subtotal =
    orderPricing.subtotal;

  const discountAmount =
    orderPricing.discountAmount;

  const totalPrice =
    orderPricing.finalTotal;

  // =========================================================
  // VARIANT SELECTION
  // =========================================================

  const handleSelectVariant = (
    variant: CakeVariant
  ) => {
    if (
      !cake?.available ||
      !variant.available
    ) {
      return;
    }

    setSelectedVariant(
      variant
    );

    setOrderQuantity(1);

    setOrderError("");
  };

  // =========================================================
  // QUANTITY
  // =========================================================

  const decreaseQuantity = () => {
    setOrderQuantity(
      (current) =>
        Math.max(
          1,
          current - 1
        )
    );
  };

  const increaseQuantity = () => {
    setOrderQuantity(
      (current) =>
        Math.min(
          10,
          current + 1
        )
    );
  };

  // =========================================================
  // DATE
  // =========================================================

  const handleDateChange = (
    date: string
  ) => {
    setOrderDate(date);
    setOrderTiming("");
    setOrderError("");
  };

  // =========================================================
  // MODALS
  // =========================================================

  const closeAvailabilityModal =
    () => {
      setAvailabilityModal({
        open: false,
        title: "",
        message: "",
      });
    };

  const closeOrderModal = () => {
    if (checkingAvailability) {
      return;
    }

    setIsOrderModalOpen(false);
    setOrderError("");
  };

  // =========================================================
  // AVAILABILITY HELPERS
  // =========================================================

  const markCakeUnavailable =
    () => {
      setCake(
        (currentCake) => {
          if (!currentCake) {
            return currentCake;
          }

          return {
            ...currentCake,
            available: false,
          };
        }
      );

      setSelectedVariant(null);
    };

  const markVariantUnavailable =
    (
      variantId: string
    ) => {
      setCake(
        (currentCake) => {
          if (!currentCake) {
            return currentCake;
          }

          return {
            ...currentCake,
            variants:
              currentCake.variants.map(
                (variant) =>
                  variant._id ===
                  variantId
                    ? {
                        ...variant,
                        available:
                          false,
                      }
                    : variant
              ),
          };
        }
      );

      setSelectedVariant(
        (currentVariant) =>
          currentVariant?._id ===
          variantId
            ? null
            : currentVariant
      );
    };


    // =========================================================
// REMOVE CLOSED OFFER
// =========================================================

const removeClosedOffer = () => {
  setCake((currentCake) => {
    if (!currentCake) {
      return currentCake;
    }

    return {
      ...currentCake,
      offer: null,
    };
  });
};

  // =========================================================
  // AVAILABILITY ERROR
  // =========================================================

  const handleAvailabilityError =
    (
      error: any,
      source:
        | "open-modal"
        | "final-order"
    ) => {
      const status =
        error.response?.status;

      const responseData =
        error.response?.data;

      const reason =
        responseData?.reason as
          | AvailabilityReason
          | undefined;

      const apiError =
        responseData?.error;

      // =====================================================
      // CAKE NOT FOUND
      // =====================================================

      if (
        status === 404 ||
        reason ===
          "CAKE_NOT_FOUND"
      ) {
        if (
          source ===
          "final-order"
        ) {
          setOrderError(
            "This cake or selected size no longer exists. Please refresh the menu."
          );
        } else {
          setAvailabilityModal({
            open: true,
            title:
              "Cake No Longer Available",
            message:
              "This cake or selected size no longer exists. Please refresh the menu.",
          });
        }

        return;
      }

      // =====================================================
      // CAKE UNAVAILABLE
      // =====================================================

      if (
        status === 409 &&
        reason ===
          "CAKE_UNAVAILABLE"
      ) {
        markCakeUnavailable();

        if (
          source ===
          "final-order"
        ) {
          setOrderError(
            "This cake is currently unavailable. Please choose another cake."
          );
        } else {
          setAvailabilityModal({
            open: true,
            title:
              "Cake Not Available",
            message:
              "This cake is currently unavailable. Please choose another cake.",
          });
        }

        return;
      }

      // =====================================================
      // VARIANT UNAVAILABLE
      // =====================================================

      if (
        status === 409 &&
        reason ===
          "VARIANT_UNAVAILABLE"
      ) {
        const unavailableVariantId =
          selectedVariant?._id;

        if (
          unavailableVariantId
        ) {
          markVariantUnavailable(
            unavailableVariantId
          );
        }

        const weight =
          selectedVariant?.weight;

        const message = weight
          ? `The ${weight} Kg size is currently unavailable. Please select another size.`
          : "The selected cake size is currently unavailable. Please select another size.";

        if (
          source ===
          "final-order"
        ) {
          setOrderError(
            message
          );
        } else {
          setAvailabilityModal({
            open: true,
            title:
              "Size Not Available",
            message,
          });
        }

        return;
      }


      // =====================================================
// OFFER CLOSED
// =====================================================

if (
  status === 400 &&
  reason === "OFFER_CLOSED"
) {
  // Remove the expired/closed offer from the UI
  removeClosedOffer();

  if (source === "final-order") {
    // Order modal is still open.
    // Show the updated price without the offer.
    setOrderError(
      "This offer is no longer available. The price has been updated without the offer."
    );
  } else {
    // Opening the order modal failed because the offer
    // is no longer available.
    setAvailabilityModal({
      open: true,
      title: "Offer No Longer Available",
      message:
        "This offer is no longer available. The price has been updated without the offer.",
    });
  }

  return;
}


      // =====================================================
      // FALLBACK
      // =====================================================

      const fallbackMessage =
        apiError ||
        "We couldn't verify availability right now. Please try again.";

      if (
        source ===
        "final-order"
      ) {
        setOrderError(
          fallbackMessage
        );
      } else {
        setAvailabilityModal({
          open: true,
          title:
            "Unable to Check Availability",
          message:
            fallbackMessage,
        });
      }
    };

  // =========================================================
  // OPEN ORDER MODAL
  // =========================================================

  const handleOpenOrderModal =
    async (isOffer: boolean) => {
      if (checkingAvailability) {
        return;
      }

      if (!cake) {
        return;
      }

      if (!cake.available) {
        setAvailabilityModal({
          open: true,
          title:
            "Cake Not Available",
          message:
            "This cake is currently unavailable. Please choose another cake.",
        });

        return;
      }

      if (!selectedVariant) {
        setAvailabilityModal({
          open: true,
          title:
            "Select Cake Size",
          message:
            "Please select an available cake size before proceeding.",
        });

        return;
      }

      if (
        !selectedVariant.available
      ) {
        setAvailabilityModal({
          open: true,
          title:
            "Size Not Available",
          message:
            "The selected cake size is currently unavailable. Please choose another size.",
        });

        return;
      }

      try {
        setCheckingAvailability(
          true
        );

        const response =
          await axios.get(
            `/api/menu/${cake._id}?variantId=${selectedVariant._id}&isOffer=${isOffer}`
          );

        const result =
          response.data;

        if (
          !result?.success ||
          !result?.available
        ) {
          throw new Error(
            "Availability check failed"
          );
        }

        const latestCake =
          result?.data?.cake;

        const latestVariant =
          result?.data?.variant;

        // ===================================================
        // CAKE UNAVAILABLE
        // ===================================================

        if (
          !latestCake?.available
        ) {
          markCakeUnavailable();

          setAvailabilityModal({
            open: true,
            title:
              "Cake Not Available",
            message:
              "This cake is currently unavailable. Please choose another cake.",
          });

          return;
        }

        // ===================================================
        // VARIANT UNAVAILABLE
        // ===================================================

        if (
          !latestVariant?.available
        ) {
          markVariantUnavailable(
            selectedVariant._id
          );

          setAvailabilityModal({
            open: true,
            title:
              "Size Not Available",
            message:
              "The selected cake size is currently unavailable. Please choose another size.",
          });

          return;
        }

        // ===================================================
        // UPDATE LATEST DB DATA
        // ===================================================

        setCake(
          (currentCake) => {
            if (!currentCake) {
              return currentCake;
            }

            return {
              ...currentCake,
              ...latestCake,
              variants:
                currentCake.variants.map(
                  (variant) =>
                    variant._id ===
                    latestVariant._id
                      ? latestVariant
                      : variant
                ),
            };
          }
        );

        setSelectedVariant(
          latestVariant
        );

        setOrderError("");

        setIsOrderModalOpen(
          true
        );
      } catch (error: any) {
        handleAvailabilityError(
          error,
          "open-modal"
        );
      } finally {
        setCheckingAvailability(
          false
        );
      }
    };

  // =========================================================
  // FINAL ORDER
  // =========================================================

  const handleFinalOrder =
    async (isOffer: boolean) => {
      if (checkingAvailability) {
        return;
      }

      if (
        !cake ||
        !selectedVariant
      ) {
        setOrderError(
          "Please select an available cake size."
        );

        return;
      }

      if (!orderDate) {
        setOrderError(
          "Please select the required date."
        );

        return;
      }

      if (!orderTiming) {
        setOrderError(
          "Please select your preferred timing."
        );

        return;
      }

      // =====================================================
      // TIMING VALIDATION
      // =====================================================

      if (
        isToday &&
        timingDisabled[
          orderTiming as Timing
        ]
      ) {
        setOrderError(
          `${orderTiming} timing is no longer available for today. Please choose another timing.`
        );

        setOrderTiming("");

        return;
      }

      try {
        setCheckingAvailability(
          true
        );

        setOrderError("");

        // ===================================================
        // SECOND AVAILABILITY CHECK
        // ===================================================

        const response =
          await axios.get(
            `/api/menu/${cake._id}?variantId=${selectedVariant._id}&isOffer=${isOffer}`
          );

        console.log(
          "cake availability response |",
          response
        );

        const result =
          response.data;

        if (
          !result?.success ||
          !result?.available
        ) {
          throw new Error(
            "Availability check failed"
          );
        }

        const latestCake =
          result?.data?.cake;

        const latestVariant =
          result?.data?.variant;

        // ===================================================
        // CAKE UNAVAILABLE
        // ===================================================

        if (
          !latestCake?.available
        ) {
          markCakeUnavailable();

          setOrderError(
            "This cake is currently unavailable. Please choose another cake."
          );

          return;
        }

        // ===================================================
        // VARIANT UNAVAILABLE
        // ===================================================

        if (
          !latestVariant?.available
        ) {
          markVariantUnavailable(
            selectedVariant._id
          );

          setOrderError(
            `The ${selectedVariant.weight} Kg size is currently unavailable. Please select another size.`
          );

          return;
        }

        // ===================================================
        // UPDATE LATEST CAKE + VARIANT
        // ===================================================

        setCake(
          (currentCake) => {
            if (!currentCake) {
              return currentCake;
            }

            return {
              ...currentCake,
              ...latestCake,
              variants:
                currentCake.variants.map(
                  (variant) =>
                    variant._id ===
                    latestVariant._id
                      ? latestVariant
                      : variant
                ),
            };
          }
        );

        setSelectedVariant(
          latestVariant
        );

        // ===================================================
        // LATEST PRICE
        // ===================================================

        const latestOriginalPrice =
          Number(
            latestVariant.price
          );

        if (
          !Number.isFinite(
            latestOriginalPrice
          ) ||
          latestOriginalPrice < 0
        ) {
          setOrderError(
            "The latest cake price is invalid. Please refresh the menu and try again."
          );

          return;
        }

        // ===================================================
        // LATEST OFFER
        // ===================================================

        const latestOffer =
          isCurrentlyActiveOffer(
            latestCake.offer
          )
            ? latestCake.offer
            : null;

        // ===================================================
        // FINAL ORDER PRICING
        //
        // IMPORTANT:
        // Discount is applied ONCE to subtotal.
        //
        // Example:
        // ₹500 × 2 = ₹1000
        //
        // 10% = ₹100 discount
        // Final = ₹900
        //
        // Flat ₹200
        // Final = ₹800
        // ===================================================

        const latestPricing =
          calculateOrderPricing(
            latestOriginalPrice,
            orderQuantity,
            latestOffer
          );

        const latestSubtotal =
          latestPricing.subtotal;

        const latestDiscountAmount =
          latestPricing.discountAmount;

        const latestFinalTotal =
          latestPricing.finalTotal;

        // ===================================================
        // ORDER DATE
        // ===================================================

        const date = new Date(
          `${orderDate}T00:00:00`
        );

        if (
          Number.isNaN(
            date.getTime()
          )
        ) {
          setOrderError(
            "Invalid order date. Please select the date again."
          );

          return;
        }

        // ===================================================
        // FORMAT DATE
        // ===================================================

        const formattedDate =
          date
            .toLocaleDateString(
              "en-GB",
              {
                day: "2-digit",
                month: "short",
                year: "numeric",
              }
            )
            .toUpperCase()
            .replace(
              / /g,
              "-"
            );

        // ===================================================
        // WEEKDAY
        // ===================================================

        const weekday =
          date
            .toLocaleDateString(
              "en-US",
              {
                weekday: "long",
              }
            )
            .toUpperCase();

        // ===================================================
        // FINAL QUANTITY
        // ===================================================

        const finalQuantity =
          orderQuantity;

        // ===================================================
        // OFFER MESSAGE
        // ===================================================

        const offerMessage =
          latestOffer &&
          latestDiscountAmount >
            0
            ? `\n*Offer:* ${latestOffer.title}\n*Discount:* ${formatOfferText(
                latestOffer
              )}\n*Subtotal:* ₹${formatPrice(
                latestSubtotal
              )}\n*Offer Discount:* ₹${formatPrice(
                latestDiscountAmount
              )}`
            : `\n*Subtotal:* ₹${formatPrice(
                latestSubtotal
              )}`;

        // ===================================================
        // WHATSAPP MESSAGE
        // ===================================================

        const message = `Hi Butterfly Bakes,

I would like to place an order for:

*Cake:* ${latestCake.name}
*Flavour:* ${latestCake.flavour}
*Weight:* ${latestVariant.weight} Kg
*Quantity:* ${finalQuantity}${offerMessage}

*Final Total:* ₹${formatPrice(
          latestFinalTotal
        )}

*Cake Required On:* ${formattedDate} (${weekday})
*Preferred Time:* ${orderTiming}

Please confirm the order details.`;

        // ===================================================
        // WHATSAPP
        // ===================================================

        const whatsappLink =
          `https://wa.me/918301036420?text=${encodeURIComponent(
            message
          )}`;

        window.open(
          whatsappLink,
          "_blank",
          "noopener,noreferrer"
        );

        setIsOrderModalOpen(
          false
        );

        setOrderError("");
      } catch (error: any) {
        handleAvailabilityError(
          error,
          "final-order"
        );
      } finally {
        setCheckingAvailability(
          false
        );
      }
    };

  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {
    return (
      <main className="min-h-screen bg-amber-50/40 dark:bg-stone-950 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="mx-auto w-10 h-10 border-4 border-pink-200 border-t-pink-600 rounded-full animate-spin" />

          <p className="mt-4 text-sm font-medium text-stone-600 dark:text-stone-400">
            Fetching cake details...
          </p>
        </div>
      </main>
    );
  }

  // =========================================================
  // CAKE NOT FOUND
  // =========================================================

  if (!cake) {
    return (
      <main className="min-h-screen bg-amber-50/40 dark:bg-stone-950 flex items-center justify-center px-4">
        <div className="w-full max-w-sm text-center">
          <div className="mx-auto w-14 h-14 rounded-full bg-pink-100 dark:bg-pink-900/40 flex items-center justify-center text-pink-600 dark:text-pink-300">
            <AlertCircle className="w-7 h-7" />
          </div>

          <h1 className="mt-5 text-2xl font-serif font-bold text-stone-900 dark:text-stone-50">
            Cake Not Found
          </h1>

          <p className="mt-2 text-sm text-stone-600 dark:text-stone-300">
            The cake you are looking for could not be found.
          </p>

          <button
            type="button"
            onClick={() =>
              router.push(
                "/menu"
              )
            }
            className="mt-6 px-6 py-3 rounded-full bg-pink-600 hover:bg-pink-700 text-white text-sm font-semibold transition-colors shadow-sm"
          >
            Back to Menu
          </button>
        </div>
      </main>
    );
  }

  // =========================================================
  // MAIN UI
  // =========================================================

  return (
    <div className="min-h-screen bg-amber-50/40 dark:bg-stone-950 text-stone-800 dark:text-stone-100">
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 md:py-12">

        {/* BACK */}

        <button
          type="button"
          onClick={() =>
            router.push(
              "/menu"
            )
          }
          className="inline-flex items-center gap-2 text-sm font-medium text-stone-500 hover:text-pink-600 dark:hover:text-pink-400 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Menu
        </button>

        <div className="mt-8 grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8 lg:gap-12 items-start">

          {/* =================================================
              LEFT
          ================================================= */}

          <section className="min-w-0">

            {/* FLAVOUR */}

            <span className="inline-flex items-center gap-2 bg-pink-100 dark:bg-pink-900/40 text-pink-700 dark:text-pink-300 border border-pink-200 dark:border-pink-800 px-3.5 py-1.5 rounded-full text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              {cake.flavour}
            </span>

            {/* NAME */}

            <h1 className="mt-4 text-3xl sm:text-5xl font-serif font-bold text-stone-900 dark:text-stone-50 tracking-tight leading-tight">
              {cake.name}
            </h1>

            {/* AVAILABILITY */}

            <div className="mt-3">
              <span
                className={`inline-flex items-center gap-1.5 text-xs font-medium ${
                  cake.available
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-rose-600 dark:text-rose-400"
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    cake.available
                      ? "bg-emerald-500"
                      : "bg-rose-500"
                  }`}
                />

                {cake.available
                  ? "Freshly Baked & Available"
                  : "Currently Unavailable"}
              </span>
            </div>

            {/* =================================================
                OFFER BANNER
            ================================================= */}

            {currentOffer && (
              <div
                className={`mt-6 flex items-start gap-3 rounded-2xl border p-4 ${
                  currentOffer.offerStatus ===
                  "ACTIVE"
                    ? "border-pink-200 bg-pink-50 dark:border-pink-900/60 dark:bg-pink-950/20"
                    : "border-amber-200 bg-amber-50 dark:border-amber-900/50 dark:bg-amber-950/20"
                }`}
              >
                <div
                  className={`w-9 h-9 shrink-0 rounded-xl text-white flex items-center justify-center ${
                    currentOffer.offerStatus ===
                    "ACTIVE"
                      ? "bg-pink-600"
                      : "bg-amber-500"
                  }`}
                >
                  <Tag className="w-4 h-4" />
                </div>

                <div className="min-w-0">
                  <p
                    className={`text-sm font-bold ${
                      currentOffer.offerStatus ===
                      "ACTIVE"
                        ? "text-pink-700 dark:text-pink-300"
                        : "text-amber-700 dark:text-amber-300"
                    }`}
                  >
                    {currentOffer.title}
                  </p>

                  <p
                    className={`mt-0.5 text-xs ${
                      currentOffer.offerStatus ===
                      "ACTIVE"
                        ? "text-pink-600 dark:text-pink-400"
                        : "text-amber-600 dark:text-amber-400"
                    }`}
                  >
                    {formatOfferText(
                      currentOffer
                    )}

                    {currentOffer.offerStatus ===
                    "ACTIVE"
                      ? " on this cake"
                      : " — upcoming offer"}
                  </p>
                </div>
              </div>
            )}

            {/* DESCRIPTION */}

            <div className="mt-8">
              <h2 className="text-xs font-bold uppercase tracking-widest text-stone-400">
                Description
              </h2>

              <p className="mt-2 text-sm sm:text-base leading-relaxed text-stone-600 dark:text-stone-300">
                {cake.description ||
                  "A delicious homemade cake prepared with carefully selected ingredients."}
              </p>
            </div>

            <hr className="my-8 border-stone-200 dark:border-stone-800" />

            {/* =================================================
                SIZE SELECTION
            ================================================= */}

            <div>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-serif font-bold text-stone-900 dark:text-stone-50">
                    1. Choose Weight / Size
                  </h3>

                  <p className="text-xs text-stone-500 dark:text-stone-400">
                    Select your preferred cake size.
                  </p>
                </div>

                <span className="text-xs font-medium text-stone-400">
                  {
                    availableVariants.length
                  }{" "}
                  options available
                </span>
              </div>

              <div className="mt-4 flex flex-wrap gap-3">

                {[...cake.variants]
                  .sort(
                    (a, b) =>
                      a.weight -
                      b.weight
                  )
                  .map(
                    (variant) => {
                      const isAvailable =
                        cake.available &&
                        variant.available;

                      const isSelected =
                        selectedVariant?._id ===
                        variant._id;

                      const originalPrice =
                        Number(
                          variant.price
                        );

                      return (
                        <button
                          key={
                            variant._id
                          }
                          type="button"
                          disabled={
                            !isAvailable
                          }
                          onClick={() =>
                            handleSelectVariant(
                              variant
                            )
                          }
                          className={`min-w-[145px] px-5 py-3 rounded-2xl border text-sm font-medium transition-all flex items-center justify-between gap-3 ${
                            !isAvailable
                              ? "border-stone-200 dark:border-stone-800 bg-stone-100 dark:bg-stone-900 text-stone-400 cursor-not-allowed opacity-50"
                              : isSelected
                              ? "bg-pink-600 border-pink-600 text-white shadow-md shadow-pink-600/20"
                              : "bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800 text-stone-700 dark:text-stone-200 hover:border-pink-300 dark:hover:border-pink-800"
                          }`}
                        >
                          <div className="text-left">
                            <div>
                              {variant.weight}{" "}
                              Kg
                            </div>

                            {/* ONLY ORIGINAL UNIT PRICE */}
                            <div
                              className={`mt-1 text-sm font-bold ${
                                isSelected
                                  ? "text-white"
                                  : "text-stone-800 dark:text-stone-200"
                              }`}
                            >
                              ₹
                              {formatPrice(
                                originalPrice
                              )}
                            </div>
                          </div>

                          {isSelected && (
                            <Check className="w-4 h-4 shrink-0" />
                          )}
                        </button>
                      );
                    }
                  )}
              </div>

              {/* OFFER NOTE */}

              {activeOffer && (
                <div className="mt-4 flex items-center gap-2 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                  <Tag className="w-3.5 h-3.5" />
                  {formatOfferText(
                    activeOffer
                  )}{" "}
                  applies to your total order amount.
                </div>
              )}
            </div>
          </section>

          {/* =================================================
              RIGHT - ORDER SUMMARY
          ================================================= */}

          <section className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-6 shadow-sm sticky top-6">

            <h3 className="text-lg font-serif font-bold text-stone-900 dark:text-stone-50 mb-4">
              Order Summary
            </h3>

            {/* PRICE */}

            <div className="p-4 rounded-2xl bg-amber-50/60 dark:bg-stone-950/50 border border-amber-100 dark:border-stone-800">

              <div className="flex items-center justify-between">

                <div>
                  <p className="text-xs font-medium text-stone-500">
                    Unit Price
                  </p>

                  <p className="text-sm font-semibold text-stone-800 dark:text-stone-200">
                    {selectedVariant
                      ? `${selectedVariant.weight} Kg`
                      : "Select Size"}
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-2xl font-bold text-pink-600 dark:text-pink-400">
                    ₹
                    {formatPrice(
                      originalUnitPrice
                    )}
                  </p>
                </div>
              </div>

              {/* QUANTITY SUBTOTAL */}

              {selectedVariant && (
                <div className="mt-3 pt-3 border-t border-amber-200 dark:border-stone-800">

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-stone-500 dark:text-stone-400">
                      {formatPrice(
                        originalUnitPrice
                      )}{" "}
                      ×{" "}
                      {
                        orderQuantity
                      }
                    </span>

                    <span className="font-semibold text-stone-700 dark:text-stone-200">
                      ₹
                      {formatPrice(
                        subtotal
                      )}
                    </span>
                  </div>

                </div>
              )}

              {/* OFFER */}

              {activeOffer &&
                discountAmount >
                  0 && (
                  <div className="mt-3 pt-3 border-t border-amber-200 dark:border-stone-800">

                    <div className="flex items-center justify-between">

                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                        <Tag className="w-3.5 h-3.5" />

                        {formatOfferText(
                          activeOffer
                        )}
                      </span>

                      <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                        - ₹
                        {formatPrice(
                          discountAmount
                        )}
                      </span>

                    </div>

                  </div>
                )}

            </div>

            {/* QUANTITY */}

            <div className="mt-6">

              <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-2">
                2. Select Quantity
              </label>

              <div className="flex items-center justify-between h-12 rounded-2xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-950 px-2">

                <button
                  type="button"
                  onClick={
                    decreaseQuantity
                  }
                  disabled={
                    !selectedVariant ||
                    checkingAvailability
                  }
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-stone-600 dark:text-stone-300 hover:bg-white dark:hover:bg-stone-800 disabled:opacity-40 transition-colors"
                >
                  <Minus className="w-4 h-4" />
                </button>

                <span className="text-base font-bold text-stone-800 dark:text-stone-100">
                  {
                    orderQuantity
                  }
                </span>

                <button
                  type="button"
                  onClick={
                    increaseQuantity
                  }
                  disabled={
                    !selectedVariant ||
                    checkingAvailability
                  }
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-stone-600 dark:text-stone-300 hover:bg-white dark:hover:bg-stone-800 disabled:opacity-40 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>

              </div>
            </div>

            <hr className="my-6 border-stone-100 dark:border-stone-800" />

            {/* =================================================
                TOTAL
            ================================================= */}

            <div className="mb-6">

              {activeOffer &&
                discountAmount >
                  0 && (
                  <div className="flex items-center justify-between mb-2">

                    <span className="text-sm text-stone-500 dark:text-stone-400">
                      Subtotal
                    </span>

                    <span className="text-sm text-stone-500 dark:text-stone-400 line-through">
                      ₹
                      {formatPrice(
                        subtotal
                      )}
                    </span>

                  </div>
                )}

              <div className="flex items-center justify-between">

                <span className="text-sm font-medium text-stone-500 dark:text-stone-400">
                  Total Amount
                </span>

                <span className="text-3xl font-bold text-stone-900 dark:text-stone-50">
                  ₹
                  {formatPrice(
                    totalPrice
                  )}
                </span>

              </div>

              {activeOffer &&
                discountAmount >
                  0 && (
                  <p className="mt-1 text-right text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                    {formatOfferText(
                      activeOffer
                    )}{" "}
                    applied to total
                  </p>
                )}

            </div>

            {/* PROCEED */}

            <button
              type="button"
              disabled={
                !selectedVariant ||
                !cake.available ||
                checkingAvailability
              }
              onClick={
                () => handleOpenOrderModal(activeOffer ? true : false)
                // handleOpenOrderModal
              }
              className="w-full h-12 rounded-full bg-pink-600 hover:bg-pink-700 text-white text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md shadow-pink-600/20 active:scale-[0.98]"
            >
              <ShoppingBag className="w-4 h-4" />

              {checkingAvailability
                ? "Checking Availability..."
                : "Proceed to Order Details"}
            </button>

            <p className="mt-3 text-center text-xs text-stone-400 leading-normal">
              Availability and latest pricing will be verified before proceeding.
            </p>

          </section>
        </div>
      </main>

      {/* =====================================================
          ORDER DETAILS MODAL
      ===================================================== */}

      {isOrderModalOpen && (
        <div className="fixed inset-0 z-[100] bg-stone-950/60 backdrop-blur-sm flex items-center justify-center p-4">

          <div className="relative w-full max-w-md bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 p-6 shadow-2xl">

            {/* CLOSE */}

            <button
              type="button"
              onClick={
                closeOrderModal
              }
              disabled={
                checkingAvailability
              }
              className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center hover:bg-stone-100 dark:hover:bg-stone-800 disabled:opacity-40 transition-colors"
            >
              <X className="w-4 h-4 text-stone-500" />
            </button>

            {/* HEADER */}

            <div className="flex items-center gap-2 text-pink-600 dark:text-pink-400 mb-1">
              <Calendar className="w-5 h-5" />

              <h3 className="font-serif font-bold text-xl text-stone-900 dark:text-stone-50">
                Select Pickup Date & Time
              </h3>
            </div>

            <p className="text-xs text-stone-500 dark:text-stone-400 mb-6">
              Please choose when you need your fresh cake ready.
            </p>

            {/* =================================================
                ORDER BRIEF
            ================================================= */}

            <div className="p-3.5 rounded-2xl bg-amber-50/60 dark:bg-stone-950/50 border border-amber-100 dark:border-stone-800 mb-6">

              <div className="flex items-center justify-between text-xs">

                <div>
                  <p className="font-semibold text-stone-800 dark:text-stone-200">
                    {cake.name}
                  </p>

                  <p className="text-stone-500">
                    {
                      selectedVariant?.weight
                    }{" "}
                    Kg ×{" "}
                    {
                      orderQuantity
                    }
                  </p>
                </div>

                <div className="text-right">

                  {activeOffer &&
                  discountAmount >
                    0 ? (
                    <>
                      <p className="text-[10px] text-stone-400 line-through">
                        ₹
                        {formatPrice(
                          subtotal
                        )}
                      </p>

                      <p className="font-bold text-pink-600 text-sm">
                        ₹
                        {formatPrice(
                          totalPrice
                        )}
                      </p>
                    </>
                  ) : (
                    <p className="font-bold text-pink-600 text-sm">
                      ₹
                      {formatPrice(
                        totalPrice
                      )}
                    </p>
                  )}

                </div>

              </div>

              {/* OFFER DETAILS */}

              {activeOffer &&
                discountAmount >
                  0 && (
                  <div className="mt-3 pt-3 border-t border-amber-200 dark:border-stone-800">

                    <div className="flex items-center justify-between">

                      <span className="inline-flex items-center gap-1.5 text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                        <Tag className="w-3 h-3" />

                        {activeOffer.title}
                      </span>

                      <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                        {formatOfferText(
                          activeOffer
                        )}
                      </span>

                    </div>

                    <div className="mt-1 flex items-center justify-between">

                      <span className="text-[11px] text-stone-500">
                        Discount
                      </span>

                      <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                        ₹
                        {formatPrice(
                          discountAmount
                        )}
                      </span>

                    </div>

                  </div>
                )}

            </div>

            {/* ERROR */}

            {orderError && (
              <div className="mb-5 flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 dark:border-rose-900/50 dark:bg-rose-950/30">

                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-rose-600 dark:text-rose-400" />

                <p className="text-xs leading-relaxed text-rose-700 dark:text-rose-300">
                  {
                    orderError
                  }
                </p>

              </div>
            )}

            {/* DATE */}

            <div className="mb-5">

              <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-2">
                Required Date
              </label>

              <input
                type="date"
                value={
                  orderDate
                }
                min={
                  todayString
                }
                disabled={
                  checkingAvailability
                }
                onChange={(e) =>
                  handleDateChange(
                    e.target.value
                  )
                }
                className="w-full h-11 px-4 rounded-2xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-950 text-sm text-stone-800 dark:text-stone-200 outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-500/10 disabled:opacity-50"
              />

            </div>

            {/* TIMING */}

            <div className="mb-6">

              <div className="flex items-center justify-between mb-2">

                <label className="text-xs font-bold uppercase tracking-wider text-stone-500">
                  Preferred Timing
                </label>

                <Clock className="w-3.5 h-3.5 text-stone-400" />

              </div>

              <div className="grid grid-cols-3 gap-2">

                {TIMINGS.map(
                  (timing) => {
                    const disabled =
                      !orderDate ||
                      timingDisabled[
                        timing
                      ] ||
                      checkingAvailability;

                    const selected =
                      orderTiming ===
                      timing;

                    return (
                      <button
                        key={
                          timing
                        }
                        type="button"
                        disabled={
                          disabled
                        }
                        onClick={() => {
                          setOrderTiming(
                            timing
                          );

                          setOrderError(
                            ""
                          );
                        }}
                        className={`h-11 rounded-2xl border text-xs font-semibold transition-all ${
                          disabled
                            ? "bg-stone-100 dark:bg-stone-800 text-stone-400 border-stone-200 dark:border-stone-800 cursor-not-allowed opacity-50"
                            : selected
                            ? "bg-pink-600 border-pink-600 text-white shadow-sm"
                            : "bg-stone-50 dark:bg-stone-950 border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:border-pink-300"
                        }`}
                      >
                        {selected && (
                          <Check className="inline w-3 h-3 mr-1" />
                        )}

                        {timing}
                      </button>
                    );
                  }
                )}

              </div>

              {!orderDate && (
                <p className="mt-2 text-[11px] text-stone-400">
                  Select a date first to choose your preferred timing.
                </p>
              )}

            </div>

            {/* SUBMIT */}

            <button
              type="button"
              disabled={
                checkingAvailability ||
                !selectedVariant ||
                !orderDate ||
                !orderTiming
              }
              onClick={
                () => handleFinalOrder(activeOffer ? true : false)
                // handleFinalOrder
              }
              className="w-full h-12 rounded-full bg-pink-600 hover:bg-pink-700 text-white text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md shadow-pink-600/20 active:scale-[0.98]"
            >
              <ShoppingBag className="w-4 h-4" />

              {checkingAvailability
                ? "Checking Availability..."
                : "Confirm & Send to WhatsApp"}
            </button>

            {!checkingAvailability && (
              <p className="mt-3 text-center text-[11px] text-stone-400">
                Availability, latest price and offer will be verified before opening WhatsApp.
              </p>
            )}

          </div>
        </div>
      )}

      {/* =====================================================
          GENERAL AVAILABILITY MODAL
      ===================================================== */}

      {availabilityModal.open && (
        <div className="fixed inset-0 z-[110] bg-stone-950/60 backdrop-blur-sm flex items-center justify-center p-4">

          <div className="relative w-full max-w-sm bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 p-6 shadow-2xl text-center">

            <div className="mx-auto w-12 h-12 rounded-full bg-pink-100 dark:bg-pink-900/40 flex items-center justify-center text-pink-600 dark:text-pink-300">
              <AlertCircle className="w-6 h-6" />
            </div>

            <h3 className="mt-4 font-serif font-bold text-lg text-stone-900 dark:text-stone-50">
              {
                availabilityModal.title
              }
            </h3>

            <p className="mt-2 text-sm text-stone-500 dark:text-stone-400 leading-relaxed">
              {
                availabilityModal.message
              }
            </p>

            <button
              type="button"
              onClick={() => {
                closeAvailabilityModal();

                router.push(
                  "/menu"
                );
              }}
              className="w-full mt-5 h-11 rounded-full bg-pink-600 hover:bg-pink-700 text-white text-sm font-semibold transition-colors"
            >
              Back to Menu
            </button>

            <button
              type="button"
              onClick={
                closeAvailabilityModal
              }
              className="mt-3 text-xs font-medium text-stone-500 hover:text-stone-800 dark:hover:text-stone-300"
            >
              Close
            </button>

          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}

// =========================================================
// SUSPENSE WRAPPER
// =========================================================

export default function CakeDetails() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-amber-50/40 dark:bg-stone-950 flex items-center justify-center px-4">
          <div className="text-center">

            <div className="mx-auto w-10 h-10 border-4 border-pink-200 border-t-pink-600 rounded-full animate-spin" />

            <p className="mt-4 text-sm font-medium text-stone-600 dark:text-stone-400">
              Loading cake details...
            </p>

          </div>
        </main>
      }
    >
      <CakeDetailsContent />
    </Suspense>
  );
}








// "use client";

// import axios from "axios";
// import {
//   AlertCircle,
//   ArrowLeft,
//   Calendar,
//   Check,
//   Clock,
//   Minus,
//   Plus,
//   ShoppingBag,
//   Sparkles,
//   X,
// } from "lucide-react";
// import { useRouter, useSearchParams } from "next/navigation";
// import {
//   Suspense,
//   useEffect,
//   useMemo,
//   useState,
// } from "react";
// import { Footer } from "../ui/Footer";

// type CakeVariant = {
//   _id: string;
//   cakeId?: string;
//   cakeName?: string;
//   weight: number;
//   price: number;
//   available: boolean;
// };

// type MenuItem = {
//   _id: string;
//   name: string;
//   flavour: string;
//   description?: string;
//   image?: string;
//   available: boolean;
//   variants: CakeVariant[];
// };

// type AvailabilityModal = {
//   open: boolean;
//   title: string;
//   message: string;
// };

// type AvailabilityReason =
//   | "CAKE_NOT_FOUND"
//   | "CAKE_UNAVAILABLE"
//   | "VARIANT_UNAVAILABLE"
//   | "INVALID_CAKE_ID"
//   | "INVALID_VARIANT_ID"
//   | "VARIANT_ID_REQUIRED"
//   | "AVAILABILITY_CHECK_FAILED";

// const TIMINGS = ["Morning", "Evening", "Night"] as const;

// type Timing = (typeof TIMINGS)[number];

// /* =========================================================
//    CAKE DETAILS CONTENT
//    =========================================================
   
//    This component contains useSearchParams().
//    It is rendered inside Suspense by the wrapper below.
// ========================================================= */

// function CakeDetailsContent() {
//   const router = useRouter();
//   const searchParams = useSearchParams();

//   const cakeId = searchParams.get("id");

//   const [cake, setCake] = useState<MenuItem | null>(null);
//   const [loading, setLoading] = useState(true);

//   const [checkingAvailability, setCheckingAvailability] =
//     useState(false);

//   const [selectedVariant, setSelectedVariant] =
//     useState<CakeVariant | null>(null);

//   const [orderQuantity, setOrderQuantity] = useState(1);
//   const [orderDate, setOrderDate] = useState("");
//   const [orderTiming, setOrderTiming] = useState("");

//   const [isOrderModalOpen, setIsOrderModalOpen] =
//     useState(false);

//   const [orderError, setOrderError] = useState("");

//   const [availabilityModal, setAvailabilityModal] =
//     useState<AvailabilityModal>({
//       open: false,
//       title: "",
//       message: "",
//     });

//   /* =========================================================
//      Date
//   ========================================================= */

//   const getTodayString = () => {
//     const now = new Date();

//     return `${now.getFullYear()}-${String(
//       now.getMonth() + 1
//     ).padStart(2, "0")}-${String(now.getDate()).padStart(
//       2,
//       "0"
//     )}`;
//   };

//   const todayString = getTodayString();

//   const now = new Date();
//   const currentHour = now.getHours();

//   const isToday = orderDate === todayString;

//   /*
//    * Timing rules:
//    *
//    * Morning  -> available before 12 PM
//    * Evening  -> available before 6 PM
//    * Night    -> available before 11 PM
//    *
//    * For future dates all timings are available.
//    */

//   const timingDisabled: Record<Timing, boolean> = {
//     Morning: isToday && currentHour >= 12,
//     Evening: isToday && currentHour >= 18,
//     Night: isToday && currentHour >= 23,
//   };

//   /* =========================================================
//      Fetch Cake
//   ========================================================= */

//   useEffect(() => {
//     if (!cakeId) {
//       setLoading(false);

//       setAvailabilityModal({
//         open: true,
//         title: "Cake Not Found",
//         message:
//           "No cake was selected. Please go back to the menu and choose a cake.",
//       });

//       return;
//     }

//     const fetchCake = async () => {
//       try {
//         setLoading(true);

//         const response = await axios.get(
//           `/api/menu/details/${cakeId}`
//         );

//         const result = response.data.data.cake;

//         if (!result?.cake) {
//           throw new Error("CAKE_NOT_FOUND");
//         }

//         const variants: CakeVariant[] = Array.isArray(
//           result.variant
//         )
//           ? result.variant
//           : [];

//         const fetchedCake: MenuItem = {
//           ...result.cake,
//           variants,
//         };

//         setCake(fetchedCake);

//         /*
//          * Select smallest available variant by default.
//          */

//         const smallestAvailableVariant = [...variants]
//           .filter(
//             (variant) =>
//               fetchedCake.available && variant.available
//           )
//           .sort((a, b) => a.weight - b.weight)[0];

//         setSelectedVariant(
//           smallestAvailableVariant || null
//         );
//       } catch (error: any) {
//         const status = error.response?.status;

//         if (status === 404) {
//           setAvailabilityModal({
//             open: true,
//             title: "Cake Not Found",
//             message:
//               "This cake no longer exists. Please go back to the menu.",
//           });
//         } else {
//           setAvailabilityModal({
//             open: true,
//             title: "Unable to Load Cake",
//             message:
//               "We couldn't load this cake right now. Please try again.",
//           });
//         }
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchCake();
//   }, [cakeId]);

//   /* =========================================================
//      Calculated Values
//   ========================================================= */

//   const availableVariants = useMemo(() => {
//     if (!cake || !cake.available) return [];

//     return [...cake.variants]
//       .filter((variant) => variant.available)
//       .sort((a, b) => a.weight - b.weight);
//   }, [cake]);

//   const totalPrice = selectedVariant
//     ? Number(selectedVariant.price) * orderQuantity
//     : 0;

//   /* =========================================================
//      Variant Selection
//   ========================================================= */

//   const handleSelectVariant = (
//     variant: CakeVariant
//   ) => {
//     if (!cake?.available || !variant.available) {
//       return;
//     }

//     setSelectedVariant(variant);
//     setOrderQuantity(1);
//     setOrderError("");
//   };

//   /* =========================================================
//      Quantity
//   ========================================================= */

//   const decreaseQuantity = () => {
//     setOrderQuantity((current) =>
//       Math.max(1, current - 1)
//     );
//   };

//   const increaseQuantity = () => {
//     setOrderQuantity((current) =>
//       Math.min(10, current + 1)
//     );
//   };

//   /* =========================================================
//      Date
//   ========================================================= */

//   const handleDateChange = (date: string) => {
//     setOrderDate(date);
//     setOrderTiming("");
//     setOrderError("");
//   };

//   /* =========================================================
//      Modal
//   ========================================================= */

//   const closeAvailabilityModal = () => {
//     setAvailabilityModal({
//       open: false,
//       title: "",
//       message: "",
//     });
//   };

//   const closeOrderModal = () => {
//     if (checkingAvailability) {
//       return;
//     }

//     setIsOrderModalOpen(false);
//     setOrderError("");
//   };

//   /* =========================================================
//      Availability State Helpers
//   ========================================================= */

//   const markCakeUnavailable = () => {
//     setCake((currentCake) => {
//       if (!currentCake) return currentCake;

//       return {
//         ...currentCake,
//         available: false,
//       };
//     });

//     setSelectedVariant(null);
//   };

//   const markVariantUnavailable = (
//     variantId: string
//   ) => {
//     setCake((currentCake) => {
//       if (!currentCake) return currentCake;

//       return {
//         ...currentCake,
//         variants: currentCake.variants.map(
//           (variant) =>
//             variant._id === variantId
//               ? {
//                   ...variant,
//                   available: false,
//                 }
//               : variant
//         ),
//       };
//     });

//     setSelectedVariant((currentVariant) =>
//       currentVariant?._id === variantId
//         ? null
//         : currentVariant
//     );
//   };

//   /* =========================================================
//      Handle Availability Error
//   ========================================================= */

//   const handleAvailabilityError = (
//     error: any,
//     source: "open-modal" | "final-order"
//   ) => {
//     const status = error.response?.status;
//     const responseData = error.response?.data;

//     const reason =
//       responseData?.reason as
//         | AvailabilityReason
//         | undefined;

//     const apiError = responseData?.error;

//     /*
//      * Cake no longer exists
//      */

//     if (
//       status === 404 ||
//       reason === "CAKE_NOT_FOUND"
//     ) {
//       if (source === "final-order") {
//         setOrderError(
//           "This cake or selected size no longer exists. Please refresh the menu."
//         );
//       } else {
//         setAvailabilityModal({
//           open: true,
//           title: "Cake No Longer Available",
//           message:
//             "This cake or selected size no longer exists. Please refresh the menu.",
//         });
//       }

//       return;
//     }

//     /*
//      * Cake unavailable
//      */

//     if (
//       status === 409 &&
//       reason === "CAKE_UNAVAILABLE"
//     ) {
//       markCakeUnavailable();

//       if (source === "final-order") {
//         setOrderError(
//           "This cake is currently unavailable. Please choose another cake."
//         );
//       } else {
//         setAvailabilityModal({
//           open: true,
//           title: "Cake Not Available",
//           message:
//             "This cake is currently unavailable. Please choose another cake.",
//         });
//       }

//       return;
//     }

//     /*
//      * Variant unavailable
//      */

//     if (
//       status === 409 &&
//       reason === "VARIANT_UNAVAILABLE"
//     ) {
//       const unavailableVariantId =
//         selectedVariant?._id;

//       if (unavailableVariantId) {
//         markVariantUnavailable(
//           unavailableVariantId
//         );
//       }

//       const weight =
//         selectedVariant?.weight;

//       const message = weight
//         ? `The ${weight} Kg size is currently unavailable. Please select another size.`
//         : "The selected cake size is currently unavailable. Please select another size.";

//       if (source === "final-order") {
//         setOrderError(message);
//       } else {
//         setAvailabilityModal({
//           open: true,
//           title: "Size Not Available",
//           message,
//         });
//       }

//       return;
//     }

//     /*
//      * Fallback
//      */

//     const fallbackMessage =
//       apiError ||
//       "We couldn't verify availability right now. Please try again.";

//     if (source === "final-order") {
//       setOrderError(fallbackMessage);
//     } else {
//       setAvailabilityModal({
//         open: true,
//         title: "Unable to Check Availability",
//         message: fallbackMessage,
//       });
//     }
//   };

//   /* =========================================================
//      Open Order Modal
//   ========================================================= */

//   const handleOpenOrderModal = async () => {
//     if (checkingAvailability) {
//       return;
//     }

//     if (!cake) {
//       return;
//     }

//     if (!cake.available) {
//       setAvailabilityModal({
//         open: true,
//         title: "Cake Not Available",
//         message:
//           "This cake is currently unavailable. Please choose another cake.",
//       });

//       return;
//     }

//     if (!selectedVariant) {
//       setAvailabilityModal({
//         open: true,
//         title: "Select Cake Size",
//         message:
//           "Please select an available cake size before proceeding.",
//       });

//       return;
//     }

//     if (!selectedVariant.available) {
//       setAvailabilityModal({
//         open: true,
//         title: "Size Not Available",
//         message:
//           "The selected cake size is currently unavailable. Please choose another size.",
//       });

//       return;
//     }

//     try {
//       setCheckingAvailability(true);

//       /*
//        * Frontend data may be stale.
//        * Always verify directly against DB
//        * before opening the order modal.
//        */

//       const response = await axios.get(
//         `/api/menu/${cake._id}?variantId=${selectedVariant._id}`
//       );

//       const result = response.data;

//       if (
//         !result?.success ||
//         !result?.available
//       ) {
//         throw new Error(
//           "Availability check failed"
//         );
//       }

//       const latestCake =
//         result?.data?.cake;

//       const latestVariant =
//         result?.data?.variant;

//       /*
//        * Cake unavailable
//        */

//       if (!latestCake?.available) {
//         markCakeUnavailable();

//         setAvailabilityModal({
//           open: true,
//           title: "Cake Not Available",
//           message:
//             "This cake is currently unavailable. Please choose another cake.",
//         });

//         return;
//       }

//       /*
//        * Variant unavailable
//        */

//       if (!latestVariant?.available) {
//         markVariantUnavailable(
//           selectedVariant._id
//         );

//         setAvailabilityModal({
//           open: true,
//           title: "Size Not Available",
//           message:
//             "The selected cake size is currently unavailable. Please choose another size.",
//         });

//         return;
//       }

//       /*
//        * Keep latest DB data.
//        * This ensures latest price is used.
//        */

//       setCake((currentCake) => {
//         if (!currentCake) {
//           return currentCake;
//         }

//         return {
//           ...currentCake,
//           ...latestCake,
//           variants:
//             currentCake.variants.map(
//               (variant) =>
//                 variant._id ===
//                 latestVariant._id
//                   ? latestVariant
//                   : variant
//             ),
//         };
//       });

//       setSelectedVariant(latestVariant);
//       // setOrderQuantity(1);
//       setOrderError("");
//       setIsOrderModalOpen(true);
//     } catch (error: any) {
//       handleAvailabilityError(
//         error,
//         "open-modal"
//       );
//     } finally {
//       setCheckingAvailability(false);
//     }
//   };

//   /* =========================================================
//      Final Order
//   ========================================================= */

//   const handleFinalOrder = async () => {
//     if (checkingAvailability) {
//       return;
//     }

//     if (!cake || !selectedVariant) {
//       setOrderError(
//         "Please select an available cake size."
//       );

//       return;
//     }

//     if (!orderDate) {
//       setOrderError(
//         "Please select the required date."
//       );

//       return;
//     }

//     if (!orderTiming) {
//       setOrderError(
//         "Please select your preferred timing."
//       );

//       return;
//     }

//     /*
//      * Frontend timing validation
//      */

//     if (
//       isToday &&
//       timingDisabled[orderTiming as Timing]
//     ) {
//       setOrderError(
//         `${orderTiming} timing is no longer available for today. Please choose another timing.`
//       );

//       setOrderTiming("");

//       return;
//     }

//     try {
//       setCheckingAvailability(true);
//       setOrderError("");

//       /*
//        * SECOND availability check.
//        *
//        * The cake could become unavailable while
//        * the user is filling date/time.
//        */

//       const response = await axios.get(
//         `/api/menu/${cake._id}?variantId=${selectedVariant._id}`
//       );

//       const result = response.data;

//       if (
//         !result?.success ||
//         !result?.available
//       ) {
//         throw new Error(
//           "Availability check failed"
//         );
//       }

//       const latestCake =
//         result?.data?.cake;

//       const latestVariant =
//         result?.data?.variant;

//       /*
//        * Cake unavailable
//        */

//       if (!latestCake?.available) {
//         markCakeUnavailable();

//         setOrderError(
//           "This cake is currently unavailable. Please choose another cake."
//         );

//         return;
//       }

//       /*
//        * Variant unavailable
//        */

//       if (!latestVariant?.available) {
//         markVariantUnavailable(
//           selectedVariant._id
//         );

//         setOrderError(
//           `The ${selectedVariant.weight} Kg size is currently unavailable. Please select another size.`
//         );

//         return;
//       }

//       /*
//        * Use latest verified data.
//        */

//       setCake((currentCake) => {
//         if (!currentCake) {
//           return currentCake;
//         }

//         return {
//           ...currentCake,
//           ...latestCake,
//           variants:
//             currentCake.variants.map(
//               (variant) =>
//                 variant._id ===
//                 latestVariant._id
//                   ? latestVariant
//                   : variant
//             ),
//         };
//       });

//       setSelectedVariant(latestVariant);

//       /*
//        * Latest price from DB
//        */

//       const latestPrice =
//         Number(latestVariant.price);

//       /*
//        * Validate latest price
//        */

//       if (
//         !Number.isFinite(latestPrice) ||
//         latestPrice < 0
//       ) {
//         setOrderError(
//           "The latest cake price is invalid. Please refresh the menu and try again."
//         );

//         return;
//       }

//       /*
//        * Create order date
//        */

//       const date = new Date(
//         `${orderDate}T00:00:00`
//       );

//       if (Number.isNaN(date.getTime())) {
//         setOrderError(
//           "Invalid order date. Please select the date again."
//         );

//         return;
//       }

//       /*
//        * Format date
//        */

//       const formattedDate = date
//         .toLocaleDateString("en-GB", {
//           day: "2-digit",
//           month: "short",
//           year: "numeric",
//         })
//         .toUpperCase()
//         .replace(/ /g, "-");

//       /*
//        * Weekday
//        */

//       const weekday = date
//         .toLocaleDateString("en-US", {
//           weekday: "long",
//         })
//         .toUpperCase();

//       /*
//        * Capture final values
//        */

//       const finalQuantity =
//         orderQuantity;

//       const finalTotal =
//         latestPrice * finalQuantity;

//       /*
//        * WhatsApp message
//        */

//       const message = `Hi Butterfly Bakes,

// I would like to place an order for:

// *Cake:* ${latestCake.name}
// *Flavour:* ${latestCake.flavour}
// *Weight:* ${latestVariant.weight} Kg
// *Quantity:* ${finalQuantity}
// *Price:* ₹${latestPrice}
// *Total:* ₹${finalTotal}

// *Cake Required On:* ${formattedDate} (${weekday})
// *Preferred Time:* ${orderTiming}

// Please confirm the order details.`;

//       const whatsappLink =
//         `https://wa.me/918301036420?text=${encodeURIComponent(
//           message
//         )}`;

//       /*
//        * Open WhatsApp ONLY after
//        * successful DB availability check.
//        */

//       window.open(
//         whatsappLink,
//         "_blank",
//         "noopener,noreferrer"
//       );

//       setIsOrderModalOpen(false);
//       setOrderError("");
//     } catch (error: any) {
//       handleAvailabilityError(
//         error,
//         "final-order"
//       );
//     } finally {
//       setCheckingAvailability(false);
//     }
//   };

//   /* =========================================================
//      Loading
//   ========================================================= */

//   if (loading) {
//     return (
//       <main className="min-h-screen bg-amber-50/40 dark:bg-stone-950 flex items-center justify-center px-4">
//         <div className="text-center">
//           <div className="mx-auto w-10 h-10 border-4 border-pink-200 border-t-pink-600 rounded-full animate-spin" />

//           <p className="mt-4 text-sm font-medium text-stone-600 dark:text-stone-400">
//             Fetching cake details...
//           </p>
//         </div>
//       </main>
//     );
//   }

//   /* =========================================================
//      Cake Not Found
//   ========================================================= */

//   if (!cake) {
//     return (
//       <main className="min-h-screen bg-amber-50/40 dark:bg-stone-950 flex items-center justify-center px-4">
//         <div className="w-full max-w-sm text-center">
//           <div className="mx-auto w-14 h-14 rounded-full bg-pink-100 dark:bg-pink-900/40 flex items-center justify-center text-pink-600 dark:text-pink-300">
//             <AlertCircle className="w-7 h-7" />
//           </div>

//           <h1 className="mt-5 text-2xl font-serif font-bold text-stone-900 dark:text-stone-50">
//             Cake Not Found
//           </h1>

//           <p className="mt-2 text-sm text-stone-600 dark:text-stone-300">
//             The cake you are looking for could not
//             be found.
//           </p>

//           <button
//             type="button"
//             onClick={() =>
//               router.push("/menu")
//             }
//             className="mt-6 px-6 py-3 rounded-full bg-pink-600 hover:bg-pink-700 text-white text-sm font-semibold transition-colors shadow-sm"
//           >
//             Back to Menu
//           </button>
//         </div>
//       </main>
//     );
//   }

//   /* =========================================================
//      Main UI
//   ========================================================= */

//   return (
//     <div className="min-h-screen bg-amber-50/40 dark:bg-stone-950 text-stone-800 dark:text-stone-100">
//       <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 md:py-12">

//         {/* Back */}

//         <button
//           type="button"
//           onClick={() =>
//             router.push("/menu")
//           }
//           className="inline-flex items-center gap-2 text-sm font-medium text-stone-500 hover:text-pink-600 dark:hover:text-pink-400 transition-colors"
//         >
//           <ArrowLeft className="w-4 h-4" />
//           Back to Menu
//         </button>

//         <div className="mt-8 grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8 lg:gap-12 items-start">

//           {/* =================================================
//               LEFT
//               ================================================= */}

//           <section className="min-w-0">

//             <span className="inline-flex items-center gap-2 bg-pink-100 dark:bg-pink-900/40 text-pink-700 dark:text-pink-300 border border-pink-200 dark:border-pink-800 px-3.5 py-1.5 rounded-full text-xs font-semibold">
//               <Sparkles className="w-3.5 h-3.5" />
//               {cake.flavour}
//             </span>

//             <h1 className="mt-4 text-3xl sm:text-5xl font-serif font-bold text-stone-900 dark:text-stone-50 tracking-tight leading-tight">
//               {cake.name}
//             </h1>

//             <div className="mt-3">
//               <span
//                 className={`inline-flex items-center gap-1.5 text-xs font-medium ${
//                   cake.available
//                     ? "text-emerald-600 dark:text-emerald-400"
//                     : "text-rose-600 dark:text-rose-400"
//                 }`}
//               >
//                 <span
//                   className={`w-2 h-2 rounded-full ${
//                     cake.available
//                       ? "bg-emerald-500"
//                       : "bg-rose-500"
//                   }`}
//                 />

//                 {cake.available
//                   ? "Freshly Baked & Available"
//                   : "Currently Unavailable"}
//               </span>
//             </div>

//             {/* Description */}

//             <div className="mt-8">
//               <h2 className="text-xs font-bold uppercase tracking-widest text-stone-400">
//                 Description
//               </h2>

//               <p className="mt-2 text-sm sm:text-base leading-relaxed text-stone-600 dark:text-stone-300">
//                 {cake.description ||
//                   "A delicious homemade cake prepared with carefully selected ingredients."}
//               </p>
//             </div>

//             <hr className="my-8 border-stone-200 dark:border-stone-800" />

//             {/* =================================================
//                 Size Selection
//                 ================================================= */}

//             <div>
//               <div className="flex items-center justify-between">
//                 <div>
//                   <h3 className="text-lg font-serif font-bold text-stone-900 dark:text-stone-50">
//                     1. Choose Weight / Size
//                   </h3>

//                   <p className="text-xs text-stone-500 dark:text-stone-400">
//                     Select your preferred cake size.
//                   </p>
//                 </div>

//                 <span className="text-xs font-medium text-stone-400">
//                   {availableVariants.length} options available
//                 </span>
//               </div>

//               <div className="mt-4 flex flex-wrap gap-3">
//                 {[...cake.variants]
//                   .sort(
//                     (a, b) =>
//                       a.weight - b.weight
//                   )
//                   .map((variant) => {
//                     const isAvailable =
//                       cake.available &&
//                       variant.available;

//                     const isSelected =
//                       selectedVariant?._id ===
//                       variant._id;

//                     return (
//                       <button
//                         key={variant._id}
//                         type="button"
//                         disabled={!isAvailable}
//                         onClick={() =>
//                           handleSelectVariant(
//                             variant
//                           )
//                         }
//                         className={`min-w-[110px] px-5 py-3 rounded-2xl border text-sm font-medium transition-all flex items-center justify-between gap-2 ${
//                           !isAvailable
//                             ? "border-stone-200 dark:border-stone-800 bg-stone-100 dark:bg-stone-900 text-stone-400 cursor-not-allowed opacity-50"
//                             : isSelected
//                             ? "bg-pink-600 border-pink-600 text-white shadow-md shadow-pink-600/20"
//                             : "bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800 text-stone-700 dark:text-stone-200 hover:border-pink-300 dark:hover:border-pink-800"
//                         }`}
//                       >
//                         <span>
//                           {variant.weight} Kg
//                         </span>

//                         {isSelected && (
//                           <Check className="w-4 h-4" />
//                         )}
//                       </button>
//                     );
//                   })}
//               </div>
//             </div>
//           </section>

//           {/* =================================================
//               RIGHT - Order Summary
//               ================================================= */}

//           <section className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-6 shadow-sm sticky top-6">

//             <h3 className="text-lg font-serif font-bold text-stone-900 dark:text-stone-50 mb-4">
//               Order Summary
//             </h3>

//             {/* Price */}

//             <div className="flex items-baseline justify-between p-4 rounded-2xl bg-amber-50/60 dark:bg-stone-950/50 border border-amber-100 dark:border-stone-800">
//               <div>
//                 <p className="text-xs font-medium text-stone-500">
//                   Unit Price
//                 </p>

//                 <p className="text-sm font-semibold text-stone-800 dark:text-stone-200">
//                   {selectedVariant
//                     ? `${selectedVariant.weight} Kg`
//                     : "Select Size"}
//                 </p>
//               </div>

//               <p className="text-2xl font-bold text-pink-600 dark:text-pink-400">
//                 ₹{selectedVariant?.price || 0}
//               </p>
//             </div>

//             {/* Quantity */}

//             <div className="mt-6">
//               <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-2">
//                 2. Select Quantity
//               </label>

//               <div className="flex items-center justify-between h-12 rounded-2xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-950 px-2">

//                 <button
//                   type="button"
//                   onClick={
//                     decreaseQuantity
//                   }
//                   disabled={
//                     !selectedVariant ||
//                     checkingAvailability
//                   }
//                   className="w-9 h-9 rounded-xl flex items-center justify-center text-stone-600 dark:text-stone-300 hover:bg-white dark:hover:bg-stone-800 disabled:opacity-40 transition-colors"
//                 >
//                   <Minus className="w-4 h-4" />
//                 </button>

//                 <span className="text-base font-bold text-stone-800 dark:text-stone-100">
//                   {orderQuantity}
//                 </span>

//                 <button
//                   type="button"
//                   onClick={
//                     increaseQuantity
//                   }
//                   disabled={
//                     !selectedVariant ||
//                     checkingAvailability
//                   }
//                   className="w-9 h-9 rounded-xl flex items-center justify-center text-stone-600 dark:text-stone-300 hover:bg-white dark:hover:bg-stone-800 disabled:opacity-40 transition-colors"
//                 >
//                   <Plus className="w-4 h-4" />
//                 </button>
//               </div>
//             </div>

//             <hr className="my-6 border-stone-100 dark:border-stone-800" />

//             {/* Total */}

//             <div className="flex items-center justify-between mb-6">
//               <span className="text-sm font-medium text-stone-500 dark:text-stone-400">
//                 Total Amount
//               </span>

//               <span className="text-3xl font-bold text-stone-900 dark:text-stone-50">
//                 ₹{totalPrice}
//               </span>
//             </div>

//             {/* Proceed */}

//             <button
//               type="button"
//               disabled={
//                 !selectedVariant ||
//                 !cake.available ||
//                 checkingAvailability
//               }
//               onClick={
//                 handleOpenOrderModal
//               }
//               className="w-full h-12 rounded-full bg-pink-600 hover:bg-pink-700 text-white text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md shadow-pink-600/20 active:scale-[0.98]"
//             >
//               <ShoppingBag className="w-4 h-4" />

//               {checkingAvailability
//                 ? "Checking Availability..."
//                 : "Proceed to Order Details"}
//             </button>

//             <p className="mt-3 text-center text-xs text-stone-400 leading-normal">
//               Availability will be verified before
//               proceeding.
//             </p>
//           </section>
//         </div>
//       </main>

//       {/* =====================================================
//           ORDER DETAILS MODAL
//           ===================================================== */}

//       {isOrderModalOpen && (
//         <div className="fixed inset-0 z-[100] bg-stone-950/60 backdrop-blur-sm flex items-center justify-center p-4">

//           <div className="relative w-full max-w-md bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 p-6 shadow-2xl">

//             {/* Close */}

//             <button
//               type="button"
//               onClick={
//                 closeOrderModal
//               }
              
//               disabled={
//                 checkingAvailability
//               }
//               className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center hover:bg-stone-100 dark:hover:bg-stone-800 disabled:opacity-40 transition-colors"
//             >
//               <X className="w-4 h-4 text-stone-500" />
//             </button>

//             {/* Header */}

//             <div className="flex items-center gap-2 text-pink-600 dark:text-pink-400 mb-1">
//               <Calendar className="w-5 h-5" />

//               <h3 className="font-serif font-bold text-xl text-stone-900 dark:text-stone-50">
//                 Select Pickup Date & Time
//               </h3>
//             </div>

//             <p className="text-xs text-stone-500 dark:text-stone-400 mb-6">
//               Please choose when you need your fresh cake ready.
//             </p>

//             {/* Order Brief */}

//             <div className="p-3.5 rounded-2xl bg-amber-50/60 dark:bg-stone-950/50 border border-amber-100 dark:border-stone-800 mb-6 flex items-center justify-between text-xs">

//               <div>
//                 <p className="font-semibold text-stone-800 dark:text-stone-200">
//                   {cake.name}
//                 </p>

//                 <p className="text-stone-500">
//                   {selectedVariant?.weight} Kg ×{" "}
//                   {orderQuantity}
//                 </p>
//               </div>

//               <p className="font-bold text-pink-600 text-sm">
//                 ₹
//                 {selectedVariant
//                   ? Number(
//                       selectedVariant.price
//                     ) * orderQuantity
//                   : 0}
//               </p>
//             </div>

//             {/* Availability Error */}

//             {orderError && (
//               <div className="mb-5 flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 dark:border-rose-900/50 dark:bg-rose-950/30">

//                 <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-rose-600 dark:text-rose-400" />

//                 <p className="text-xs leading-relaxed text-rose-700 dark:text-rose-300">
//                   {orderError}
//                 </p>
//               </div>
//             )}

//             {/* Date */}

//             <div className="mb-5">
//               <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-2">
//                 Required Date
//               </label>

//               <input
//                 type="date"
//                 value={orderDate}
//                 min={todayString}
//                 disabled={
//                   checkingAvailability
//                 }
//                 onChange={(e) =>
//                   handleDateChange(
//                     e.target.value
//                   )
//                 }
//                 className="w-full h-11 px-4 rounded-2xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-950 text-sm text-stone-800 dark:text-stone-200 outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-500/10 disabled:opacity-50"
//               />
//             </div>

//             {/* Timing */}

//             <div className="mb-6">

//               <div className="flex items-center justify-between mb-2">

//                 <label className="text-xs font-bold uppercase tracking-wider text-stone-500">
//                   Preferred Timing
//                 </label>

//                 <Clock className="w-3.5 h-3.5 text-stone-400" />
//               </div>

//               <div className="grid grid-cols-3 gap-2">

//                 {TIMINGS.map(
//                   (timing) => {
//                     const disabled =
//                       !orderDate ||
//                       timingDisabled[
//                         timing
//                       ] ||
//                       checkingAvailability;

//                     const selected =
//                       orderTiming ===
//                       timing;

//                     return (
//                       <button
//                         key={timing}
//                         type="button"
//                         disabled={
//                           disabled
//                         }
//                         onClick={() => {
//                           setOrderTiming(
//                             timing
//                           );
//                           setOrderError(
//                             ""
//                           );
//                         }}
//                         className={`h-11 rounded-2xl border text-xs font-semibold transition-all ${
//                           disabled
//                             ? "bg-stone-100 dark:bg-stone-800 text-stone-400 border-stone-200 dark:border-stone-800 cursor-not-allowed opacity-50"
//                             : selected
//                             ? "bg-pink-600 border-pink-600 text-white shadow-sm"
//                             : "bg-stone-50 dark:bg-stone-950 border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:border-pink-300"
//                         }`}
//                       >
//                         {selected && (
//                           <Check className="inline w-3 h-3 mr-1" />
//                         )}

//                         {timing}
//                       </button>
//                     );
//                   }
//                 )}
//               </div>

//               {!orderDate && (
//                 <p className="mt-2 text-[11px] text-stone-400">
//                   Select a date first to choose your preferred timing.
//                 </p>
//               )}
//             </div>

//             {/* Submit */}

//             <button
//               type="button"
//               disabled={
//                 checkingAvailability ||
//                 !selectedVariant ||
//                 !orderDate ||
//                 !orderTiming
//               }
//               onClick={
//                 handleFinalOrder
//               }
//               className="w-full h-12 rounded-full bg-pink-600 hover:bg-pink-700 text-white text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md shadow-pink-600/20 active:scale-[0.98]"
//             >
//               <ShoppingBag className="w-4 h-4" />

//               {checkingAvailability
//                 ? "Checking Availability..."
//                 : "Confirm & Send to WhatsApp"}
//             </button>

//             {!checkingAvailability && (
//               <p className="mt-3 text-center text-[11px] text-stone-400">
//                 Availability and latest price will be verified before opening WhatsApp.
//               </p>
//             )}
//           </div>
//         </div>
//       )}

//       {/* =====================================================
//           GENERAL AVAILABILITY MODAL
//           ===================================================== */}

//       {availabilityModal.open && (
//         <div className="fixed inset-0 z-[110] bg-stone-950/60 backdrop-blur-sm flex items-center justify-center p-4">

//           <div className="relative w-full max-w-sm bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 p-6 shadow-2xl text-center">

//             <div className="mx-auto w-12 h-12 rounded-full bg-pink-100 dark:bg-pink-900/40 flex items-center justify-center text-pink-600 dark:text-pink-300">
//               <AlertCircle className="w-6 h-6" />
//             </div>

//             <h3 className="mt-4 font-serif font-bold text-lg text-stone-900 dark:text-stone-50">
//               {availabilityModal.title}
//             </h3>

//             <p className="mt-2 text-sm text-stone-500 dark:text-stone-400 leading-relaxed">
//               {availabilityModal.message}
//             </p>

//             <button
//               type="button"
//               onClick={() => {
//                 closeAvailabilityModal();
//                 router.push("/menu");
//               }}
//               className="w-full mt-5 h-11 rounded-full bg-pink-600 hover:bg-pink-700 text-white text-sm font-semibold transition-colors"
//             >
//               Back to Menu
//             </button>

//             <button
//               type="button"
//               onClick={
//                 closeAvailabilityModal
//               }
//               className="mt-3 text-xs font-medium text-stone-500 hover:text-stone-800 dark:hover:text-stone-300"
//             >
//               Close
//             </button>
//           </div>
//         </div>
//       )}

//       <Footer />
//     </div>
//   );
// }

// /* =========================================================
//    SUSPENSE WRAPPER
//    =========================================================

//    useSearchParams() is used inside CakeDetailsContent.
//    This boundary satisfies Next.js production prerendering
//    requirements without disabling static rendering.
// ========================================================= */

// export default function CakeDetails() {
//   return (
//     <Suspense
//       fallback={
//         <main className="min-h-screen bg-amber-50/40 dark:bg-stone-950 flex items-center justify-center px-4">
//           <div className="text-center">
//             <div className="mx-auto w-10 h-10 border-4 border-pink-200 border-t-pink-600 rounded-full animate-spin" />

//             <p className="mt-4 text-sm font-medium text-stone-600 dark:text-stone-400">
//               Loading cake details...
//             </p>
//           </div>
//         </main>
//       }
//     >
//       <CakeDetailsContent />
//     </Suspense>
//   );
// }









// "use client";

// import axios from "axios";
// import {
//   AlertCircle,
//   ArrowLeft,
//   Calendar,
//   Check,
//   Clock,
//   Minus,
//   Plus,
//   ShoppingBag,
//   Sparkles,
//   X,
// } from "lucide-react";
// import { useRouter, useSearchParams } from "next/navigation";
// import { useEffect, useMemo, useState } from "react";
// import { Footer } from "../ui/Footer";

// type CakeVariant = {
//   _id: string;
//   cakeId?: string;
//   cakeName?: string;
//   weight: number;
//   price: number;
//   available: boolean;
// };

// type MenuItem = {
//   _id: string;
//   name: string;
//   flavour: string;
//   description?: string;
//   image?: string;
//   available: boolean;
//   variants: CakeVariant[];
// };

// type AvailabilityModal = {
//   open: boolean;
//   title: string;
//   message: string;
// };

// type AvailabilityReason =
//   | "CAKE_NOT_FOUND"
//   | "CAKE_UNAVAILABLE"
//   | "VARIANT_UNAVAILABLE"
//   | "INVALID_CAKE_ID"
//   | "INVALID_VARIANT_ID"
//   | "VARIANT_ID_REQUIRED"
//   | "AVAILABILITY_CHECK_FAILED";

// const TIMINGS = ["Morning", "Evening", "Night"] as const;

// type Timing = (typeof TIMINGS)[number];

// export default function CakeDetails() {
//   const router = useRouter();
//   const searchParams = useSearchParams();

//   const cakeId = searchParams.get("id");

//   const [cake, setCake] = useState<MenuItem | null>(null);
//   const [loading, setLoading] = useState(true);

//   const [checkingAvailability, setCheckingAvailability] =
//     useState(false);

//   const [selectedVariant, setSelectedVariant] =
//     useState<CakeVariant | null>(null);

//   const [orderQuantity, setOrderQuantity] = useState(1);
//   const [orderDate, setOrderDate] = useState("");
//   const [orderTiming, setOrderTiming] = useState("");

//   const [isOrderModalOpen, setIsOrderModalOpen] =
//     useState(false);

//   const [orderError, setOrderError] = useState("");

//   const [availabilityModal, setAvailabilityModal] =
//     useState<AvailabilityModal>({
//       open: false,
//       title: "",
//       message: "",
//     });

//   /* =========================================================
//      Date
//      ========================================================= */

//   const getTodayString = () => {
//     const now = new Date();

//     return `${now.getFullYear()}-${String(
//       now.getMonth() + 1
//     ).padStart(2, "0")}-${String(now.getDate()).padStart(
//       2,
//       "0"
//     )}`;
//   };

//   const todayString = getTodayString();

//   const now = new Date();
//   const currentHour = now.getHours();

//   const isToday = orderDate === todayString;

//   /*
//    * Timing rules:
//    *
//    * Morning  -> available before 12 PM
//    * Evening  -> available before 6 PM
//    * Night    -> available before 11 PM
//    *
//    * For future dates all timings are available.
//    */

//   const timingDisabled: Record<Timing, boolean> = {
//     Morning: isToday && currentHour >= 12,
//     Evening: isToday && currentHour >= 18,
//     Night: isToday && currentHour >= 23,
//   };

//   /* =========================================================
//      Fetch Cake
//      ========================================================= */

//   useEffect(() => {
//     if (!cakeId) {
//       setLoading(false);

//       setAvailabilityModal({
//         open: true,
//         title: "Cake Not Found",
//         message:
//           "No cake was selected. Please go back to the menu and choose a cake.",
//       });

//       return;
//     }

//     const fetchCake = async () => {
//       try {
//         setLoading(true);

//         const response = await axios.get(
//           `/api/menu/details/${cakeId}`
//         );

//         const result = response.data.data.cake;

//         if (!result?.cake) {
//           throw new Error("CAKE_NOT_FOUND");
//         }

//         const variants: CakeVariant[] = Array.isArray(
//           result.variant
//         )
//           ? result.variant
//           : [];

//         const fetchedCake: MenuItem = {
//           ...result.cake,
//           variants,
//         };

//         setCake(fetchedCake);

//         /*
//          * Select smallest available variant by default.
//          */
//         const smallestAvailableVariant = [...variants]
//           .filter(
//             (variant) =>
//               fetchedCake.available && variant.available
//           )
//           .sort((a, b) => a.weight - b.weight)[0];

//         setSelectedVariant(
//           smallestAvailableVariant || null
//         );
//       } catch (error: any) {
//         // console.error(
//         //   "Failed to fetch cake:",
//         //   error
//         // );

//         const status = error.response?.status;

//         if (status === 404) {
//           setAvailabilityModal({
//             open: true,
//             title: "Cake Not Found",
//             message:
//               "This cake no longer exists. Please go back to the menu.",
//           });
//         } else {
//           setAvailabilityModal({
//             open: true,
//             title: "Unable to Load Cake",
//             message:
//               "We couldn't load this cake right now. Please try again.",
//           });
//         }
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchCake();
//   }, [cakeId]);

//   /* =========================================================
//      Calculated Values
//      ========================================================= */

//   const availableVariants = useMemo(() => {
//     if (!cake || !cake.available) return [];

//     return [...cake.variants]
//       .filter((variant) => variant.available)
//       .sort((a, b) => a.weight - b.weight);
//   }, [cake]);

//   const totalPrice = selectedVariant
//     ? Number(selectedVariant.price) * orderQuantity
//     : 0;

//   /* =========================================================
//      Variant Selection
//      ========================================================= */

//   const handleSelectVariant = (
//     variant: CakeVariant
//   ) => {
//     if (!cake?.available || !variant.available) {
//       return;
//     }

//     setSelectedVariant(variant);
//     setOrderQuantity(1);
//     setOrderError("");
//   };

//   /* =========================================================
//      Quantity
//      ========================================================= */

//   const decreaseQuantity = () => {
//     setOrderQuantity((current) =>
//       Math.max(1, current - 1)
//     );
//   };

//   const increaseQuantity = () => {
//     setOrderQuantity((current) =>
//       Math.min(10, current + 1)
//     );
//   };

//   /* =========================================================
//      Date
//      ========================================================= */

//   const handleDateChange = (date: string) => {
//     setOrderDate(date);
//     setOrderTiming("");
//     setOrderError("");
//   };

//   /* =========================================================
//      Modal
//      ========================================================= */

//   const closeAvailabilityModal = () => {
//     setAvailabilityModal({
//       open: false,
//       title: "",
//       message: "",
//     });
//   };

//   const closeOrderModal = () => {
//     if (checkingAvailability) {
//       return;
//     }

//     setIsOrderModalOpen(false);
//     setOrderError("");
//   };

//   /* =========================================================
//      Availability State Helpers
//      ========================================================= */

//   const markCakeUnavailable = () => {
//     setCake((currentCake) => {
//       if (!currentCake) return currentCake;

//       return {
//         ...currentCake,
//         available: false,
//       };
//     });

//     setSelectedVariant(null);
//   };

//   const markVariantUnavailable = (
//     variantId: string
//   ) => {
//     setCake((currentCake) => {
//       if (!currentCake) return currentCake;

//       return {
//         ...currentCake,
//         variants: currentCake.variants.map(
//           (variant) =>
//             variant._id === variantId
//               ? {
//                   ...variant,
//                   available: false,
//                 }
//               : variant
//         ),
//       };
//     });

//     setSelectedVariant((currentVariant) =>
//       currentVariant?._id === variantId
//         ? null
//         : currentVariant
//     );
//   };

//   /* =========================================================
//      Handle Availability Error
//      ========================================================= */

//   const handleAvailabilityError = (
//     error: any,
//     source: "open-modal" | "final-order"
//   ) => {
//     const status = error.response?.status;

//     const responseData = error.response?.data;

//     const reason =
//       responseData?.reason as
//         | AvailabilityReason
//         | undefined;

//     const apiError =
//       responseData?.error;

//     /*
//      * ---------------------------------------------
//      * Cake no longer exists
//      * ---------------------------------------------
//      */

//     if (
//       status === 404 ||
//       reason === "CAKE_NOT_FOUND"
//     ) {
//       if (source === "final-order") {
//         setOrderError(
//           "This cake or selected size no longer exists. Please refresh the menu."
//         );
//       } else {
//         setAvailabilityModal({
//           open: true,
//           title: "Cake No Longer Available",
//           message:
//             "This cake or selected size no longer exists. Please refresh the menu.",
//         });
//       }

//       return;
//     }

//     /*
//      * ---------------------------------------------
//      * Cake unavailable
//      * ---------------------------------------------
//      */

//     if (
//       status === 409 &&
//       reason === "CAKE_UNAVAILABLE"
//     ) {
//       markCakeUnavailable();

//       if (source === "final-order") {
//         setOrderError(
//           "This cake is currently unavailable. Please choose another cake."
//         );
//       } else {
//         setAvailabilityModal({
//           open: true,
//           title: "Cake Not Available",
//           message:
//             "This cake is currently unavailable. Please choose another cake.",
//         });
//       }

//       return;
//     }

//     /*
//      * ---------------------------------------------
//      * Variant unavailable
//      * ---------------------------------------------
//      */

//     if (
//       status === 409 &&
//       reason === "VARIANT_UNAVAILABLE"
//     ) {
//       const unavailableVariantId =
//         selectedVariant?._id;

//       if (unavailableVariantId) {
//         markVariantUnavailable(
//           unavailableVariantId
//         );
//       }

//       const weight =
//         selectedVariant?.weight;

//       const message = weight
//         ? `The ${weight} Kg size is currently unavailable. Please select another size.`
//         : "The selected cake size is currently unavailable. Please select another size.";

//       if (source === "final-order") {
//         setOrderError(message);
//       } else {
//         setAvailabilityModal({
//           open: true,
//           title: "Size Not Available",
//           message,
//         });
//       }

//       return;
//     }

//     /*
//      * ---------------------------------------------
//      * Fallback
//      * ---------------------------------------------
//      */

//     const fallbackMessage =
//       apiError ||
//       "We couldn't verify availability right now. Please try again.";

//     if (source === "final-order") {
//       setOrderError(fallbackMessage);
//     } else {
//       setAvailabilityModal({
//         open: true,
//         title: "Unable to Check Availability",
//         message: fallbackMessage,
//       });
//     }
//   };

//   /* =========================================================
//      Open Order Modal
//      ========================================================= */

//   const handleOpenOrderModal = async () => {
//     if (checkingAvailability) {
//       return;
//     }

//     if (!cake) {
//       return;
//     }

//     if (!cake.available) {
//       setAvailabilityModal({
//         open: true,
//         title: "Cake Not Available",
//         message:
//           "This cake is currently unavailable. Please choose another cake.",
//       });

//       return;
//     }

//     if (!selectedVariant) {
//       setAvailabilityModal({
//         open: true,
//         title: "Select Cake Size",
//         message:
//           "Please select an available cake size before proceeding.",
//       });

//       return;
//     }

//     if (!selectedVariant.available) {
//       setAvailabilityModal({
//         open: true,
//         title: "Size Not Available",
//         message:
//           "The selected cake size is currently unavailable. Please choose another size.",
//       });

//       return;
//     }

//     try {
//       setCheckingAvailability(true);

//       /*
//        * IMPORTANT:
//        *
//        * The frontend data may be stale.
//        * Always verify directly against DB
//        * before opening the order modal.
//        */

//       const response = await axios.get(
//         `/api/menu/${cake._id}?variantId=${selectedVariant._id}`
//       );

//       const result = response.data;

//       if (
//         !result?.success ||
//         !result?.available
//       ) {
//         throw new Error(
//           "Availability check failed"
//         );
//       }

//       const latestCake =
//         result?.data?.cake;

//       const latestVariant =
//         result?.data?.variant;

//       /*
//        * Cake unavailable
//        */

//       if (!latestCake?.available) {
//         markCakeUnavailable();

//         setAvailabilityModal({
//           open: true,
//           title: "Cake Not Available",
//           message:
//             "This cake is currently unavailable. Please choose another cake.",
//         });

//         return;
//       }

//       /*
//        * Variant unavailable
//        */

//       if (!latestVariant?.available) {
//         markVariantUnavailable(
//           selectedVariant._id
//         );

//         setAvailabilityModal({
//           open: true,
//           title: "Size Not Available",
//           message:
//             "The selected cake size is currently unavailable. Please choose another size.",
//         });

//         return;
//       }

//       /*
//        * Keep latest DB data.
//        *
//        * This also ensures latest price is used.
//        */

//       setCake((currentCake) => {
//         if (!currentCake) {
//           return currentCake;
//         }

//         return {
//           ...currentCake,
//           ...latestCake,
//           variants:
//             currentCake.variants.map(
//               (variant) =>
//                 variant._id ===
//                 latestVariant._id
//                   ? latestVariant
//                   : variant
//             ),
//         };
//       });

//       setSelectedVariant(latestVariant);
//       setOrderQuantity(1);
//       setOrderError("");
//       setIsOrderModalOpen(true);
//     } catch (error: any) {
//       // console.error(
//       //   "Failed to check cake availability:",
//       //   error
//       // );

//       handleAvailabilityError(
//         error,
//         "open-modal"
//       );
//     } finally {
//       setCheckingAvailability(false);
//     }
//   };

//   /* =========================================================
//      Final Order
//      ========================================================= */

//   const handleFinalOrder = async () => {
//     if (checkingAvailability) {
//       return;
//     }

//     if (!cake || !selectedVariant) {
//       setOrderError(
//         "Please select an available cake size."
//       );

//       return;
//     }

//     if (!orderDate) {
//       setOrderError(
//         "Please select the required date."
//       );

//       return;
//     }

//     if (!orderTiming) {
//       setOrderError(
//         "Please select your preferred timing."
//       );

//       return;
//     }

//     /*
//      * Frontend timing validation
//      */

//     if (
//       isToday &&
//       timingDisabled[orderTiming as Timing]
//     ) {
//       setOrderError(
//         `${orderTiming} timing is no longer available for today. Please choose another timing.`
//       );

//       setOrderTiming("");

//       return;
//     }

//     try {
//       setCheckingAvailability(true);
//       setOrderError("");

//       /*
//        * SECOND availability check.
//        *
//        * This is intentionally required.
//        *
//        * The cake could become unavailable while
//        * the user is filling date/time.
//        */

//       const response = await axios.get(
//         `/api/menu/${cake._id}?variantId=${selectedVariant._id}`
//       );

//       const result = response.data;

//       if (
//         !result?.success ||
//         !result?.available
//       ) {
//         throw new Error(
//           "Availability check failed"
//         );
//       }

//       const latestCake =
//         result?.data?.cake;

//       const latestVariant =
//         result?.data?.variant;

//       /*
//        * Cake unavailable
//        */

//       if (!latestCake?.available) {
//         markCakeUnavailable();

//         setOrderError(
//           "This cake is currently unavailable. Please choose another cake."
//         );

//         return;
//       }

//       /*
//        * Variant unavailable
//        */

//       if (!latestVariant?.available) {
//         markVariantUnavailable(
//           selectedVariant._id
//         );

//         setOrderError(
//           `The ${selectedVariant.weight} Kg size is currently unavailable. Please select another size.`
//         );

//         return;
//       }

//       /*
//        * Use latest verified data.
//        */

//       setCake((currentCake) => {
//         if (!currentCake) {
//           return currentCake;
//         }

//         return {
//           ...currentCake,
//           ...latestCake,
//           variants:
//             currentCake.variants.map(
//               (variant) =>
//                 variant._id ===
//                 latestVariant._id
//                   ? latestVariant
//                   : variant
//             ),
//         };
//       });

//       setSelectedVariant(latestVariant);

//       /*
//        * Latest price from DB
//        */

//       const latestPrice =
//         Number(latestVariant.price);

//       /*
//        * Validate latest price
//        */

//       if (
//         !Number.isFinite(latestPrice) ||
//         latestPrice < 0
//       ) {
//         setOrderError(
//           "The latest cake price is invalid. Please refresh the menu and try again."
//         );

//         return;
//       }

//       /*
//        * Create order date
//        */

//       const date = new Date(
//         `${orderDate}T00:00:00`
//       );

//       if (Number.isNaN(date.getTime())) {
//         setOrderError(
//           "Invalid order date. Please select the date again."
//         );

//         return;
//       }

//       /*
//        * Format date
//        */

//       const formattedDate = date
//         .toLocaleDateString("en-GB", {
//           day: "2-digit",
//           month: "short",
//           year: "numeric",
//         })
//         .toUpperCase()
//         .replace(/ /g, "-");

//       /*
//        * Weekday
//        */

//       const weekday = date
//         .toLocaleDateString("en-US", {
//           weekday: "long",
//         })
//         .toUpperCase();

//       /*
//        * Capture final values.
//        */

//       const finalQuantity =
//         orderQuantity;

//       const finalTotal =
//         latestPrice * finalQuantity;

//       /*
//        * WhatsApp message
//        */

//       const message = `Hi Butterfly Bakes,

// I would like to place an order for:

// *Cake:* ${latestCake.name}
// *Flavour:* ${latestCake.flavour}
// *Weight:* ${latestVariant.weight} Kg
// *Quantity:* ${finalQuantity}
// *Price:* ₹${latestPrice}
// *Total:* ₹${finalTotal}

// *Cake Required On:* ${formattedDate} (${weekday})
// *Preferred Time:* ${orderTiming}

// Please confirm the order details.`;

//       const whatsappLink =
//         `https://wa.me/918301036420?text=${encodeURIComponent(
//           message
//         )}`;

//       /*
//        * Open WhatsApp ONLY after
//        * successful DB availability check.
//        */

//       window.open(
//         whatsappLink,
//         "_blank",
//         "noopener,noreferrer"
//       );

//       setIsOrderModalOpen(false);
//       setOrderError("");
//     } catch (error: any) {
//       // console.error(
//       //   "Failed to verify cake availability:",
//       //   error
//       // );

//       /*
//        * IMPORTANT:
//        *
//        * Axios throws for HTTP 409.
//        *
//        * handleAvailabilityError() converts
//        * that 409 into the correct user message.
//        */

//       handleAvailabilityError(
//         error,
//         "final-order"
//       );
//     } finally {
//       setCheckingAvailability(false);
//     }
//   };

//   /* =========================================================
//      Loading
//      ========================================================= */

//   if (loading) {
//     return (
//       <main className="min-h-screen bg-amber-50/40 dark:bg-stone-950 flex items-center justify-center px-4">
//         <div className="text-center">
//           <div className="mx-auto w-10 h-10 border-4 border-pink-200 border-t-pink-600 rounded-full animate-spin" />

//           <p className="mt-4 text-sm font-medium text-stone-600 dark:text-stone-400">
//             Fetching cake details...
//           </p>
//         </div>
//       </main>
//     );
//   }

//   /* =========================================================
//      Cake Not Found
//      ========================================================= */

//   if (!cake) {
//     return (
//       <main className="min-h-screen bg-amber-50/40 dark:bg-stone-950 flex items-center justify-center px-4">
//         <div className="w-full max-w-sm text-center">
//           <div className="mx-auto w-14 h-14 rounded-full bg-pink-100 dark:bg-pink-900/40 flex items-center justify-center text-pink-600 dark:text-pink-300">
//             <AlertCircle className="w-7 h-7" />
//           </div>

//           <h1 className="mt-5 text-2xl font-serif font-bold text-stone-900 dark:text-stone-50">
//             Cake Not Found
//           </h1>

//           <p className="mt-2 text-sm text-stone-600 dark:text-stone-300">
//             The cake you are looking for could not
//             be found.
//           </p>

//           <button
//             type="button"
//             onClick={() =>
//               router.push("/menu")
//             }
//             className="mt-6 px-6 py-3 rounded-full bg-pink-600 hover:bg-pink-700 text-white text-sm font-semibold transition-colors shadow-sm"
//           >
//             Back to Menu
//           </button>
//         </div>
//       </main>
//     );
//   }

//   /* =========================================================
//      Main UI
//      ========================================================= */

//   return (
//     <div className="min-h-screen bg-amber-50/40 dark:bg-stone-950 text-stone-800 dark:text-stone-100">
//       <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 md:py-12">

//         {/* Back */}

//         <button
//           type="button"
//           onClick={() =>
//             router.push("/menu")
//           }
//           className="inline-flex items-center gap-2 text-sm font-medium text-stone-500 hover:text-pink-600 dark:hover:text-pink-400 transition-colors"
//         >
//           <ArrowLeft className="w-4 h-4" />
//           Back to Menu
//         </button>

//         <div className="mt-8 grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8 lg:gap-12 items-start">

//           {/* =================================================
//               LEFT
//               ================================================= */}

//           <section className="min-w-0">

//             <span className="inline-flex items-center gap-2 bg-pink-100 dark:bg-pink-900/40 text-pink-700 dark:text-pink-300 border border-pink-200 dark:border-pink-800 px-3.5 py-1.5 rounded-full text-xs font-semibold">
//               <Sparkles className="w-3.5 h-3.5" />
//               {cake.flavour}
//             </span>

//             <h1 className="mt-4 text-3xl sm:text-5xl font-serif font-bold text-stone-900 dark:text-stone-50 tracking-tight leading-tight">
//               {cake.name}
//             </h1>

//             <div className="mt-3">
//               <span
//                 className={`inline-flex items-center gap-1.5 text-xs font-medium ${
//                   cake.available
//                     ? "text-emerald-600 dark:text-emerald-400"
//                     : "text-rose-600 dark:text-rose-400"
//                 }`}
//               >
//                 <span
//                   className={`w-2 h-2 rounded-full ${
//                     cake.available
//                       ? "bg-emerald-500"
//                       : "bg-rose-500"
//                   }`}
//                 />

//                 {cake.available
//                   ? "Freshly Baked & Available"
//                   : "Currently Unavailable"}
//               </span>
//             </div>

//             {/* Description */}

//             <div className="mt-8">
//               <h2 className="text-xs font-bold uppercase tracking-widest text-stone-400">
//                 Description
//               </h2>

//               <p className="mt-2 text-sm sm:text-base leading-relaxed text-stone-600 dark:text-stone-300">
//                 {cake.description ||
//                   "A delicious homemade cake prepared with carefully selected ingredients."}
//               </p>
//             </div>

//             <hr className="my-8 border-stone-200 dark:border-stone-800" />

//             {/* =================================================
//                 Size Selection
//                 ================================================= */}

//             <div>
//               <div className="flex items-center justify-between">
//                 <div>
//                   <h3 className="text-lg font-serif font-bold text-stone-900 dark:text-stone-50">
//                     1. Choose Weight / Size
//                   </h3>

//                   <p className="text-xs text-stone-500 dark:text-stone-400">
//                     Select your preferred cake size.
//                   </p>
//                 </div>

//                 <span className="text-xs font-medium text-stone-400">
//                   {availableVariants.length} options available
//                 </span>
//               </div>

//               <div className="mt-4 flex flex-wrap gap-3">
//                 {[...cake.variants]
//                   .sort(
//                     (a, b) =>
//                       a.weight - b.weight
//                   )
//                   .map((variant) => {
//                     const isAvailable =
//                       cake.available &&
//                       variant.available;

//                     const isSelected =
//                       selectedVariant?._id ===
//                       variant._id;

//                     return (
//                       <button
//                         key={variant._id}
//                         type="button"
//                         disabled={!isAvailable}
//                         onClick={() =>
//                           handleSelectVariant(
//                             variant
//                           )
//                         }
//                         className={`min-w-[110px] px-5 py-3 rounded-2xl border text-sm font-medium transition-all flex items-center justify-between gap-2 ${
//                           !isAvailable
//                             ? "border-stone-200 dark:border-stone-800 bg-stone-100 dark:bg-stone-900 text-stone-400 cursor-not-allowed opacity-50"
//                             : isSelected
//                             ? "bg-pink-600 border-pink-600 text-white shadow-md shadow-pink-600/20"
//                             : "bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800 text-stone-700 dark:text-stone-200 hover:border-pink-300 dark:hover:border-pink-800"
//                         }`}
//                       >
//                         <span>
//                           {variant.weight} Kg
//                         </span>

//                         {isSelected && (
//                           <Check className="w-4 h-4" />
//                         )}
//                       </button>
//                     );
//                   })}
//               </div>
//             </div>
//           </section>

//           {/* =================================================
//               RIGHT - Order Summary
//               ================================================= */}

//           <section className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-6 shadow-sm sticky top-6">

//             <h3 className="text-lg font-serif font-bold text-stone-900 dark:text-stone-50 mb-4">
//               Order Summary
//             </h3>

//             {/* Price */}

//             <div className="flex items-baseline justify-between p-4 rounded-2xl bg-amber-50/60 dark:bg-stone-950/50 border border-amber-100 dark:border-stone-800">
//               <div>
//                 <p className="text-xs font-medium text-stone-500">
//                   Unit Price
//                 </p>

//                 <p className="text-sm font-semibold text-stone-800 dark:text-stone-200">
//                   {selectedVariant
//                     ? `${selectedVariant.weight} Kg`
//                     : "Select Size"}
//                 </p>
//               </div>

//               <p className="text-2xl font-bold text-pink-600 dark:text-pink-400">
//                 ₹{selectedVariant?.price || 0}
//               </p>
//             </div>

//             {/* Quantity */}

//             <div className="mt-6">
//               <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-2">
//                 2. Select Quantity
//               </label>

//               <div className="flex items-center justify-between h-12 rounded-2xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-950 px-2">

//                 <button
//                   type="button"
//                   onClick={
//                     decreaseQuantity
//                   }
//                   disabled={
//                     !selectedVariant ||
//                     checkingAvailability
//                   }
//                   className="w-9 h-9 rounded-xl flex items-center justify-center text-stone-600 dark:text-stone-300 hover:bg-white dark:hover:bg-stone-800 disabled:opacity-40 transition-colors"
//                 >
//                   <Minus className="w-4 h-4" />
//                 </button>

//                 <span className="text-base font-bold text-stone-800 dark:text-stone-100">
//                   {orderQuantity}
//                 </span>

//                 <button
//                   type="button"
//                   onClick={
//                     increaseQuantity
//                   }
//                   disabled={
//                     !selectedVariant ||
//                     checkingAvailability
//                   }
//                   className="w-9 h-9 rounded-xl flex items-center justify-center text-stone-600 dark:text-stone-300 hover:bg-white dark:hover:bg-stone-800 disabled:opacity-40 transition-colors"
//                 >
//                   <Plus className="w-4 h-4" />
//                 </button>
//               </div>
//             </div>

//             <hr className="my-6 border-stone-100 dark:border-stone-800" />

//             {/* Total */}

//             <div className="flex items-center justify-between mb-6">
//               <span className="text-sm font-medium text-stone-500 dark:text-stone-400">
//                 Total Amount
//               </span>

//               <span className="text-3xl font-bold text-stone-900 dark:text-stone-50">
//                 ₹{totalPrice}
//               </span>
//             </div>

//             {/* Proceed */}

//             <button
//               type="button"
//               disabled={
//                 !selectedVariant ||
//                 !cake.available ||
//                 checkingAvailability
//               }
//               onClick={
//                 handleOpenOrderModal
//               }
//               className="w-full h-12 rounded-full bg-pink-600 hover:bg-pink-700 text-white text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md shadow-pink-600/20 active:scale-[0.98]"
//             >
//               <ShoppingBag className="w-4 h-4" />

//               {checkingAvailability
//                 ? "Checking Availability..."
//                 : "Proceed to Order Details"}
//             </button>

//             <p className="mt-3 text-center text-xs text-stone-400 leading-normal">
//               Availability will be verified before
//               proceeding.
//             </p>
//           </section>
//         </div>
//       </main>

//       {/* =====================================================
//           ORDER DETAILS MODAL
//           ===================================================== */}

//       {isOrderModalOpen && (
//         <div className="fixed inset-0 z-[100] bg-stone-950/60 backdrop-blur-sm flex items-center justify-center p-4">

//           <div className="relative w-full max-w-md bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 p-6 shadow-2xl">

//             {/* Close */}

//             <button
//               type="button"
//               onClick={
//                 closeOrderModal
//               }
//               disabled={
//                 checkingAvailability
//               }
//               className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center hover:bg-stone-100 dark:hover:bg-stone-800 disabled:opacity-40 transition-colors"
//             >
//               <X className="w-4 h-4 text-stone-500" />
//             </button>

//             {/* Header */}

//             <div className="flex items-center gap-2 text-pink-600 dark:text-pink-400 mb-1">
//               <Calendar className="w-5 h-5" />

//               <h3 className="font-serif font-bold text-xl text-stone-900 dark:text-stone-50">
//                 Select Delivery / Pickup
//               </h3>
//             </div>

//             <p className="text-xs text-stone-500 dark:text-stone-400 mb-6">
//               Please choose when you need your fresh cake ready.
//             </p>

//             {/* Order Brief */}

//             <div className="p-3.5 rounded-2xl bg-amber-50/60 dark:bg-stone-950/50 border border-amber-100 dark:border-stone-800 mb-6 flex items-center justify-between text-xs">

//               <div>
//                 <p className="font-semibold text-stone-800 dark:text-stone-200">
//                   {cake.name}
//                 </p>

//                 <p className="text-stone-500">
//                   {selectedVariant?.weight} Kg ×{" "}
//                   {orderQuantity}
//                 </p>
//               </div>

//               <p className="font-bold text-pink-600 text-sm">
//                 ₹
//                 {selectedVariant
//                   ? Number(
//                       selectedVariant.price
//                     ) * orderQuantity
//                   : 0}
//               </p>
//             </div>

//             {/* =================================================
//                 Availability Error
//                 ================================================= */}

//             {orderError && (
//               <div className="mb-5 flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 dark:border-rose-900/50 dark:bg-rose-950/30">

//                 <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-rose-600 dark:text-rose-400" />

//                 <p className="text-xs leading-relaxed text-rose-700 dark:text-rose-300">
//                   {orderError}
//                 </p>
//               </div>
//             )}

//             {/* Date */}

//             <div className="mb-5">
//               <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-2">
//                 Required Date
//               </label>

//               <input
//                 type="date"
//                 value={orderDate}
//                 min={todayString}
//                 disabled={
//                   checkingAvailability
//                 }
//                 onChange={(e) =>
//                   handleDateChange(
//                     e.target.value
//                   )
//                 }
//                 className="w-full h-11 px-4 rounded-2xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-950 text-sm text-stone-800 dark:text-stone-200 outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-500/10 disabled:opacity-50"
//               />
//             </div>

//             {/* Timing */}

//             <div className="mb-6">

//               <div className="flex items-center justify-between mb-2">

//                 <label className="text-xs font-bold uppercase tracking-wider text-stone-500">
//                   Preferred Timing
//                 </label>

//                 <Clock className="w-3.5 h-3.5 text-stone-400" />
//               </div>

//               <div className="grid grid-cols-3 gap-2">

//                 {TIMINGS.map(
//                   (timing) => {
//                     const disabled =
//                       !orderDate ||
//                       timingDisabled[
//                         timing
//                       ] ||
//                       checkingAvailability;

//                     const selected =
//                       orderTiming ===
//                       timing;

//                     return (
//                       <button
//                         key={timing}
//                         type="button"
//                         disabled={
//                           disabled
//                         }
//                         onClick={() => {
//                           setOrderTiming(
//                             timing
//                           );
//                           setOrderError(
//                             ""
//                           );
//                         }}
//                         className={`h-11 rounded-2xl border text-xs font-semibold transition-all ${
//                           disabled
//                             ? "bg-stone-100 dark:bg-stone-800 text-stone-400 border-stone-200 dark:border-stone-800 cursor-not-allowed opacity-50"
//                             : selected
//                             ? "bg-pink-600 border-pink-600 text-white shadow-sm"
//                             : "bg-stone-50 dark:bg-stone-950 border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:border-pink-300"
//                         }`}
//                       >
//                         {selected && (
//                           <Check className="inline w-3 h-3 mr-1" />
//                         )}

//                         {timing}
//                       </button>
//                     );
//                   }
//                 )}
//               </div>

//               {!orderDate && (
//                 <p className="mt-2 text-[11px] text-stone-400">
//                   Select a date first to choose your preferred timing.
//                 </p>
//               )}
//             </div>

//             {/* Submit */}

//             <button
//               type="button"
//               disabled={
//                 checkingAvailability ||
//                 !selectedVariant ||
//                 !orderDate ||
//                 !orderTiming
//               }
//               onClick={
//                 handleFinalOrder
//               }
//               className="w-full h-12 rounded-full bg-pink-600 hover:bg-pink-700 text-white text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md shadow-pink-600/20 active:scale-[0.98]"
//             >
//               <ShoppingBag className="w-4 h-4" />

//               {checkingAvailability
//                 ? "Checking Availability..."
//                 : "Confirm & Send to WhatsApp"}
//             </button>

//             {!checkingAvailability && (
//               <p className="mt-3 text-center text-[11px] text-stone-400">
//                 Availability and latest price will be verified before opening WhatsApp.
//               </p>
//             )}
//           </div>
//         </div>
//       )}

//       {/* =====================================================
//           GENERAL AVAILABILITY MODAL
//           ===================================================== */}

//       {availabilityModal.open && (
//         <div className="fixed inset-0 z-[110] bg-stone-950/60 backdrop-blur-sm flex items-center justify-center p-4">

//           <div className="relative w-full max-w-sm bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 p-6 shadow-2xl text-center">

//             <div className="mx-auto w-12 h-12 rounded-full bg-pink-100 dark:bg-pink-900/40 flex items-center justify-center text-pink-600 dark:text-pink-300">
//               <AlertCircle className="w-6 h-6" />
//             </div>

//             <h3 className="mt-4 font-serif font-bold text-lg text-stone-900 dark:text-stone-50">
//               {availabilityModal.title}
//             </h3>

//             <p className="mt-2 text-sm text-stone-500 dark:text-stone-400 leading-relaxed">
//               {availabilityModal.message}
//             </p>

//             <button
//               type="button"
//               onClick={() => {
//                 closeAvailabilityModal();
//                 router.push("/menu");
//               }}
//               className="w-full mt-5 h-11 rounded-full bg-pink-600 hover:bg-pink-700 text-white text-sm font-semibold transition-colors"
//             >
//               Back to Menu
//             </button>

//             <button
//               type="button"
//               onClick={
//                 closeAvailabilityModal
//               }
//               className="mt-3 text-xs font-medium text-stone-500 hover:text-stone-800 dark:hover:text-stone-300"
//             >
//               Close
//             </button>
//           </div>
//         </div>
//       )}

//       <Footer />

//     </div>
//   );
// }



