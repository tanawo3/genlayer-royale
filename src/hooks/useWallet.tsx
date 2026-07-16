import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { genLayerService } from '../services/genlayer';
import { createClient, createAccount } from 'genlayer-js';
import { studionet } from 'genlayer-js/chains';
import { GAME_CONTRACT_CODE, GLOBAL_CONTRACT_ADDRESS } from '../lib/gameContract';

interface WalletContextType {
  isConnected: boolean;
  address: string | null;
  balance: number;
  isConnecting: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
  client: any | null; // GenLayerClient
  contractAddress: string | null;
  clearContractAddress: () => void;
  isDeploying: boolean;
  deployContract: () => Promise<void>;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [isConnected, setIsConnected] = useState(false);
  const [address, setAddress] = useState<string | null>(null);
  const [balance, setBalance] = useState(0);
  const [isConnecting, setIsConnecting] = useState(false);
  const [client, setClient] = useState<any | null>(null);
  
  // Default to a globally deployed contract address that the user recently deployed
  const [contractAddress, setContractAddress] = useState<string | null>(GLOBAL_CONTRACT_ADDRESS);
  const [isDeploying, setIsDeploying] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('genlayer_game_contract_v2');
    if (saved) {
      setContractAddress(saved);
    }
  }, []);

  useEffect(() => {
    const checkConnection = async () => {
      const existing = await genLayerService.fetchExistingConnection();
      if (existing) {
         setClient(existing.client);
         setIsConnected(true);
         setAddress(existing.address);
         setBalance(4250.75); // Mock GEN balance
      }
    };
    checkConnection();
  }, []);

  const connect = async () => {
    setIsConnecting(true);
    try {
      const conn = await genLayerService.connect();
      setClient(conn.client);
      setIsConnected(true);
      setAddress(conn.address);
      setBalance(4250.75); // Mock balance
    } catch(e) {
      console.error("Connection failed", e);
    } finally {
      setIsConnecting(false);
    }
  };

  const deployContract = useCallback(async () => {
    if (isDeploying) return;
    setIsDeploying(true);
    try {
      if (!client) {
        throw new Error("Wallet not connected");
      }
      
      const hash = await client.deployContract({
          code: GAME_CONTRACT_CODE,
          args: [],
      });
      const types = await import('genlayer-js/types');
      try {
         const receipt = await client.waitForTransactionReceipt({
             hash: hash as any,
             status: types.TransactionStatus.ACCEPTED,
         });
          const newAddr = receipt.data.contract_address as string;
          // Verify the contract is fully readable on-chain before claiming success
          console.log(`Contract deployed at ${newAddr}. Verifying chain registration...`);
          let isReadyOnChain = false;
          for (let i = 0; i < 12; i++) {
            try {
              await client.readContract({
                address: newAddr as `0x${string}`,
                functionName: 'get_highest_score',
                args: ['Medium']
              });
              isReadyOnChain = true;
              console.log(`Contract verified and fully ready on-chain after ${i + 1} attempt(s) (waiting extra 500ms index gap)`);
              await new Promise((resolve) => setTimeout(resolve, 500));
              break;
            } catch (readErr: any) {
              console.log(`Verification attempt ${i + 1} failed: contract not yet fully indexed. Retrying in 1.5s...`);
              await new Promise((resolve) => setTimeout(resolve, 1500));
            }
          }
          if (!isReadyOnChain) {
            console.warn("Contract deployment verified but reading timed out. Setting address anyway...");
          }
          localStorage.setItem('genlayer_game_contract_v2', newAddr);
          setContractAddress(newAddr);
      } catch (e: any) {
         console.warn("Wait error during transaction receipt check:", e?.message || e);
      } finally {
         setIsDeploying(false);
      }
    } catch(e: any) {
      console.warn("Contract deployment failed:", e?.message || e);
      setIsDeploying(false);
    }
  }, [isDeploying, client]);

  const disconnect = () => {
    genLayerService.disconnect();
    setIsConnected(false);
    setAddress(null);
    setBalance(0);
    setClient(null);
  };

  const clearContractAddress = useCallback(() => {
    sessionStorage.removeItem('genlayer_game_contract');
    localStorage.removeItem('genlayer_game_contract_v2');
    localStorage.removeItem('genlayer_game_contract');
    setContractAddress(null);
  }, []);

  return (
    <WalletContext.Provider value={{ isConnected, address, balance, isConnecting, connect, disconnect, client, contractAddress, clearContractAddress, isDeploying, deployContract }}>
      {children}
    </WalletContext.Provider>
  );
}

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};
