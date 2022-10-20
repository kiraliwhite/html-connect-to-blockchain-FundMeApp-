import { Contract, ethers } from "./ethers-5.6.esm.min.js";
import { abi, contractAddress } from "./constant.js";

const connectButton = document.getElementById("connectButton");
const fundButton = document.getElementById("fundButton");
const balanceButton = document.getElementById("balanceButton");
const withdrawButton = document.getElementById("withdrawButton");
//當connectButton按鈕按下時呼叫connect function
connectButton.onclick = connect;
//當connectButton按鈕按下時呼叫fund function
fundButton.onclick = fund;
//當balanceButton按鈕按下後,呼叫getBalance function
balanceButton.onclick = getBalance;
withdrawButton.onclick = withdraw;

async function connect() {
  if (typeof window.ethereum !== "undefined") {
    //加上await等待connect結果回傳
    await window.ethereum.request({ method: "eth_requestAccounts" });
    //透過搜尋按鈕的id,替換按鈕的字樣改為connected
    connectButton.innerHTML = "Connected!";
  } else {
    connectButton.innerHTML = "Please install MetaMask";
  }
}

async function getBalance() {
  if (typeof window.ethereum !== "undefined") {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    //使用provider抓取餘額,傳入合約地址
    const balance = await provider.getBalance(contractAddress);
    //console.log(`None format balance is ${balance}`);
    console.log(`Contract balance is ${ethers.utils.formatEther(balance)}`);
  }
}

async function withdraw() {
  if (typeof window.ethereum !== "undefined") {
    console.log("Withdrawing...");
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    const contract = new ethers.Contract(contractAddress, abi, signer);
    try {
      const transactionResponse = await contract.withdraw();
      await listenForTransactionMine(transactionResponse, provider);
    } catch (error) {
      console.log(error);
    }
  }
}

async function fund() {
  //ethAmount的值來自於,html內的ethAmount的值
  const ethAmount = document.getElementById("ethAmount").value;
  console.log(`Funding with ${ethAmount}`);
  if (typeof window.ethereum !== "undefined") {
    //使用ethers抓取web3Provider,MetaMask的連接(包含網路,錢包等...)
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    //獲取MetaMask錢包中,正在連線的帳號
    const signer = provider.getSigner();
    //帳號,ABI,合約地址三者連接
    const contract = new ethers.Contract(contractAddress, abi, signer);
    //發出transaction與合約ABI互動
    try {
      //呼叫合約中的fund function並傳入值
      const transactionResponse = await contract.fund({
        value: ethers.utils.parseEther(ethAmount),
      });

      // 等待上述交易完成, 輸入兩個變數給function
      // 分別是 上述的交易Transaction與provider 給listenForTransactionMine function
      await listenForTransactionMine(transactionResponse, provider);
      console.log("done");
    } catch (error) {
      console.log(error);
    }
  }
}

//監聽function,監聽交易是否完成,輸入兩個變數transactionResponse,provider
function listenForTransactionMine(transactionResponse, provider) {
  //顯示該筆交易的hash值
  console.log(`Mining ${transactionResponse.hash}...`);

  //回傳一個Promise,使這整個function在呼叫之後,也會等待下方的provider.once的程序完成之後,才會繼續進行
  //這個Promise執行了一個箭頭匿名函式,傳遞了兩個參數resolve,reject,
  //這個Promise的箭頭匿名函式 是用來執行provider.once
  return new Promise((resolve, reject) => {
    //當找到transactionResponse.hash時,將該值作為輸入,改名為transactionReceipt,傳遞給箭頭匿名函式
    provider.once(transactionResponse.hash, (transactionReceipt) => {
      //輸出transactionReceipt的區塊確認
      console.log(
        `Completed with ${transactionReceipt.confirmations} confirmations`
      );
      //呼叫resolve,結束這個Promise
      resolve();
    });
  });
}
