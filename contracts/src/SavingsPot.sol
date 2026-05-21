// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract SavingsPot {
    IERC20 public immutable musd;
    
    struct Pot {
        address creator;
        string name;
        uint256 targetAmount; // MUSD goal
        uint256 totalDeposited;
        uint256 unlockTime; // block.timestamp + lock seconds
        mapping(address => uint256) deposits;
        bool distributed;
    }
    
    mapping(bytes32 => Pot) public pots;
    uint256 public potCount;
    
    event PotCreated(bytes32 indexed potId, string name, uint256 target, uint256 unlockTime);
    event Deposited(bytes32 indexed potId, address indexed user, uint256 amount);
    event Withdrawn(bytes32 indexed potId, address indexed user, uint256 amount);
    
    constructor(address _musd) {
        musd = IERC20(_musd);
    }
    
    function createPot(string calldata name, uint256 target, uint256 lockSeconds) external returns (bytes32 potId) {
        potId = keccak256(abi.encodePacked(msg.sender, potCount++, block.timestamp));
        Pot storage p = pots[potId];
        p.creator = msg.sender;
        p.name = name;
        p.targetAmount = target;
        p.unlockTime = block.timestamp + lockSeconds;
        emit PotCreated(potId, name, target, p.unlockTime);
    }
    
    function deposit(bytes32 potId, uint256 amount) external {
        Pot storage p = pots[potId];
        require(!p.distributed, "Pot closed");
        musd.transferFrom(msg.sender, address(this), amount);
        p.deposits[msg.sender] += amount;
        p.totalDeposited += amount;
        emit Deposited(potId, msg.sender, amount);
    }
    
    function withdraw(bytes32 potId) external {
        Pot storage p = pots[potId];
        require(block.timestamp >= p.unlockTime, "Still locked");
        uint256 share = p.deposits[msg.sender];
        require(share > 0, "Nothing to withdraw");
        p.deposits[msg.sender] = 0;
        musd.transfer(msg.sender, share);
        emit Withdrawn(potId, msg.sender, share);
    }
    
    function getDeposit(bytes32 potId, address user) external view returns (uint256) {
        return pots[potId].deposits[user];
    }
}
