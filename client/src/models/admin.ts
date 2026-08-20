import { Schema, model, models, Model } from "mongoose";

export interface IAdmin {
  email: string;
  password: string;
  is_active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const AdminSchema = new Schema<IAdmin>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },

    password: {
      type: String,
      required: true,
    },

    is_active: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

const Admin: Model<IAdmin> =
  models.Admin || model<IAdmin>("Admin", AdminSchema);

export default Admin;