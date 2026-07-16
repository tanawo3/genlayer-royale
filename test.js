import { createClient } from 'genlayer-js';
import { studionet } from 'genlayer-js/chains';

async function main() {
  const client = createClient({
    chain: studionet
  });

  const contractAddress = '0xCF80A2554C340574186d5d7e3CB7713dF59Ab657';
  const playerAddr = '0x60f5Bda825DAFb1993Ad85Be7395ac8f67Dbf431';

  try {
    const statsData = await client.readContract({
      address: contractAddress,
      functionName: 'get_player_stats',
      args: [playerAddr]
    });
    console.log("Raw statsData:", statsData);
  } catch (err) {
    console.error("Error:", err);
  }
}
main();
