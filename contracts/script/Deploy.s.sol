// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import "forge-std/Script.sol";
import "../src/SavingsPot.sol";
import "../src/UsernameRegistry.sol";
import "../src/SplitManager.sol";

contract Deploy is Script {
    address constant MUSD_TESTNET = 0x118917a40FAF1CD7a13dB0Ef56C86De7973Ac503;

    function run() external {
        uint256 deployerKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerKey);

        UsernameRegistry registry = new UsernameRegistry();
        SplitManager splitManager = new SplitManager(MUSD_TESTNET, address(registry));
        SavingsPot pot = new SavingsPot(MUSD_TESTNET);

        console.log("UsernameRegistry: ", address(registry));
        console.log("SplitManager:     ", address(splitManager));
        console.log("SavingsPot:       ", address(pot));

        vm.stopBroadcast();
    }
}
