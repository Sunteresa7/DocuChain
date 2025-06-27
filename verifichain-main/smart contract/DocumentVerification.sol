// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract DocumentVerification {
    address public owner;
    mapping(address => bool) public isVerifier;
    address[] public verifierList;

    enum VerificationStatus {
        Pending,
        Approved,
        Rejected
    }

    struct VerificationRequest {
        string documentHash;
        address requester;
        VerificationStatus status;
        address verifier;
        string documentName;
        uint256 timestamp;
    }

    VerificationRequest[] public requests;

    // ✅ NEW: Store IPFS CIDs per user
    mapping(address => string[]) private userCIDs;

    // ✅ Events
    event VerificationRequested(uint256 requestId, string documentHash, address requester, uint256 timestamp);
    event VerificationProcessed(uint256 requestId, bool approved, address verifier);
    event CIDStored(address user, string cid);

    constructor() {
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }

    modifier onlyVerifier() {
        require(isVerifier[msg.sender], "Only verifiers can call this function");
        _;
    }

    // Existing Functions
    function addVerifier(address _verifier) public onlyOwner {
        require(!isVerifier[_verifier], "Already a verifier");
        isVerifier[_verifier] = true;
        verifierList.push(_verifier);
    }

    function removeVerifier(address _verifier) public onlyOwner {
        require(isVerifier[_verifier], "Not a verifier");

        isVerifier[_verifier] = false;

        for (uint256 i = 0; i < verifierList.length; i++) {
            if (verifierList[i] == _verifier) {
                verifierList[i] = verifierList[verifierList.length - 1];
                verifierList.pop();
                break;
            }
        }
    }

    function requestVerification(string calldata _hash, string memory _documentName) public {
        requests.push(VerificationRequest(_hash, msg.sender, VerificationStatus.Pending, address(0), _documentName, block.timestamp));
        emit VerificationRequested(requests.length - 1, _hash, msg.sender, block.timestamp);
    }

    function verifyRequest(uint256 _requestId, bool _approve) public onlyVerifier {
        require(_requestId < requests.length, "Invalid request ID");
        VerificationRequest storage request = requests[_requestId];
        require(request.status == VerificationStatus.Pending, "Request already processed");

        request.status = _approve ? VerificationStatus.Approved : VerificationStatus.Rejected;
        request.verifier = msg.sender;

        emit VerificationProcessed(_requestId, _approve, msg.sender);
    }

    function getRequestCount() public view returns (uint256) {
        return requests.length;
    }

    function getAllVerifiers() public view returns (address[] memory) {
        return verifierList;
    }

    function getActiveDocumentCount() public view returns (uint256 count) {
        for (uint256 i = 0; i < requests.length; i++) {
            if (requests[i].status == VerificationStatus.Pending) {
                count++;
            }
        }
    }

    function getActiveDocumentsSince(uint256 monthStartTimestamp) public view returns (uint256 count) {
        for (uint256 i = 0; i < requests.length; i++) {
            if (requests[i].status == VerificationStatus.Pending && requests[i].timestamp >= monthStartTimestamp) {
                count++;
            }
        }
    }

    // ✅ NEW FUNCTION: Store a document IPFS CID
    function storeDocumentCID(string memory cid) public {
        userCIDs[msg.sender].push(cid);
        emit CIDStored(msg.sender, cid);
    }

    // ✅ NEW FUNCTION: Verify if CID belongs to a user
    function verifyDocumentCID(address user, string memory cid) public view returns (bool) {
        string[] memory cids = userCIDs[user];
        for (uint256 i = 0; i < cids.length; i++) {
            if (keccak256(abi.encodePacked(cids[i])) == keccak256(abi.encodePacked(cid))) {
                return true;
            }
        }
        return false;
    }

    // ✅ NEW FUNCTION: Return all CIDs for a user
    function getUserCIDs(address user) public view returns (string[] memory) {
        return userCIDs[user];
    }
}
