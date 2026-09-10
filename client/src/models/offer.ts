import { Schema, model, models, Model, Document } from 'mongoose';

export type DiscountType = 'PERCENTAGE' | 'FLAT';

export interface IOffer extends Document {
  title: string;
  discountType: DiscountType;
  discountValue: number;
  startDate: Date;
  endDate: Date;
  offerStatus: "ACTIVE" | "EXPIRED" | "UPCOMING";
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const offerSchema = new Schema<IOffer>(
  {
    title: {
      type: String,
      required: [true, 'Offer title is required'],
      trim: true,
    },
    discountType: {
      type: String,
      enum: ['PERCENTAGE', 'FLAT'],
      required: [true, 'Discount type is required'],
    },
    discountValue: {
      type: Number,
      required: [true, 'Discount value is required'],
      min: [1, 'Discount value cannot be negative'],
    },
    startDate: {
      type: Date,
      required: [true, 'Start date is required'],
    },
    endDate: {
      type: Date,
      required: [true, 'End date is required'],
    },
    offerStatus: {
        type: String,
        enum: ["ACTIVE", "EXPIRED", "UPCOMING"],
        required: [true, "Offer status required"],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

const Offer: Model<IOffer> =
  models.Offer || model<IOffer>("Offer", offerSchema);

export default Offer;