pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract TestNFT is ERC721 {
    constructor() ERC721("TestNFT", "TNFT") {}

    uint256 tokenCount;

    function mint(address to) public {
	_safeMint(to, tokenCount);
	tokenCount += 1;
    }
}

struct PossessedNFTS {
    mapping(uint256 => address) contractAddress;
    mapping(uint256 => uint256) tokenId;
    uint256 count;

}

struct TransferVotes {
    mapping(uint256 => address) destination;

    mapping(uint256 => address) tokenAddress;
    mapping(uint256 => uint256) tokenId;

    mapping(uint256 => uint256) pledgedVotes;
    mapping(uint256 => bool) approved;
    mapping(uint256 => mapping(address => bool)) hasVoted;

    mapping(uint256 => bool) useSafeTransfer;
    
    uint256 count;
}

contract OpenFraction is ERC20, IERC721Receiver {

    PossessedNFTS NFTList;
    TransferVotes Votes;
        
    constructor(uint256 supply, string memory communityName, string memory communityToken) ERC20(communityName, communityToken) {
	_mint(msg.sender, supply);
    }

    function onERC721Received(address operator, address from, uint256 tokenId, bytes memory data) public override returns (bytes4) {
	addToken(msg.sender, uint256(tokenId));
	return IERC721Receiver.onERC721Received.selector;
    }

    function voteCount() public view returns (uint256) {
	return Votes.count;
    }

    function haveVoted(uint256 voteId) public view returns (bool) {
	require(Votes.count > voteId, "This vote does not exist!");
	return Votes.hasVoted[voteId][msg.sender];
    }

    function voteInfo(uint256 voteId) public view returns (address, address, uint256, uint256, bool, bool) {
	require(Votes.count > voteId, "This vote does not exist!");
	return (Votes.destination[voteId], Votes.tokenAddress[voteId], Votes.tokenId[voteId], Votes.pledgedVotes[voteId],
		Votes.approved[voteId],
		Votes.useSafeTransfer[voteId]);
		
    }

    function createVote(address destination, address tokenAddress, uint256 tokenId, bool safeTransfer) public returns (uint256) {
	require(balanceOf(msg.sender) > 0, "You need to participate in this collective to create votes!");
	(uint256 _unused, bool hasToken) = getIndex(tokenAddress, tokenId);
	require(hasToken, "This token is not owned by this collective!");
	Votes.destination[Votes.count] = destination;
	Votes.tokenAddress[Votes.count] = tokenAddress;
	Votes.tokenId[Votes.count] = tokenId;
	Votes.pledgedVotes[Votes.count] = 0;
	Votes.approved[Votes.count] = false;
	Votes.useSafeTransfer[Votes.count] = safeTransfer;
	uint256 voteId = Votes.count;
	Votes.count += 1;
	return voteId;
    }

    function processVote(uint256 voteId) internal {
	require(Votes.approved[voteId], "Vote has not been approved!");
	(uint256 token, bool have) = getIndex(Votes.tokenAddress[voteId], Votes.tokenId[voteId]);
	require(have, "Collective no longer owns the referenced token!");
	(IERC721 tokenContract, uint256 tokenId) = get(token);
	if(Votes.useSafeTransfer[voteId]) {
	    tokenContract.safeTransferFrom(address(this), Votes.destination[voteId], tokenId);
	} else {
	    tokenContract.transferFrom(address(this), Votes.destination[voteId], tokenId);
	}
	removeToken(token);
    }
    
    function voteFor(uint256 voteId) public returns (uint256) {
	require(balanceOf(msg.sender) > 0, "You need to participate in this collective to vote!");
	require(Votes.count > voteId, "This vote does not exist!");
	require(!Votes.approved[voteId], "This vote has already passed!");
	require(!Votes.hasVoted[voteId][msg.sender], "You have already pledged in this vote!");
	Votes.pledgedVotes[voteId] += balanceOf(msg.sender);
	Votes.hasVoted[voteId][msg.sender] = true;
	if(Votes.pledgedVotes[voteId] > (totalSupply()/2)) {
	    Votes.approved[voteId] = true;
	    processVote(voteId);
	}
    }
    
    function nftCount() public view returns (uint256) {
	return NFTList.count;
    }

    function get(uint256 index) public view returns (IERC721, uint256) {
	require(index < NFTList.count, "Out of bounds!");
	return (IERC721(NFTList.contractAddress[index]), NFTList.tokenId[index]);
    }

    function getIndex(address tokenAddress, uint256 tokenId) public view returns (uint256, bool) {
	for(uint256 i = 0; i < NFTList.count; i++) {
	    if(NFTList.contractAddress[i] == tokenAddress
	       && NFTList.tokenId[i] == tokenId)
		{
		    return (i, true);
		}
	}
	return (0, false);
    }

    function addToken(address nftContract, uint256 tokenId) internal {
	NFTList.contractAddress[NFTList.count] = address(nftContract);
        NFTList.tokenId[NFTList.count] = tokenId;
	NFTList.count += 1;
    }

    function removeToken(uint256 index) internal {
	require(index < NFTList.count, "Out of bounds!");
	NFTList.count -= 1;
	NFTList.contractAddress[index] = NFTList.contractAddress[NFTList.count];
	NFTList.tokenId[index] = NFTList.tokenId[NFTList.count];
    }
}
