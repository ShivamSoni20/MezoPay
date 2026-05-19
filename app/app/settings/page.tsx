"use client";

import { useState, useEffect } from "react";
import { useApp } from "../context";
import { usePublicClient, useWriteContract } from "wagmi";
import { parseAbi } from "viem";
import { CONTRACTS, REGISTRY_ABI } from "@/lib/contracts";

export default function SettingsPage() {
  const { username, address, showToast, refetchData } = useApp();
  const publicClient = usePublicClient();
  const { writeContractAsync } = useWriteContract();

  const [claimInput, setClaimInput] = useState("");
  const [isChecking, setIsChecking] = useState(false);
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Check username availability on change
  useEffect(() => {
    if (!claimInput) {
      setIsAvailable(null);
      return;
    }

    const cleanInput = claimInput.replace("@", "").trim().toLowerCase();
    if (cleanInput.length < 3) {
      setIsAvailable(false);
      return;
    }

    const checkAvailability = async () => {
      setIsChecking(true);
      try {
        if (publicClient) {
          const result = await publicClient.readContract({
            address: CONTRACTS.USERNAME_REGISTRY,
            abi: parseAbi(REGISTRY_ABI),
            functionName: "isAvailable",
            args: [cleanInput],
          });
          setIsAvailable(result as boolean);
        } else {
          // Simulation fallback
          setIsAvailable(true);
        }
      } catch (err) {
        console.error("Availability check failed", err);
        setIsAvailable(true); // Fallback to allow button click
      } finally {
        setIsChecking(false);
      }
    };

    const timer = setTimeout(checkAvailability, 500);
    return () => clearTimeout(timer);
  }, [claimInput, publicClient]);

  const handleClaim = async () => {
    if (!claimInput) return;
    const cleanInput = claimInput.replace("@", "").trim().toLowerCase();
    setIsSubmitting(true);

    try {
      showToast("Registering username on-chain...");

      if (publicClient) {
        const hash = await writeContractAsync({
          address: CONTRACTS.USERNAME_REGISTRY,
          abi: parseAbi(REGISTRY_ABI),
          functionName: "register",
          args: [cleanInput],
        });
        showToast(`Registered @${cleanInput}!`, hash.slice(0, 8));
      } else {
        // Simulation mode
        await new Promise((resolve) => setTimeout(resolve, 1500));
        showToast(`Simulated: Registered @${cleanInput}!`);
      }

      setClaimInput("");
      refetchData();
    } catch (e: any) {
      console.error(e);
      showToast(e.message || "Registration failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRelease = async () => {
    if (!confirm("Are you sure you want to release your username? Anyone will be able to claim it.")) {
      return;
    }
    setIsSubmitting(true);

    try {
      showToast("Releasing username...");

      if (publicClient) {
        const hash = await writeContractAsync({
          address: CONTRACTS.USERNAME_REGISTRY,
          abi: parseAbi(REGISTRY_ABI),
          functionName: "release",
        });
        showToast("Released username successfully", hash.slice(0, 8));
      } else {
        // Simulation mode
        await new Promise((resolve) => setTimeout(resolve, 1500));
        showToast("Released username successfully (Simulated)");
      }

      refetchData();
    } catch (e: any) {
      console.error(e);
      showToast(e.message || "Failed to release handle");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="sc max-w-[680px]">
      <div className="sc-head">
        <span className="sc-title">Account Settings</span>
      </div>

      <div className="settings-list">
        {/* USERNAME REGISTRY SECTION */}
        <div className="settings-section">
          <div className="settings-section-title">On-Chain Profile (@Username)</div>

          {username ? (
            <div>
              <p className="text-sm text-[var(--gray)] mb-4 leading-normal">
                You have successfully registered a case-insensitive username on the Mezo Username Registry. This name maps directly to your wallet address.
              </p>
              <div
                className="flex items-center justify-between p-4 border border-[var(--border)] rounded-xl bg-[var(--gray-light)]"
                style={{ marginBottom: "16px" }}
              >
                <div>
                  <div className="text-xs font-bold text-[var(--gray)] uppercase tracking-wider">
                    Your Username
                  </div>
                  <div className="font-[var(--font-syne)] text-xl font-extrabold text-[var(--orange)] mt-1">
                    @{username}
                  </div>
                </div>
                <button
                  className="tb-btn"
                  onClick={handleRelease}
                  disabled={isSubmitting}
                  style={{ color: "var(--red)", borderColor: "var(--red)" }}
                >
                  {isSubmitting ? "Releasing..." : "Release Handle"}
                </button>
              </div>
            </div>
          ) : (
            <div>
              <p className="text-sm text-[var(--gray)] mb-4 leading-normal">
                Claim your case-insensitive username on the Mezo Testnet registry. Once claimed, other users can pay you using your handle instead of your 42-character hex address.
              </p>
              <div className="fg">
                <label>Desired Handle</label>
                <div className="flex gap-3">
                  <div style={{ flex: 1, position: "relative" }}>
                    <input
                      className="fi"
                      type="text"
                      placeholder="username"
                      value={claimInput}
                      onChange={(e) => setClaimInput(e.target.value)}
                      style={{ paddingLeft: "15px" }}
                    />
                  </div>
                  <button
                    className="tb-btn primary"
                    onClick={handleClaim}
                    disabled={isSubmitting || isChecking || !isAvailable || claimInput.length < 3}
                    style={{ whiteSpace: "nowrap" }}
                  >
                    {isSubmitting ? "Claiming..." : "Claim Username"}
                  </button>
                </div>

                {claimInput && (
                  <div className="text-xs font-bold mt-2">
                    {isChecking ? (
                      <span className="text-[var(--gray)]">Checking availability...</span>
                    ) : isAvailable ? (
                      <span className="text-[var(--green)]">✓ @{claimInput.replace("@", "").toLowerCase()} is available!</span>
                    ) : (
                      <span className="text-[var(--red)]">✗ Unavailable or too short (min 3 chars)</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* PASSPORT DETAIL */}
        <div className="settings-section">
          <div className="settings-section-title">Wallet & Credentials</div>
          <div className="passport-box">
            <div className="pb-label">Mezo Passport Address</div>
            <div className="pb-addr">{address}</div>
          </div>
          <p className="text-xs text-[var(--gray)] leading-normal mt-2">
            Mezo Passport acts as your smart-wallet account on the Mezo ecosystem, sponsoring transactions and bridging assets with gasless ease.
          </p>
        </div>

        {/* NETWORK METADATA */}
        <div className="settings-section">
          <div className="settings-section-title">Developer & Network Info</div>
          <div className="flex flex-col gap-3">
            <div className="setting-row">
              <div className="sr-info">
                <h4>Network Status</h4>
                <p>RPC and Network chain details.</p>
              </div>
              <span className="s-tag live">Connected</span>
            </div>

            <div className="setting-row">
              <div className="sr-info">
                <h4>Chain ID</h4>
                <p>Mezo Testnet Chain Spec.</p>
              </div>
              <span className="font-bold text-sm">31611</span>
            </div>

            <div className="setting-row">
              <div className="sr-info">
                <h4>MUSD Address</h4>
                <p>The stablecoin contract address.</p>
              </div>
              <span className="text-xs font-mono text-[var(--gray)]">
                {CONTRACTS.MUSD.slice(0, 10)}...{CONTRACTS.MUSD.slice(-8)}
              </span>
            </div>

            <div className="setting-row">
              <div className="sr-info">
                <h4>UsernameRegistry Address</h4>
                <p>The registered handle registry contract.</p>
              </div>
              <span className="text-xs font-mono text-[var(--gray)]">
                {CONTRACTS.USERNAME_REGISTRY.slice(0, 10)}...{CONTRACTS.USERNAME_REGISTRY.slice(-8)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
