/* eslint-disable no-process-exit */
import got from 'got';
import logger from './log';
import {parseObj, hexToString} from './util';
import SworkerApi, {RecoverRes} from './sworker';

const subscanEndpoint = 'https://crust.webapi.subscan.io';

export interface FixResult {
  added_files: string[],
  deleted_files: string[]
}

async function getLastReportWorks(account: string): Promise<any> {
  const transfersApi = subscanEndpoint + '/api/scan/extrinsics';
  let results : FixResult  = {
    added_files: [],
    deleted_files: []
  };
  if(!account) {
    console.log("Recovered files: ", results);
    return results;
  }
  const res: any = await got.post(transfersApi, {
    json: {
      address: account,
      call: "report_works",
      module: "swork",
      no_params: false,
      page: 0,
      row: 1,
      signed: "signed",
      success: true
    },
    responseType: 'json',
  });
  const data = parseObj(res.body.data);
  const extrinsics: any = data['extrinsics'];
  for (const extrinsic of extrinsics) {
    const paramsData = JSON.parse(extrinsic["params"]);
    paramsData[6].value?.forEach((file: { col1: string; }) => {
      results.added_files.push(hexToString(file.col1));
    });
    paramsData[7].value?.forEach((file: { col1: string; }) => {
      results.deleted_files.push(hexToString(file.col1));
    });
  }
  console.log("Recovered files: ", results);
  return results;
}

async function main(): Promise<boolean> {
  // const account = "cTM4YpotCczjcyu3oPAhAjZQ6v7d7iG65dzTjifzAswNBtKJV";
  const sworkerAddr = 'http://localhost:12222';
  const sworkerTimeout = 8000 * 1000; //8000s
  const sworkerApi = new SworkerApi(sworkerAddr, sworkerTimeout);
  try {
    const account = await sworkerApi.getAccount();
    console.log("Recovered Account: ", account);
    const recoved_files = await getLastReportWorks(account);
    await sworkerApi.recoverFiles(recoved_files);
  } catch(e: any) {
    throw e;
  }
  return true;
}

main()
  .then(r => {
    logger.info('Recover Illegal Files Success');
    process.exit(0);
  })
  .catch(e => {
    logger.error(`Recover Illegal Files with error: ${e}`);
    process.exit(1);
  });
