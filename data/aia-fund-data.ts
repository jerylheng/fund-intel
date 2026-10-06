import {aiaPerformance} from "./aia-performance";
export type AiaFundData={oneY:number|null;threeY:number|null;fiveY:number|null;tenY:number|null;sinceInception:number|null;fee:number|null;inception:number|null};
export const aiaDataAsOf="2025-12-31";
export const aiaDataSource="AIA Annual Funds Report 2025";
export const aiaFundData:Record<string,AiaFundData>=Object.fromEntries(Object.entries(aiaPerformance).map(([name,v])=>[name,{oneY:v[0],threeY:v[1],fiveY:v[2],tenY:v[3],sinceInception:v[4],fee:null,inception:null}]));
