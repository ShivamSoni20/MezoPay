export const MEZO_TESTNET_CHAIN_ID = 31611;
export const MEZO_TESTNET_RPC = "https://rpc.test.mezo.org";

export const CONTRACTS = {
  MUSD: "0x118917a40FAF1CD7a13dB0Ef56C86De7973Ac503" as `0x${string}`,
  USERNAME_REGISTRY:
    (process.env.NEXT_PUBLIC_REGISTRY ||
      "0x8eB4E69A550Dc63BaB674469eBC516d893793de8") as `0x${string}`,
  SPLIT_MANAGER:
    (process.env.NEXT_PUBLIC_SPLIT ||
      "0x11B5B5058C85CB446e4d68765B24661Da58BE83A") as `0x${string}`,
  SAVINGS_POT:
    (process.env.NEXT_PUBLIC_SAVINGS_POT ||
      "0xCEB877c8dD2f67A77353790d961Ee56fF7F1a4e4") as `0x${string}`,
} as const;

export const MUSD_ABI = [
  "function balanceOf(address) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function transferFrom(address from, address to, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function permit(address owner, address spender, uint256 value, uint256 deadline, uint8 v, bytes32 r, bytes32 s)",
  "function nonces(address owner) view returns (uint256)",
  "function DOMAIN_SEPARATOR() view returns (bytes32)",
  "function name() view returns (string)",
] as const;

export const REGISTRY_ABI = [
  "function register(string username)",
  "function resolve(string username) view returns (address)",
  "function reverseLookup(address wallet) view returns (string)",
  "function isAvailable(string username) view returns (bool)",
  "function release()",
] as const;

export const SPLIT_ABI = [
  "function createTab(string title, address[] members, uint256[] shares) returns (bytes32)",
  "function settleTab(bytes32 tabId)",
  "function settleWithPermit(bytes32 tabId, address member, uint256 amount, uint256 deadline, uint8 v, bytes32 r, bytes32 s)",
  "function payShare(bytes32 tabId)",
  "function getTab(bytes32 tabId) view returns (address, string, address[], uint256[], bool, uint256)",
  "function hasPaid(bytes32 tabId, address member) view returns (bool)",
  "function getUserTabs(address user) view returns (bytes32[])",
  "function totalAmount(bytes32 tabId) view returns (uint256)",
] as const;

export const SAVINGS_POT_ABI = [
  "function createPot(string name, uint256 target, uint256 lockSeconds) returns (bytes32)",
  "function deposit(bytes32 potId, uint256 amount)",
  "function withdraw(bytes32 potId)",
  "function creatorUnlock(bytes32 potId)",
  "function getDeposit(bytes32 potId, address user) view returns (uint256)",
  "function pots(bytes32) view returns (address creator, string name, uint256 targetAmount, uint256 totalDeposited, uint256 unlockTime, bool distributed)",
  "function potCount() view returns (uint256)"
] as const;
