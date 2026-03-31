import { initWallet, getWalletClient } from "../src/wallet";
import { config } from "../src/config";
import { logger } from "../src/logger";
import { parseEther, formatEther } from "viem";

/**
 * Script para convertir ETH a WETH en Base Sepolia.
 *
 * Uso: npx ts-node scripts/wrap-eth.ts [cantidad]
 * Ejemplo: npx ts-node scripts/wrap-eth.ts 2.3
 *
 * Si no se especifica cantidad, convierte 2.3 ETH por defecto.
 */

async function main() {
  const ethAmount = process.argv[2] || "2.3";
  const amountWei = parseEther(ethAmount);

  logger.info("ETH → WETH Wrap Script", {
    amount: ethAmount,
    network: config.NETWORK_ID,
  });

  // Inicializar wallet
  await initWallet();
  const client = getWalletClient();
  const address = client.getAddress();

  logger.info("Wallet loaded", { address });

  // Verificar balance WETH antes
  const wethAbi = [
    {
      name: "balanceOf",
      type: "function",
      stateMutability: "view",
      inputs: [{ type: "address" }],
      outputs: [{ type: "uint256" }],
    },
  ] as const;

  const wethBefore = await client.readContract({
    address: config.WETH_ADDRESS,
    abi: wethAbi,
    functionName: "balanceOf",
    args: [address as `0x${string}`],
  });

  logger.info("Before wrap", {
    wethBalance: formatEther(wethBefore as bigint),
  });

  // Ejecutar wrap: enviar ETH al contrato WETH con data = deposit()
  logger.info(`Wrapping ${ethAmount} ETH → WETH...`);

  const txHash = await client.sendTransaction({
    to: config.WETH_ADDRESS,
    value: amountWei,
    data: "0xd0e30db0", // deposit() function selector
  });

  logger.info("Transaction sent", {
    hash: txHash,
    amount: ethAmount,
  });

  // Esperar confirmación
  logger.info("Waiting for confirmation...");
  await new Promise((resolve) => setTimeout(resolve, 15000));

  // Verificar nuevo balance WETH
  const wethAfter = await client.readContract({
    address: config.WETH_ADDRESS,
    abi: wethAbi,
    functionName: "balanceOf",
    args: [address as `0x${string}`],
  });

  logger.info("Wrap complete!", {
    wethBefore: formatEther(wethBefore as bigint),
    wethAfter: formatEther(wethAfter as bigint),
    wrapped: formatEther((wethAfter as bigint) - (wethBefore as bigint)),
    txHash,
  });
}

main().catch((error) => {
  logger.error("Wrap failed", { error: error.message });
  process.exit(1);
});
