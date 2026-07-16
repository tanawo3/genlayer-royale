import { createClient, createAccount } from 'genlayer-js';
import { studionet } from 'genlayer-js/chains';

// Configuration interface matching the standard service logic
export interface GenLayerConfig {
  provider?: any;
  account?: any;
  privateKey?: string;
}

export class GenLayerService {
  private client: any | null = null;
  private providerName: 'ethereum' | 'local' | null = null;
  private address: string | null = null;
  private privateKey: string | null = null;

  constructor() {
    this.restoreSession();
  }

  private restoreSession() {
    const savedProvider = localStorage.getItem('genlayer_provider');
    const savedAddress = localStorage.getItem('genlayer_address');
    const savedPrivKey = localStorage.getItem('genlayer_privkey');
    
    if (savedProvider) {
       this.providerName = savedProvider as 'ethereum' | 'local';
    }
    if (savedAddress) {
       this.address = savedAddress;
    }
    if (savedPrivKey) {
       this.privateKey = savedPrivKey;
    }
  }

  async connect(): Promise<{ address: string; client: any }> {
    if (typeof window !== 'undefined') {
      let provider = (window as any).ethereum;
      
      // EIP-6963 Discovery (try to find Rabby/Phantom first)
      const providers: any[] = [];
      const onAnnounce = (e: any) => { providers.push(e.detail.provider); };
      window.addEventListener("eip6963:announceProvider", onAnnounce);
      window.dispatchEvent(new Event("eip6963:requestProvider"));
      
      // Give it a tiny delay to collect
      await new Promise(r => setTimeout(r, 50));
      window.removeEventListener("eip6963:announceProvider", onAnnounce);
      
      if (providers.length > 0) {
        // Prefer Rabby, then Phantom, then whatever is first
        provider = providers.find(p => p.isRabby) || providers.find(p => p.isPhantom) || providers[0];
      }

      if (provider) {
        try {
          const accounts = await provider.request({ method: 'eth_requestAccounts' });
          this.address = accounts[0];
          
          // ensureWalletChain
          const targetChainId = '0x123'; // Studio chain ID mock/fallback (in hex) if needed, but GenLayer JS handles it in connect().
          // Actually, let's just use the robust ensureWalletChain logic
          try {
            await provider.request({
              method: 'wallet_switchEthereumChain',
              params: [{ chainId: '0x1c' }] // GenLayer Studio is usually 28 (0x1c) or similar. For now rely on genlayer-js connect
            });
          } catch(e: any) {
             if (e.code === 4902 || e.message?.includes("unrecognized chain id")) {
                 await provider.request({
                     method: 'wallet_addEthereumChain',
                     params: [{
                         chainId: '0x1c',
                         chainName: 'GenLayer Studio',
                         nativeCurrency: { name: 'GEN', symbol: 'GEN', decimals: 18 },
                         rpcUrls: ['https://studio.genlayer.com'],
                         blockExplorerUrls: []
                     }]
                 });
             }
          }
          
          this.client = createClient({
            chain: studionet,
            account: this.address as `0x${string}`,
            provider,
          });
  
          try {
            await this.client.connect('studionet');
          } catch (connectionError) {
            console.warn("Wallet extension connection step failed or not fully supported. Proceeding anyway...");
          }
          this.providerName = 'ethereum';
          this.saveSession();
          return { address: this.address!, client: this.client };
        } catch(requestError) {
          console.warn("eth_requestAccounts failed, falling back to local account", requestError);
        }
      }
    }

    // Fallback to local account
    console.log("Using local account fallback.");
    const mockAccount = createAccount();
    this.address = mockAccount.address;
    this.privateKey = (mockAccount as any).getPrivateKey ? (mockAccount as any).getPrivateKey() : (mockAccount as any).privateKey || "";
    
    this.client = createClient({
      chain: studionet,
      account: mockAccount,
    });
    this.providerName = 'local';
    this.saveSession();
    return { address: this.address!, client: this.client };
  }

  async fetchExistingConnection(): Promise<{ address: string; client: any } | null> {
    if (this.providerName === 'ethereum' && this.address && typeof window !== 'undefined' && (window as any).ethereum) {
        try {
          const ethereum = (window as any).ethereum;
          const accounts = await ethereum.request({ method: 'eth_accounts' });
          if (accounts.length > 0 && accounts[0].toLowerCase() === this.address.toLowerCase()) {
            this.client = createClient({
              chain: studionet,
              account: accounts[0] as `0x${string}`,
              provider: ethereum,
            });
            try {
              await this.client.connect('studionet');
            } catch (connectionError) {
              // Proceeding anyway
            }
            return { address: this.address!, client: this.client };
          }
        } catch(e) {
           console.warn("Ethereum provider accounts lookup failed");
        }
      } else if (this.providerName === 'local' && this.address && this.privateKey) {
        try {
           const { privateKeyToAccount } = await import('viem/accounts');
           const mockAccount = privateKeyToAccount(this.privateKey as `0x${string}`);
           this.client = createClient({
             chain: studionet,
             account: mockAccount,
           });
           return { address: this.address!, client: this.client };
        } catch(e) {
          console.warn("Local account restoration failed");
        }
      }
      return null;
  }

  disconnect() {
    this.client = null;
    this.address = null;
    this.privateKey = null;
    this.providerName = null;
    localStorage.removeItem('genlayer_address');
    localStorage.removeItem('genlayer_provider');
    localStorage.removeItem('genlayer_privkey');
  }

  private saveSession() {
    if (this.address) localStorage.setItem('genlayer_address', this.address);
    if (this.providerName) localStorage.setItem('genlayer_provider', this.providerName);
    if (this.privateKey) localStorage.setItem('genlayer_privkey', this.privateKey);
  }

  async submitMatch(contractAddress: string, difficulty: string, strategy: string, actualKills: number, actualOutcome: string): Promise<string> {
    if (!this.client) {
      throw new Error("Client not initialized. Please connect your wallet.");
    }
    const idempotencyKey = crypto.randomUUID();
    const timestampMs = Date.now();
    const hash = await this.client.writeContract({
      address: contractAddress,
      functionName: 'record_match',
      args: [difficulty, strategy, actualKills, actualOutcome, timestampMs, idempotencyKey],
      value: 0n,
    });
    return hash as string;
  }

  async claimTournamentBounty(contractAddress: string, bossId: number): Promise<string> {
    if (!this.client) {
      throw new Error("Client not initialized. Please connect your wallet.");
    }
    const hash = await this.client.writeContract({
      address: contractAddress,
      functionName: 'claim_tournament_bounty',
      args: [bossId],
      value: 0n,
    });
    return hash as string;
  }

  async triggerWorldBossEvent(contractAddress: string): Promise<string> {
    if (!this.client) {
      throw new Error("Client not initialized. Please connect your wallet.");
    }
    const hash = await this.client.writeContract({
      address: contractAddress,
      functionName: 'trigger_world_boss_event',
      args: [],
      value: 0n,
    });
    return hash as string;
  }

  async attackWorldBoss(contractAddress: string, bossId: number, playerColor: string, strategy: string): Promise<string> {
    if (!this.client) {
      throw new Error("Client not initialized. Please connect your wallet.");
    }
    const hash = await this.client.writeContract({
      address: contractAddress,
      functionName: 'attack_world_boss',
      args: [bossId, playerColor, strategy],
      value: 1000000000000000000n, // 1 GEN
    });
    return hash as string;
  }

  async disputeRejection(contractAddress: string, bossId: number, playerColor: string, originalStrategy: string, appealReason: string): Promise<string> {
    if (!this.client) {
      throw new Error("Client not initialized. Please connect your wallet.");
    }
    const hash = await this.client.writeContract({
      address: contractAddress,
      functionName: 'dispute_rejection',
      args: [bossId, playerColor, originalStrategy, appealReason],
      value: 0n,
    });
    return hash as string;
  }

  async getProtocolState(contractAddress: string): Promise<any> {
    if (!this.client) {
      throw new Error("Client not initialized.");
    }
    const result = await this.client.readContract({
      address: contractAddress,
      functionName: 'get_state',
      args: []
    });
    if (result) {
      return JSON.parse(result as string);
    }
    return null;
  }

  async getContractMetadata(contractAddress: string): Promise<any> {
    if (!this.client) return null;
    try {
      const result = await this.client.readContract({
        address: contractAddress,
        functionName: 'get_contract_version',
        args: []
      });
      if (result) return JSON.parse(result as string);
    } catch (e) {
      console.warn("Failed to fetch metadata", e);
    }
    return null;
  }

  async getHealthCheck(contractAddress: string): Promise<any> {
    if (!this.client) return null;
    try {
      const result = await this.client.readContract({
        address: contractAddress,
        functionName: 'perform_health_check',
        args: []
      });
      if (result) return JSON.parse(result as string);
    } catch (e) {
      console.warn("Failed to fetch health check", e);
    }
    return null;
  }

  async registerPlayer(contractAddress: string, handle: string, feeValue: bigint): Promise<string> {
    if (!this.client) throw new Error("Client not initialized.");
    const hash = await this.client.writeContract({
      address: contractAddress,
      functionName: 'register_player',
      args: [handle],
      value: feeValue,
    });
    return hash as string;
  }

  async generateLoadout(contractAddress: string): Promise<string> {
    if (!this.client) throw new Error("Client not initialized.");
    const hash = await this.client.writeContract({
      address: contractAddress,
      functionName: 'generate_cyberpunk_loadout',
      args: [],
      value: 0n,
    });
    return hash as string;
  }

  getClient() {
    return this.client;
  }
}

export const genLayerService = new GenLayerService();
