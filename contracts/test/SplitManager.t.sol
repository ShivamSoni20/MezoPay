// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import "forge-std/Test.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "../src/SplitManager.sol";
import "../src/UsernameRegistry.sol";

contract MockMUSD is IERC20 {
    string public constant name = "Mezo USD";
    string public constant symbol = "MUSD";
    uint8 public constant decimals = 18;
    uint256 public override totalSupply;

    mapping(address => uint256) public override balanceOf;
    mapping(address => mapping(address => uint256)) public override allowance;

    function mint(address to, uint256 amount) external {
        balanceOf[to] += amount;
        totalSupply += amount;
        emit Transfer(address(0), to, amount);
    }

    function approve(address spender, uint256 amount) external override returns (bool) {
        allowance[msg.sender][spender] = amount;
        emit Approval(msg.sender, spender, amount);
        return true;
    }

    function transfer(address to, uint256 amount) external override returns (bool) {
        balanceOf[msg.sender] -= amount;
        balanceOf[to] += amount;
        emit Transfer(msg.sender, to, amount);
        return true;
    }

    function transferFrom(address from, address to, uint256 amount) external override returns (bool) {
        allowance[from][msg.sender] -= amount;
        balanceOf[from] -= amount;
        balanceOf[to] += amount;
        emit Transfer(from, to, amount);
        return true;
    }
}

contract SplitManagerTest is Test {
    SplitManager public split;
    UsernameRegistry public registry;
    MockMUSD public musd;

    address creator = address(0xC0);
    address alice = address(0xA1);
    address bob = address(0xB0);

    function setUp() public {
        musd = new MockMUSD();
        registry = new UsernameRegistry();
        split = new SplitManager(address(musd), address(registry));

        musd.mint(alice, 50 ether);
        musd.mint(bob, 50 ether);

        vm.prank(alice);
        musd.approve(address(split), type(uint256).max);
        vm.prank(bob);
        musd.approve(address(split), type(uint256).max);
    }

    function test_createAndSettle() public {
        address[] memory members = new address[](2);
        members[0] = alice;
        members[1] = bob;

        uint256[] memory shares = new uint256[](2);
        shares[0] = 30 ether;
        shares[1] = 30 ether;

        vm.prank(creator);
        bytes32 tabId = split.createTab("Dinner", members, shares);

        vm.prank(creator);
        split.settleTab(tabId);

        assertEq(musd.balanceOf(alice), 20 ether);
        assertEq(musd.balanceOf(bob), 20 ether);
        assertEq(musd.balanceOf(creator), 60 ether);

        (, , , , bool settled, ) = split.getTab(tabId);
        assertTrue(settled);
    }

    function test_revert_non_creator_settle() public {
        address[] memory members = new address[](1);
        members[0] = alice;

        uint256[] memory shares = new uint256[](1);
        shares[0] = 10 ether;

        vm.prank(creator);
        bytes32 tabId = split.createTab("Coffee", members, shares);

        vm.prank(bob);
        vm.expectRevert(SplitManager.NotCreator.selector);
        split.settleTab(tabId);
    }

    function test_revert_double_settle() public {
        address[] memory members = new address[](1);
        members[0] = alice;

        uint256[] memory shares = new uint256[](1);
        shares[0] = 10 ether;

        vm.prank(creator);
        bytes32 tabId = split.createTab("Coffee", members, shares);

        vm.prank(creator);
        split.settleTab(tabId);

        vm.prank(creator);
        vm.expectRevert(SplitManager.AlreadySettled.selector);
        split.settleTab(tabId);
    }

    function test_revert_duplicate_member() public {
        address[] memory members = new address[](2);
        members[0] = alice;
        members[1] = alice;

        uint256[] memory shares = new uint256[](2);
        shares[0] = 10 ether;
        shares[1] = 5 ether;

        vm.prank(creator);
        vm.expectRevert(SplitManager.DuplicateMember.selector);
        split.createTab("Duplicate", members, shares);
    }
}
