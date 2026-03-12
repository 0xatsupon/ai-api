import "dotenv/config";

export const config = {
  port: parseInt(process.env.PORT || "3000", 10),
  walletAddress: process.env.WALLET_ADDRESS || "0x0000000000000000000000000000000000000000",
  network: process.env.NETWORK || "eip155:84532", // Base Sepolia (testnet)
  facilitatorUrl: process.env.FACILITATOR_URL || "https://facilitator.xpay.sh",
};
