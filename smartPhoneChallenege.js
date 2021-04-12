const puppeteer = require("puppeteer");
const process = require("process");


(async function(){
    console.log("**********************************");
    console.log("             Welcome              ");
    console.log("**********************************");
    console.log();
    let min=0, max=0;
    console.log("Please enter your Price Range?");
    process.stdout.write("Min Price:  ");
    min = await takeInput();
    process.stdout.write("Max Price:  ");
    max = await takeInput();
    const browser = await puppeteer.launch({headless:false,defaultViewport:null, args:["--start-maximized"]});
    const allPages = await browser.pages();
    const tab = allPages[0];
    await tab.goto("https://www.flipkart.com");
    await waitAndClick("._2KpZ6l._2doB4z", tab);
    await tab.type("._3704LK", "smartphones");
    await tab.keyboard.press("Enter");
    await tab.waitForSelector('._2YxCDZ', {visible:true});
    const bothPriceOptions = await tab.$$('._2YxCDZ');
    const minPriceList = await bothPriceOptions[0].$$('._3AsjWR');
    const maxPriceList = await bothPriceOptions[1].$$('._3AsjWR');

    let idx1="-1";
    for(let i=1;i<minPriceList.length;i++){
      const minPrice=await tab.evaluate(elem=>{return elem.getAttribute('value');}, minPriceList[i]);
      if(Number(minPrice)>=Number(min)){
        idx1=minPrice;
        break;
      }
    }
    if(idx1==="-1"){
      await tab.select('._1YAKP4 ._2YxCDZ', `Min`);
    }else{
      await tab.select('._1YAKP4 ._2YxCDZ', `${idx1}`);
    }

    let idx="-1";
    for(let i=0;i<maxPriceList.length-1;i++){
      const maxPrice = await tab.evaluate(elem=>{return elem.getAttribute('value');}, maxPriceList[i]);
      if(Number(maxPrice)>=Number(max)){
        idx=maxPrice;
        break;
      }
    }

    await tab.waitForTimeout(1000);
    if(idx==="-1"){
      await tab.select('._3uDYxP ._2YxCDZ', `Max`);
    }else{
      await tab.select('._3uDYxP ._2YxCDZ', `${idx}`);
    }

    let criteria = [
      "Processor Type","RAM", "Internal Storage", "Resolution Type"
    ];
    let bestSmartphone = {
      AntutuScore:5000,
      RAM:1,
      InternalStorage:4,
      Price:100000,
      Link:"Hi"
    }
    await tab.waitForTimeout(2000);
    const allPhones = await tab.$$('._1AtVbE.col-12-12 ._13oc-S a');
    let allPhoneLinks=[];
    for(let i=0;i<allPhones.length;i++){
      const link = await tab.evaluate(elem=>{return elem.getAttribute('href');}, allPhones[i]);
      allPhoneLinks.push("https://www.flipkart.com"+link);
    }
    for(let i=0;i<allPhoneLinks.length;i++)
      await singlePhone(browser, allPhoneLinks[i], criteria, bestSmartphone);
    
    tab.close();
    const page = await browser.newPage();
    await page.goto(bestSmartphone.Link);
})();

async function singlePhone(browser, link, criteria, bestSmartphone){
  let page = await browser.newPage();
  await page.goto(link);
  await waitAndClick('._2KpZ6l._1FH0tX', page);

  await page.waitForSelector('._1UhVsV ._14cfVK ._1s_Smc.row');
  const allTdsKeys = await page.$$('._1UhVsV ._14cfVK ._1s_Smc.row ._1hKmbr.col.col-3-12');
  const allTdsValue = await page.$$('._1UhVsV ._14cfVK ._1s_Smc.row .URwL2w.col.col-9-12')
  let AntutuScore;
  let RAM;
  let InternalStorage;
  let Price;
  for(let i=0;i<allTdsKeys.length;i++){
    const tdContent = await page.evaluate(elem=>{return elem.innerText;},allTdsKeys[i]);

    for(let j=0;j<criteria.length;j++){
      if(tdContent===criteria[j]){
        if(j===0){
          const tdValue = await page.evaluate(elem=>{return elem.innerText;}, allTdsValue[i]);
          const p = await browser.newPage();
          await p.goto("https://www.google.com");
          await p.waitForSelector(".gLFyf.gsfi");
          await p.type(".gLFyf.gsfi", tdValue+" nanoreview");
          await p.keyboard.press("Enter");
          await p.waitForSelector('#cnt .GyAeWb a');
          const nano = await p.$$('#cnt .GyAeWb a');
          for(let k=0;k<nano.length;k++){
            let content = await p.evaluate(elem=>{return elem.getAttribute('href');}, nano[k]);
            if(content.includes("nanoreview.net")){
              await nano[k].click();
              break;
            }
          }
          await p.waitForSelector('.card .score-bar-result-number');
          const antutu = await p.$('.card .score-bar-result-number');
          AntutuScore = await p.evaluate(elem=>{return elem.innerText;}, antutu);
          p.close();
        }else if(j===1){
          const tdValue = await page.evaluate(elem=>{return elem.innerText;}, allTdsValue[i]);
          RAM = Number(tdValue.split(" GB")[0]);
        }else if(j===2){
          const tdValue = await page.evaluate(elem=>{return elem.innerText;}, allTdsValue[i]);
          InternalStorage = Number(tdValue.split(" GB")[0]);
        }
      }

    }
  }
  const price = await page.$('._30jeq3._16Jk6d');
  const PValue = await page.evaluate(elem=>{return elem.innerText;}, price);
  let p1 = PValue.split("₹")[1].split(",")[0];
  p1+= PValue.split("₹")[1].split(",")[1];
  Price = Number(p1);
  if(Number(bestSmartphone.AntutuScore)<AntutuScore){
    change(bestSmartphone, AntutuScore, RAM, InternalStorage, Price, link);
  }else if(Number(bestSmartphone.AntutuScore)===AntutuScore){
    if(Number(bestSmartphone.RAM)<RAM){
      change(bestSmartphone, AntutuScore, RAM, InternalStorage, Price, link);
    }else if(Number(bestSmartphone.RAM)===RAM){
      if(Number(bestSmartphone.InternalStorage)<InternalStorage){
        change(bestSmartphone, AntutuScore, RAM, InternalStorage, Price, link);
      }else if(Number(bestSmartphone.InternalStorage)<InternalStorage){
        if(Number(bestSmartphone.Price)>Price){
          change(bestSmartphone, AntutuScore, RAM, InternalStorage, Price, link);
        }
      }
    }
  }
  page.close();
}

function change(bestSmartphone, AntutuScore, RAM, InternalStorage, Price, link){
  bestSmartphone.AntutuScore=AntutuScore;
  bestSmartphone.RAM=RAM;
  bestSmartphone.InternalStorage=InternalStorage;
  bestSmartphone.Price=Price;
  bestSmartphone.Link=link;
}

async function takeInput(){
    return new Promise((resolve, reject)=>{
        process.stdin.on('data', data=>{
            resolve(data);
        })
    })
}

async function waitAndClick(selector, tab) {
    return new Promise((resolve, reject) => {
      tab
        .waitForSelector(selector, { visible: true })
        .then((data) => {
          resolve(tab.click(selector));
        })
        .catch((error) => {
          reject(error);
        });
    });
  }