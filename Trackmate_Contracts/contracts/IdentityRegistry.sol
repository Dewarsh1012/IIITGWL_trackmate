// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

contract IdentityRegistry is Ownable {
    
    enum Role { NONE, TOURIST, RESIDENT, BUSINESS, AUTHORITY }
    
    struct UserIdentity {
        Role role;
        bool isVerified;
        bool isSuspended;
        uint256 registeredAt;
    }

    mapping(address => UserIdentity) public identities;

    event IdentityMinted(address indexed userWallet, Role role, uint256 timestamp);
    event IdentitySuspended(address indexed userWallet, uint256 timestamp);
    event IdentityVerified(address indexed userWallet, uint256 timestamp);

    constructor() Ownable(msg.sender) {}

    /**
     * @dev Only the central authority/owner can register identities securely
     */
    function registerIdentity(address _user, Role _role) external onlyOwner {
        require(identities[_user].role == Role.NONE, "Identity already registered");
        require(_role != Role.NONE, "Invalid role");

        identities[_user] = UserIdentity({
            role: _role,
            isVerified: false,
            isSuspended: false,
            registeredAt: block.timestamp
        });

        emit IdentityMinted(_user, _role, block.timestamp);
    }

    /**
     * @dev Verify a specific user
     */
    function verifyIdentity(address _user) external onlyOwner {
        require(identities[_user].role != Role.NONE, "Identity not found");
        identities[_user].isVerified = true;

        emit IdentityVerified(_user, block.timestamp);
    }

    /**
     * @dev Suspend an identity upon safety violations
     */
    function suspendIdentity(address _user) external onlyOwner {
        require(identities[_user].role != Role.NONE, "Identity not found");
        identities[_user].isSuspended = true;

        emit IdentitySuspended(_user, block.timestamp);
    }

    /**
     * @dev Public view helper to check validity of an identity instantly
     */
    function isIdentityValid(address _user) external view returns (bool) {
        return (identities[_user].role != Role.NONE && !identities[_user].isSuspended);
    }
}
