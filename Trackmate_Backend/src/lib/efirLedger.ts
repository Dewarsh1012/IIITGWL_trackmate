import { Contract, JsonRpcProvider, Wallet, isAddress } from 'ethers';

const EFIR_LEDGER_ABI = [
    'function fileFIR(string _firNumber, string _dataHash, address _complainant) external',
    'function updateFIRStatus(string _firNumber, string _newStatus) external',
    'function getEFIRData(string _firNumber) external view returns (string dataHash, address complainant, string status, uint256 timestamp)',
] as const;

export interface LedgerReadData {
    firNumber: string;
    dataHash: string;
    complainant: string;
    status: string;
    timestamp: number;
}

export interface LedgerAnchorResult {
    configured: boolean;
    status: 'not_configured' | 'anchored' | 'failed';
    txHash?: string;
    chainId?: string;
    alreadyAnchored?: boolean;
    error?: string;
}

export interface LedgerStatusResult {
    configured: boolean;
    status: 'not_configured' | 'updated' | 'failed';
    txHash?: string;
    error?: string;
}

interface LedgerConfig {
    rpcUrl?: string;
    contractAddress?: string;
    privateKey?: string;
}

function getConfig(): LedgerConfig {
    return {
        rpcUrl: process.env.EFIR_LEDGER_RPC_URL,
        contractAddress: process.env.EFIR_LEDGER_CONTRACT_ADDRESS,
        privateKey: process.env.EFIR_LEDGER_OWNER_PRIVATE_KEY,
    };
}

function hasReadConfig(config: LedgerConfig): config is Required<Pick<LedgerConfig, 'rpcUrl' | 'contractAddress'>> {
    return Boolean(config.rpcUrl && config.contractAddress);
}

function hasWriteConfig(config: LedgerConfig): config is Required<Pick<LedgerConfig, 'rpcUrl' | 'contractAddress' | 'privateKey'>> {
    return Boolean(config.rpcUrl && config.contractAddress && config.privateKey);
}

export function isLedgerReadConfigured(): boolean {
    return hasReadConfig(getConfig());
}

export function isLedgerWriteConfigured(): boolean {
    return hasWriteConfig(getConfig());
}

async function getReadContract(): Promise<Contract> {
    const config = getConfig();
    if (!hasReadConfig(config)) {
        throw new Error('Ledger read configuration missing (EFIR_LEDGER_RPC_URL / EFIR_LEDGER_CONTRACT_ADDRESS).');
    }

    const provider = new JsonRpcProvider(config.rpcUrl);
    return new Contract(config.contractAddress, EFIR_LEDGER_ABI, provider);
}

async function getWriteContract(): Promise<{ contract: Contract; provider: JsonRpcProvider; wallet: Wallet }> {
    const config = getConfig();
    if (!hasWriteConfig(config)) {
        throw new Error('Ledger write configuration missing (EFIR_LEDGER_RPC_URL / EFIR_LEDGER_CONTRACT_ADDRESS / EFIR_LEDGER_OWNER_PRIVATE_KEY).');
    }

    const provider = new JsonRpcProvider(config.rpcUrl);
    const wallet = new Wallet(config.privateKey, provider);
    const contract = new Contract(config.contractAddress, EFIR_LEDGER_ABI, wallet);
    return { contract, provider, wallet };
}

export async function readEFIRFromLedger(firNumber: string): Promise<LedgerReadData | null> {
    if (!isLedgerReadConfigured()) return null;

    try {
        const contract = await getReadContract();
        const [dataHash, complainant, status, timestampRaw] = await contract.getEFIRData(firNumber);
        return {
            firNumber,
            dataHash: String(dataHash),
            complainant: String(complainant),
            status: String(status),
            timestamp: Number(timestampRaw),
        };
    } catch (err) {
        const message = String((err as { message?: string })?.message || err || '');
        if (message.toLowerCase().includes('fir does not exist')) return null;
        throw err;
    }
}

export async function anchorEFIRToLedger(args: {
    firNumber: string;
    dataHash: string;
    complainantAddress?: string;
}): Promise<LedgerAnchorResult> {
    if (!isLedgerWriteConfigured()) {
        return { configured: false, status: 'not_configured' };
    }

    const { firNumber, dataHash } = args;

    try {
        const { contract, provider, wallet } = await getWriteContract();
        const complainant = args.complainantAddress && isAddress(args.complainantAddress)
            ? args.complainantAddress
            : wallet.address;

        try {
            const tx = await contract.fileFIR(firNumber, dataHash, complainant);
            await tx.wait();
            const network = await provider.getNetwork();
            return {
                configured: true,
                status: 'anchored',
                txHash: tx.hash,
                chainId: network.chainId.toString(),
            };
        } catch (err) {
            const message = String((err as { shortMessage?: string; message?: string })?.shortMessage || (err as { message?: string })?.message || err || '');
            if (message.toLowerCase().includes('fir already exists')) {
                const onChain = await readEFIRFromLedger(firNumber);
                if (onChain && onChain.dataHash.toLowerCase() === dataHash.toLowerCase()) {
                    return {
                        configured: true,
                        status: 'anchored',
                        alreadyAnchored: true,
                    };
                }

                return {
                    configured: true,
                    status: 'failed',
                    alreadyAnchored: true,
                    error: 'Existing on-chain eFIR hash does not match local record.',
                };
            }

            return {
                configured: true,
                status: 'failed',
                error: message,
            };
        }
    } catch (err) {
        return {
            configured: true,
            status: 'failed',
            error: String((err as { message?: string })?.message || err),
        };
    }
}

export async function updateEFIRStatusOnLedger(args: {
    firNumber: string;
    status: string;
}): Promise<LedgerStatusResult> {
    if (!isLedgerWriteConfigured()) {
        return { configured: false, status: 'not_configured' };
    }

    try {
        const { contract } = await getWriteContract();
        const tx = await contract.updateFIRStatus(args.firNumber, args.status.toUpperCase());
        await tx.wait();

        return {
            configured: true,
            status: 'updated',
            txHash: tx.hash,
        };
    } catch (err) {
        return {
            configured: true,
            status: 'failed',
            error: String((err as { shortMessage?: string; message?: string })?.shortMessage || (err as { message?: string })?.message || err),
        };
    }
}
