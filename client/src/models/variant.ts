import { Schema, model, models, Model, Types } from "mongoose";

export interface ICakeVariant {
  cakeId: Types.ObjectId;
  cakeName: string;
  weight: number;
  price: number;
  available: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CakeVariantSchema = new Schema<ICakeVariant>(
  {
    cakeId: {
      type: Schema.Types.ObjectId,
      ref: "Menu",
      required: true,
      index: true,
    },

    cakeName: {
        type: String,
        required: true
    },

    weight: {
      type: Number,
      required: true,
      min: 0.5,
    },

    price: {
      type: Number,
      required: true,
      min: 1,
    },

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

// Same cake cannot have duplicate weight
CakeVariantSchema.index(
  {
    cakeId: 1,
    weight: 1,
  },
  {
    unique: true,
  }
);

const CakeVariant: Model<ICakeVariant> =
  models.CakeVariant || model<ICakeVariant>("CakeVariant", CakeVariantSchema);

export default CakeVariant;