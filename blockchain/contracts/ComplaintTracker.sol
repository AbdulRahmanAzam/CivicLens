// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title ComplaintTracker
 * @dev Smart contract for tracking complaints on the Sepolia testnet
 * @notice This contract provides transparency by recording all complaints and status updates on-chain
 */
contract ComplaintTracker {
    // Complaint status enum
    enum Status {
        Pending,
        UnderReview,
        InProgress,
        Resolved,
        Rejected,
        Closed
    }

    // Complaint structure
    struct Complaint {
        string complaintId;
        uint256 timestamp;
        string category;
        bytes32 hashedDetails;
        Status currentStatus;
        bool exists;
    }

    // Status update structure
    struct StatusUpdate {
        Status oldStatus;
        Status newStatus;
        uint256 timestamp;
        bytes32 transactionHash;
    }

    // Mappings
    mapping(string => Complaint) public complaints;
    mapping(string => StatusUpdate[]) public statusHistory;
    string[] public complaintIds;

    // Events
    event ComplaintRegistered(
        string indexed complaintId,
        uint256 timestamp,
        string category,
        bytes32 hashedDetails,
        address registeredBy
    );

    event StatusUpdated(
        string indexed complaintId,
        Status oldStatus,
        Status newStatus,
        uint256 timestamp,
        address updatedBy
    );

    // Owner address
    address public owner;
    mapping(address => bool) public authorizedUpdaters;

    // Modifiers
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }

    modifier onlyAuthorized() {
        require(
            msg.sender == owner || authorizedUpdaters[msg.sender],
            "Not authorized to update"
        );
        _;
    }

    constructor() {
        owner = msg.sender;
        authorizedUpdaters[msg.sender] = true;
    }

    /**
     * @dev Add an authorized updater
     * @param _updater Address to authorize
     */
    function addAuthorizedUpdater(address _updater) external onlyOwner {
        authorizedUpdaters[_updater] = true;
    }

    /**
     * @dev Remove an authorized updater
     * @param _updater Address to remove
     */
    function removeAuthorizedUpdater(address _updater) external onlyOwner {
        authorizedUpdaters[_updater] = false;
    }

    /**
     * @dev Register a new complaint on the blockchain
     * @param _complaintId Unique identifier for the complaint
     * @param _timestamp Unix timestamp of complaint creation
     * @param _category Category of the complaint
     * @param _hashedDetails Keccak256 hash of complaint details for privacy
     */
    function registerComplaint(
        string calldata _complaintId,
        uint256 _timestamp,
        string calldata _category,
        bytes32 _hashedDetails
    ) external onlyAuthorized {
        require(!complaints[_complaintId].exists, "Complaint already registered");
        require(bytes(_complaintId).length > 0, "Complaint ID cannot be empty");

        complaints[_complaintId] = Complaint({
            complaintId: _complaintId,
            timestamp: _timestamp,
            category: _category,
            hashedDetails: _hashedDetails,
            currentStatus: Status.Pending,
            exists: true
        });

        complaintIds.push(_complaintId);

        // Record initial status
        statusHistory[_complaintId].push(StatusUpdate({
            oldStatus: Status.Pending,
            newStatus: Status.Pending,
            timestamp: _timestamp,
            transactionHash: bytes32(0)
        }));

        emit ComplaintRegistered(
            _complaintId,
            _timestamp,
            _category,
            _hashedDetails,
            msg.sender
        );
    }

    /**
     * @dev Update the status of a complaint
     * @param _complaintId Unique identifier for the complaint
     * @param _newStatus New status value
     * @param _timestamp Unix timestamp of the update
     */
    function updateStatus(
        string calldata _complaintId,
        Status _newStatus,
        uint256 _timestamp
    ) external onlyAuthorized {
        require(complaints[_complaintId].exists, "Complaint does not exist");
        
        Status oldStatus = complaints[_complaintId].currentStatus;
        complaints[_complaintId].currentStatus = _newStatus;

        statusHistory[_complaintId].push(StatusUpdate({
            oldStatus: oldStatus,
            newStatus: _newStatus,
            timestamp: _timestamp,
            transactionHash: bytes32(0)
        }));

        emit StatusUpdated(
            _complaintId,
            oldStatus,
            _newStatus,
            _timestamp,
            msg.sender
        );
    }

    /**
     * @dev Get complaint details
     * @param _complaintId Unique identifier for the complaint
     * @return Complaint struct with all details
     */
    function getComplaint(string calldata _complaintId) 
        external 
        view 
        returns (
            string memory complaintId,
            uint256 timestamp,
            string memory category,
            bytes32 hashedDetails,
            Status currentStatus,
            bool exists
        ) 
    {
        Complaint memory c = complaints[_complaintId];
        return (
            c.complaintId,
            c.timestamp,
            c.category,
            c.hashedDetails,
            c.currentStatus,
            c.exists
        );
    }

    /**
     * @dev Get the complete status history of a complaint
     * @param _complaintId Unique identifier for the complaint
     * @return Array of StatusUpdate structs
     */
    function getComplaintHistory(string calldata _complaintId)
        external
        view
        returns (StatusUpdate[] memory)
    {
        require(complaints[_complaintId].exists, "Complaint does not exist");
        return statusHistory[_complaintId];
    }

    /**
     * @dev Get the number of status updates for a complaint
     * @param _complaintId Unique identifier for the complaint
     * @return Number of status updates
     */
    function getStatusHistoryCount(string calldata _complaintId)
        external
        view
        returns (uint256)
    {
        return statusHistory[_complaintId].length;
    }

    /**
     * @dev Get total number of registered complaints
     * @return Total count
     */
    function getTotalComplaints() external view returns (uint256) {
        return complaintIds.length;
    }

    /**
     * @dev Get all complaint IDs (paginated)
     * @param _offset Starting index
     * @param _limit Number of items to return
     * @return Array of complaint IDs
     */
    function getAllComplaints(uint256 _offset, uint256 _limit)
        external
        view
        returns (string[] memory)
    {
        require(_offset < complaintIds.length || complaintIds.length == 0, "Offset out of bounds");
        
        uint256 end = _offset + _limit;
        if (end > complaintIds.length) {
            end = complaintIds.length;
        }
        
        uint256 length = end - _offset;
        string[] memory result = new string[](length);
        
        for (uint256 i = 0; i < length; i++) {
            result[i] = complaintIds[_offset + i];
        }
        
        return result;
    }

    /**
     * @dev Convert status enum to string for display
     * @param _status Status enum value
     * @return String representation of status
     */
    function statusToString(Status _status) external pure returns (string memory) {
        if (_status == Status.Pending) return "Pending";
        if (_status == Status.UnderReview) return "Under Review";
        if (_status == Status.InProgress) return "In Progress";
        if (_status == Status.Resolved) return "Resolved";
        if (_status == Status.Rejected) return "Rejected";
        if (_status == Status.Closed) return "Closed";
        return "Unknown";
    }
}
