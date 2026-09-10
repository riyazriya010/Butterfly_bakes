import { Types } from "mongoose";
import Admin from "../models/admin";
import Menu from "../models/menu";
import Offer from "../models/offer";
import CakeVariant from "../models/variant";


interface CreateMenuData {
    name: string;
    flavour: string;
    weight: number;
    price: number;
    description?: string;
    available?: boolean;
    offerId?: string | null
}

export interface OfferPayload {
    title: string;
    discountType: "PERCENTAGE" | "FLAT";
    discountValue: number;
    startDate: Date;
    endDate: Date;
    // isActive: boolean;
}

export interface OfferListParams {
    page: number;
    limit: number;
    search?: string;
}


export class AdminRepository {


    async getOne() {
        return await Admin.findOne();
    }


    // async createMenu(menuData: {
    //     name: string;
    //     flavour: string;
    //     price: number;
    //     weight: string;
    //     description?: string;
    //     image?: string;
    //     available?: boolean;
    // }) {
    //     const duplicate = await Menu.findOne({
    //         name: {
    //             $regex: `^${menuData.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`,
    //             $options: "i",
    //         },
    //         flavour: {
    //             $regex: `^${menuData.flavour.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`,
    //             $options: "i",
    //         },
    //         weight: {
    //             $regex: `^${menuData.weight.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`,
    //             $options: "i",
    //         },
    //     }).lean();

    //     if (duplicate) {
    //         throw new Error("DUPLICATE_MENU");
    //     }

    //     return await Menu.create(menuData);
    // }


    async createMenu(
        menuData: CreateMenuData
    ) {
        const escapeRegex = (value: string) =>
            value.replace(
                /[.*+?^${}()|[\]\\]/g,
                "\\$&"
            );

        console.log('menu data', menuData)

        // --------------------------------------------------
        // CHECK DUPLICATE MENU
        // --------------------------------------------------

        const duplicateMenu =
            await Menu.findOne({
                name: {
                    $regex: `^${escapeRegex(
                        menuData.name
                    )}$`,
                    $options: "i",
                },

                flavour: {
                    $regex: `^${escapeRegex(
                        menuData.flavour
                    )}$`,
                    $options: "i",
                },
            });

        if (duplicateMenu) {
            throw new Error(
                "DUPLICATE_MENU"
            );
        }

        // --------------------------------------------------
        // CREATE MENU
        // --------------------------------------------------

        const formattedCreateData: any = {
            name: menuData.name,
            flavour: menuData.flavour,
            description:
                menuData.description || "",
            available:
                menuData.available ?? true,
        }

        // Only convert offerId if it was explicitly provided in updateData
        if ("offerId" in menuData) {
            formattedCreateData.offerId =
                typeof menuData.offerId === "string" && menuData.offerId.trim() !== ""
                    ? new Types.ObjectId(menuData.offerId)
                    : menuData.offerId === null
                        ? null
                        : undefined;
        }

        const menu = await Menu.create(formattedCreateData);

        // --------------------------------------------------
        // CREATE FIRST VARIANT
        // --------------------------------------------------

        await CakeVariant.create({
            cakeId: menu._id,
            cakeName: menu.name,
            weight: menuData.weight,
            price: menuData.price,
            available: true,
        });

        return menu;
    }


    async getMenuLists({
        page,
        limit,
        search,
    }: {
        page: number;
        limit: number;
        search: string;
    }) {
        const query = search
            ? {
                $or: [
                    {
                        name: {
                            $regex: search,
                            $options: "i",
                        },
                    },
                    {
                        flavour: {
                            $regex: search,
                            $options: "i",
                        },
                    },
                ],
            }
            : {};

        const [data, totalItems] = await Promise.all([
            Menu.find(query)
                .sort({ createdAt: -1 })
                .skip((page - 1) * limit)
                .limit(limit)
                .populate("offerId") // <--- Add this!
                .lean(),

            Menu.countDocuments(query),
        ]);

        const formattedData = data.map((menu) => {
            const { offerId, ...rest } = menu;

            return {
                ...rest,
                offerId: offerId?._id || offerId || null,
                offer: offerId || null,
            };
        });

        const totalPages = Math.ceil(totalItems / limit);

        return {
            data: formattedData,
            pagination: {
                currentPage: page,
                totalPages,
                totalItems,
                limit,
            },
        };
    }


    async updateMenu(
        id: string,
        updateData: Record<string, unknown>
    ) {
        const currentMenu = await Menu.findById(id).lean();

        if (!currentMenu) {
            return null;
        }

        const duplicateQuery = {
            _id: { $ne: id },
            name: updateData.name ?? currentMenu.name,
            flavour: updateData.flavour ?? currentMenu.flavour,
        };

        const duplicate = await Menu.findOne(duplicateQuery).lean();

        if (duplicate) {
            throw new Error("DUPLICATE_MENU");
        }

        // Copy updateData to avoid mutating the original parameter
        const formattedUpdateData: Record<string, unknown> = { ...updateData };

        // Only convert offerId if it was explicitly provided in updateData
        if ("offerId" in updateData) {
            formattedUpdateData.offerId =
                typeof updateData.offerId === "string" && updateData.offerId.trim() !== ""
                    ? new Types.ObjectId(updateData.offerId)
                    : updateData.offerId === null
                        ? null
                        : undefined;
        }

        console.log('formatData', formattedUpdateData)

        const created = await Menu.findByIdAndUpdate(
            id,
            {
                $set: {
                    ...formattedUpdateData, // FIXED: Now passing formattedUpdateData instead of updateData
                    updatedAt: new Date(),
                },
            },
            {
                returnDocument: "after",
                runValidators: true,
            }
        ).populate("offerId") // <--- Add this!
            .lean();

        return created;
    }




    async deleteMenu(id: string) {
        const menu = await Menu.findById(id).lean();

        if (!menu) {
            return null;
        }

        await CakeVariant.deleteMany({
            cakeId: id,
        });

        return await Menu.findByIdAndDelete(id).lean();
    }


    async updateMenuAvailability(
        id: string,
        available: boolean
    ) {
        return await Menu.updateOne(
            { _id: id },
            {
                $set: {
                    available: available,
                    updatedAt: new Date(),
                },
            }
        );
    }



    // ---------------------------------  VARIANTS  ----------------------------

    // create variant
    async createVariant(variantData: {
        cakeId: string;
        cakeName: string;
        price: number;
        weight: number;
        available?: boolean;
    }) {

        // CHECK DUPLICATE
        const duplicate = await CakeVariant.findOne({
            cakeId: variantData.cakeId,
            weight: variantData.weight,
        }).lean();

        if (duplicate) {
            throw new Error("DUPLICATE_VARIANT");
        }

        //CHECK PRICE MISMATCH BETWEEN WEIGHT.
        // Find nearest smaller weight 
        const smallerVariant = await CakeVariant
            .findOne({ cakeId: variantData.cakeId, weight: { $lt: variantData.weight }, })
            .sort({ weight: -1 })
            .select("weight price");

        // Find nearest larger weight 
        const largerVariant = await CakeVariant
            .findOne({ cakeId: variantData.cakeId, weight: { $gt: variantData.weight }, })
            .sort({ weight: 1 })
            .select("weight price");

        // New weight must be more expensive than smaller weight 
        if (smallerVariant && variantData.price <= smallerVariant.price) {
            throw new Error("PRICE_MUST_GREATER_THAN_SMALLER_WEIGHT");
        }

        // New weight must be cheaper than larger weight
        if (largerVariant && variantData.price >= largerVariant.price) {
            throw new Error("PRICE_MUST_LESS_THAN_LARGER_WEIGHT");
        }


        return await CakeVariant.create({
            cakeId: variantData.cakeId,
            cakeName: variantData.cakeName,
            weight: variantData.weight,
            price: variantData.price,
            available: variantData.available ?? true,
        });
    }

    // get all variants
    async getVariantLists({
        page,
        limit,
        search,
    }: {
        page: number;
        limit: number;
        search: string;
    }) {
        const query = search
            ? {
                $or: [
                    {
                        cakeName: {
                            $regex: search,
                            $options: "i",
                        },
                    }
                ],
            }
            : {};

        const [data, totalItems] = await Promise.all([
            CakeVariant.find(query)
                .sort({ createdAt: -1 })
                .skip((page - 1) * limit)
                .limit(limit)
                .lean(),

            CakeVariant.countDocuments(query),
        ]);

        const totalPages = Math.ceil(totalItems / limit);

        return {
            data,
            pagination: {
                currentPage: page,
                totalPages,
                totalItems,
                limit,
            },
        };
    }

    // update variant
    async updateVariant(
        id: string,
        updateData: {
            weight?: number;
            price?: number;
            available?: boolean;
        }
    ) {
        try {

            // -----------------------------------------
            // FIND EXISTING VARIANT
            // -----------------------------------------

            const existingVariant = await CakeVariant
                .findById(id)
                .select("cakeId weight price");

            if (!existingVariant) {
                throw new Error("VARIANT_NOT_FOUND");
            }


            // -----------------------------------------
            // GET FINAL VALUES AFTER UPDATE
            // -----------------------------------------

            const newWeight =
                updateData.weight ?? existingVariant.weight;

            const newPrice =
                updateData.price ?? existingVariant.price;


            // -----------------------------------------
            // CHECK DUPLICATE WEIGHT
            // -----------------------------------------
            // Exclude the current variant itself

            const duplicate = await CakeVariant.findOne({
                _id: { $ne: id },
                cakeId: existingVariant.cakeId,
                weight: newWeight,
            }).lean();

            if (duplicate) {
                throw new Error("DUPLICATE_VARIANT");
            }


            // -----------------------------------------
            // FIND NEAREST SMALLER WEIGHT
            // -----------------------------------------

            const smallerVariant = await CakeVariant
                .findOne({
                    _id: { $ne: id },
                    cakeId: existingVariant.cakeId,
                    weight: { $lt: newWeight },
                })
                .sort({ weight: -1 })
                .select("weight price");


            // -----------------------------------------
            // FIND NEAREST LARGER WEIGHT
            // -----------------------------------------

            const largerVariant = await CakeVariant
                .findOne({
                    _id: { $ne: id },
                    cakeId: existingVariant.cakeId,
                    weight: { $gt: newWeight },
                })
                .sort({ weight: 1 })
                .select("weight price");


            // -----------------------------------------
            // PRICE VALIDATION
            // -----------------------------------------

            // New weight must be more expensive
            // than the nearest smaller weight

            if (
                smallerVariant &&
                newPrice <= smallerVariant.price
            ) {
                throw new Error(
                    "PRICE_MUST_GREATER_THAN_SMALLER_WEIGHT"
                );
            }


            // New weight must be cheaper
            // than the nearest larger weight

            if (
                largerVariant &&
                newPrice >= largerVariant.price
            ) {
                throw new Error(
                    "PRICE_MUST_LESS_THAN_LARGER_WEIGHT"
                );
            }


            // -----------------------------------------
            // UPDATE
            // -----------------------------------------

            return await CakeVariant.findByIdAndUpdate(
                id,
                {
                    $set: updateData,
                },
                {
                    new: true,
                    runValidators: true,
                }
            ).lean();

        } catch (error: any) {

            if (error?.code === 11000) {
                throw new Error("DUPLICATE_VARIANT");
            }

            throw error;
        }
    }


    async toggleVariantAvailability(
        id: string
    ) {
        const variant = await CakeVariant.findById(id)

        if (!variant) {
            return null;
        }

        // Count variants belonging to this cake
        const variantCount = await CakeVariant.countDocuments({
            cakeId: variant.cakeId,
        });

        // Every cake must have at least one variant
        if (variantCount <= 1) {
            throw new Error("MINIMUM_ONE_VARIANT_REQUIRED");
        }

        variant.available = !variant.available;

        await variant.save();

        return variant.toObject();
    }


    async deleteVariant(id: string) {
        const variant = await CakeVariant.findById(id)
            .select("cakeId");

        if (!variant) {
            return null;
        }

        // Count variants belonging to this cake
        const variantCount = await CakeVariant.countDocuments({
            cakeId: variant.cakeId,
        });

        // Every cake must have at least one variant
        if (variantCount <= 1) {
            throw new Error("MINIMUM_ONE_VARIANT_REQUIRED");
        }

        return await CakeVariant.findByIdAndDelete(id).lean();
    }





    // ------------------------------ OFFER ----------------

    // --------------------------------------------------
    // CREATE
    // --------------------------------------------------

    async createOffer(data: OfferPayload) {
        const existingOffer = await Offer.findOne({
            title: data.title,
        }).lean();

        if (existingOffer) {
            throw new Error("DUPLICATE_OFFER");
        }

        const now = new Date();
        const startDate = new Date(data.startDate);

        // Calculate status based on current time vs start date
        // If startDate is in the past or right now, it's ACTIVE; otherwise UPCOMING.
        const offerStatus = startDate <= now ? "ACTIVE" : "UPCOMING";

        return Offer.create({
            ...data,
            offerStatus,
        });

    }

    // --------------------------------------------------
    // GET OFFERS
    // --------------------------------------------------

    async getOffers({
        page,
        limit,
        search,
    }: OfferListParams) {
        const skip = (page - 1) * limit;

        const filter: Record<string, any> = {};

        if (search?.trim()) {
            filter.title = {
                $regex: search.trim(),
                $options: "i",
            };
        }

        const [offers, totalItems] = await Promise.all([
            Offer.find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),

            Offer.countDocuments(filter),
        ]);

        const totalPages = Math.max(
            Math.ceil(totalItems / limit),
            1
        );

        return {
            offers,
            pagination: {
                currentPage: page,
                limit,
                totalItems,
                totalPages,
            },
        };
    }

    // --------------------------------------------------
    // GET SINGLE OFFER
    // --------------------------------------------------

    async getOfferById(id: string) {
        return Offer.findById(id).lean();
    }

    // --------------------------------------------------
    // UPDATE
    // --------------------------------------------------

    async updateOffer(
        id: string,
        data: OfferPayload
    ) {
        // Exclude current offer from duplicate check
        const existingOffer = await Offer.findOne({
            title: data.title,
            _id: { $ne: id },
        }).lean();

        if (existingOffer) {
            throw new Error("DUPLICATE_OFFER");
        }

        const now = new Date();
        const startDate = new Date(data.startDate);

        // Calculate status based on current time vs start date
        // If startDate is in the past or right now, it's ACTIVE; otherwise UPCOMING.
        const offerStatus = startDate <= now ? "ACTIVE" : "UPCOMING";

        const updatedOffer = await Offer.findByIdAndUpdate(
            id,
            {
                $set: { ...data, offerStatus },
            },
            {
                returnDocument: "after",
                runValidators: true,
            }
        ).lean();

        if (!updatedOffer) {
            throw new Error("OFFER_NOT_FOUND");
        }

        return updatedOffer;
    }

    // --------------------------------------------------
    // TOGGLE ACTIVE STATUS
    // --------------------------------------------------

    async updateOfferStatus(
        id: string,
        isActive: boolean
    ) {
        const updatedOffer =
            await Offer.findByIdAndUpdate(
                id,
                {
                    $set: {
                        isActive,
                    },
                },
                {
                    new: true,
                    runValidators: true,
                }
            ).lean();

        if (!updatedOffer) {
            throw new Error("OFFER_NOT_FOUND");
        }

        return updatedOffer;
    }

    // --------------------------------------------------
    // DELETE
    // --------------------------------------------------

    async deleteOffer(id: string) {
        const deletedOffer =
            await Offer.findByIdAndDelete(id).lean();

        if (!deletedOffer) {
            throw new Error("OFFER_NOT_FOUND");
        }

        return deletedOffer;
    }



    // CHECK AND UPDATE ALL OFFERS STATUS
    async checkAndUpdateeOffer() {
        const now = new Date();

        const [expiredResult, activatedResult] = await Promise.all([
            // 1. Mark offers as EXPIRED if their end date has passed
            Offer.updateMany(
                {
                    endDate: { $lt: now },
                    offerStatus: { $ne: "EXPIRED" },
                },
                {
                    $set: { offerStatus: "EXPIRED" },
                }
            ),

            // 2. Mark UPCOMING offers as ACTIVE if their start date has reached/passed
            Offer.updateMany(
                {
                    startDate: { $lte: now },
                    endDate: { $gte: now },
                    offerStatus: "UPCOMING",
                },
                {
                    $set: { offerStatus: "ACTIVE" },
                }
            ),
        ]);

        return {
            expiredCount: expiredResult.modifiedCount,
            activatedCount: activatedResult.modifiedCount,
        };
    }



}