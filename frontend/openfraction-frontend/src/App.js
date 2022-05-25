import './App.css';
import React, {useState, useEffect} from 'react';
import Backdrop from '@mui/material/Backdrop';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import InputLabel from '@mui/material/InputLabel';
import Grid from '@mui/material/Grid';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import Select from '@mui/material/Select';
import List from '@mui/material/List';
import Checkbox from '@mui/material/Checkbox';
import CheckBoxIcon from '@mui/icons-material/CheckBox';
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Card from '@mui/material/Card';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import TextField from '@mui/material/TextField';
import Modal from '@mui/material/Modal';
import Box from '@mui/material/Box';
import CardContent from '@mui/material/CardContent';
import CardActions from '@mui/material/CardActions';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import CssBaseline from '@mui/material/CssBaseline';
import { ethers } from 'ethers';

function TabPanel(props) {
    const { children, value, index, ...other } = props;

    return (
	<div
	    role="tabpanel"
	    hidden={value !== index}
	    id={`simple-tabpanel-${index}`}
	    aria-labelledby={`simple-tab-${index}`}
	    {...other}
	>
	    {value === index && (
		<Box sx={{ p: 3 }}>
		    {children}
		</Box>
	    )}
	</div>
    );
}

function NFTsList({loadedContract}) {
    return (
    	<Box sx={{width:1, border:1,borderRadius:5,borderColor:"primary.main"}}>
	    <List>
		{loadedContract.held.map((v, k) => 
		    (<ListItem key={k}>
			 <ListItemText primary={`${v.tokenName} #${v.tokenId} @ ${v.tokenAddress}`}/>
		     </ListItem>))
		}
	    </List>
	</Box>
    );
}

function VotesList({loadedContract, updateContractData}) {
    function voteLabel(v) {
	return (`Transfer ${v.tokenName} #${v.tokenId} to ${v.destination}: `+
		`${v.pledgedVotes / loadedContract.totalSupply * 100}% approval.`+
		` You have ${v.haveVoted?"":"not "}voted.`);
    }
    const [selectedVoting, setSelectedVoting] = useState(null);
    const [waiting, setWaiting] = useState(false);
    const [err, setErr] = useState(null);
    async function handleVote() {
	setWaiting(true);
	(loadedContract.contract
	 .voteFor(selectedVoting.id)
	 .then(
	     ((tx) => tx.wait()),
	     ((err) => {
		 setWaiting(false);
		 setErr(err.toString());
	     }))
	 .then(
	     ((tx) => {
		 setSelectedVoting(null);
		 setWaiting(false);
		 updateContractData(loadedContract.contract,
				    loadedContract.address,
				    loadedContract.wallet);
	     }),
	     ((err) => {
		 setWaiting(false);
		 setErr(err.toString());
	     })
	 ));
    }
    return (<>
		<Backdrop sx={{color: '#fff', zIndex: (theme)=>theme.zIndex.drawer+1}}
			  open={waiting}>
		    <CircularProgress/>
		</Backdrop>
		<Modal open={selectedVoting !== null}
		       onClose={() => setSelectedVoting(null)}>
		    {selectedVoting !== null ?
		     (<Box sx={{width:1/2,ml:'auto',mr:'auto', mt:12}}>
			  <Card variant="outline">
			      <CardContent>
				  {err !== null ?
				   <Alert severity="error">{err}</Alert> :
				   <></>}
				  <Typography
				      align="center">
				      Vote progress: {selectedVoting.pledgedVotes/loadedContract.totalSupply*100}%.
				  </Typography>
				  {selectedVoting.haveVoted?<Typography align="center">You have already voted.</Typography>:
				   (<>
					<Typography align="center">
					    You can contribute {loadedContract.ourBalance} votes to this decision
					    ({loadedContract.ourBalance/loadedContract.totalSupply*100}%)
					</Typography>
					<Button onClick={handleVote}>Vote</Button>
				    </>)}
			      </CardContent>
			  </Card>
		      </Box>) : (<></>)}
		</Modal>
    		<Box sx={{width:1, border:1,borderRadius:25,borderColor:"primary.main"}}>
		    <List>
			{loadedContract.votes.map((v, k) => 
			    (<ListItem key={k}>
				 <ListItemButton onClick={() => setSelectedVoting(v)}>
				     <ListItemIcon>
					 {
					     v.approved ?
						 <CheckBoxIcon/> :
						 <CheckBoxOutlineBlankIcon/>
					 }
				     </ListItemIcon>
				     <ListItemText primary={voteLabel(v)}/>
				 </ListItemButton>
			     </ListItem>))
			}
		    </List>
		</Box>
	    </>
	   );
}

function CreateVote({loadedContract, updateContractData}) {
    const [creatingNew, setCreatingNew] = useState(false);
    const [selectedNft, setSelectedNft] = useState("");
    const [destinationAddress, setDestinationAddress] = useState("");
    const [useSafeTransfer, setUseSafeTransfer] = useState(true);
    const [waiting, setWaiting] = useState(false);
    const [err, setErr] = useState(null);
    function handleChangeSelectedNft(event) {
	setSelectedNft(event.target.value);
    }
    function handleChangeDestination(event) {
	setDestinationAddress(event.target.value);
    }
    function handleChangeSafe(event) {
	setUseSafeTransfer(event.target.checked);
    }
    async function createVote() {
	setWaiting(true);
	(loadedContract.contract.createVote(destinationAddress,
							     selectedNft.tokenAddress,
							     selectedNft.tokenId,
					    useSafeTransfer)
	 .then(((tx) =>
	     tx.wait().then(async () => {
		 setCreatingNew(false);
		 setSelectedNft("");
		 setDestinationAddress("");
		 setUseSafeTransfer(true);
		 (await updateContractData(loadedContract.contract,
					   loadedContract.address,
					   loadedContract.wallet));
		 setWaiting(false);
	     }, (err) => {
		 setErr(err.toString());
		 setWaiting(false);
	     })),
	     ((err) => {
		 setErr(err.toString());
		 setWaiting(false);
	     })
	 ));
    }
    console.log(loadedContract.held);
    return (
	<>
	    <Backdrop
		sx={{color: '#fff', zIndex: (theme)=>theme.zIndex.drawer+1}}
		open={waiting}
	    >
		<CircularProgress/>
	    </Backdrop>

	    <Box sx={{mb:2}}>
		{creatingNew
		 ?
		 <Box sx={{border: 1, borderRadius: 5, borderColor: "primary.main", p:2}}>
		     {err !== null ?
		      <Alert severity="error">{err}</Alert> :
		      <></>}
		     <Grid container spacing={2}>
			 <Grid item xs={12}>
			     <FormControl fullWidth>
				 <InputLabel id="nft-select-label">NFT to Transfer</InputLabel>
				 <Select
				     labelId="nft-select-label"
				     id="nft-select"
				     value={selectedNft}
				     label="NFT to Transfer"
				     onChange={handleChangeSelectedNft}
				 >
				     {
					 loadedContract.held.map(
					     (nft, k) =>
					     <MenuItem value={nft} key={k}>{nft.tokenName} #{nft.tokenId}</MenuItem>
					 )
				     }
				 </Select>
			     </FormControl>
			 </Grid>
			 <Grid item xs={8}>
			     <TextField id="destination" label="Destination" variant="outlined" value={destinationAddress} onChange={handleChangeDestination} sx={{width:1}}/>
			 </Grid>
			 <Grid item xs={4}>
			     <FormControlLabel control={<Checkbox checked={useSafeTransfer} onChange={handleChangeSafe} />} label="Use safe transfer"/>
			 </Grid>
			 <Grid item xs={12}>
			     <Button variant="contained" sx={{width:1}} onClick={createVote}>Create vote</Button>
			 </Grid>
		     </Grid>
		 </Box>
		 :
		 <Button sx={{ml:"auto",mr:"auto",display:"block"}} variant="contained" onClick={() => setCreatingNew(true)}>Create new vote</Button>
		}
	    </Box>
	</>
    );
}

function ContractLoaded({loadedContract, updateContractData}) {
    const [selectedTab, setSelectedTab] = useState(0);

    function handleTab(e, value) {
	setSelectedTab(value);
    }
    
    return (
	<Box>
	    <Box sx={{flexGrow:1}}>
		<AppBar position="static">
		    <Toolbar>
			{loadedContract.name}
			(${loadedContract.symbol})
			@ {loadedContract.address}
		    </Toolbar>
		</AppBar>
	    </Box>
	    <Box sx={{width: 0.7, mr:'auto',ml:'auto',mt:2,mb:2}}>
		<Card variant="outlined">
		    <CardContent>
			<Typography align="center">
			    You hold ({loadedContract.ourBalance}/{loadedContract.totalSupply}) tokens which is {loadedContract.ourBalance/loadedContract.totalSupply*100}% of the voting power.
			</Typography>
		    </CardContent>
		</Card>
	    </Box>
	    <Box sx={{borderBottom:1,borderColor:'divider'}}>
		<Tabs value={selectedTab} onChange={handleTab}>
		    <Tab label="Held NFTs" id="simple-tab-0"/>
		    <Tab label="Votes" id="simple-tab-1"/>
		</Tabs>
	    </Box>
	    <TabPanel value={selectedTab} index={0}>
		<NFTsList loadedContract={loadedContract}/>
	    </TabPanel>
	    <TabPanel value={selectedTab} index={1}>
		<CreateVote loadedContract={loadedContract} updateContractData={updateContractData}/>
		<VotesList loadedContract={loadedContract} updateContractData={updateContractData}/>
	    </TabPanel>
	</Box>
    );
}

function NoContractLoaded({setLoadedContract}) {
    const [inputModalOpen, setInputModalOpen] = useState(false);
    const [contractAddress, setContractAddress] = useState("");
    function handleOpen() {
	setInputModalOpen(true);
    }
    function handleTextChange(input) {
	setContractAddress(input.target.value);
    }

    function closeModal() {
	setInputModalOpen(false);
	setLoadedContract(
	    contractAddress
	);
    }
    return (
	<Box>
	    <Modal
		open={inputModalOpen}
	    >
		<Box sx={{width: 1/2,ml:'auto',mr:'auto',mt:2}}>
		    <Card variant="outlined">
			<CardContent>
			    <TextField
				label="OpenFraction Contract Address"
				value={contractAddress}
				onChange={handleTextChange}
			    />
			</CardContent>
			<CardActions>
			    <Button variant="contained" onClick={closeModal}>
				Load contract
			    </Button>
			</CardActions>
		    </Card>
		</Box>
	    </Modal>
	    <Box sx={{width: 1/2,ml:'auto',mr:'auto',mt:2}}>		
		<Card variant="outlined">
		    <CardContent>
			<Typography
			    sx={{ fontSize: 14 }}
			    color="error"
			    align="center"
			    gutterBottom>
			    No OpenFraction contract loaded!
			</Typography>
		    </CardContent>
		    <CardActions>
			<Button onClick={handleOpen} size="small">Load contract...</Button>
		    </CardActions>
		</Card>
	    </Box>
	</Box>
    );
}

const nftApi = [
    "function name() view returns (string)",
    "function symbol() view returns (string)",
    "function balanceOf(address) view returns (uint256)"
];

const fractionApi = [
    ...nftApi,
    "function voteCount() view returns (uint256)",
    "function haveVoted(uint256) view returns (bool)",
    "function voteInfo(uint256) view returns (address, address, uint256, uint256, bool, bool)",
    "function createVote(address, address, uint256, bool) returns (uint256)",
    "function voteFor(uint256) returns (uint256)",

    "function nftCount() view returns (uint256)",
    "function get(uint256) view returns (address, uint256)",
    "function getIndex(address, uint256) view returns (uint256, bool)",

    "function totalSupply() view returns (uint256)",
];

function App() {
    const [loadedContract, setLoadedContract] = useState(null);
    const [provider, setProvider] = useState(null);

    async function updateContractData(fractionContract, contractAddress, walletAddress) {
	const nftCount = await fractionContract.nftCount();
	const nfts = [];

	const tokenNames = {};

	for(let i = 0; i < nftCount; i++) {
	    const [nftTokenAddress, nftTokenId] = await fractionContract.get(i);
	    if(!(nftTokenAddress in tokenNames)) {
		const nftTokenContract = new ethers.Contract(nftTokenAddress, nftApi, provider);
		const nftTokenName = await nftTokenContract.name();
		tokenNames[nftTokenAddress] = nftTokenName;
	    }
	    nfts.push(
		{
		    'tokenAddress': nftTokenAddress,
		    'tokenId': nftTokenId.toNumber(),
		    'tokenName': tokenNames[nftTokenAddress]
		}
	    );
	}

	const voteCount = await fractionContract.voteCount();
	const votes = [];
	for(let i = 0; i < voteCount; i++) {
	    let [destination, tokenAddress, tokenId, pledgedVotes, approved, safeTransfer] = await fractionContract.voteInfo(i);
	    tokenId = tokenId.toNumber();
	    pledgedVotes = pledgedVotes.toNumber();
	    const haveVoted = await fractionContract.haveVoted(i);
	    const voteData = {
		'id': i,
		destination,
		tokenAddress,
		tokenId,
		'tokenName': tokenNames[tokenAddress],
		pledgedVotes,
		approved,
		safeTransfer,
		haveVoted
	    };
	    votes.push(voteData);
	}
	const supply = (await fractionContract.totalSupply()).toNumber();
	const balance = (await fractionContract.balanceOf(walletAddress)).toNumber();
	console.log(balance);
	setLoadedContract(
	    {
		'address': contractAddress,
		'name': await fractionContract.name(),
		'symbol': await fractionContract.symbol(),
		'ourBalance': balance,
		'totalSupply': supply,
		'votes': votes,
		'held': nfts,
		'contract': fractionContract,
		'wallet': walletAddress
	    }
	);
    }

    async function handleChangeContract(contractAddress) {
	const signer = provider.getSigner();
	console.log(contractAddress);
	const fractionContract = new ethers.Contract(contractAddress, fractionApi, signer);
	const walletAddress = await signer.getAddress();
	updateContractData(fractionContract, contractAddress, walletAddress);
    }
 
    useEffect(() => {
	if(provider === null) {
	    const _provider = new ethers.providers.Web3Provider(window.ethereum);
	    _provider.send("eth_requestAccounts",[]).then((l) => {
		console.log(l);
		setProvider(_provider);
	    });
	}
    }, [provider]);
    
    return (
	<Box>
	    <CssBaseline/>
	    <Backdrop
		sx={{color: '#fff', zIndex: (theme)=>theme.zIndex.drawer+1}}
		open={provider === null}
	    >
		<CircularProgress/>
	    </Backdrop>
	    {(
		loadedContract != null ?
		    (<ContractLoaded loadedContract={loadedContract} updateContractData={updateContractData}/>) :
		    (<NoContractLoaded setLoadedContract={handleChangeContract}/>)
	    )}
	</Box>);
}

export default App;
