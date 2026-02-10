import PhonePeSDK from "phonepe-be-sdk";

export const phonepe = new PhonePeSDK({
  environment: process.env.PHONEPE_ENVIRONMENT || "sandbox",
  merchantId: process.env.PHONEPE_MERCHANT_ID,
  secret: process.env.PHONEPE_CLIENT_SECRET,
  version: process.env.PHONEPE_CLIENT_VERSION
});
