import connectDB from "../lib/mongoose";
import { AdminRepository } from "../repositories/admin.repository";

const adminRepo = new AdminRepository()

export async function getAdmin() {
  // CONNECT DB
  await connectDB()

  return await adminRepo.getOne()
}



export interface CreateMenuData {
  name: string;
  flavour: string;
  weight: number;
  price: number;
  description?: string;
  image?: string;
  available?: boolean;
  offerId?: string | null;
}

// CREATE MENU
export async function createMenu(
  menuData: CreateMenuData
) {
  await connectDB();

  return await adminRepo.createMenu(
    menuData
  );
}

// GET MENU LIST
export async function getMenuList({
  page,
  limit,
  search,
}: {
  page: number;
  limit: number;
  search: string;
}) {
  await connectDB();

  return await adminRepo.getMenuLists({
    page,
    limit,
    search,
  });
}

// UPDATE MENU
export async function updateMenu(
  id: string,
  updateData: Record<string, unknown>
) {
  await connectDB();

  return await adminRepo.updateMenu(id, updateData);
}

// DELETE MENU
export async function deleteMenu(id: string) {
  await connectDB();

  return await adminRepo.deleteMenu(id);
}

// UPDATE MENU AVAILABLITY
export async function updateMenuAvailability(
  id: string,
  available: boolean
) {
  await connectDB();

  return await adminRepo.updateMenuAvailability(
    id,
    available
  );
}



// ------------------------------------ VARIANTS

export async function createVariant(variantData: {
  cakeId: string;
  cakeName: string;
  price: number;
  weight: number;
  available?: boolean;
}) {
  await connectDB();

  return await adminRepo.createVariant(variantData);
}

export async function getVariantList({
  page,
  limit,
  search,
}: {
  page: number;
  limit: number;
  search: string;
}) {
  await connectDB();

  return await adminRepo.getVariantLists({
    page,
    limit,
    search,
  });
}


export async function updateVariant(
  id: string,
  updateData: {
    weight?: number;
    price?: number;
    available?: boolean;
  }
) {
  await connectDB();

  return await adminRepo.updateVariant(
    id,
    updateData
  );
}


export async function toggleVariantAvailability(
  id: string
) {
  await connectDB();

  return await adminRepo.toggleVariantAvailability(id);
}


export async function deleteVariant(id: string) {
  await connectDB();

  return await adminRepo.deleteVariant(id);
}




// ------------------------- OFFER SERVICE -----------------------

export interface OfferPayload {
    title: string;
    discountType: "PERCENTAGE" | "FLAT";
    discountValue: number;
    startDate: Date;
    endDate: Date;
}

// --------------------------------------------------
// CREATE
// --------------------------------------------------

export async function createOfferService(
    data: OfferPayload
) {
    await connectDB();

    validateOfferData(data);

    return adminRepo.createOffer(data);
}

// --------------------------------------------------
// GET LIST
// --------------------------------------------------

export async function getOffersService(
    page: number,
    limit: number,
    search?: string
) {
    await connectDB();

    return adminRepo.getOffers({
        page,
        limit,
        search,
    });
}

// --------------------------------------------------
// GET SINGLE
// --------------------------------------------------

export async function getOfferByIdService(
    id: string
) {
    await connectDB();

    return adminRepo.getOfferById(id);
}

// --------------------------------------------------
// UPDATE
// --------------------------------------------------

export async function updateOfferService(
    id: string,
    data: OfferPayload
) {
    await connectDB();

    validateOfferData(data);

    return adminRepo.updateOffer(id, data);
}

// --------------------------------------------------
// TOGGLE STATUS
// --------------------------------------------------

export async function updateOfferStatusService(
    id: string,
    isActive: boolean
) {
    await connectDB();

    return adminRepo.updateOfferStatus(
        id,
        isActive
    );
}

// --------------------------------------------------
// DELETE
// --------------------------------------------------

export async function deleteOfferService(
    id: string
) {
    await connectDB();

    return adminRepo.deleteOffer(id);
}

// --------------------------------------------------
// VALIDATION
// --------------------------------------------------

function validateOfferData(data: OfferPayload) {
    const title = data.title?.trim();

    if (!title) {
        throw new Error("TITLE_REQUIRED");
    }

    if (!["PERCENTAGE", "FLAT"].includes(
        data.discountType
    )) {
        throw new Error("INVALID_DISCOUNT_TYPE");
    }

    if (
        !Number.isFinite(data.discountValue) ||
        data.discountValue <= 0
    ) {
        throw new Error("INVALID_DISCOUNT_VALUE");
    }

    if (
        data.discountType === "PERCENTAGE" &&
        data.discountValue > 100
    ) {
        throw new Error("PERCENTAGE_CANNOT_EXCEED_100");
    }

    if (!(data.startDate instanceof Date) ||
        Number.isNaN(data.startDate.getTime())) {
        throw new Error("INVALID_START_DATE");
    }

    if (!(data.endDate instanceof Date) ||
        Number.isNaN(data.endDate.getTime())) {
        throw new Error("INVALID_END_DATE");
    }

    if (data.endDate <= data.startDate) {
        throw new Error("END_DATE_MUST_BE_AFTER_START_DATE");
    }
}


//CHECK ADN EXPIRE OFFERS
export async function checkAndUpdateeOfferService() {
  connectDB();

  return await adminRepo.checkAndUpdateeOffer()
}