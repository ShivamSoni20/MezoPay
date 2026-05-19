// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

/**
 * @title UsernameRegistry
 * @notice Maps lowercase MezoPay usernames to wallet addresses.
 */
contract UsernameRegistry {
    mapping(string => address) private _nameToAddress;
    mapping(address => string) private _addressToName;

    event UsernameRegistered(string indexed username, address indexed wallet);
    event UsernameReleased(string indexed username, address indexed wallet);

    error UsernameTaken();
    error AddressAlreadyHasUsername();
    error NotRegistered();
    error InvalidUsername();

    function register(string calldata username) external {
        string memory lower = _toLower(username);
        _validateUsername(lower);

        if (_nameToAddress[lower] != address(0)) revert UsernameTaken();
        if (bytes(_addressToName[msg.sender]).length != 0) {
            revert AddressAlreadyHasUsername();
        }

        _nameToAddress[lower] = msg.sender;
        _addressToName[msg.sender] = lower;

        emit UsernameRegistered(lower, msg.sender);
    }

    function release() external {
        string memory name = _addressToName[msg.sender];
        if (bytes(name).length == 0) revert NotRegistered();

        delete _nameToAddress[name];
        delete _addressToName[msg.sender];

        emit UsernameReleased(name, msg.sender);
    }

    function resolve(string calldata username) external view returns (address) {
        return _nameToAddress[_toLower(username)];
    }

    function reverseLookup(address wallet) external view returns (string memory) {
        return _addressToName[wallet];
    }

    function isAvailable(string calldata username) external view returns (bool) {
        return _nameToAddress[_toLower(username)] == address(0);
    }

    function _validateUsername(string memory username) internal pure {
        bytes memory b = bytes(username);
        if (b.length < 3 || b.length > 20) revert InvalidUsername();

        for (uint256 i = 0; i < b.length; i++) {
            bytes1 c = b[i];
            bool ok = (c >= 0x61 && c <= 0x7A) ||
                (c >= 0x30 && c <= 0x39) ||
                c == 0x5F;
            if (!ok) revert InvalidUsername();
        }
    }

    function _toLower(string calldata str) internal pure returns (string memory) {
        bytes memory b = bytes(str);
        bytes memory result = new bytes(b.length);

        for (uint256 i = 0; i < b.length; i++) {
            bytes1 c = b[i];
            result[i] = c >= 0x41 && c <= 0x5A
                ? bytes1(uint8(c) + 32)
                : c;
        }

        return string(result);
    }
}
