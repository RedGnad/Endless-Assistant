// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title Minimal Ownable implementation for Endless RiskTagRegistry
contract Ownable {
    address public owner;

    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    constructor() {
        owner = msg.sender;
        emit OwnershipTransferred(address(0), msg.sender);
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Ownable: caller is not the owner");
        _;
    }

    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "Ownable: new owner is the zero address");
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }
}

/// @title Endless Risk Tag Registry
/// @notice Simple on-chain registry for tagging contracts with a risk level and metadata
contract RiskTagRegistry is Ownable {
    /// @notice Risk levels used by the registry
    enum RiskLevel {
        Unknown,
        Low,
        Medium,
        High
    }

    /// @notice Information stored for a given contract address
    struct RiskInfo {
        RiskLevel level;
        string label;
        string uri;
    }

    mapping(address => RiskInfo) private _risks;

    event RiskUpdated(address indexed target, RiskLevel level, string label, string uri);

    /// @notice Set or update the risk info for a target contract
    /// @dev Only the owner (e.g. Endless or a designated curator) can call this
    function setRisk(
        address target,
        RiskLevel level,
        string calldata label,
        string calldata uri
    ) external onlyOwner {
        require(target != address(0), "RiskTagRegistry: target is the zero address");

        _risks[target] = RiskInfo({level: level, label: label, uri: uri});

        emit RiskUpdated(target, level, label, uri);
    }

    /// @notice Return the full risk info for a target contract
    function getRisk(address target) external view returns (RiskInfo memory) {
        return _risks[target];
    }

    /// @notice Convenience helper to read only the risk level for a target
    function getRiskLevel(address target) external view returns (RiskLevel) {
        return _risks[target].level;
    }
}
