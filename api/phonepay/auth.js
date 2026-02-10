import crypto from "crypto";

export function phonePeHeaders(payload) {
  const saltKey = process.env.PHONEPE_SALT_KEY;
  const saltIndex = process.env.PHONEPE_SALT_INDEX;

  const base64Payload = Buffer.from(JSON.stringify(payload)).toString("base64");
  const string = base64Payload + "/pg/v1/pay" + saltKey;

  const sha256 = crypto.createHash("sha256").update(string).digest("hex");
  const checksum = `${sha256}###${saltIndex}`;

  return { base64Payload, checksum };
}
