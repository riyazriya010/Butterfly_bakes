import Menu from "../models/menu";
import Offer from "../models/offer";
import CakeVariant from "../models/variant";

export interface CreateMenuPayload {
  name: string;
  flavour: string;
  price: number;
  weight: string;
  description?: string;
  image?: string;
  available?: boolean;
}

export class MenuRepository {

  // Get All Menu
  async getAll() {
    return await Menu.find();
  }


  async getMenuWithVariants(
    page: number,
    limit: number,
    search?: string
  ) {
    const skip = (page - 1) * limit;

    const filter: Record<string, any> = {};

    if (search?.trim()) {
      const searchRegex = {
        $regex: search.trim(),
        $options: "i",
      };

      filter.$or = [
        { name: searchRegex },
        { flavour: searchRegex },
        { description: searchRegex },
      ];
    }

    const [menus, total] = await Promise.all([
      Menu.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),

      Menu.countDocuments(filter),
    ]);

    if (!menus.length) {
      return {
        items: [],
        pagination: {
          page,
          limit,
          totalItems: total,
          totalPages: Math.ceil(total / limit),
          hasNextPage: false,
          hasPreviousPage: page > 1,
        },
      };
    }

    const cakeIds = menus.map((menu) => menu._id);

    const variants = await CakeVariant.find({
      cakeId: { $in: cakeIds },
    })
      .sort({ weight: 1, price: 1 })
      .lean();

    const variantsByCakeId = new Map<string, typeof variants>();

    for (const variant of variants) {
      const cakeId = variant.cakeId.toString();

      if (!variantsByCakeId.has(cakeId)) {
        variantsByCakeId.set(cakeId, []);
      }

      variantsByCakeId.get(cakeId)!.push(variant);
    }

    const items = menus.map((menu) => {
      const menuVariants =
        variantsByCakeId.get(menu._id.toString()) || [];

      const prices = menuVariants.map((variant) => variant.price);

      return {
        _id: menu._id,
        name: menu.name,
        flavour: menu.flavour,
        description: menu.description,
        available: menu.available,

        variants: menuVariants.map((variant) => ({
          _id: variant._id,
          cakeId: variant.cakeId,
          cakeName: variant.cakeName,
          weight: variant.weight,
          price: variant.price,
          available: variant.available,
        })),

        minPrice: prices.length > 0 ? Math.min(...prices) : null,
        maxPrice: prices.length > 0 ? Math.max(...prices) : null,

        availableVariantCount: menuVariants.filter(
          (variant) => variant.available
        ).length,

        totalVariantCount: menuVariants.length,
      };
    })
    // LOW → HIGH
  .sort((a, b) => {
    if (a.minPrice === null) return 1;
    if (b.minPrice === null) return -1;

    return a.minPrice - b.minPrice;
  });


    return {
      items,

      pagination: {
        page,
        limit,
        totalItems: total,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page < Math.ceil(total / limit),
        hasPreviousPage: page > 1,
      },
    };
  }

  // Get Menu By Id
  async getById(id: string) {
    return await Menu.findById(id);
  }


  // async checkMenuAvailability(menuId: string) {
  //   const menu = await Menu.findOne({
  //     _id: menuId,
  //   }).lean();

  //   if (!menu) {
  //     return null;
  //   }

  //   return {
  //     _id: menu._id,
  //     name: menu.name,
  //     available: menu.available !== false,
  //   };
  // }



  async checkMenuAvailability(
    cakeId: string,
    variantId: string,
    isOffer: boolean
  ) {
    const cake = await Menu.findById(cakeId).populate("offerId")

    if (!cake) {
      return null;
    }

    const variant = await CakeVariant.findOne({
      _id: variantId,
      cakeId: cakeId,
    }).lean();


    if (!variant) {
      return {
        cakeAvailable: cake.available === true,
        variantAvailable: false,
        cake,
        variant: null,
      };
    }

    const cakeObject = cake.toObject()

    const offer = cakeObject.offerId as any

    const validOffer =
      offer &&
        typeof offer === "object" &&
        (offer.offerStatus === "ACTIVE" ||
          offer.offerStatus === "UPCOMING") &&
        offer.isActive === true
        ? offer
        : {};

    const { offerId, ...cakeWithoutOfferId } = cakeObject;

    return {
      cakeAvailable: cake.available === true,
      variantAvailable: variant.available === true,
      cake: {
        ...cakeWithoutOfferId,
        offer: validOffer,
      },
      variant,
    };
  }



  async getMenuFilterOptions() {
    const [flavours, weights, priceResult] = await Promise.all([
      // Get unique flavours from Menu
      Menu.distinct("flavour", {
        flavour: { $exists: true, $nin: [""] },
      }),

      // Get unique weights from Variant
      CakeVariant.distinct("weight", {
        weight: { $exists: true },
      }),

      // Get min/max variant price
      CakeVariant.aggregate([
        {
          $group: {
            _id: null,
            minPrice: { $min: "$price" },
            maxPrice: { $max: "$price" },
          },
        },
      ]),
    ]);

    const prices = priceResult[0] || {
      minPrice: 0,
      maxPrice: 0,
    };

    return {
      flavours: flavours.sort((a: string, b: string) =>
        a.localeCompare(b)
      ),

      weights: weights.sort(
        (a: number, b: number) => a - b
      ),

      price: {
        min: prices.minPrice,
        max: prices.maxPrice,
      },
    };
  }


  // get single cake details

  async singleCakeDetails(id: string) {

    const cake = await Menu.findById(id).populate("offerId")

    if (!cake) return null

    const variant = await CakeVariant.find({ cakeId: id })


    const cakeObject = cake.toObject()

    const offer = cakeObject.offerId as any

    const validOffer =
      offer &&
        typeof offer === "object" &&
        (offer.offerStatus === "ACTIVE" ||
          offer.offerStatus === "UPCOMING") &&
        offer.isActive === true
        ? offer
        : {};

    const { offerId, ...cakeWithoutOfferId } = cakeObject;

    return {
      cake: {
        ...cakeWithoutOfferId,
        offer: validOffer,
      },
      variant
    }
  }






  // --------------------------------- OFFER



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