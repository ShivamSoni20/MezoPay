// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import "forge-std/Test.sol";
import "../src/UsernameRegistry.sol";

contract UsernameRegistryTest is Test {
    UsernameRegistry public registry;
    address alice = address(0xA11CE);
    address bob = address(0xB0B);

    function setUp() public {
        registry = new UsernameRegistry();
    }

    function test_register() public {
        vm.prank(alice);
        registry.register("alice");

        assertEq(registry.resolve("alice"), alice);
        assertEq(registry.reverseLookup(alice), "alice");
    }

    function test_resolve_case_insensitive() public {
        vm.prank(alice);
        registry.register("Alice");

        assertEq(registry.resolve("ALICE"), alice);
        assertEq(registry.resolve("alice"), alice);
    }

    function test_revert_username_taken() public {
        vm.prank(alice);
        registry.register("alice");

        vm.prank(bob);
        vm.expectRevert(UsernameRegistry.UsernameTaken.selector);
        registry.register("alice");
    }

    function test_revert_too_short() public {
        vm.prank(alice);
        vm.expectRevert(UsernameRegistry.InvalidUsername.selector);
        registry.register("ab");
    }

    function test_release_and_reregister() public {
        vm.prank(alice);
        registry.register("alice");

        vm.prank(alice);
        registry.release();

        assertTrue(registry.isAvailable("alice"));

        vm.prank(bob);
        registry.register("alice");
        assertEq(registry.resolve("alice"), bob);
    }
}
