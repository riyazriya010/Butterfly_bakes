import { Schema, model, models, Model } from "mongoose";

export interface IMenu {
  name: string;
  flavour: string;
  price: number;
  weight: string; // 500g, 1kg, 2kg
  description?: string;
  // image?: string;
  available: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const MenuSchema = new Schema<IMenu>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    flavour: {
      type: String,
      required: true,
      trim: true,
    },

    price: {
      type: Number,
      required: true,
      min: 0,
    },

    weight: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      default: "",
      trim: true,
    },

    // image: {
    //   type: String,
    //   default: "",
    // },

    available: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

MenuSchema.index(
  {
    name: 1,
    flavour: 1,
    weight: 1,
  },
  {
    unique: true,
  }
);

const Menu: Model<IMenu> =
  models.Menu || model<IMenu>("Menu", MenuSchema);

export default Menu;