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

  /**
   * Initializes the client based on browser provider or falls back to local.
   */
  async connect(): Promise<{ address: string; client: any }> {
    if (typeof window !== 'undefined' && typeof (window as any).ethereum !== 'undefined') {
      const ethereum = (window as any).ethereum;
      try {
        const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
        this.address = accounts[0];
        
        this.client = createClient({
          chain: studionet,
          account: this.address as `0x${string}`,
          provider: ethereum,
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

  async submitMatch(contractAddress: string, difficulty: string, finalKills: number, summary: string): Promise<string> {
    if (!this.client) {
      throw new Error("Client not initialized. Please connect your wallet.");
    }
    const hash = await this.client.writeContract({
      address: contractAddress,
      functionName: 'record_match',
      args: [difficulty, finalKills, summary],
      value: 0n,
    });
    return hash as string;
  }

  getClient() {
    return this.client;
  }
}

export const genLayerService = new GenLayerService();
