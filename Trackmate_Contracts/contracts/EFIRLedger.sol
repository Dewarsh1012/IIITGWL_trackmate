// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

contract EFIRLedger is Ownable {

    struct EFIRRecord {
        string firNumber;
        string dataHash;         // IPFS Hash or SHA-256 of the FIR PDF/JSON Metadata
        address complainant;
        string status;           // SUBMITTED | UNDER_REVIEW | RESOLVED | CLOSED
        uint256 timestamp;
    }

    // Mapping FIR Number (String ID) constraints an immutable record
    mapping(string => EFIRRecord) public firRecords;
    
    // Reverse lookup for complainant to retrieve list of FIRs
    mapping(address => string[]) public complainantFIRs;

    event FIRFiled(string indexed firNumber, address indexed complainant, string dataHash, uint256 timestamp);
    event FIRStatusUpdated(string indexed firNumber, string newStatus, uint256 timestamp);

    constructor() Ownable(msg.sender) {}

    /**
     * @dev File a brand new FIR and immutably pin its hash
     */
    function fileFIR(string calldata _firNumber, string calldata _dataHash, address _complainant) external onlyOwner {
        require(bytes(firRecords[_firNumber].firNumber).length == 0, "FIR already exists");
        
        firRecords[_firNumber] = EFIRRecord({
            firNumber: _firNumber,
            dataHash: _dataHash,
            complainant: _complainant,
            status: "SUBMITTED",
            timestamp: block.timestamp
        });

        complainantFIRs[_complainant].push(_firNumber);

        emit FIRFiled(_firNumber, _complainant, _dataHash, block.timestamp);
    }

    /**
     * @dev Authority can safely update FIR status, leaving a transparent trail via events
     */
    function updateFIRStatus(string calldata _firNumber, string calldata _newStatus) external onlyOwner {
        require(bytes(firRecords[_firNumber].firNumber).length != 0, "FIR does not exist");
        
        firRecords[_firNumber].status = _newStatus;

        emit FIRStatusUpdated(_firNumber, _newStatus, block.timestamp);
    }

    /**
     * @dev Public verification method to retrieve FIR immutable hash data
     */
    function getEFIRData(string calldata _firNumber) external view returns (string memory dataHash, address complainant, string memory status, uint256 timestamp) {
        require(bytes(firRecords[_firNumber].firNumber).length != 0, "FIR does not exist");
        EFIRRecord memory record = firRecords[_firNumber];
        return (record.dataHash, record.complainant, record.status, record.timestamp);
    }
}
