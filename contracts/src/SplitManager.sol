// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Permit.sol";

/**
 * @title SplitManager
 * @notice Creates and settles MUSD group tabs on Mezo.
 */
contract SplitManager {
    IERC20 public immutable musd;
    address public immutable registry;

    uint256 public tabCount;

    struct Tab {
        bytes32 id;
        address creator;
        string title;
        address[] members;
        uint256[] shares;
        mapping(address => bool) paid;
        mapping(address => uint256) owed;
        bool settled;
        uint256 paidCount;
        uint256 createdAt;
    }

    mapping(bytes32 => Tab) private _tabs;
    mapping(address => bytes32[]) public userTabs;

    event TabCreated(bytes32 indexed tabId, address indexed creator, string title, uint256 total);
    event TabSettled(bytes32 indexed tabId, uint256 totalMUSD);
    event MemberPaid(bytes32 indexed tabId, address indexed member, uint256 amount);

    error TabNotFound();
    error AlreadySettled();
    error NotCreator();
    error MembersSharesMismatch();
    error ZeroMembers();
    error InvalidMember();
    error InvalidShare();
    error DuplicateMember();
    error AmountMismatch();

    constructor(address _musd, address _registry) {
        if (_musd == address(0) || _registry == address(0)) revert InvalidMember();
        musd = IERC20(_musd);
        registry = _registry;
    }

    function createTab(
        string calldata title,
        address[] calldata members,
        uint256[] calldata shares
    ) external returns (bytes32 tabId) {
        if (members.length == 0) revert ZeroMembers();
        if (members.length != shares.length) revert MembersSharesMismatch();

        tabId = keccak256(abi.encodePacked(msg.sender, tabCount++, block.timestamp, block.chainid));

        Tab storage t = _tabs[tabId];
        t.id = tabId;
        t.creator = msg.sender;
        t.title = title;
        t.createdAt = block.timestamp;

        uint256 total;
        for (uint256 i = 0; i < members.length; i++) {
            address member = members[i];
            uint256 share = shares[i];

            if (member == address(0)) revert InvalidMember();
            if (share == 0) revert InvalidShare();
            if (t.owed[member] != 0) revert DuplicateMember();

            t.members.push(member);
            t.shares.push(share);
            t.owed[member] = share;
            total += share;
            userTabs[member].push(tabId);
        }

        userTabs[msg.sender].push(tabId);
        emit TabCreated(tabId, msg.sender, title, total);
    }

    function settleTab(bytes32 tabId) external {
        Tab storage t = _requireOpenTab(tabId);
        if (msg.sender != t.creator) revert NotCreator();

        uint256 total;
        for (uint256 i = 0; i < t.members.length; i++) {
            address member = t.members[i];
            if (!t.paid[member]) {
                uint256 share = t.shares[i];
                _markPaid(t, member);
                musd.transferFrom(member, t.creator, share);
                total += share;
                emit MemberPaid(tabId, member, share);
            }
        }

        t.settled = true;
        emit TabSettled(tabId, total);
    }

    function settleWithPermit(
        bytes32 tabId,
        address member,
        uint256 amount,
        uint256 deadline,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external {
        Tab storage t = _requireOpenTab(tabId);
        uint256 owed = t.owed[member];
        if (owed == 0) revert InvalidMember();
        if (amount != owed) revert AmountMismatch();
        if (t.paid[member]) return;

        IERC20Permit(address(musd)).permit(member, address(this), amount, deadline, v, r, s);

        _markPaid(t, member);
        musd.transferFrom(member, t.creator, amount);
        emit MemberPaid(tabId, member, amount);

        if (t.paidCount == t.members.length) {
            t.settled = true;
            emit TabSettled(tabId, totalAmount(tabId));
        }
    }

    function payShare(bytes32 tabId) external {
        Tab storage t = _requireOpenTab(tabId);
        uint256 owed = t.owed[msg.sender];
        if (owed == 0) revert InvalidMember();
        if (t.paid[msg.sender]) return; // Or revert AlreadySettled()

        _markPaid(t, msg.sender);
        musd.transferFrom(msg.sender, t.creator, owed);
        emit MemberPaid(tabId, msg.sender, owed);

        if (t.paidCount == t.members.length) {
            t.settled = true;
            emit TabSettled(tabId, totalAmount(tabId));
        }
    }

    function getTab(bytes32 tabId)
        external
        view
        returns (
            address creator,
            string memory title,
            address[] memory members,
            uint256[] memory shares,
            bool settled,
            uint256 createdAt
        )
    {
        Tab storage t = _tabs[tabId];
        if (t.creator == address(0)) revert TabNotFound();
        return (t.creator, t.title, t.members, t.shares, t.settled, t.createdAt);
    }

    function hasPaid(bytes32 tabId, address member) external view returns (bool) {
        return _tabs[tabId].paid[member];
    }

    function getUserTabs(address user) external view returns (bytes32[] memory) {
        return userTabs[user];
    }

    function totalAmount(bytes32 tabId) public view returns (uint256 total) {
        Tab storage t = _tabs[tabId];
        if (t.creator == address(0)) revert TabNotFound();

        for (uint256 i = 0; i < t.shares.length; i++) {
            total += t.shares[i];
        }
    }

    function _requireOpenTab(bytes32 tabId) internal view returns (Tab storage t) {
        t = _tabs[tabId];
        if (t.creator == address(0)) revert TabNotFound();
        if (t.settled) revert AlreadySettled();
    }

    function _markPaid(Tab storage t, address member) internal {
        t.paid[member] = true;
        t.paidCount += 1;
    }
}
